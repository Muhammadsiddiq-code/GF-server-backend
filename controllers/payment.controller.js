const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Botni faqat xabar yuborish uchun chaqiramiz
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN;

// 1. Invoice yaratish
const createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type } = req.body;

    if (!telegramId) return res.status(400).json({ msg: "Telegram ID kerak" });

    // MUHIM: Stringga o'tkazish
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
    console.log("Wallet Pay Request:", req.body);

    if (!telegramId) {
      return res.status(400).json({ msg: "Telegram ID topilmadi" });
    }

    // 1. Xatolikni oldini olish uchun Stringga o'tkazamiz
    const tgIdString = String(telegramId);

    // 2. Userni qidirish
    const user = await User.findOne({ where: { telegramId: tgIdString } });
    const game = await Game.findByPk(gameId);

    if (!user) {
      return res
        .status(404)
        .json({
          msg: "Foydalanuvchi bazadan topilmadi. Iltimos qayta ro'yxatdan o'ting.",
        });
    }
    if (!game) {
      return res.status(404).json({ msg: "O'yin topilmadi" });
    }

    // 3. Balansni tekshirish
    const payAmount = amount ? parseFloat(amount) : game.price;

    if (user.balance < payAmount) {
      return res
        .status(400)
        .json({ msg: "Hisobingizda mablag' yetarli emas." });
    }

    // 4. Tranzaksiya boshlash (Barcha ishlar bir vaqtda bajarilishi uchun)
    // Agar Transaction ishlatmasak ham ketma-ketlikni to'g'rilaymiz:

    // A. User balansini yangilash
    await user.update({ balance: user.balance - payAmount });

    // B. UserGame yaratish (User ID integer formatda ketadi)
    await UserGame.create({
      userId: user.id, // Bu yerda Userning ID si (1, 2, 5...) ketadi
      gameId: game.id,
      status: "paid",
      paymentAmount: payAmount,
      team: "A",
    });

    // C. O'yinchi sonini oshirish
    await game.increment("playersJoined");

    // D. Tarixga yozish
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

    // Agar user topilsa-yu, karta raqami bo'lmasa
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
