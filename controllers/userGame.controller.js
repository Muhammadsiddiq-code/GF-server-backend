// const { Game, UserGame } = require("../models");
// const { Op } = require("sequelize");

// // 1. O'YINGA QO'SHILISH (JOIN)
// exports.joinGame = async (req, res) => {
//   try {
//     const { gameId, userId, team } = req.body; // userId telegramdan keladi

//     const game = await Game.findByPk(gameId);
//     if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

//     if (game.playersJoined >= game.totalPlayers) {
//       return res.status(400).json({ message: "Joy qolmagan" });
//     }

//     const booking = await UserGame.create({
//       gameId,
//       userId,
//       team: team || "A",
//     });

//     await game.increment("playersJoined");

//     res.status(201).json(booking);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 2. TARIXNI OLISH (HISTORY)
// exports.getUserHistory = async (req, res) => {
//   try {
//     const { userId } = req.params; // Telegram ID yoki bazadagi ID

//     const history = await UserGame.findAll({
//       where: { userId },
//       include: [
//         {
//           model: Game,
//           // O'yin vaqti o'tib ketgan bo'lsa tarixga o'tadi
//           where: { playDate: { [Op.lt]: new Date() } },
//         },
//       ],
//       order: [[Game, "playDate", "DESC"]],
//     });

//     const formatted = history.map((item) => {
//       const g = item.Game;
//       return {
//         id: g.id,
//         date: new Date(g.playDate).toLocaleDateString("uz-UZ", {
//           day: "numeric",
//           month: "long",
//         }),
//         time: `${g.startTime} - ${g.endTime}`,
//         location: g.location,
//         price: g.price,
//         myTeam: item.team === "A" ? "Jamoa A" : "Jamoa B",
//         opponentTeam: item.team === "A" ? "Jamoa B" : "Jamoa A",
//         myScore: g.scoreTeamA || 0,
//         opponentScore: g.scoreTeamB || 0,
//         result:
//           g.scoreTeamA > g.scoreTeamB && item.team === "A"
//             ? "win"
//             : g.scoreTeamA < g.scoreTeamB && item.team === "B"
//             ? "win"
//             : g.scoreTeamA === g.scoreTeamB
//             ? "draw"
//             : "lose",
//         playersCount: g.playersJoined,
//         mvp: g.mvpPlayer || "Aniqlanmadi",
//       };
//     });

//     res.json(formatted);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };










const { UserGame, Game } = require("../models");
const { Op } = require("sequelize");

// 1. O'yinga qo'shilish
exports.joinGame = async (req, res) => {
  try {
    const { gameId, userId, team } = req.body;

    // O'yin mavjudligini tekshirish
    const game = await Game.findByPk(gameId);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

    // Joy borligini tekshirish
    if (game.playersJoined >= game.totalPlayers) {
      return res.status(400).json({ message: "Barcha joylar band" });
    }

    // UserGame ga yozish
    const newJoin = await UserGame.create({ gameId, userId, team });

    // O'yinda odamlar sonini 1 taga oshirish
    await game.increment("playersJoined");

    res.status(201).json(newJoin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Foydalanuvchi Tarixini olish
exports.getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await UserGame.findAll({
      where: { userId },
      include: [
        {
          model: Game,
          where: {
            // Faqat o'tib ketgan o'yinlarni ko'rsatish
            playDate: { [Op.lt]: new Date() },
          },
        },
      ],
      order: [[Game, "playDate", "DESC"]], // Yaqin tarix birinchi
    });

    // Frontend formatiga moslash
    const formattedData = history.map((item) => ({
      id: item.Game.id,
      title: item.Game.title,
      location: item.Game.location,
      time: item.Game.startTime,
      date: item.Game.playDate,
      myTeam: item.team,
      score: `${item.Game.scoreTeamA || 0} : ${item.Game.scoreTeamB || 0}`,
      status: "Tugallangan",
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};