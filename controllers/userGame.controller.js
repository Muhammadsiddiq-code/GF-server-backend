// const { UserGame, Game, User } = require("../models"); // User modelini qo'shdik
// const { Op } = require("sequelize");


// exports.joinGame = async (req, res) => {
//   try {
//     const { gameId, userId, team } = req.body; // userId bu yerda bazadagi ID

//     // 1. O'yin mavjudligini va joy borligini tekshirish
//     const game = await Game.findByPk(gameId);
//     if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

//     if (game.playersJoined >= game.totalPlayers) {
//       return res.status(400).json({ message: "Barcha joylar band" });
//     }

//     // 2. UserGame ga yozish (O'yinga qo'shish)
//     const newJoin = await UserGame.create({ gameId, userId, team });

//     // 3. O'yinda odamlar sonini 1 taga oshirish
//     await game.increment("playersJoined");

//     // 4. XP QO'SHISH (Siz aytgan 3000 XP)
//     const user = await User.findByPk(userId);
//     if (user) {
//       await user.increment("xp", { by: 3000 });
//     }

//     res.status(201).json({
//       message: "O'yinga muvaffaqiyatli qo'shildingiz va 3000 XP berildi!",
//       data: newJoin,
//       currentXp: user ? user.xp + 3000 : 0,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



// // 1. Foydalanuvchining barcha o'yinlari tarixi
// exports.getUserGameHistory = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const history = await UserGame.findAll({
//       where: { userId: userId },
//       include: [{ model: Game }],
//       order: [["createdAt", "DESC"]],
//     });
//     res.json(history);
//   } catch (error) {
//     console.error("History Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // 2. (YANGI) O'yin bo'yicha barcha ishtirokchilarni olish (Admin uchun)
// exports.getPlayersByGameId = async (req, res) => {
//   try {
//     const { gameId } = req.params;

//     const players = await UserGame.findAll({
//       where: { gameId: gameId },
//       include: [
//         {
//           model: User, // User ma'lumotlarini (Ism, Tel) qo'shib olamiz
//           attributes: ["id", "firstName", "lastName", "phone", "telegramId"],
//         },
//       ],
//       order: [["createdAt", "DESC"]], // Eng oxirgi qo'shilganlar tepadaga
//     });

//     res.json(players);
//   } catch (error) {
//     console.error("Get Players Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };





















// ✅ Notification modelini ham import qildik
const { UserGame, Game, User, Notification } = require("../models");
const { Op } = require("sequelize");

exports.joinGame = async (req, res) => {
  const transaction = await UserGame.sequelize.transaction(); // Tranzaksiya xavfsizlik uchun

  try {
    const { gameId, userId, team } = req.body;

    // 1. O'yin mavjudligini va joy borligini tekshirish
    const game = await Game.findByPk(gameId, { transaction });
    if (!game) {
      await transaction.rollback();
      return res.status(404).json({ message: "O'yin topilmadi" });
    }

    // 1.1 Oldin qo'shilganmi tekshiramiz (Double join oldini olish uchun)
    const existingJoin = await UserGame.findOne({
      where: { gameId, userId },
      transaction,
    });
    if (existingJoin) {
      await transaction.rollback();
      return res.status(400).json({ message: "Siz allaqachon bu o'yinga qo'shilgansiz" });
    }

    // 1.2 Joy tekshirish
    if (game.playersJoined >= game.totalPlayers) {
      await transaction.rollback();
      return res.status(400).json({ message: "Barcha joylar band" });
    }

    // 2. UserGame ga yozish (O'yinga qo'shish)
    const newJoin = await UserGame.create(
      { gameId, userId, team },
      { transaction }
    );

    // 3. O'yinda odamlar sonini 1 taga oshirish
    await game.increment("playersJoined", { transaction });

    // 4. XP QO'SHISH (3000 XP)
    let currentXp = 0;
    const user = await User.findByPk(userId, { transaction });
    if (user) {
      await user.increment("xp", { by: 3000, transaction });
      currentXp = user.xp + 3000;
    }

    // --------------------------------------------------------
    // ✅ 5. YANGI: Notification yaratish
    // --------------------------------------------------------
    await Notification.create(
      {
        userId: userId,
        gameId: gameId,
        title: "Muvaffaqiyatli qo'shildingiz! ✅",
        message: `Siz "${game.title}" o'yiniga muvaffaqiyatli ro'yxatdan o'tdingiz. Hisobingizga 3000 XP qo'shildi. O'yin vaqtini o'tkazib yubormang!`,
        type: "success", // Frontendda yashil bo'lib chiqadi
        isRead: false,
      },
      { transaction }
    );

    // Hamma o'zgarishlarni saqlash
    await transaction.commit();

    res.status(201).json({
      message: "O'yinga muvaffaqiyatli qo'shildingiz va 3000 XP berildi!",
      data: newJoin,
      currentXp: currentXp,
    });
  } catch (error) {
    // Xatolik bo'lsa, hammasini bekor qilish
    await transaction.rollback();
    console.error("Join Game Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 1. Foydalanuvchining barcha o'yinlari tarixi
exports.getUserGameHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await UserGame.findAll({
      where: { userId: userId },
      include: [
        {
          model: Game,
          attributes: ["id", "title", "startTime", "location", "price", "imageUrl"], // Kerakli maydonlar
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(history);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. O'yin bo'yicha barcha ishtirokchilarni olish (Admin uchun)
exports.getPlayersByGameId = async (req, res) => {
  try {
    const { gameId } = req.params;

    const players = await UserGame.findAll({
      where: { gameId: gameId },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "phone", "telegramId", "xp"], // XP ni ham qo'shdik
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(players);
  } catch (error) {
    console.error("Get Players Error:", error);
    res.status(500).json({ message: error.message });
  }
};