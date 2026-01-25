// const axios = require("axios");
// const { Game } = require("../models");

// const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// // 30% ni hisoblash
// const calculateAdvanceAmount = (totalPrice) => {
//   return parseInt(totalPrice * 0.3); // Butun son bo'lishi kerak
// };

// exports.createInvoiceLink = async (req, res) => {
//   try {
//     const { gameId, userId, provider } = req.body; // provider: 'payme' yoki 'click'

//     const game = await Game.findByPk(gameId);
//     if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

//     // 1. Narxni hisoblash (30%)
//     const advanceAmount = calculateAdvanceAmount(game.price);
//     const amountInTiyin = advanceAmount * 100; // Telegram ham tiyinda so'raydi

//     // 2. Tokenni tanlash
//     let providerToken = "";
//     if (provider === "payme") providerToken = process.env.PAYME_PROVIDER_TOKEN;
//     if (provider === "click") providerToken = process.env.CLICK_PROVIDER_TOKEN;

//     if (!providerToken) {
//       return res
//         .status(400)
//         .json({ message: "Provayder tokeni topilmadi (.env ni tekshiring)" });
//     }

//     // 3. Telegram API ga so'rov yuborish (Invoice Link olish)
//     const response = await axios.post(
//       `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
//       {
//         title: game.title, // Chek nomi
//         description: `${game.location} da o'yin uchun zaklad to'lovi`, // Izoh
//         payload: `${gameId}_${userId}`, // To'lovdan keyin bizga kerak bo'ladigan info (IDlar)
//         provider_token: providerToken,
//         currency: "UZS",
//         prices: [{ label: "Zaklad (30%)", amount: amountInTiyin }], // Narxlar
//         // Qo'shimcha (ixtiyoriy): Rasm qo'shish
//         photo_url:
//           game.imageUrl ||
//           "https://cdn-icons-png.flaticon.com/512/2617/2617812.png",
//         photo_height: 512,
//         photo_width: 512,
//         photo_size: 512,
//         need_name: true, // Foydalanuvchi ismini so'rash
//         need_phone_number: true, // Telefon raqamini so'rash
//       }
//     );

//     if (response.data.ok) {
//       // Muvaffaqiyatli! Linkni qaytaramiz
//       res.json({
//         url: response.data.result, // Bu https://t.me/$... degan ssilka
//         amount: advanceAmount,
//       });
//     } else {
//       console.error("Telegram API Xatosi:", response.data);
//       res.status(500).json({ message: "Telegramdan link olib bo'lmadi" });
//     }
//   } catch (error) {
//     console.error("Payment Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };










const axios = require("axios");
const { Game, User, UserGame, Transaction, sequelize } = require("../models");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// 1. O'YIN UCHUN INVOICE (Payme/Click orqali to'g'ridan-to'g'ri to'lash)
exports.createInvoiceLink = async (req, res) => {
  try {
    const { gameId, userId, provider } = req.body;
    const game = await Game.findByPk(gameId);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

    // Zaklad 30%
    const advanceAmount = parseInt(game.price * 0.3);
    const amountInTiyin = advanceAmount * 100;

    let providerToken = "";
    if (provider === "payme") providerToken = process.env.PAYME_PROVIDER_TOKEN;
    if (provider === "click") providerToken = process.env.CLICK_PROVIDER_TOKEN;

    if (!providerToken)
      return res.status(400).json({ message: "Token topilmadi" });

    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        title: game.title,
        description: `O'yin uchun zaklad to'lovi (${game.location})`,
        payload: `GAME_${gameId}_${userId}`, // Payload: GAME_...
        provider_token: providerToken,
        currency: "UZS",
        prices: [{ label: "Zaklad (30%)", amount: amountInTiyin }],
        photo_url: game.imageUrl,
        need_name: true,
        need_phone_number: true,
      }
    );

    if (response.data.ok) {
      res.json({ url: response.data.result });
    } else {
      res.status(500).json({ message: "Telegram API xatosi" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 2. BALANSNI TO'LDIRISH UCHUN INVOICE (YANGI)
exports.createTopUpInvoice = async (req, res) => {
  try {
    const { userId, amount, provider } = req.body; // amount so'mda keladi

    // Minimal summa tekshiruvi
    if (amount < 1000)
      return res.status(400).json({ message: "Minimal to'lov 1000 so'm" });

    let providerToken = "";
    if (provider === "payme") providerToken = process.env.PAYME_PROVIDER_TOKEN;
    if (provider === "click") providerToken = process.env.CLICK_PROVIDER_TOKEN;

    if (!providerToken)
      return res.status(400).json({ message: "Token topilmadi" });

    const amountInTiyin = amount * 100;

    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        title: "Hamyonni to'ldirish",
        description: `GF Hisobingizni ${amount} so'mga to'ldirish`,
        payload: `TOPUP_${userId}_${amount}`, // Payload: TOPUP_...
        provider_token: providerToken,
        currency: "UZS",
        prices: [{ label: "Hamyon to'lovi", amount: amountInTiyin }],
        photo_url: "https://cdn-icons-png.flaticon.com/512/2953/2953363.png", // Wallet icon
        need_name: true,
      }
    );

    if (response.data.ok) {
      res.json({ url: response.data.result });
    } else {
      console.error("Telegram Error:", response.data);
      res.status(500).json({ message: "Invoice yaratishda xatolik" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ... (Tepadagi importlar va boshqa funksiyalar o'z joyida qolsin)

// 3. BALANSDAN TO'LASH (LOGLAR VA NUMBER FORMATLASH BILAN)
exports.payFromBalance = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, gameId } = req.body;
    
    console.log("-----------------------------------------");
    console.log(`💰 BALANCE PAYMENT REQUEST: User: ${userId}, Game: ${gameId}`);

    // 1. User va O'yinni topish
    const user = await User.findOne({ where: { telegramId: String(userId) }, transaction: t });
    const game = await Game.findByPk(gameId, { transaction: t });

    if (!user) {
        await t.rollback();
        console.log("❌ User topilmadi");
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }
    if (!game) {
        await t.rollback();
        console.log("❌ O'yin topilmadi");
        return res.status(404).json({ message: "O'yin topilmadi" });
    }

    // 2. Joy va Status tekshiruvi
    if (game.isFinished) {
        await t.rollback();
        return res.status(400).json({ message: "O'yin allaqachon tugagan" });
    }
    if (game.playersJoined >= game.totalPlayers) {
        await t.rollback();
        return res.status(400).json({ message: "Afsuski, joylar to'lgan" });
    }

    // 3. User allaqachon yozilganmi?
    const existing = await UserGame.findOne({ where: { userId: user.id, gameId: game.id }, transaction: t });
    if (existing) {
        await t.rollback();
        return res.status(400).json({ message: "Siz allaqachon bu o'yinga yozilgansiz" });
    }

    // 4. NARXNI HISOBLASH (Muhim joyi)
    // Agar zaklad (advance) belgilangan bo'lsa o'shani olamiz, yo'qsa narxning 30% ini olamiz
    let paymentAmount = 0;
    if (game.advance > 0) {
        paymentAmount = Number(game.advance);
    } else {
        paymentAmount = Math.floor(Number(game.price) * 0.3); // 30% ni olib butun songa aylantiramiz
    }

    const userBalance = Number(user.balance || 0); // User balansini songa aylantiramiz

    console.log(`💵 To'lov summasi: ${paymentAmount} UZS`);
    console.log(`💳 User Balansi: ${userBalance} UZS`);

    // 5. BALANS YETARLIMI?
    if (userBalance < paymentAmount) {
        await t.rollback();
        console.log("❌ Mablag' yetarli emas");
        return res.status(400).json({ 
            message: `Mablag' yetarli emas. Sizda: ${userBalance} so'm, Kerak: ${paymentAmount} so'm` 
        });
    }

    // 6. TRANZAKSIYA BAJARISH
    const newBalance = userBalance - paymentAmount;

    // A) Balansdan ayirish
    await user.update({ balance: newBalance }, { transaction: t });

    // B) UserGame ga yozish
    await UserGame.create({
        userId: user.id,
        gameId: game.id,
        status: "paid_balance",
        paymentAmount: paymentAmount,
        team: "A"
    }, { transaction: t });

    // C) O'yin statistikasini yangilash
    await game.increment('playersJoined', { transaction: t });

    // D) Tarixga yozish
    await Transaction.create({
        userId: user.id,
        amount: paymentAmount,
        type: 'expense', // Chiqim
        description: `${game.title} o'yini (Hamyondan)`,
        paymentMethod: 'wallet'
    }, { transaction: t });

    await t.commit();
    
    console.log(`✅ To'lov muvaffaqiyatli! Yangi balans: ${newBalance}`);
    res.json({ message: "Muvaffaqiyatli to'landi", newBalance: newBalance });

  } catch (error) {
    await t.rollback();
    console.error("🔥 Pay Balance Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// 4. TARIXNI OLISH
exports.getHistory = async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId)
      return res.status(400).json({ message: "Telegram ID kerak" });

    const user = await User.findOne({ where: { telegramId } });
    if (!user) return res.status(404).json({ message: "User yo'q" });

    const history = await Transaction.findAll({
      where: { userId: user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};