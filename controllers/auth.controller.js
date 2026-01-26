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




















const { Admin } = require("../models"); // Admin modelini chaqiramiz (User emas!)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Maxfiy kalit
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_gf_admin";

// 1. LOGIN (Kirish)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tekshiruv: Ma'lumotlar keldimi?
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Login va parol talab qilinadi!" });
    }

    // Adminni qidiramiz
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(404).json({ message: "Admin topilmadi!" });
    }

    // Parolni tekshiramiz
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Parol noto'g'ri!" });
    }

    // Token yaratamiz
    const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Xush kelibsiz!",
      token: token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};

// 2. ADMIN YARATISH (Bir martalik - "kolizey" ni yaratish uchun)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Login va parol kerak" });
    }

    // Parolni hashlaymiz
    const hashedPassword = await bcrypt.hash(password, 8);

    const newAdmin = await Admin.create({
      username,
      password: hashedPassword,
    });

    res
      .status(201)
      .json({ message: "Admin yaratildi", admin: newAdmin.username });
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};