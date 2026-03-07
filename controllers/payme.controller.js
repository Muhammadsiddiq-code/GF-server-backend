// controllers/payme.controller.js
const { User, Transaction, PaymeTransaction, sequelize } = require("../models");
require("dotenv").config();

const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY; // Paycom "Paycom:<KEY>" Basic Auth password

// PAYME xatolik kodlari
const PaymeError = {
  InvalidAmount: {
    code: -31001,
    message: {
      uz: "Noto'g'ri summa",
      ru: "Неверная сумма",
      en: "Invalid amount",
    },
  },
  UserNotFound: {
    code: -31050,
    message: {
      uz: "Foydalanuvchi topilmadi",
      ru: "Пользователь не найден",
      en: "User not found",
    },
  },
  TransactionNotFound: {
    code: -31003,
    message: {
      uz: "Tranzaksiya topilmadi",
      ru: "Транзакция не найдена",
      en: "Transaction not found",
    },
  },
  CantDoOperation: {
    code: -31008,
    message: {
      uz: "Operatsiyani bajarib bo'lmaydi",
      ru: "Невозможно выполнить операцию",
      en: "Cannot perform operation",
    },
  },
  TransactionAlreadyExists: {
    code: -31051,
    message: {
      uz: "Tranzaksiya allaqachon mavjud",
      ru: "Транзакция уже существует",
      en: "Transaction already exists",
    },
  },
  InvalidAuthorization: {
    code: -32504,
    message: {
      uz: "Avtorizatsiya xatosi",
      ru: "Ошибка авторизации",
      en: "Authorization error",
    },
  },
};

// JSON-RPC helpers
const errorResponse = (id, error) => ({
  jsonrpc: "2.0",
  id,
  error: { code: error.code, message: error.message },
});

const successResponse = (id, result) => ({
  jsonrpc: "2.0",
  id,
  result,
});

// --- Basic Auth tekshirish (Paycom:SECRET_KEY) ---
const checkAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  if (!authHeader.startsWith("Basic ")) return false;

  const base64Credentials = authHeader.split(" ")[1];
  if (!base64Credentials) return false;

  let decoded = "";
  try {
    decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
  } catch {
    return false;
  }

  const [login, password] = decoded.split(":");
  if (!login || password === undefined) return false;

  return login === "Paycom" && password === PAYME_SECRET_KEY;
};

// ============================================================
// PAYME METHODS
// Biz account.telegram_id ishlatamiz (frontend checkout-url shuni yuboradi)
// amount doim TIYINda keladi (INTEGER). Minimal 100 (1 so'm).
// PaymeTransaction.amount -> TIYIN (INTEGER)
// User.balance -> SO'M (FLOAT)
// ============================================================

// 1) CheckPerformTransaction
const CheckPerformTransaction = async (params, id) => {
  try {
    const { account, amount } = params || {};
    const tgId = account?.telegram_id;

    if (!tgId) return errorResponse(id, PaymeError.UserNotFound);

    const user = await User.findOne({ where: { telegramId: String(tgId) } });
    if (!user) return errorResponse(id, PaymeError.UserNotFound);

    const amountTiyin = Number(amount);
    if (!Number.isFinite(amountTiyin) || amountTiyin < 100) {
      return errorResponse(id, PaymeError.InvalidAmount);
    }

    return successResponse(id, { allow: true });
  } catch (error) {
    console.error("CheckPerformTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 2) CreateTransaction
const CreateTransaction = async (params, id) => {
  const t = await sequelize.transaction();
  try {
    const { account, amount, time } = params || {};
    const paymeTransactionId = params?.id;
    const tgId = account?.telegram_id;

    if (!paymeTransactionId) {
      await t.rollback();
      return errorResponse(id, PaymeError.CantDoOperation);
    }

    // user
    const user = await User.findOne({
      where: { telegramId: String(tgId) },
      transaction: t,
    });
    if (!user) {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
    }

    const amountTiyin = Number(amount);
    if (!Number.isFinite(amountTiyin) || amountTiyin < 100) {
      await t.rollback();
      return errorResponse(id, PaymeError.InvalidAmount);
    }

    // PaymeTransaction oldin bor-yo'qligini tekshiramiz
    let paymeTx = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (paymeTx) {
      await t.rollback();
      // state=1 bo'lsa shu transactionni qaytaramiz
      if (paymeTx.state === 1) {
        return successResponse(id, {
          create_time: Number(paymeTx.createTime || 0),
          transaction: String(paymeTx.id),
          state: paymeTx.state,
        });
      }
      // boshqa state bo'lsa bajarib bo'lmaydi
      return errorResponse(id, PaymeError.CantDoOperation);
    }

    // Transaction (bizda so'm bilan yuradi)
    const amountSom = amountTiyin / 100;

    const transaction = await Transaction.create(
      {
        userId: user.id,
        amount: amountSom,
        type: "income",
        description: "PAYME orqali balans to'ldirish",
        status: "pending",
        paymentType: "payme",
        paymeTransactionId,
        paymeTime: String(time || ""),
      },
      { transaction: t }
    );

    // PaymeTransaction (tiyin bilan)
    paymeTx = await PaymeTransaction.create(
      {
        userId: user.id,
        transactionId: transaction.id,
        paymeTransactionId,
        paymeTime: String(time || ""),
        amount: amountTiyin, // ✅ TIYIN (INTEGER) - modelga mos
        state: 1,
        createTime: Number(time || Date.now()),
        account: account || {},
      },
      { transaction: t }
    );

    await t.commit();

    return successResponse(id, {
      create_time: Number(paymeTx.createTime || 0),
      transaction: String(paymeTx.id),
      state: paymeTx.state,
    });
  } catch (error) {
    await t.rollback();
    console.error("CreateTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 3) PerformTransaction
const PerformTransaction = async (params, id) => {
  const t = await sequelize.transaction();
  try {
    const paymeTransactionId = params?.id;

    const paymeTx = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (!paymeTx) {
      await t.rollback();
      return errorResponse(id, PaymeError.TransactionNotFound);
    }

    // allaqachon bajarilgan
    if (paymeTx.state === 2) {
      await t.commit();
      return successResponse(id, {
        perform_time: Number(paymeTx.performTime || 0),
        transaction: String(paymeTx.id),
        state: paymeTx.state,
      });
    }

    // faqat state=1 bo'lsa perform qilamiz
    if (paymeTx.state !== 1) {
      await t.rollback();
      return errorResponse(id, PaymeError.CantDoOperation);
    }

    const performTime = Date.now();

    // user olish
    const user = await User.findByPk(paymeTx.userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
    }

    const amountSom = Number(paymeTx.amount || 0) / 100; // paymeTx.amount = tiyin
    const account = paymeTx.account || {};

    // =====================================================
    // GAME PAYMENT: Agar account.game_id mavjud bo'lsa (0 = topup)
    // o'yinga to'g'ridan-to'g'ri to'lov qilamiz
    // =====================================================
    if (account.game_id && String(account.game_id) !== "0") {
      const { Game, UserGame } = require("../models");

      const gameId = Number(account.game_id);
      const team = account.team || "Noma'lum";

      const game = await Game.findByPk(gameId, { transaction: t });
      if (!game) {
        // Game topilmasa, balansga qo'shamiz (fallback)
        console.warn(`Game ${gameId} not found, falling back to wallet topup`);
        await user.update(
          { balance: Number(user.balance || 0) + amountSom },
          { transaction: t }
        );
      } else {
        // UserGame mavjudmi tekshirish
        let userGameEntry = await UserGame.findOne({
          where: { userId: user.id, gameId: game.id },
          transaction: t,
        });

        if (userGameEntry) {
          // Mavjud bo'lsa - to'lovni qo'shamiz
          const newTotal = Number(userGameEntry.paymentAmount || 0) + amountSom;
          await userGameEntry.update(
            { paymentAmount: newTotal, status: "paid" },
            { transaction: t }
          );
        } else {
          // Yangi yozuv yaratamiz
          await UserGame.create(
            {
              userId: user.id,
              gameId: game.id,
              status: "paid",
              paymentAmount: amountSom,
              team: team,
            },
            { transaction: t }
          );
          // playersJoined ni oshiramiz
          await game.increment("playersJoined", { transaction: t });
        }

        // Transaction yaratish (expense turi)
        await Transaction.create(
          {
            userId: user.id,
            amount: amountSom,
            type: "expense",
            description: `${game.title} (Payme)`,
            status: "approved",
            paymentType: "payme",
            paymeTransactionId,
            paymeTime: String(paymeTx.paymeTime || ""),
          },
          { transaction: t }
        );
      }
    } else {
      // =====================================================
      // WALLET TOPUP: Oddiy balans to'ldirish (eski logika)
      // =====================================================
      await user.update(
        { balance: Number(user.balance || 0) + amountSom },
        { transaction: t }
      );

      // transaction status -> approved
      if (paymeTx.transactionId) {
        await Transaction.update(
          { status: "approved" },
          { where: { id: paymeTx.transactionId }, transaction: t }
        );
      }
    }

    await paymeTx.update(
      { state: 2, performTime },
      { transaction: t }
    );

    await t.commit();

    return successResponse(id, {
      perform_time: performTime,
      transaction: String(paymeTx.id),
      state: 2,
    });
  } catch (error) {
    await t.rollback();
    console.error("PerformTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 4) CancelTransaction
const CancelTransaction = async (params, id) => {
  const t = await sequelize.transaction();
  try {
    const paymeTransactionId = params?.id;
    const reason = params?.reason;

    const paymeTx = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (!paymeTx) {
      await t.rollback();
      return errorResponse(id, PaymeError.TransactionNotFound);
    }

    const cancelTime = Date.now();

    // Agar to'lov bajarilgan bo'lsa (state=2) -> rollback balans
    if (paymeTx.state === 2) {
      const user = await User.findByPk(paymeTx.userId, { transaction: t });
      if (user) {
        const amountSom = Number(paymeTx.amount || 0) / 100;
        // balans yetarliligini tekshiramiz
        if (Number(user.balance || 0) >= amountSom) {
          await user.update(
            { balance: Number(user.balance || 0) - amountSom },
            { transaction: t }
          );
        }
      }

      await paymeTx.update(
        { state: -2, cancelTime, reason },
        { transaction: t }
      );

      if (paymeTx.transactionId) {
        await Transaction.update(
          { status: "declined" },
          { where: { id: paymeTx.transactionId }, transaction: t }
        );
      }

      await t.commit();

      return successResponse(id, {
        cancel_time: cancelTime,
        transaction: String(paymeTx.id),
        state: -2,
      });
    }

    // Agar hali bajarilmagan bo'lsa (state=1) -> -1
    if (paymeTx.state === 1) {
      await paymeTx.update(
        { state: -1, cancelTime, reason },
        { transaction: t }
      );

      if (paymeTx.transactionId) {
        await Transaction.update(
          { status: "declined" },
          { where: { id: paymeTx.transactionId }, transaction: t }
        );
      }

      await t.commit();

      return successResponse(id, {
        cancel_time: cancelTime,
        transaction: String(paymeTx.id),
        state: -1,
      });
    }

    // allaqachon cancel bo'lgan bo'lsa
    await t.commit();
    return successResponse(id, {
      cancel_time: Number(paymeTx.cancelTime || 0),
      transaction: String(paymeTx.id),
      state: paymeTx.state,
    });
  } catch (error) {
    await t.rollback();
    console.error("CancelTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 5) CheckTransaction
const CheckTransaction = async (params, id) => {
  try {
    const paymeTransactionId = params?.id;

    const paymeTx = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
    });

    if (!paymeTx) return errorResponse(id, PaymeError.TransactionNotFound);

    return successResponse(id, {
      create_time: Number(paymeTx.createTime || 0),
      perform_time: Number(paymeTx.performTime || 0),
      cancel_time: Number(paymeTx.cancelTime || 0),
      transaction: String(paymeTx.id),
      state: paymeTx.state,
      reason: paymeTx.reason,
    });
  } catch (error) {
    console.error("CheckTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 6) GetStatement
const GetStatement = async (params, id) => {
  try {
    const { from, to } = params || {};
    const { Op } = require("sequelize");

    const txs = await PaymeTransaction.findAll({
      where: {
        createTime: {
          [Op.between]: [Number(from || 0), Number(to || Date.now())],
        },
      },
    });

    const result = txs.map((tx) => ({
      id: tx.paymeTransactionId,
      time: Number(tx.createTime || 0),
      amount: Number(tx.amount || 0), // ✅ tiyin (Payme format)
      account: tx.account || {},
      create_time: Number(tx.createTime || 0),
      perform_time: Number(tx.performTime || 0),
      cancel_time: Number(tx.cancelTime || 0),
      transaction: String(tx.id),
      state: tx.state,
      reason: tx.reason,
    }));

    return successResponse(id, { transactions: result });
  } catch (error) {
    console.error("GetStatement error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// ============================================================
// MAIN ENDPOINT
// ============================================================
const handlePayme = async (req, res) => {
  if (!checkAuth(req)) {
    return res.json(errorResponse(req.body?.id, PaymeError.InvalidAuthorization));
  }

  const { method, params, id } = req.body || {};

  let result;

  switch (method) {
    case "CheckPerformTransaction":
      result = await CheckPerformTransaction(params, id);
      break;
    case "CreateTransaction":
      result = await CreateTransaction(params, id);
      break;
    case "PerformTransaction":
      result = await PerformTransaction(params, id);
      break;
    case "CancelTransaction":
      result = await CancelTransaction(params, id);
      break;
    case "CheckTransaction":
      result = await CheckTransaction(params, id);
      break;
    case "GetStatement":
      result = await GetStatement(params, id);
      break;
    default:
      result = errorResponse(id, {
        code: -32601,
        message: {
          uz: "Metod topilmadi",
          ru: "Метод не найден",
          en: "Method not found",
        },
      });
  }

  return res.json(result);
};

module.exports = { handlePayme };
