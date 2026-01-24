const { Game } = require("../models");
const Joi = require("joi");

// // Validatsiya sxemasi
// const gameSchema = Joi.object({
//   title: Joi.string().required(),
//   subtitle: Joi.string().allow(""),
//   location: Joi.string().required(),
//   playDate: Joi.date().required(),
//   startTime: Joi.string().required(),
//   endTime: Joi.string().required(),
//   price: Joi.number().required(),
//   totalPlayers: Joi.number().integer(),
//   playersJoined: Joi.number().integer(),
//   isOutdoor: Joi.boolean(),
//   hasLockers: Joi.boolean(),
//   hasShowers: Joi.boolean(),
//   type: Joi.string(),
//   advance: Joi.number(),
//   imageUrl: Joi.string().uri(),
//   rules: Joi.array().items(Joi.string()),
// });











// Validatsiya sxemasi
const gameSchema = Joi.object({
  title: Joi.string().required(),
  subtitle: Joi.string().allow(""),
  location: Joi.string().required(),
  playDate: Joi.date().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  price: Joi.number().required(),
  totalPlayers: Joi.number().integer(),
  playersJoined: Joi.number().integer(),
  isOutdoor: Joi.boolean(),
  hasLockers: Joi.boolean(),
  hasShowers: Joi.boolean(),
  type: Joi.string(),
  advance: Joi.number(),
  imageUrl: Joi.string().uri(),
  rules: Joi.array().items(Joi.string()),
  
  // MANA BU QATORNI QO'SHING:
  isFinished: Joi.boolean(), 
  
  // Kelajakda xato bermasligi uchun bularni ham qo'shib qo'yganingiz ma'qul:
  scoreTeamA: Joi.number().integer(),
  scoreTeamB: Joi.number().integer(),
  mvpPlayer: Joi.string().allow(null, "")
});

// Sanani formatlash uchun yordamchi funksiya
const formatDateForFrontend = (game) => {
  const dateObj = new Date(game.playDate);
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return {
    ...game.toJSON(),
    day: days[dateObj.getDay()],
    date: dateObj.getDate().toString().padStart(2, "0"),
    month: months[dateObj.getMonth()],
    time: `${game.startTime} - ${game.endTime}`,
    playersLeft: game.totalPlayers - game.playersJoined,
  };
};

// 1. Hamma o'yinlarni olish
// exports.getAllGames = async (req, res) => {
//   try {
//     const games = await Game.findAll({ order: [["playDate", "ASC"]] });
//     // Frontendga moslab formatlaymiz
//     const formattedGames = games.map(formatDateForFrontend);
//     res.json(formattedGames);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.getAllGames = async (req, res) => {
//   try {
//     const limit = req.query.limit ? parseInt(req.query.limit) : null;

//     const options = {
//       order: [["playDate", "ASC"]], // Eng yaqin o'yinlar har doim tepada
//     };

//     if (limit) {
//       options.limit = limit; // Agar limit bo'lsa (masalan 4), faqat 4 ta oladi
//     }

//     const games = await Game.findAll(options);
//     const formattedGames = games.map(formatDateForFrontend);
//     res.json(formattedGames);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// Games controller namunasi
exports.getAllGames = async (req, res) => {
try {
  const games = await Game.findAll();
  res.json(games);
} catch (err) {
  console.error(err); // Bu log Render terminalida ko'rinadi
  res.status(500).json({ message: "Server xatosi", error: err.message });
}
};

// 2. Bitta o'yinni olish
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });
    res.json(formatDateForFrontend(game));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Yangi o'yin yaratish
exports.createGame = async (req, res) => {
  try {
    const { error } = gameSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const newGame = await Game.create(req.body);
    res.status(201).json(formatDateForFrontend(newGame));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. O'yinni yangilash
exports.updateGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

    await game.update(req.body);
    res.json(formatDateForFrontend(game));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. O'yinni o'chirish
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

    await game.destroy();
    res.json({ message: "O'yin muvaffaqiyatli o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
