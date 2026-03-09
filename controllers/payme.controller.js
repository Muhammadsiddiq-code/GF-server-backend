// controllers/payme.controller.js
const { User, Transaction, PaymeTransaction, PaymeOrder, sequelize } = require("../models");
require("dotenv").config();

const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY;
const PAYME_TEST_KEY = process.env.PAYME_TEST_KEY;

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
  error: {
    code: error.code,
    message: typeof error.message === "object" ? error.message : { uz: error.message, ru: error.message, en: error.message },
    data: error.data || null,
  },
});

const successResponse = (id, result) => ({
  jsonrpc: "2.0",
  id,
  result,
});

// --- Basic Auth tekshirish (Paycom:SECRET_KEY) ---
// "test" yoki "production" qaytaradi, yoki false
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

  const colonIndex = decoded.indexOf(":");
  const login = decoded.substring(0, colonIndex);
  const password = decoded.substring(colonIndex + 1);
  if (!login || password === undefined) return false;

  if (login !== "Paycom") return false;
  if (password === process.env.PAYME_SECRET_KEY) return "production";
  if (password === process.env.PAYME_TEST_KEY) return "test";
  return false;
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
    const orderId = account?.order_id;

    if (!tgId) return errorResponse(id, PaymeError.UserNotFound);

    const user = await User.findOne({ where: { telegramId: String(tgId) } });
    if (!user) return errorResponse(id, PaymeError.UserNotFound);

    // Order tekshirish - order_id bazada bo'lishi kerak
    if (!orderId) return errorResponse(id, PaymeError.UserNotFound);
    const order = await PaymeOrder.findOne({ where: { orderId: String(orderId) } });
    if (!order) return errorResponse(id, PaymeError.UserNotFound);

    // Account fieldlarini order bilan solishtirish
    if (order.telegramId !== String(tgId)) return errorResponse(id, PaymeError.UserNotFound);
    if (order.gameId !== String(account?.game_id || "0")) return errorResponse(id, PaymeError.UserNotFound);
    if (order.team !== String(account?.team || "NA")) return errorResponse(id, PaymeError.UserNotFound);

    // Summa tekshiruvi
    const amountTiyin = Number(amount);
    if (!Number.isFinite(amountTiyin) || amountTiyin < 100 || amountTiyin > 100_000_000) {
      return errorResponse(id, PaymeError.InvalidAmount);
    }
    if (order.amount !== amountTiyin) {
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
    const orderId = account?.order_id;

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

    // Order tekshirish
    if (!orderId) {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
    }
    const order = await PaymeOrder.findOne({ where: { orderId: String(orderId) }, transaction: t });
    if (!order) {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
    }

    // Account fieldlarini order bilan solishtirish
    if (order.telegramId !== String(tgId) || order.gameId !== String(account?.game_id || "0") || order.team !== String(account?.team || "NA")) {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
    }

    const amountTiyin = Number(amount);
    if (!Number.isFinite(amountTiyin) || amountTiyin < 100 || amountTiyin > 100_000_000) {
      await t.rollback();
      return errorResponse(id, PaymeError.InvalidAmount);
    }

    // Order summasi tekshirish
    if (order.amount !== amountTiyin) {
      await t.rollback();
      return errorResponse(id, PaymeError.InvalidAmount);
    }

    // PaymeTransaction oldin bor-yo'qligini tekshiramiz (qayta chaqiruv bo'lishi mumkin)
    let paymeTx = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (paymeTx) {
      await t.rollback();
      // state=1 bo'lsa shu transactionni qaytaramiz (idempotent)
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

    // Shu order uchun allaqachon boshqa tranzaksiya bormi tekshirish
    if (order.status !== "pending") {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
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

    // Order statusini yangilash
    await order.update({ status: "processing" }, { transaction: t });

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
    // GAME PAYMENT: Agar account.game_id mavjud bo'lsa  (0 = topup)
    // o'yinga to'g'ridan-to'g'ri to'lov qilamiz
    // =====================================================
   if (account.game_id && String(account.game_id) !== "0"){
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

    // Agar to'lov bajarilgan bo'lsa (state=2) -> rollback
    if (paymeTx.state === 2) {
      const { Game, UserGame } = require("../models");
      const user = await User.findByPk(paymeTx.userId, { transaction: t });
      const amountSom = Number(paymeTx.amount || 0) / 100;
      const account = paymeTx.account || {};
      const gameId = account.game_id;

      if (gameId && gameId !== "0") {
        // O'yin to'lovi bekor qilish — UserGame va playersJoined qaytarish
        const userGameEntry = await UserGame.findOne({
          where: { userId: paymeTx.userId, gameId },
          transaction: t,
        });
        if (userGameEntry) {
          await userGameEntry.destroy({ transaction: t });
        }

        const game = await Game.findByPk(gameId, { transaction: t });
        if (game && game.playersJoined > 0) {
          await game.update(
            { playersJoined: game.playersJoined - 1 },
            { transaction: t }
          );
        }

        // Expense transactionni ham declined qilish
        await Transaction.update(
          { status: "declined" },
          {
            where: { userId: paymeTx.userId, paymentType: "payme", type: "expense", status: "approved" },
            transaction: t,
            limit: 1,
          }
        );
      } else {
        // Hamyon to'ldirish bekor qilish — balansni kamaytirish
        if (user && Number(user.balance || 0) >= amountSom) {
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

// 7) ChangePassword
const ChangePassword = async (params, id, authType) => {
  try {
    const { password } = params || {};
    if (!password) return errorResponse(id, PaymeError.CantDoOperation);

    const fs = require("fs");
    const envPath = require("path").join(__dirname, "..", ".env");
    let envContent = fs.readFileSync(envPath, "utf8");

    // Qaysi kalit bilan autentifikatsiya qilingan bo'lsa, shuni o'zgartiramiz
    const envKey = authType === "test" ? "PAYME_TEST_KEY" : "PAYME_SECRET_KEY";
    const oldKey = process.env[envKey];

    if (envContent.includes(`${envKey}=`)) {
      envContent = envContent.replace(
        new RegExp(`${envKey}=.*`),
        `${envKey}="${password}"`
      );
    } else {
      envContent += `\n${envKey}="${password}"`;
    }

    fs.writeFileSync(envPath, envContent);

    // Runtime da ham yangilash
    process.env[envKey] = password;

    console.log("PAYME PASSWORD CHANGED:", { type: authType, envKey, old: oldKey?.slice(0, 5) + "...", new: password?.slice(0, 5) + "..." });

    return successResponse(id, { success: true });
  } catch (error) {
    console.error("ChangePassword error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// ============================================================
// MAIN ENDPOINT
// ============================================================
const handlePayme = async (req, res) => {
  console.log("PAYME REQUEST:", JSON.stringify({ method: req.body?.method, auth: !!req.headers.authorization, body: req.body }));
  const authType = checkAuth(req);
  if (!authType) {
    console.log("PAYME AUTH FAILED");
    return res.json(errorResponse(req.body?.id, PaymeError.InvalidAuthorization));
  }
  console.log("PAYME AUTH OK, type:", authType);

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
    case "ChangePassword":
      result = await ChangePassword(params, id, authType);
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
