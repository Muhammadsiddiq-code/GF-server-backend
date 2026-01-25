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

// 1. HAMYONDAN TO'LASH (ASOSIY MANTIQ)
exports.payFromBalance = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { userId, gameId } = req.body;

    // User va O'yinni topamiz
    const user = await User.findOne({
      where: { telegramId: String(userId) },
      transaction: t,
    });
    const game = await Game.findByPk(gameId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
    }

    if (!game) {
      await t.rollback();
      return res.status(404).json({ message: "O'yin topilmadi." });
    }

    // O'yin to'lib qolmaganini tekshirish
    if (game.playersJoined >= game.totalPlayers) {
      await t.rollback();
      return res.status(400).json({ message: "O'yinda joylar qolmadi!" });
    }

    // Allaqachon qo'shilganmi?
    const existingEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
      transaction: t,
    });

    if (existingEntry) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Siz allaqachon bu o'yinga qo'shilgansiz!" });
    }

    // Narxni aniqlash
    const paymentAmount =
      game.advance > 0 ? parseFloat(game.advance) : parseFloat(game.price);

    // Balans yetarliligini tekshirish
    if (parseFloat(user.balance) < paymentAmount) {
      await t.rollback();
      return res.status(400).json({
        message: `Mablag' yetarli emas. Balansingiz: ${user.balance} so'm. Kerak: ${paymentAmount} so'm`,
      });
    }

    // To'lovni amalga oshirish
    await UserGame.create(
      {
        userId: user.id,
        gameId: game.id,
        status: "paid",
        paymentAmount: paymentAmount,
        team: "A",
      },
      { transaction: t }
    );

    await user.update(
      {
        balance: parseFloat(user.balance) - paymentAmount,
      },
      { transaction: t }
    );

    await game.increment("playersJoined", { transaction: t });

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

    return res.status(200).json({
      message: "To'lov muvaffaqiyatli! O'yinga qo'shildingiz.",
      newBalance: parseFloat(user.balance) - paymentAmount,
    });
  } catch (error) {
    await t.rollback();
    console.error("PayFromBalance Error:", error);
    return res.status(500).json({ message: "Server xatosi: " + error.message });
  }
};

// 2. INVOICE YARATISH (PAYME/CLICK UCHUN STUB)
exports.createInvoice = async (req, res) => {
  try {
    const { provider } = req.body;
    // Hozircha test uchun fake link qaytaramiz
    const fakeUrl =
      provider === "click" ? "https://click.uz" : "https://payme.uz";
    res.json({ url: fakeUrl });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// 3. TARIXNI OLISH (BU FUNKSIYA YETISHMAYOTGAN EDI)
exports.getHistory = async (req, res) => {
  try {
    const { telegramId } = req.query;

    const user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });
    if (!user) return res.json([]);

    const history = await Transaction.findAll({
      where: { userId: user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. BALANS TO'LDIRISH INVOICE (AGAR KERAK BO'LSA)
exports.createTopUpInvoice = async (req, res) => {
  res.json({ message: "TopUp funksiyasi", url: "#" });
};