const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN;

// 1. Invoice yaratish (Click/Payme)
const createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type, team } = req.body;

    if (!telegramId) return res.status(400).json({ msg: "Telegram ID kerak" });

    const tgIdString = String(telegramId);
    let title, description, payload, prices;

    if (type === "GAME") {
      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yiniga to'lov (${
        team || "Jamoa tanlanmadi"
      })`;
      // Payloadga jamoani qo'shamiz: GAME_GAMEID_USERID_TEAMNAME
      payload = `GAME_${gameId}_${tgIdString}_${
        team ? team.replace(/\s/g, "") : "NA"
      }`;
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

// 2. Hamyon orqali to'lash (ASOSIY FUNKSIYA)
const payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId, amount, team } = req.body;

    // 1. Validatsiya
    if (!telegramId)
      return res.status(400).json({ msg: "Telegram ID topilmadi" });
    const tgIdString = String(telegramId);

    // 2. Ma'lumotlarni olish
    const user = await User.findOne({ where: { telegramId: tgIdString } });
    const game = await Game.findByPk(gameId);

    if (!user) return res.status(404).json({ msg: "Foydalanuvchi topilmadi" });
    if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

    // 3. Balansni tekshirish
    const payAmount = amount ? parseFloat(amount) : game.price;
    if (user.balance < payAmount) {
      return res
        .status(400)
        .json({ msg: "Hisobingizda mablag' yetarli emas." });
    }

    // 4. User bu o'yinda bormi?
    let userGameEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
    });

    // --- TRANZAKSIYA ---

    // A) Pul yechish
    await user.update({ balance: user.balance - payAmount });

    // B) UserGame ga yozish (Update yoki Create)
    if (userGameEntry) {
      // Agar user avval to'lagan bo'lsa (Avans), faqat summani qo'shamiz
      const newTotal = parseFloat(userGameEntry.paymentAmount || 0) + payAmount;
      await userGameEntry.update({
        paymentAmount: newTotal,
        status: "paid",
        // Jamoani o'zgartirmaymiz, chunki avval tanlab bo'lgan
      });
    } else {
      // Agar yangi bo'lsa, YANGI yozamiz va JAMOANI saqlaymiz
      await UserGame.create({
        userId: user.id,
        gameId: game.id,
        status: "paid",
        paymentAmount: payAmount,
        team: team || "Aniqlanmadi", // <--- JAMOA NOMI MUHIM
      });

      // O'yinchilar sonini oshirish
      await game.increment("playersJoined");
    }

    // C) Tarixga yozish
    await Transaction.create({
      userId: user.id,
      amount: payAmount,
      type: "expense",
      description: `${game.title} (${team || "To'lov"})`,
      paymentMethod: "wallet",
    });

    res.json({ success: true, message: "To'lov muvaffaqiyatli!" });
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

    // Agar user bo'lmasa yoki karta raqami yo'q bo'lsa
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
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { createInvoice, payWithWallet, getUserWallet };
