// const express = require("express");
// const router = express.Router();
// const userController = require("../controllers/user.controller");

// // Diqqat: Funksiya nomlari controllerdagi bilan bir xil bo'lishi shart!
// // router.post("/login", userController.loginOrRegister);
// // userController.js yoki routes/users.js ichida
// router.post('/login', async (req, res) => {
//   const { telegramId, firstName, lastName, username, invitedBy } = req.body;

//   try {
//     let user = await User.findOne({ where: { telegramId } });

//     if (!user) {
//       // Yangi user yaratish
//       user = await User.create({
//         telegramId,
//         firstName,
//         lastName,
//         username,
//         xp: 0
//       });

//       // AGAR REFERRAL LINK ORQALI KELGAN BO'LSA
//       // invitedBy ichida taklif qilgan odamning telegramId bo'ladi
//       if (invitedBy && invitedBy !== telegramId) {
//         const inviter = await User.findOne({ where: { telegramId: invitedBy } });
//         if (inviter) {
//           // Taklif qilgan odamga 10,000 XP qo'shish
//           await inviter.increment('xp', { by: 3000 });
//           console.log(`User ${invitedBy} rewarded with 10000 XP`);
//         }
//       }
//     }

//     res.status(200).json({ user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
// router.get("/all", userController.getAllUsers);

// module.exports = router;

















const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// Login va Update uchun yagona route
router.post("/login", userController.loginOrRegister);

// Hamma userlarni olish
router.get("/all", userController.getAllUsers);

router.post("/update-balance", userController.updateUserBalance);


// YANGI ROUTE: Ma'lumotlarni yangilash
router.put("/:telegramId", userController.updateUser);
module.exports = router;