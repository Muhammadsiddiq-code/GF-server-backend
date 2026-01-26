// const { User } = require("../models"); // User modelini chaqiramiz
// const { v4: uuidv4 } = require("uuid");

// exports.login = async (req, res) => {
//   try {
//     const { telegramId, firstName, username, photo_url } = req.body;

//     // 1. Telegram ID kelganini tekshirish
//     if (!telegramId) {
//       return res.status(400).json({ msg: "Telegram ID talab qilinadi!" });
//     }

//     // 2. Bazadan userni qidirish
//     let user = await User.findOne({
//       where: { telegramId: String(telegramId) },
//     });

//     // 3. Agar user yo'q bo'lsa, yangi yaratish
//     if (!user) {
//       // Yangi karta raqami generatsiya qilish
//       const newCardNumber =
//         "GF-" +
//         uuidv4().split("-")[0].toUpperCase() +
//         "-" +
//         Math.floor(1000 + Math.random() * 9000);

//       user = await User.create({
//         telegramId: String(telegramId),
//         firstName: firstName || "Noma'lum",
//         username: username || "",
//         balance: 0,
//         xp: 0,
//         walletCardNumber: newCardNumber,
//         photo: photo_url || null,
//       });
//       console.log("Yangi foydalanuvchi yaratildi:", user.firstName);
//     } else {
//       // Agar user bor bo'lsa, ma'lumotlarini yangilash (masalan rasm yoki ism o'zgargan bo'lsa)
//       if (firstName || username || photo_url) {
//         await user.update({
//           firstName: firstName || user.firstName,
//           username: username || user.username,
//           photo: photo_url || user.photo, // Rasm URL ni saqlash
//         });
//       }
//     }

//     // 4. Frontendga javob qaytarish
//     res.json({
//       success: true,
//       user: user,
//     });
//   } catch (error) {
//     console.error("Auth Login Xatosi:", error);
//     res
//       .status(500)
//       .json({ msg: "Serverda xatolik yuz berdi: " + error.message });
//   }
// };




















const { User } = require("../models");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken"); // Token yaratish uchun

// Maxfiy kalit (buni .env faylga olish tavsiya etiladi)
const JWT_SECRET = process.env.JWT_SECRET || "gf_secret_key_12345";

exports.login = async (req, res) => {
  try {
    const { telegramId, firstName, username, photo_url, start_param } =
      req.body;

    // 1. Telegram ID kelganini tekshirish
    if (!telegramId) {
      return res.status(400).json({ msg: "Telegram ID talab qilinadi!" });
    }

    // 2. Bazadan userni qidirish
    let user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });

    // 3. AGAR YANGI USER BO'LSA
    if (!user) {
      // A) Karta raqami generatsiya qilish
      const newCardNumber =
        "GF-" +
        uuidv4().split("-")[0].toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);

      // B) Yangi user yaratish
      user = await User.create({
        telegramId: String(telegramId),
        firstName: firstName || "Noma'lum",
        username: username || "",
        balance: 0,
        xp: 0,
        walletCardNumber: newCardNumber,
        photo: photo_url || null,
        role: "user", // Default rol
      });

      console.log("Yangi foydalanuvchi ro'yxatdan o'tdi:", user.firstName);

      // C) REFERRAL TIZIMI (Agar kimdir taklif qilgan bo'lsa)
      if (start_param && start_param !== String(telegramId)) {
        const referrer = await User.findOne({
          where: { telegramId: start_param },
        });

        if (referrer) {
          // Taklif qilgan odamga 1000 XP bonus beramiz
          await referrer.increment("xp", { by: 1000 });
          console.log(`Referral ishladi: ${referrer.firstName} +1000 XP oldi`);
        }
      }
    }
    // 4. AGAR ESKI USER BO'LSA (Update)
    else {
      // Ma'lumotlar o'zgargan bo'lsa, yangilaymiz
      const updates = {};
      if (firstName && firstName !== user.firstName)
        updates.firstName = firstName;
      if (username && username !== user.username) updates.username = username;
      if (photo_url && photo_url !== user.photo) updates.photo = photo_url;

      if (Object.keys(updates).length > 0) {
        await user.update(updates);
      }
    }

    // 5. JWT TOKEN YARATISH (Eng muhim qism)
    // Bu token userning ID va Roli shifrlangan holda saqlaydi
    const token = jwt.sign(
      {
        id: user.id,
        telegramId: user.telegramId,
        role: user.role || "user",
      },
      JWT_SECRET,
      { expiresIn: "30d" } // Token 30 kun amal qiladi
    );

    // 6. Frontendga javob qaytarish
    res.json({
      success: true,
      message: "Muvaffaqiyatli kirildi",
      token: token, // Frontend buni localStorage da saqlashi kerak
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        balance: user.balance,
        xp: user.xp,
        photo: user.photo,
        position: user.position,
        city: user.city,
        phone: user.phone,
        walletCardNumber: user.walletCardNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth Login Xatosi:", error);
    res.status(500).json({
      success: false,
      msg: "Serverda xatolik yuz berdi: " + error.message,
    });
  }
};