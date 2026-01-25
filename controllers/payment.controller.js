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

    // MUHIM: Telegram ID ni stringga o'tkazamiz
    const tgIdString = String(telegramId);

    let title, description, payload, prices;

    if (type === "GAME") {
      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yini uchun joy band qilish`;
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

// 2. Hamyon orqali to'lash (WALLET PAY)
const payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId, amount } = req.body;

    // XATOLIK SABABI SHU YERDA EDI: String() ga o'tkazish shart
    const user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });
    const game = await Game.findByPk(gameId);

    if (!user || !game)
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });

    // Summani tekshirish (Agar amount frontenddan kelmasa, game.price olinadi)
    const payAmount = amount ? parseFloat(amount) : game.price;

    if (user.balance < payAmount) {
      return res.status(400).json({ msg: "Mablag' yetarli emas" });
    }

    // Balansdan ayirish
    await user.update({ balance: user.balance - payAmount });

    // UserGame ga yozish
    await UserGame.create({
      userId: user.id,
      gameId: game.id,
      status: "paid",
      paymentAmount: payAmount,
      team: "A",
    });

    // O'yinchi sonini oshirish
    await game.increment("playersJoined");

    // Tarixga yozish
    await Transaction.create({
      userId: user.id,
      amount: payAmount,
      type: "expense",
      description: `${game.title} (Hamyon orqali)`,
      paymentMethod: "wallet",
    });

    res.json({
      success: true,
      message: "To'lov muvaffaqiyatli amalga oshirildi",
    });
  } catch (error) {
    console.error("Wallet Pay Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

// 3. User profilini olish
const getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Bu yerda ham String() qilamiz
    let user = await User.findOne({
      where: { telegramId: String(telegramId) },
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
