const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Bot instansiyasi (Faqat xabar yuborish uchun)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN;

// 1. Invoice yaratish
const createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type } = req.body;

    if (!telegramId) return res.status(400).json({ msg: "Telegram ID kerak" });

    let title, description, payload, prices;

    if (type === "GAME") {
      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yini uchun joy band qilish`;
      payload = `GAME_${gameId}_${telegramId}`;
      prices = [{ label: game.title, amount: game.price * 100 }];
    } else {
      title = "Hamyonni to'ldirish";
      description = "Hisobingizga mablag' qo'shish";
      payload = `TOPUP_${telegramId}`;
      prices = [{ label: "Balans", amount: amount * 100 }];
    }

    await bot.sendInvoice(
      telegramId,
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

// 2. Hamyon orqali to'lash
const payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId } = req.body;

    const user = await User.findOne({ where: { telegramId } });
    const game = await Game.findByPk(gameId);

    if (!user || !game)
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });

    if (user.balance < game.price) {
      return res.status(400).json({ msg: "Mablag' yetarli emas" });
    }

    await user.update({ balance: user.balance - game.price });

    await UserGame.create({
      userId: user.id,
      gameId: game.id,
      status: "paid",
      paymentAmount: game.price,
      team: "A",
    });

    await game.increment("playersJoined");

    await Transaction.create({
      userId: user.id,
      amount: game.price,
      type: "expense",
      description: `${game.title} (Hamyon orqali)`,
      paymentMethod: "wallet",
    });

    res.json({ success: true, message: "To'lov qabul qilindi" });
  } catch (error) {
    console.error("Wallet Pay Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

// 3. User profilini olish (Wallet va Tarix)
const getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;
    let user = await User.findOne({
      where: { telegramId },
      include: [{ model: Transaction, as: "transactions" }], // Alias 'as' model bilan mos bo'lishi kerak
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

// --- HAMMASINI EKSPORT QILISH (ENG MUHIM QISM) ---
module.exports = {
  createInvoice,
  payWithWallet,
  getUserWallet,
};
