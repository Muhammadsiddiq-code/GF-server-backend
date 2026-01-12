// const User = require("../models/userModel");

// exports.telegramAuth = async (req, res) => {
//   try {
//     const { telegramId, firstName, lastName, username } = req.body;

//     // 1. User bazada bormi tekshiramiz
//     let user = await User.findOne({ where: { telegramId } });

//     // 2. Agar yo'q bo'lsa, yangi yaratamiz (Ro'yxatdan o'tkazish)
//     if (!user) {
//       user = await User.create({
//         telegramId,
//         firstName,
//         lastName,
//         username,
//       });
//     } else {
//       // Agar bo'lsa, ma'lumotlarini yangilab qo'yamiz (masalan username o'zgargan bo'lsa)
//       await user.update({ firstName, lastName, username });
//     }

//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.findAll();
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };




































// controllers/user.controller.js
// const db = require("../models"); // models/index.js ni chaqiradi
// const User = db.User; // Aniq User modelini oladi

// exports.getAllUsers = async (req, res) => {
//   try {
//     // Diagnostika: Agar User modeli bo'lmasa, consolega chiqaramiz
//     if (!User) {
//       console.error("KRITIK XATO: User modeli yuklanmadi!");
//       return res.status(500).json({ error: "Server ichki xatosi: Database Model Error" });
//     }

//     const users = await User.findAll({
//       order: [['xp', 'DESC']]
//     });

//     res.json(users);
//   } catch (error) {
//     console.error("findAll xatosi:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

const db = require("../models"); // index.js ni chaqiradi
const User = db.User; // db ichidan User modelini sug'urib oladi

exports.getAllUsers = async (req, res) => {
  try {
    // Diagnostika uchun: User modeli yuklanganini tekshiramiz
    if (!User) {
      return res.status(500).json({ error: "User modeli undefined!" });
    }

    const users = await User.findAll({
      order: [["xp", "DESC"]],
    });

    res.json(users);
  } catch (error) {
    console.error("HATO:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Login funksiyasi ham shu faylda bo'lsa, u ham db.User ishlatsin
exports.loginOrRegister = async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username } = req.body;

    // Telegram ID kelmasa xato qaytaramiz
    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID yetishmayapti" });
    }

    // Bazadan qidiramiz
    let user = await User.findOne({ where: { telegramId } });

    if (!user) {
      // Agar yo'q bo'lsa - yangi yaratamiz
      user = await User.create({
        telegramId,
        firstName,
        lastName,
        username,
        xp: 500, // Boshlang'ich bonus
      });
      return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
    }

    // Agar bor bo'lsa - shunchaki qaytaramiz
    res.json({ message: "Login muvaffaqiyatli", user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }};