const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Bot faqat xabar yuborish uchun
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN;

// ----------------------------------------------------------------------
// 1. INVOICE YARATISH (Click/Payme orqali to'lash uchun)
// ----------------------------------------------------------------------
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
      description = `${game.title} o'yini uchun to'lov`;

      // Payload format: TYPE_GAMEID_USERID_TEAM
      // Jamoa nomi bo'sh joylarini olib tashlaymiz xatolik bo'lmasligi uchun
      const safeTeamName = team ? team.replace(/\s/g, "_") : "NA";
      payload = `GAME_${gameId}_${tgIdString}_${safeTeamName}`;

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

// ----------------------------------------------------------------------
// 2. HAMYON ORQALI TO'LASH (ASOSIY LOGIKA)
// ----------------------------------------------------------------------
const payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId, amount, team } = req.body;

    // 1. Validatsiya
    if (!telegramId)
      return res.status(400).json({ msg: "Telegram ID topilmadi" });
    const tgIdString = String(telegramId);

    // 2. Bazadan qidirish
    const user = await User.findOne({ where: { telegramId: tgIdString } });
    const game = await Game.findByPk(gameId);

    if (!user || !game) {
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });
    }

    // 3. To'lov summasini aniqlash
    const payAmount = amount ? parseFloat(amount) : game.price;

    // 4. Balans yetarliligini tekshirish
    if (user.balance < payAmount) {
      return res
        .status(400)
        .json({ msg: "Hisobingizda mablag' yetarli emas." });
    }

    // 5. User bu o'yinda avval qatnashganmi? (Update yoki Create)
    let userGameEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
    });

    // --- MINIMAL TO'LOV TEKSHIRUVI (Faqat yangi qo'shilayotganlar uchun) ---
    if (!userGameEntry) {
      const minRequired = game.advance > 0 ? game.advance : game.price;
      // Kichik farq (floating point) uchun 1 so'm ayirib hisoblaymiz
      if (payAmount < minRequired - 1) {
        return res
          .status(400)
          .json({
            msg: `Minimal to'lov miqdori: ${minRequired.toLocaleString()} UZS`,
          });
      }
    }

    // --- TRANZAKSIYA BOSHLANISHI ---

    // A) User balansidan pul yechish
    await user.update({ balance: user.balance - payAmount });

    // B) UserGame jadvaliga yozish
    if (userGameEntry) {
      // UPDATE: Agar user avval to'lagan bo'lsa (Avans), summani qo'shamiz
      const newTotal = parseFloat(userGameEntry.paymentAmount || 0) + payAmount;
      await userGameEntry.update({
        paymentAmount: newTotal,
        status: "paid",
        // Jamoa nomini o'zgartirmaymiz, chunki u avval tanlangan
      });
    } else {
      // CREATE: Agar yangi bo'lsa, yaratamiz va JAMOANI saqlaymiz
      await UserGame.create({
        userId: user.id,
        gameId: game.id,
        status: "paid",
        paymentAmount: payAmount,
        team: team || "Noma'lum", // <--- Jamoa nomi shu yerda saqlanadi
      });

      // O'yinchilar sonini oshirish (faqat birinchi marta)
      await game.increment("playersJoined");
    }

    // C) Tarix (Transaction) ga yozish
    await Transaction.create({
      userId: user.id,
      amount: payAmount,
      type: "expense",
      description: `${game.title} (${team || "Qolgan to'lov"})`,
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

// ----------------------------------------------------------------------
// 3. USER PROFILINI OLISH (History va Wallet uchun)
// ----------------------------------------------------------------------
const getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const tgIdString = String(telegramId);

    let user = await User.findOne({
      where: { telegramId: tgIdString },
      include: [{ model: Transaction, as: "transactions" }],
    });

    // Agar karta raqami yo'q bo'lsa, generatsiya qilish
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
