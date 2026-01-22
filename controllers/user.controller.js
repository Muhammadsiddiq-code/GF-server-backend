// const db = require("../models");
// const User = db.User;

// // 1. All Users
// exports.getAllUsers = async (req, res) => {
//   try {
//     if (!User) {
//       return res.status(500).json({ error: "User modeli undefined!" });
//     }
//     const users = await User.findAll({
//       order: [["xp", "DESC"]],
//     });
//     res.json(users);
//   } catch (error) {
//     console.error("HATO:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// // 2. Login or Register
// exports.loginOrRegister = async (req, res) => {
//   try {
//     const { telegramId, firstName, lastName, username } = req.body;

//     if (!telegramId) {
//       return res.status(400).json({ message: "Telegram ID yetishmayapti" });
//     }

//     let user = await User.findOne({ where: { telegramId } });

//     if (!user) {
//       user = await User.create({
//         telegramId,
//         firstName,
//         lastName,
//         username,
//         xp: 500,
//       });
//       return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
//     }

//     res.json({ message: "Login muvaffaqiyatli", user });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };






















const db = require("../models");
const User = db.User;

// 1. All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["xp", "DESC"]],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Login or Register
exports.loginOrRegister = async (req, res) => {
  try {
    // Log qilib ko'ramiz, rasm kelyaptimi?
    console.log("Login Request Body:", req.body);

    const {
      telegramId,
      firstName,
      lastName,
      username,
      phone,
      city,
      position,
      photo_url, // Frontdan shu nom bilan kelishi kerak
    } = req.body;

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID yetishmayapti" });
    }

    const strId = String(telegramId);
    let user = await User.findOne({ where: { telegramId: strId } });

    if (!user) {
      // --- YANGI USER ---
      console.log("Yangi user yaratilmoqda, Rasm:", photo_url);
      user = await User.create({
        telegramId: strId,
        firstName,
        lastName,
        username,
        photo: photo_url, // Rasmni saqlash
        phone,
        city,
        position,
        xp: 500,
      });
      return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
    } else {
      // --- UPDATE ---
      console.log("User yangilanmoqda. Yangi rasm:", photo_url);

      const updatedFields = {};
      // Faqat qiymat bor bo'lsa yangilaymiz
      if (firstName) updatedFields.firstName = firstName;
      if (lastName) updatedFields.lastName = lastName;
      if (username) updatedFields.username = username;
      if (photo_url) updatedFields.photo = photo_url; // <--- Rasm yangilanishi
      if (phone) updatedFields.phone = phone;
      if (city) updatedFields.city = city;
      if (position) updatedFields.position = position;

      await user.update(updatedFields);
      return res.json({ message: "Ma'lumotlar yangilandi", user });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
};