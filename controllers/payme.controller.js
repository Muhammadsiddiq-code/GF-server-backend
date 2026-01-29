const {
  User,
  Transaction,
  PaymeTransaction,
  sequelize,
} = require("../models");
require("dotenv").config();

// PAYME konfiguratsiya
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY; // test yoki prod key

// PAYME xatolik kodlari
const PaymeError = {
  InvalidAmount: {
    code: -31001,
    message: { uz: "Noto'g'ri summa", ru: "Неверная сумма", en: "Invalid amount" },
  },
  UserNotFound: {
    code: -31050,
    message: { uz: "Foydalanuvchi topilmadi", ru: "Пользователь не найден", en: "User not found" },
  },
  TransactionNotFound: {
    code: -31003,
    message: { uz: "Tranzaksiya topilmadi", ru: "Транзакция не найдена", en: "Transaction not found" },
  },
  CantDoOperation: {
    code: -31008,
    message: { uz: "Operatsiyani bajarib bo'lmaydi", ru: "Невозможно выполнить операцию", en: "Cannot perform operation" },
  },
  TransactionAlreadyExists: {
    code: -31051,
    message: { uz: "Tranzaksiya allaqachon mavjud", ru: "Транзакция уже существует", en: "Transaction already exists" },
  },
  InvalidAuthorization: {
    code: -32504,
    message: { uz: "Avtorizatsiya xatosi", ru: "Ошибка авторизации", en: "Authorization error" },
  },
};

// Basic Auth tekshirish
const checkAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [login, password] = credentials.split(":");

  return login === "Paycom" && password === PAYME_SECRET_KEY;
};

// Xatolik response
const errorResponse = (id, error) => ({
  jsonrpc: "2.0",
  id,
  error: {
    code: error.code,
    message: error.message,
  },
});

// Success response
const successResponse = (id, result) => ({
  jsonrpc: "2.0",
  id,
  result,
});

// ============== PAYME METODLARI ==============

// 1. CheckPerformTransaction - To'lov qilish mumkinligini tekshirish
const CheckPerformTransaction = async (params, id) => {
  try {
    const { account, amount } = params;
    const userId = account?.user_id;

    // User tekshirish
    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(id, PaymeError.UserNotFound);
    }

    // Summa tekshirish (PAYME tiyinda yuboradi, 1 so'm = 100 tiyin)
    if (!amount || amount < 100) {
      return errorResponse(id, PaymeError.InvalidAmount);
    }

    return successResponse(id, { allow: true });
  } catch (error) {
    console.error("CheckPerformTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 2. CreateTransaction - Yangi tranzaksiya yaratish
const CreateTransaction = async (params, id) => {
  const t = await sequelize.transaction();

  try {
    const { account, amount, time } = params;
    const paymeTransactionId = params.id;
    const userId = account?.user_id;

    // User tekshirish
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return errorResponse(id, PaymeError.UserNotFound);
    }

    // Mavjud tranzaksiyani tekshirish
    let paymeTransaction = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (paymeTransaction) {
      await t.rollback();
      // Agar tranzaksiya mavjud va state=1 bo'lsa, qaytaramiz
      if (paymeTransaction.state === 1) {
        return successResponse(id, {
          create_time: Number(paymeTransaction.createTime),
          transaction: String(paymeTransaction.id),
          state: paymeTransaction.state,
        });
      } else {
        return errorResponse(id, PaymeError.CantDoOperation);
      }
    }

    // Summani so'mga o'girish (tiyin -> so'm)
    const amountInSom = amount / 100;

    // Transaction yaratish (wallet request)
    const transaction = await Transaction.create({
      userId: user.id,
      amount: amountInSom,
      type: "income",
      description: "PAYME orqali balans to'ldirish",
      status: "pending",
      paymentType: "payme",
      paymeTransactionId,
      paymeTime: String(time),
    }, { transaction: t });

    // PaymeTransaction yaratish
    paymeTransaction = await PaymeTransaction.create({
      userId: user.id,
      transactionId: transaction.id,
      paymeTransactionId,
      paymeTime: String(time),
      amount: amountInSom,
      state: 1, // Created
      createTime: time,
      account: account,
    }, { transaction: t });

    await t.commit();

    return successResponse(id, {
      create_time: Number(paymeTransaction.createTime),
      transaction: String(paymeTransaction.id),
      state: paymeTransaction.state,
    });
  } catch (error) {
    await t.rollback();
    console.error("CreateTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 3. PerformTransaction - Tranzaksiyani bajarish (to'lovni tasdiqlash)
const PerformTransaction = async (params, id) => {
  const t = await sequelize.transaction();

  try {
    const paymeTransactionId = params.id;

    // PaymeTransaction topish
    const paymeTransaction = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (!paymeTransaction) {
      await t.rollback();
      return errorResponse(id, PaymeError.TransactionNotFound);
    }

    // State tekshirish
    if (paymeTransaction.state !== 1) {
      await t.rollback();
      if (paymeTransaction.state === 2) {
        // Allaqachon bajarilgan
        return successResponse(id, {
          perform_time: Number(paymeTransaction.performTime),
          transaction: String(paymeTransaction.id),
          state: paymeTransaction.state,
        });
      }
      return errorResponse(id, PaymeError.CantDoOperation);
    }

    const performTime = Date.now();

    // User balansini yangilash
    const user = await User.findByPk(paymeTransaction.userId, { transaction: t });
    if (user) {
      await user.update(
        { balance: user.balance + paymeTransaction.amount },
        { transaction: t }
      );
    }

    // Transaction statusini yangilash
    if (paymeTransaction.transactionId) {
      await Transaction.update(
        { status: "approved" },
        { where: { id: paymeTransaction.transactionId }, transaction: t }
      );
    }

    // PaymeTransaction ni yangilash
    await paymeTransaction.update(
      { state: 2, performTime },
      { transaction: t }
    );

    await t.commit();

    return successResponse(id, {
      perform_time: performTime,
      transaction: String(paymeTransaction.id),
      state: 2,
    });
  } catch (error) {
    await t.rollback();
    console.error("PerformTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 4. CancelTransaction - Tranzaksiyani bekor qilish
const CancelTransaction = async (params, id) => {
  const t = await sequelize.transaction();

  try {
    const paymeTransactionId = params.id;
    const reason = params.reason;

    // PaymeTransaction topish
    const paymeTransaction = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (!paymeTransaction) {
      await t.rollback();
      return errorResponse(id, PaymeError.TransactionNotFound);
    }

    const cancelTime = Date.now();

    // Agar to'lov bajarilgan bo'lsa, balansdan qaytarish
    if (paymeTransaction.state === 2) {
      const user = await User.findByPk(paymeTransaction.userId, { transaction: t });
      if (user && user.balance >= paymeTransaction.amount) {
        await user.update(
          { balance: user.balance - paymeTransaction.amount },
          { transaction: t }
        );
      }

      // State: -2 (CancelledAfterComplete)
      await paymeTransaction.update(
        { state: -2, cancelTime, reason },
        { transaction: t }
      );

      // Transaction statusini yangilash
      if (paymeTransaction.transactionId) {
        await Transaction.update(
          { status: "declined" },
          { where: { id: paymeTransaction.transactionId }, transaction: t }
        );
      }

      await t.commit();

      return successResponse(id, {
        cancel_time: cancelTime,
        transaction: String(paymeTransaction.id),
        state: -2,
      });
    }

    // Agar to'lov hali bajarilmagan bo'lsa
    if (paymeTransaction.state === 1) {
      await paymeTransaction.update(
        { state: -1, cancelTime, reason },
        { transaction: t }
      );

      // Transaction statusini yangilash
      if (paymeTransaction.transactionId) {
        await Transaction.update(
          { status: "declined" },
          { where: { id: paymeTransaction.transactionId }, transaction: t }
        );
      }

      await t.commit();

      return successResponse(id, {
        cancel_time: cancelTime,
        transaction: String(paymeTransaction.id),
        state: -1,
      });
    }

    // Allaqachon bekor qilingan
    await t.rollback();

    return successResponse(id, {
      cancel_time: Number(paymeTransaction.cancelTime),
      transaction: String(paymeTransaction.id),
      state: paymeTransaction.state,
    });
  } catch (error) {
    await t.rollback();
    console.error("CancelTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 5. CheckTransaction - Tranzaksiya holatini tekshirish
const CheckTransaction = async (params, id) => {
  const t = await sequelize.transaction();

  try {
    const paymeTransactionId = params.id;

    const paymeTransaction = await PaymeTransaction.findOne({
      where: { paymeTransactionId },
      transaction: t,
    });

    if (!paymeTransaction) {
      await t.rollback();
      return errorResponse(id, PaymeError.TransactionNotFound);
    }

    await t.commit();

    return successResponse(id, {
      create_time: Number(paymeTransaction.createTime),
      perform_time: Number(paymeTransaction.performTime),
      cancel_time: Number(paymeTransaction.cancelTime),
      transaction: String(paymeTransaction.id),
      state: paymeTransaction.state,
      reason: paymeTransaction.reason,
    });
  } catch (error) {
    await t.rollback();
    console.error("CheckTransaction error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// 6. GetStatement - Hisobot olish
const GetStatement = async (params, id) => {
  const t = await sequelize.transaction();

  try {
    const { from, to } = params;
    const { Op } = require("sequelize");

    const transactions = await PaymeTransaction.findAll({
      where: {
        createTime: {
          [Op.between]: [from, to],
        },
      },
      transaction: t,
    });

    await t.commit();

    const result = transactions.map((tx) => ({
      id: tx.paymeTransactionId,
      time: Number(tx.createTime),
      amount: tx.amount * 100, // so'm -> tiyin
      account: tx.account,
      create_time: Number(tx.createTime),
      perform_time: Number(tx.performTime),
      cancel_time: Number(tx.cancelTime),
      transaction: String(tx.id),
      state: tx.state,
      reason: tx.reason,
    }));

    return successResponse(id, { transactions: result });
  } catch (error) {
    await t.rollback();
    console.error("GetStatement error:", error);
    return errorResponse(id, PaymeError.CantDoOperation);
  }
};

// ============== ASOSIY ENDPOINT ==============

const handlePayme = async (req, res) => {
  // Auth tekshirish
  if (!checkAuth(req)) {
    return res.json(errorResponse(req.body.id, PaymeError.InvalidAuthorization));
  }

  const { method, params, id } = req.body;

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
        message: { uz: "Metod topilmadi", ru: "Метод не найден", en: "Method not found" },
      });
  }

  return res.json(result);
};

module.exports = {
  handlePayme,
};
