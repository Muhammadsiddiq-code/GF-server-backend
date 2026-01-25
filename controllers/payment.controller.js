const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Faqat xabar yuborish uchun bot instansiyasi (Polling kerak emas)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN; // Click/Payme tokeni

// 1. Invoice yaratish (Frontenddan chaqiriladi)
exports.createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type } = req.body;
    // type: 'GAME' yoki 'TOPUP'

    if (!telegramId) return res.status(400).json({ msg: "Telegram ID kerak" });

    let title, description, payload, prices;

    if (type === "GAME") {
      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yini uchun joy band qilish`;
      // Payload format: TYPE_GAMEID_TELEGRAMID
      payload = `GAME_${gameId}_${telegramId}`;
      prices = [{ label: game.title, amount: game.price * 100 }]; // Tiyinda
    } else {
      // Hamyon to'ldirish
      title = "Hamyonni to'ldirish";
      description = "Hisobingizga mablag' qo'shish";
      // Payload format: TYPE_TELEGRAMID
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

// 2. Hamyon (Wallet) orqali to'lash
exports.payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId } = req.body;

    const user = await User.findOne({ where: { telegramId } });
    const game = await Game.findByPk(gameId);

    if (!user || !game)
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });

    if (user.balance < game.price) {
      return res.status(400).json({ msg: "Mablag' yetarli emas" });
    }

    // 1. Balansdan ayirish
    await user.update({ balance: user.balance - game.price });

    // 2. UserGame ga qo'shish (O'yinga yozish)
    await UserGame.create({
      userId: user.id,
      gameId: game.id,
      status: "paid",
      paymentAmount: game.price,
      team: "A", // Default team
    });

    // 3. O'yin o'yinchilar sonini oshirish
    await game.increment("playersJoined");

    // 4. Tarixga yozish
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

// 3. User ma'lumotlari (Profile uchun)
exports.getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;
    let user = await User.findOne({
      where: { telegramId },
      include: ["transactions"],
    });

    if (user && !user.walletCardNumber) {
      // Unikal karta raqami yaratish: GF-XXXX-XXXX
      const uniqueNum =
        "GF-" +
        uuidv4().split("-")[0].toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);
      await user.update({ walletCardNumber: uniqueNum });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
