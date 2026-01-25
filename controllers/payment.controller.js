const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN;

// 1. Invoice yaratish
const createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type } = req.body;

    if (!telegramId) return res.status(400).json({ msg: "Telegram ID kerak" });

    const tgIdString = String(telegramId);
    let title, description, payload, prices;

    if (type === "GAME") {
      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yini uchun to'lov`;
      payload = `GAME_${gameId}_${tgIdString}`;
      prices = [{ label: game.title, amount: parseInt(amount) * 100 }];
    } else {
      title = "Hamyonni to'ldirish";
      description = "Hisobingizga mablag' qo'shish";
      payload = `TOPUP_${tgIdString}`;
      prices = [{ label: "Balans", amount: parseInt(amount) * 100 }];
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

    res.json({ success: true, message: "Invoice yuborildi" });
  } catch (error) {
    console.error("Invoice Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

// 2. Hamyon orqali to'lash (YANGILANGAN LOGIKA)
const payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId, amount } = req.body;

    if (!telegramId)
      return res.status(400).json({ msg: "Telegram ID topilmadi" });

    const tgIdString = String(telegramId);

    // 1. User va Game ni topamiz
    const user = await User.findOne({ where: { telegramId: tgIdString } });
    const game = await Game.findByPk(gameId);

    if (!user || !game) {
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });
    }

    // 2. Balans yetarliligini tekshiramiz
    const payAmount = amount ? parseFloat(amount) : game.price;

    if (user.balance < payAmount) {
      return res
        .status(400)
        .json({ msg: "Hisobingizda mablag' yetarli emas." });
    }

    // 3. User allaqachon bu o'yinda bormi?
    let userGameEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
    });

    // --- TRANZAKSIYALAR BOSHLANISHI ---

    // A) User balansidan pul yechish
    await user.update({ balance: user.balance - payAmount });

    // B) UserGame ni yangilash yoki yaratish
    if (userGameEntry) {
      // Agar avval bor bo'lsa (masalan Avans to'lagan), faqat summani qo'shamiz
      const newTotal = parseFloat(userGameEntry.paymentAmount || 0) + payAmount;
      await userGameEntry.update({
        paymentAmount: newTotal,
        status: "paid", // Har ehtimolga qarshi statusni yangilaymiz
      });
    } else {
      // Agar yo'q bo'lsa (birinchi marta to'layotgan bo'lsa), yangi yaratamiz
      await UserGame.create({
        userId: user.id,
        gameId: game.id,
        status: "paid",
        paymentAmount: payAmount,
        team: "A",
      });
      // Faqat yangi qo'shilganda o'yinchi sonini oshiramiz
      await game.increment("playersJoined");
    }

    // C) Tarixga yozish (Bu har doim yozilishi kerak, har bir to'lov uchun)
    await Transaction.create({
      userId: user.id,
      amount: payAmount,
      type: "expense",
      description: `${game.title} (Hamyon to'lovi)`,
      paymentMethod: "wallet",
    });

    res.json({
      success: true,
      message: "To'lov muvaffaqiyatli amalga oshirildi!",
    });
  } catch (error) {
    console.error("Wallet Pay Error:", error);
    res.status(500).json({ msg: "Server xatosi: " + error.message });
  }
};

// 3. User profilini olish
const getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const tgIdString = String(telegramId);

    let user = await User.findOne({
      where: { telegramId: tgIdString },
      include: [{ model: Transaction, as: "transactions" }],
    });

    if (user && !user.walletCardNumber) {
      const uniqueNum =
        "GF-" +
        uuidv4().split("-")[0].toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);
      await user.update({ walletCardNumber: uniqueNum });
    }
    res.json(user);
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createInvoice,
  payWithWallet,
  getUserWallet,
};
