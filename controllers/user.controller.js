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

// 2. Login, Register or UPDATE
exports.loginOrRegister = async (req, res) => {
  try {
    // Frontdan kelayotgan hamma ma'lumotni olamiz
    const { telegramId, firstName, lastName, username, phone, city, position } =
      req.body;

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID yetishmayapti" });
    }

    // ID string ekanligiga ishonch hosil qilamiz
    const strId = String(telegramId);

    // Bazadan qidiramiz
    let user = await User.findOne({ where: { telegramId: strId } });

    if (!user) {
      // --- YANGI USER YARATISH ---
      user = await User.create({
        telegramId: strId,
        firstName,
        lastName,
        username,
        phone, // Agar frontdan kelsa yoziladi
        city, // Agar frontdan kelsa yoziladi
        position, // Agar frontdan kelsa yoziladi
        xp: 500,
      });
      return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
    } else {
      // --- MAVJUD USERNI YANGILASH (UPDATE) ---
      // Agar user allaqachon bor bo'lsa, kelgan yangi ma'lumotlar bilan yangilaymiz
      const updatedFields = {};
      if (firstName) updatedFields.firstName = firstName;
      if (lastName) updatedFields.lastName = lastName;
      if (username) updatedFields.username = username;
      if (phone) updatedFields.phone = phone; // <-- Telefon o'zgaradi
      if (city) updatedFields.city = city; // <-- Shahar o'zgaradi
      if (position) updatedFields.position = position; // <-- Pozitsiya o'zgaradi

      // Bazada yangilaymiz
      await user.update(updatedFields);

      return res.json({ message: "Ma'lumotlar yangilandi", user });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
};