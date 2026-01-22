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
    // start_param ni qabul qilamiz (Frontendan keladi)
    const {
      telegramId,
      firstName,
      lastName,
      username,
      photo_url,
      start_param, // <-- SHU NARSA Referral ID bo'ladi
    } = req.body;

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID yetishmayapti" });
    }

    const strId = String(telegramId);
    let user = await User.findOne({ where: { telegramId: strId } });

    // Agar User OLDIN BOR BO'LSA (Login)
    if (user) {
      // Ma'lumotlarni yangilaymiz (lekin XP bermaymiz)
      const updatedFields = {};
      if (firstName) updatedFields.firstName = firstName;
      if (lastName) updatedFields.lastName = lastName;
      if (username) updatedFields.username = username;
      if (photo_url) updatedFields.photo = photo_url;
      await user.update(updatedFields);

      return res.json({ message: "Login muvaffaqiyatli", user });
    }

    // Agar User YANGI BO'LSA (Register)
    else {
      // 1. Yangi userni yaratamiz
      user = await User.create({
        telegramId: strId,
        firstName,
        lastName,
        username,
        photo: photo_url,
        invitedBy: start_param || null, // Kim taklif qilganini yozib qo'yamiz
        xp: 500, // Boshlang'ich bonus
      });

      // 2. REFERRAL LOGIKASI (1000 XP berish)
      // Agar start_param bor bo'lsa VA o'zini o'zi taklif qilmagan bo'lsa
      if (start_param && start_param !== strId) {
        const inviter = await User.findOne({
          where: { telegramId: start_param },
        });

        if (inviter) {
          // Taklif qilgan odamga 1000 XP qo'shamiz
          await inviter.increment("xp", { by: 1000 });
          console.log(
            `REFERRAL: ${inviter.firstName} ga 1000 XP berildi (yangi user: ${firstName})`
          );
        }
      }

      return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
    }
  } catch (error) {
    console.error("Login Error:", error);
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