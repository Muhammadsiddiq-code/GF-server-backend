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










const { Game, User, UserGame, Transaction, sequelize } = require("../models");

// 1. BALANSDAN TO'LASH (PAY FROM BALANCE)
exports.payFromBalance = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, gameId } = req.body; // userId = Telegram ID (7116193043)

    // 1. Foydalanuvchini Telegram ID orqali bazadan qidiramiz
    const user = await User.findOne({
      where: { telegramId: String(userId) },
      transaction: t,
    });
    const game = await Game.findByPk(gameId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "Foydalanuvchi topilmadi. Profilingizni oching." });
    }
    if (!game) {
      await t.rollback();
      return res.status(404).json({ message: "O'yin topilmadi" });
    }

    // 2. Narxni hisoblash
    const paymentAmount =
      game.advance > 0
        ? parseFloat(game.advance)
        : Math.floor(parseFloat(game.price) * 0.3);

    // 3. Balansni tekshirish
    if (parseFloat(user.balance || 0) < paymentAmount) {
      await t.rollback();
      return res
        .status(400)
        .json({
          message: `Mablag' yetarli emas. Balans: ${user.balance} so'm`,
        });
    }

    // 4. Bazadagi haqiqiy ID orqali UserGame yaratamiz (FOREIGN KEY HATOSINI YO'QOTADI)
    await UserGame.create(
      {
        userId: user.id, // <--- Telegram ID emas, bazadagi ID (masalan: 12)
        gameId: game.id,
        status: "paid_balance",
        paymentAmount: paymentAmount,
        team: "A",
      },
      { transaction: t }
    );

    // 5. Balansni yangilash
    await user.update(
      { balance: parseFloat(user.balance) - paymentAmount },
      { transaction: t }
    );
    await game.increment("playersJoined", { transaction: t });

    // 6. Tarixga yozish (Bazadagi user.id bilan)
    await Transaction.create(
      {
        userId: user.id,
        amount: paymentAmount,
        type: "expense",
        description: `${game.title} (Hamyondan)`,
        paymentMethod: "wallet",
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ message: "To'lov muvaffaqiyatli!", newBalance: user.balance });
  } catch (error) {
    await t.rollback();
    console.error("Pay Error:", error);
    res.status(500).json({ message: "Xatolik: " + error.message });
  }
};

// 2. TARIXNI OLISH (500 XATOSINI TUZATISH)
exports.getHistory = async (req, res) => {
  try {
    const { telegramId } = req.query;
    // Avval Telegram ID orqali user.id ni aniqlaymiz
    const user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });

    if (!user) return res.json([]); // Foydalanuvchi topilmasa bo'sh ro'yxat

    const history = await Transaction.findAll({
      where: { userId: user.id }, // Bazadagi tartib raqami bo'yicha qidiramiz
      order: [["createdAt", "DESC"]],
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};