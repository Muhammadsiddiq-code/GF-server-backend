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

// Login or Register
exports.loginOrRegister = async (req, res) => {
  try {
    const {
      telegramId,
      firstName,
      lastName,
      username,
      photo_url,
      start_param, // <-- Frontendan kelayotgan referral ID
    } = req.body;

    console.log("------------------------------------------------");
    console.log("LOGIN SO'ROVI KELDI:");
    console.log("Kelgan User ID:", telegramId);
    console.log("Kelgan Start Param (Referral):", start_param);

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID yetishmayapti" });
    }

    const strId = String(telegramId);
    let user = await User.findOne({ where: { telegramId: strId } });

    // 1. AGAR USER MAVJUD BO'LSA (LOGIN)
    if (user) {
      console.log("User allaqachon mavjud. Login qilinmoqda.");

      const updatedFields = {};
      if (firstName) updatedFields.firstName = firstName;
      if (lastName) updatedFields.lastName = lastName;
      if (username) updatedFields.username = username;
      if (photo_url) updatedFields.photo = photo_url;

      await user.update(updatedFields);
      return res.json({ message: "Login muvaffaqiyatli", user });
    }

    // 2. AGAR USER YANGI BO'LSA (REGISTER)
    else {
      console.log("Yangi user yaratilmoqda...");

      // Userni yaratamiz
      user = await User.create({
        telegramId: strId,
        firstName,
        lastName,
        username,
        photo: photo_url,
        invitedBy: start_param ? String(start_param) : null,
        xp: 500, // Boshlang'ich bonus
      });

      console.log("Yangi user bazaga yozildi.");

      // --- REFERRAL LOGIKASI ---
      // Agar start_param bo'lsa VA o'zi o'zini taklif qilmagan bo'lsa
      if (start_param && String(start_param) !== strId) {
        console.log("Referral tekshirilmoqda. Inviter ID:", start_param);

        // Taklif qilgan odamni qidiramiz
        const inviter = await User.findOne({
          where: { telegramId: String(start_param) },
        });

        if (inviter) {
          console.log(
            `Taklif qilgan odam topildi: ${inviter.firstName} (${inviter.xp} XP)`
          );

          // XP ni yangilashning eng ishonchli yo'li:
          const newXp = inviter.xp + 1000;
          await inviter.update({ xp: newXp });

          console.log(
            `MUVAFFAQIYAT! ${inviter.firstName} ga 1000 XP qo'shildi. Hozirgi XP: ${newXp}`
          );
        } else {
          console.log(
            "DIQQAT: Taklif qilgan odam (inviter) bazadan topilmadi! ID noto'g'ri bo'lishi mumkin."
          );
        }
      } else {
        console.log("Referral yo'q yoki user o'zi o'zini taklif qildi.");
      }
      // -------------------------

      return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
    }
  } catch (error) {
    console.error("KATTA XATOLIK (Login Error):", error);
    res.status(500).json({ error: error.message });
  }
};



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