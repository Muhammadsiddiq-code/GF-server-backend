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















const { User, Admin } = require("../models"); // Admin modelini ham chaqiramiz
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs"); // Parolni shifrlash uchun
const jwt = require("jsonwebtoken"); // Token berish uchun

// Maxfiy kalit (Token uchun)
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_gf_admin";

// ==========================================
// 1. USER LOGIN (Telegram orqali - Eski kodingiz)
// ==========================================
exports.login = async (req, res) => {
  try {
    const { telegramId, firstName, username, photo_url } = req.body;

    // 1. Telegram ID kelganini tekshirish
    if (!telegramId) {
      return res.status(400).json({ msg: "Telegram ID talab qilinadi!" });
    }

    // 2. Bazadan userni qidirish
    let user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });

    // 3. Agar user yo'q bo'lsa, yangi yaratish
    if (!user) {
      // Yangi karta raqami generatsiya qilish
      const newCardNumber =
        "GF-" +
        uuidv4().split("-")[0].toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);

      user = await User.create({
        telegramId: String(telegramId),
        firstName: firstName || "Noma'lum",
        username: username || "",
        balance: 0,
        xp: 0,
        walletCardNumber: newCardNumber,
        photo: photo_url || null,
      });
      console.log("Yangi foydalanuvchi yaratildi:", user.firstName);
    } else {
      // Agar user bor bo'lsa, ma'lumotlarini yangilash
      if (firstName || username || photo_url) {
        await user.update({
          firstName: firstName || user.firstName,
          username: username || user.username,
          photo: photo_url || user.photo,
        });
      }
    }

    // 4. Frontendga javob qaytarish
    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Auth Login Xatosi:", error);
    res
      .status(500)
      .json({ msg: "Serverda xatolik yuz berdi: " + error.message });
  }
};

// ==========================================
// 2. ADMIN LOGIN (Yangi qo'shilgan qism)
// ==========================================
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Login va parol kelganini tekshirish
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Login va parol kiritilishi shart!" });
    }

    // Adminni qidirish
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(404).json({ message: "Admin topilmadi!" });
    }

    // Parolni tekshirish (Hashlangan parolni solishtirish)
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Parol noto'g'ri!" });
    }

    // Token yaratish (24 soatga)
    const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Muvaffaqiyatli kirildi",
      token: token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};

// ==========================================
// 3. DEFAULT ADMIN YARATISH (Yangi qo'shilgan)
// ==========================================
// Bu funksiya server ishga tushganda App.js da chaqiriladi
exports.initDefaultAdmin = async () => {
  try {
    const count = await Admin.count();

    // Agar adminlar jadvali bo'sh bo'lsa
    if (count === 0) {
      console.log("⚠️ Admin topilmadi. Default admin yaratilmoqda...");

      // Parolni shifrlaymiz (123 -> $2a$10$...)
      const hashedPassword = await bcrypt.hash("123", 8);

      await Admin.create({
        username: "admin",
        password: hashedPassword,
      });

      console.log("✅ Default Admin yaratildi! Login: 'admin', Parol: '123'");
    } else {
      console.log("✅ Admin mavjud. Tizim tayyor.");
    }
  } catch (error) {
    console.error("❌ Default admin yaratishda xatolik:", error);
  }
};