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

// --- HAMYONDAN TO'LASH (ASOSIY MANTIQ) ---
exports.payFromBalance = async (req, res) => {
  // Tranzaksiya ochamiz (pul yechilib, lekin o'yinga qo'shilmay qolishini oldini olish uchun)
  const t = await sequelize.transaction();

  try {
    const { userId, gameId } = req.body;
    // userId - bu Telegram ID (Frontenddan keladi)

    // 1. Foydalanuvchi va O'yinni topamiz
    const user = await User.findOne({
      where: { telegramId: String(userId) },
      transaction: t,
    });
    const game = await Game.findByPk(gameId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res
        .status(404)
        .json({
          message: "Foydalanuvchi topilmadi. Iltimos, ro'yxatdan o'ting.",
        });
    }

    if (!game) {
      await t.rollback();
      return res.status(404).json({ message: "O'yin topilmadi." });
    }

    // 2. O'yin to'lib qolmaganini tekshiramiz
    if (game.playersJoined >= game.totalPlayers) {
      await t.rollback();
      return res.status(400).json({ message: "O'yinda joylar qolmadi!" });
    }

    // 3. Foydalanuvchi allaqachon qo'shilganmi?
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

    // 4. To'lov summasini aniqlash
    // Agar o'yinda 'advance' (zaklad) belgilangan bo'lsa, o'shani yechamiz, bo'lmasa to'liq narxni.
    const paymentAmount =
      game.advance > 0 ? parseFloat(game.advance) : parseFloat(game.price);

    // 5. Balans yetarliligini tekshirish
    if (parseFloat(user.balance) < paymentAmount) {
      await t.rollback();
      return res.status(400).json({
        message: `Hisobingizda mablag' yetarli emas. Kerak: ${paymentAmount} so'm`,
      });
    }

    // 6. Pulni yechish va O'yinga qo'shish (Barchasi bir vaqtda)

    // a) UserGame jadvaliga yozish
    await UserGame.create(
      {
        userId: user.id,
        gameId: game.id,
        status: "paid", // To'langan statusi
        paymentAmount: paymentAmount,
        team: "A", // Hozircha default A jamoaga tushadi (keyin o'zgartirish mumkin)
      },
      { transaction: t }
    );

    // b) Balansdan ayirish
    await user.update(
      {
        balance: parseFloat(user.balance) - paymentAmount,
      },
      { transaction: t }
    );

    // c) O'yin ishtirokchilar sonini oshirish (+1)
    await game.increment("playersJoined", { transaction: t });

    // d) Tarixga (Transaction) yozish
    await Transaction.create(
      {
        userId: user.id,
        amount: paymentAmount,
        type: "expense", // Chiqim
        description: `${game.title} o'yini uchun to'lov`,
        paymentMethod: "wallet",
      },
      { transaction: t }
    );

    // Muvaffaqiyatli yakunlash
    await t.commit();

    return res.status(200).json({
      message: "To'lov muvaffaqiyatli amalga oshirildi! O'yinga qo'shildingiz.",
      newBalance: parseFloat(user.balance) - paymentAmount,
    });
  } catch (error) {
    // Xatolik bo'lsa, barcha o'zgarishlarni bekor qilish
    await t.rollback();
    console.error("PayFromBalance Error:", error);
    return res.status(500).json({ message: "Server xatosi: " + error.message });
  }
};

// --- PAYME/CLICK INVOICE YARATISH (TEST REJIM UCHUN) ---
exports.createInvoice = async (req, res) => {
  // Bu qism faqat test rejimida link qaytarishi kerak
  try {
    const { provider } = req.body;
    // Haqiqiy Payme/Click ulaganingizda bu yerga url generatsiya qilish kodini yozasiz
    // Hozircha shunchaki "FAKE" link qaytaramiz frontend ishlashi uchun

    const fakeUrl =
      provider === "click" ? "https://click.uz" : "https://payme.uz";

    res.json({ url: fakeUrl });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};