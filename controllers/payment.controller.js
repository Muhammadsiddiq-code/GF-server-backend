// controllers/payment.controller.js
const { User, Game, Transaction, UserGame, PaymeOrder, sequelize } = require("../models");
const crypto = require("crypto");
<<<<<<< HEAD
const { notifyPayment } = require("../utils/paymentNotifier");
=======
const uuidv4 = () => crypto.randomUUID();
>>>>>>> 757d341efebfdb1b5a08275e1affbfabaf18e8a5

// --- XAVFSIZLIK: Ruxsat etilgan maximum to'lov (UZS) ---
const MAX_PAYMENT_AMOUNT = 50_000_000; // 50 mln UZS

// CLICK sozlamalari
const CLICK_SERVICE_ID = () => process.env.CLICK_SERVICE_ID;
const CLICK_MERCHANT_ID = () => process.env.CLICK_MERCHANT_ID;
const CLICK_BASE_URL = "https://my.click.uz/services/pay";

// --- HELPER: 16 raqamli karta raqam generatsiya ---
const generateNumericCard = () => {
  // 8600 bilan boshlaydigan 16 raqamli karta (Uzcard format)
  const random12 = crypto.randomInt(100000000000, 999999999999);
  return `8600${random12}`;
};

// --- HELPER: Input sanitize ---
const sanitizeTelegramId = (id) => {
  if (!id) return null;
  const cleaned = String(id).replace(/[^0-9]/g, '');
  if (cleaned.length < 1 || cleaned.length > 15) return null;
  return cleaned;
};

const providerToken = process.env.PROVIDER_TOKEN; // Telegram invoice provider token
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;

// Payme checkout URL: TEST yoki PRODUCTION
// Railway'da PAYME_ENV=production qo'shing (real pul uchun)
// Default: test rejim (test karta bilan ishlaydi)
const PAYME_ENV = process.env.PAYME_ENV || "test";
const PAYME_CHECKOUT_BASE = PAYME_ENV === "production"
  ? "https://checkout.paycom.uz"
  : "https://checkout.test.paycom.uz";

// ------------------------------------------------------------
// 1) TELEGRAM INVOICE YARATISH (Telegram Payments / ProviderToken)
// ------------------------------------------------------------
const createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type, team } = req.body;

    const bot = req.bot;
    if (!bot) return res.status(500).json({ msg: "Bot serverda ishlamayapti" });
    if (!providerToken)
      return res.status(500).json({ msg: "PROVIDER_TOKEN .env da yo'q" });

    const tgIdString = sanitizeTelegramId(telegramId);
    if (!tgIdString) return res.status(400).json({ msg: "Telegram ID noto'g'ri" });

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > MAX_PAYMENT_AMOUNT)
      return res.status(400).json({ msg: "Amount noto'g'ri (1 — 50,000,000 UZS)" });

    let title, description, payload, prices;

    if (type === "GAME") {
      if (!gameId) return res.status(400).json({ msg: "gameId kerak" });

      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "Game not found" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yini uchun to'lov`;

      const safeTeam = team ? String(team).replace(/\s/g, "_") : "NA";
      payload = `GAME_${gameId}_${tgIdString}_${safeTeam}`;

      prices = [{ label: game.title, amount: parseInt(amount, 10) * 100 }]; // tiyin
    } else {
      title = "Hamyonni to'ldirish";
      description = "Hisobingizga mablag' qo'shish";
      payload = `TOPUP_${tgIdString}`;
      prices = [{ label: "Balans", amount: parseInt(amount, 10) * 100 }]; // tiyin
    }

    await bot.sendInvoice(
      tgIdString,
      title,
      description,
      payload,
      providerToken,
      "UZS",
      prices
    );

    return res.json({ success: true, message: "Invoice yuborildi" });
  } catch (error) {
    console.error("Invoice Error:", error);
    return res.status(500).json({ msg: error.message });
  }
};

// ------------------------------------------------------------
// 2) HAMYONDAN TO'LASH (Wallet) + UserGame + Transaction
// ------------------------------------------------------------
const payWithWallet = async (req, res) => {
  // ✅ XAVFSIZLIK: Atomik tranzaksiya (race condition/double-spend oldini olish)
  const t = await sequelize.transaction();
  try {
    const { telegramId, gameId, amount, team } = req.body;

    const tgIdString = sanitizeTelegramId(telegramId);
    if (!tgIdString) {
      await t.rollback();
      return res.status(400).json({ msg: "Telegram ID noto'g'ri" });
    }
    if (!gameId) {
      await t.rollback();
      return res.status(400).json({ msg: "gameId topilmadi" });
    }

    // ✅ FOR UPDATE — boshqa so'rov balansni o'zgartira olmasin
    const user = await User.findOne({
      where: { telegramId: tgIdString },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    const game = await Game.findByPk(gameId, { transaction: t });

    if (!user || !game) {
      await t.rollback();
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });
    }

    // --- HISOBLASH ---
    const totalPlayers = game.totalPlayers || 14;
    const pricePerPerson = Math.ceil((game.price || 0) / totalPlayers);

    const totalAdvance = game.advance || 0;
    const advancePerPerson =
      totalAdvance > 0 ? Math.ceil(totalAdvance / totalPlayers) : 0;

    const payAmount =
      amount !== undefined && amount !== null && String(amount).trim() !== ""
        ? Number(amount)
        : pricePerPerson;

    // ✅ XAVFSIZLIK: Salbiy summa va limit tekshiruvi
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ msg: "Amount noto'g'ri" });
    }
    if (payAmount > MAX_PAYMENT_AMOUNT) {
      await t.rollback();
      return res.status(400).json({ msg: `Maximum to'lov: ${MAX_PAYMENT_AMOUNT.toLocaleString()} UZS` });
    }

    // --- TEKSHIRUV ---
    let userGameEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
      transaction: t,
    });

    if (!userGameEntry) {
      const minRequired =
        advancePerPerson > 0 ? advancePerPerson : pricePerPerson;

      if (payAmount < minRequired - 1) {
        await t.rollback();
        return res.status(400).json({
          msg: `Minimal to'lov: ${minRequired.toLocaleString()} UZS (Kishi boshiga)`,
        });
      }
    }

    if (Number(user.balance) < payAmount) {
      await t.rollback();
      return res.status(400).json({ msg: "Hisobingizda mablag' yetarli emas." });
    }

    // --- ATOMIK TRANZAKSIYA --- (hamma yoki hech narsa)
    await user.update(
      { balance: Number(user.balance) - payAmount },
      { transaction: t }
    );

    if (userGameEntry) {
      const newTotal = Number(userGameEntry.paymentAmount || 0) + payAmount;
      await userGameEntry.update(
        { paymentAmount: newTotal, status: "paid" },
        { transaction: t }
      );
    } else {
      await UserGame.create(
        {
          userId: user.id,
          gameId: game.id,
          status: "paid",
          paymentAmount: payAmount,
          team: team || "Noma'lum",
        },
        { transaction: t }
      );
      await game.increment("playersJoined", { transaction: t });
    }

    await Transaction.create(
      {
        userId: user.id,
        amount: payAmount,
        type: "expense",
        description: `${game.title} (Hamyon)`,
        status: "approved",
        paymentType: "wallet",
        paymeTransactionId: null,
        paymeTime: null,
      },
      { transaction: t }
    );

    // ✅ Hammasi yaxshi — commit
    await t.commit();

    // --- To'lov xabarnomasi Telegram botga ---
    notifyPayment({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        telegramId: tgIdString,
      },
      game: game
        ? {
            title: game.title,
            location: game.location,
            playDate: game.playDate,
            startTime: game.startTime,
            endTime: game.endTime,
          }
        : null,
      amount: payAmount,
      method: "wallet",
      team: team || "Noma'lum",
      type: "game",
    }).catch(() => {});

    // --- Bot orqali xabar (tranzaksiyadan tashqarida) ---
    if (req.bot) {
      try {
        const message = `✅ <b>To'lov qabul qilindi!</b>\n\n⚽️ <b>O'yin:</b> ${game.title
          }\n💰 <b>Summa:</b> ${Number(payAmount).toLocaleString()} UZS\n📍 <b>Manzil:</b> ${game.location || "-"
          }\n⏰ <b>Vaqt:</b> ${game.playDate || "-"} | ${game.startTime || "-"
          }\n\nSiz o'yinga muvaffaqiyatli qo'shildingiz!`;

        await req.bot.sendMessage(tgIdString, message, { parse_mode: "HTML" });
      } catch (botError) {
        console.error("Bot message error:", botError.message);
      }
    }

    return res.json({ success: true, message: "To'lov muvaffaqiyatli!" });
  } catch (error) {
    await t.rollback();
    console.error("Wallet Pay Error:", error);
    return res.status(500).json({ msg: "Server xatosi: " + error.message });
  }
};

// ------------------------------------------------------------
// 3) USER WALLET + TRANSACTIONS
// ------------------------------------------------------------
const getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const tgIdString = sanitizeTelegramId(telegramId);
    if (!tgIdString) return res.status(400).json({ msg: "Telegram ID noto'g'ri" });

    let user = await User.findOne({
      where: { telegramId: tgIdString },
      include: [{ model: Transaction, as: "transactions" }],
    });

    if (!user) return res.status(404).json({ msg: "User topilmadi" });

    // ✅ Faqat raqamli 16 xonali karta raqam generatsiya
    if (!user.walletCardNumber || /[^0-9]/.test(user.walletCardNumber)) {
      const numericCard = generateNumericCard();
      await user.update({ walletCardNumber: numericCard });
      user.walletCardNumber = numericCard;
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// ------------------------------------------------------------
// 4) PAYME CHECKOUT URL (Web frontend uchun)
//    Frontend buni chaqiradi -> checkoutUrl qaytadi
//    Payme callback esa /api/payme da qoladi (payme.controller)
// ------------------------------------------------------------
const getPaymeCheckoutUrl = async (req, res) => {
  try {
    const { telegramId, amount } = req.body;

    if (!PAYME_MERCHANT_ID) {
      return res.status(500).json({ msg: "PAYME_MERCHANT_ID .env da yo'q" });
    }

    if (!telegramId)
      return res.status(400).json({ msg: "telegramId topilmadi" });

    const amountSom = Number(amount);
    if (!Number.isFinite(amountSom) || amountSom <= 0) {
      return res.status(400).json({ msg: "amount noto'g'ri" });
    }

    // telegramId DBda borligini ham tekshirib qo'yamiz (ixtiyoriy, lekin foydali)
    const user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });
    if (!user) return res.status(404).json({ msg: "User topilmadi" });

    // Payme tiyin bilan ishlaydi: 1 so'm = 100 tiyin
    const amountTiyin = Math.round(amountSom * 100);
    if (amountTiyin < 100) {
      return res.status(400).json({ msg: "Minimal amount 1 so'm" });
    }

<<<<<<< HEAD
    const orderId = String(Date.now());

    // Orderni bazaga saqlash (CheckPerformTransaction tekshirishi uchun)
    await PaymeOrder.create({
      orderId,
      userId: user.id,
      telegramId: String(telegramId),
      gameId: "0",
      team: "NA",
      amount: amountTiyin,
      status: "pending",
    });

    const params = `m=${PAYME_MERCHANT_ID};ac.order_id=${orderId};ac.telegram_id=${String(telegramId)};ac.game_id=0;ac.team=NA;a=${amountTiyin}`;
=======
    // Payme account: telegram_id yuboramiz
    // Payme callback (CheckPerformTransaction/CreateTransaction) ham shuni tekshirishi kerak:
    // account.telegram_id bo'yicha User topish.
    const params = `m=${PAYME_MERCHANT_ID};ac.telegram_id=${encodeURIComponent(
      String(telegramId)
    )};ac.game_id=0;ac.team=NA;a=${amountTiyin}`;
>>>>>>> 7e88bce5dea5c397cfb6e8600ae94e71767e4ab9

    const b64 = Buffer.from(params).toString("base64");
    const checkoutUrl = `${PAYME_CHECKOUT_BASE}/${b64}`;

    return res.json({
      checkoutUrl,
      amountSom,
      amountTiyin,
<<<<<<< HEAD
      account: { telegram_id: String(telegramId), game_id: "0", team: "NA", order_id: orderId },
=======
      account: { telegram_id: String(telegramId), game_id: "0", team: "NA" },
>>>>>>> 7e88bce5dea5c397cfb6e8600ae94e71767e4ab9
    });
  } catch (error) {
    console.error("Payme checkout-url error:", error);
    return res.status(500).json({ msg: error.message });
  }
};

// ------------------------------------------------------------
// 5) PAYME GAME CHECKOUT URL (O'yinga to'g'ridan-to'g'ri to'lash)
//    Frontend bu endpointni chaqiradi -> checkoutUrl qaytadi
//    User to'lovni to'lagandan keyin, Payme callback orqali
//    avtomatik ravishda o'yinga qo'shiladi
// ------------------------------------------------------------
const createGamePaymeCheckout = async (req, res) => {
  try {
    const { telegramId, gameId, amount, team } = req.body;

    if (!PAYME_MERCHANT_ID) {
      return res.status(500).json({ msg: "PAYME_MERCHANT_ID .env da yo'q" });
    }

    if (!telegramId) {
      return res.status(400).json({ msg: "telegramId topilmadi" });
    }

    if (!gameId) {
      return res.status(400).json({ msg: "gameId topilmadi" });
    }

    const amountSom = Number(amount);
    if (!Number.isFinite(amountSom) || amountSom <= 0) {
      return res.status(400).json({ msg: "amount noto'g'ri" });
    }

    // User mavjudligini tekshirish
    const user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });
    if (!user) return res.status(404).json({ msg: "User topilmadi" });

    // Game mavjudligini tekshirish
    const game = await Game.findByPk(gameId);
    if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

    // O'yinga allaqachon qo'shilganmi tekshirish
    const existingEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
    });

    // Agar to'liq to'langan bo'lsa
    const totalPlayers = game.totalPlayers || 14;
    const pricePerPerson = Math.ceil((game.price || 0) / totalPlayers);

    if (existingEntry) {
      const currentPaid = Number(existingEntry.paymentAmount || 0);
      if (currentPaid >= pricePerPerson - 1) {
        return res.status(400).json({ msg: "Siz bu o'yinga to'liq to'lov qilgansiz" });
      }
    }

    // Joylar to'lganmi tekshirish
    const isGameFull = (game.playersJoined || 0) >= totalPlayers;
    if (isGameFull && !existingEntry) {
      return res.status(400).json({ msg: "Bu o'yinda joylar to'lgan" });
    }

    // Payme tiyin bilan ishlaydi: 1 so'm = 100 tiyin
    const amountTiyin = Math.round(amountSom * 100);
    if (amountTiyin < 100) {
      return res.status(400).json({ msg: "Minimal amount 1 so'm" });
    }

    // Payme account: telegram_id, game_id, team yuboramiz
    // Payme callback (PerformTransaction) ham shularni tekshiradi
    const safeTeam = team ? String(team).replace(/[^a-zA-Z0-9\s]/g, "").substring(0, 30) : "NA";
    const orderId = String(Date.now());

    // Orderni bazaga saqlash
    await PaymeOrder.create({
      orderId,
      userId: user.id,
      telegramId: String(telegramId),
      gameId: String(gameId),
      team: safeTeam,
      amount: amountTiyin,
      status: "pending",
    });

    const params = `m=${PAYME_MERCHANT_ID};ac.order_id=${orderId};ac.telegram_id=${String(telegramId)};ac.game_id=${String(gameId)};ac.team=${safeTeam};a=${amountTiyin}`;

    const b64 = Buffer.from(params).toString("base64");
    const checkoutUrl = `${PAYME_CHECKOUT_BASE}/${b64}`;

    return res.json({
      success: true,
      checkoutUrl,
      amountSom,
      amountTiyin,
      account: {
        telegram_id: String(telegramId),
        game_id: String(gameId),
        team: safeTeam
      },
    });
  } catch (error) {
    console.error("Payme game checkout error:", error);
    return res.status(500).json({ msg: error.message });
  }
};

// ------------------------------------------------------------
// 6) BARCHA TRANZAKSIYALARNI OLISH (Admin uchun)
// ------------------------------------------------------------
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "username", "telegramId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json(transactions);
  } catch (error) {
    console.error("getAllTransactions error:", error);
    return res.status(500).json({ msg: "Tranzaksiyalarni olishda xato: " + error.message });
  }
};

// ------------------------------------------------------------
// 7) CLICK CHECKOUT URL (Hamyon to'ldirish uchun)
// ------------------------------------------------------------
const getClickCheckoutUrl = async (req, res) => {
  try {
    const { telegramId, amount } = req.body;

    const serviceId = CLICK_SERVICE_ID();
    const merchantId = CLICK_MERCHANT_ID();

    if (!serviceId || !merchantId) {
      return res.status(500).json({ msg: "CLICK_SERVICE_ID yoki CLICK_MERCHANT_ID .env da yo'q" });
    }

    if (!telegramId) return res.status(400).json({ msg: "telegramId topilmadi" });

    const amountSom = Number(amount);
    if (!Number.isFinite(amountSom) || amountSom <= 0) {
      return res.status(400).json({ msg: "amount noto'g'ri" });
    }
    if (amountSom > MAX_PAYMENT_AMOUNT) {
      return res.status(400).json({ msg: `Maximum: ${MAX_PAYMENT_AMOUNT.toLocaleString()} UZS` });
    }

    const user = await User.findOne({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ msg: "User topilmadi" });

    // merchant_trans_id = telegramId (wallet topup)
    const merchantTransId = String(telegramId);
    const returnUrl = encodeURIComponent("https://goforfun.vercel.app");

    const clickUrl = `${CLICK_BASE_URL}?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amountSom}&transaction_param=${merchantTransId}&return_url=${returnUrl}`;

    return res.json({
      success: true,
      clickUrl,
      amount: amountSom,
    });
  } catch (error) {
    console.error("Click checkout-url error:", error);
    return res.status(500).json({ msg: error.message });
  }
};

// ------------------------------------------------------------
// 8) CLICK GAME CHECKOUT URL (O'yinga to'g'ridan-to'g'ri to'lash)
// ------------------------------------------------------------
const createGameClickCheckout = async (req, res) => {
  try {
    const { telegramId, gameId, amount, team } = req.body;

    const serviceId = CLICK_SERVICE_ID();
    const merchantId = CLICK_MERCHANT_ID();

    if (!serviceId || !merchantId) {
      return res.status(500).json({ msg: "CLICK_SERVICE_ID yoki CLICK_MERCHANT_ID .env da yo'q" });
    }

    if (!telegramId) return res.status(400).json({ msg: "telegramId topilmadi" });
    if (!gameId) return res.status(400).json({ msg: "gameId topilmadi" });

    const amountSom = Number(amount);
    if (!Number.isFinite(amountSom) || amountSom <= 0) {
      return res.status(400).json({ msg: "amount noto'g'ri" });
    }

    const user = await User.findOne({ where: { telegramId: String(telegramId) } });
    if (!user) return res.status(404).json({ msg: "User topilmadi" });

    const game = await Game.findByPk(gameId);
    if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

    // Joylar tekshiruvi
    const totalPlayers = game.totalPlayers || 14;
    const existingEntry = await UserGame.findOne({ where: { userId: user.id, gameId: game.id } });
    const isGameFull = (game.playersJoined || 0) >= totalPlayers;
    if (isGameFull && !existingEntry) {
      return res.status(400).json({ msg: "Bu o'yinda joylar to'lgan" });
    }

    // merchant_trans_id = GAME_{gameId}_{telegramId}_{team}
    const safeTeam = team ? String(team).replace(/[^a-zA-Z0-9]/g, "").substring(0, 20) : "NA";
    const merchantTransId = `GAME_${gameId}_${telegramId}_${safeTeam}`;
    const returnUrl = encodeURIComponent("https://goforfun.vercel.app");

    const clickUrl = `${CLICK_BASE_URL}?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amountSom}&transaction_param=${merchantTransId}&return_url=${returnUrl}`;

    return res.json({
      success: true,
      clickUrl,
      amount: amountSom,
    });
  } catch (error) {
    console.error("Click game checkout error:", error);
    return res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createInvoice,
  payWithWallet,
  getUserWallet,
  getPaymeCheckoutUrl,
  createGamePaymeCheckout,
  getAllTransactions,
  getClickCheckoutUrl,
  createGameClickCheckout,
};
