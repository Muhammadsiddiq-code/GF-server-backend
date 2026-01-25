// const { Game } = require("../models");
// const Joi = require("joi");
// const { Op } = require("sequelize");

// // --- MUHIM O'ZGARISH: mapUrl validatsiyaga qo'shildi ---
// const gameSchema = Joi.object({
//   title: Joi.string().required(),
//   subtitle: Joi.string().allow(null, ""), // Bo'sh bo'lishi mumkin
//   location: Joi.string().required(),

//   // YANGI: Xarita linki (URI bo'lishi kerak yoki bo'sh)
//   mapUrl: Joi.string().allow(null, ""),

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
//   imageUrl: Joi.string().allow(null, ""), // Rasm bo'lmasligi ham mumkin
//   rules: Joi.array().items(Joi.string()),

//   isFinished: Joi.boolean(),
//   scoreTeamA: Joi.number().integer(),
//   scoreTeamB: Joi.number().integer(),
//   mvpPlayer: Joi.string().allow(null, ""),
// });

// // Sanani formatlash
// const formatDateForFrontend = (game) => {
//   const dateObj = new Date(game.playDate);
//   const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
//   const months = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   return {
//     ...game.toJSON(),
//     day: days[dateObj.getDay()],
//     date: dateObj.getDate().toString().padStart(2, "0"),
//     month: months[dateObj.getMonth()],
//     time: `${game.startTime} - ${game.endTime}`,
//     playersLeft: (game.totalPlayers || 0) - (game.playersJoined || 0),
//   };
// };

// // 1. Hamma o'yinlarni olish (FILTER BILAN)
// exports.getAllGames = async (req, res) => {
//   try {
//     const { limit, city, date } = req.query;

//     const whereClause = {};

//     // 1. Shahar bo'yicha filter
//     if (city && city !== "Barchasi") {
//       whereClause.location = { [Op.like]: `%${city}%` };
//     }

//     // 2. Sana bo'yicha filter
//     if (date) {
//       const searchDate = new Date(date);
//       const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
//       const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

//       whereClause.playDate = {
//         [Op.between]: [startOfDay, endOfDay],
//       };
//     }

//     const options = {
//       where: whereClause,
//       order: [["playDate", "ASC"]],
//     };

//     if (limit) {
//       options.limit = parseInt(limit);
//     }

//     const games = await Game.findAll(options);
//     const formattedGames = games.map(formatDateForFrontend);

//     res.json(formattedGames);
//   } catch (error) {
//     console.error("Xatolik:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // 2. Bitta o'yinni olish
// exports.getGameById = async (req, res) => {
//   try {
//     const game = await Game.findByPk(req.params.id);
//     if (!game) return res.status(404).json({ message: "O'yin topilmadi" });
//     res.json(formatDateForFrontend(game));
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 3. Yangi o'yin yaratish
// exports.createGame = async (req, res) => {
//   try {
//     // Validatsiya
//     const { error } = gameSchema.validate(req.body);
//     if (error) {
//       console.log("Validatsiya xatosi:", error.details[0].message); // Terminalda ko'rish uchun
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const newGame = await Game.create(req.body);
//     res.status(201).json(formatDateForFrontend(newGame));
//   } catch (error) {
//     console.error("Create Game Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // 4. O'yinni yangilash
// exports.updateGame = async (req, res) => {
//   try {
//     const game = await Game.findByPk(req.params.id);
//     if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

//     // Validatsiyani update paytida ham tekshirish yaxshi, lekin majburiy emas (qisman update uchun)
//     // Agar to'liq update qilsangiz, validatsiyani qo'shing.

//     await game.update(req.body);
//     res.json(formatDateForFrontend(game));
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 5. O'yinni o'chirish
// exports.deleteGame = async (req, res) => {
//   try {
//     const game = await Game.findByPk(req.params.id);
//     if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

//     await game.destroy();
//     res.json({ message: "O'yin muvaffaqiyatli o'chirildi" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };























const { Game } = require("../models");

// Barcha o'yinlarni olish
exports.getAllGames = async (req, res) => {
  try {
    // Sanasi bo'yicha tartiblash (eng yangilari tepadaga)
    const games = await Game.findAll({
      order: [
        ["playDate", "DESC"],
        ["startTime", "ASC"],
      ],
    });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bitta o'yinni olish
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });
    res.json(game);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// O'yin yaratish (CREATE)
exports.createGame = async (req, res) => {
  try {
    const {
      title,
      playDate,
      startTime,
      price,
      location,
      team1Name,
      team2Name,
      rules,
    } = req.body;

    // Oddiy validatsiya
    if (!title || !playDate || !startTime || !price) {
      return res
        .status(400)
        .json({
          message:
            "Majburiy maydonlar to'ldirilmagan (Title, Date, Time, Price)",
        });
    }

    // O'yinni yaratish
    const newGame = await Game.create({
      ...req.body,
      // Agar rules massiv bo'lmasa, bo'sh massiv qilamiz
      rules: Array.isArray(rules) ? rules : [],
      team1Name: team1Name || "Jamoa 1",
      team2Name: team2Name || "Jamoa 2",
    });

    res.status(201).json(newGame);
  } catch (err) {
    console.error("Create Game Error:", err);
    // Xatolikni aniq qaytarish (400 Bad Request sababini bilish uchun)
    res.status(400).json({ message: "Yaratishda xatolik: " + err.message });
  }
};

// O'yinni yangilash (UPDATE)
exports.updateGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

    await game.update(req.body);
    res.json(game);
  } catch (err) {
    console.error("Update Game Error:", err);
    res.status(400).json({ message: "Yangilashda xatolik: " + err.message });
  }
};

// O'yinni o'chirish (DELETE)
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ message: "O'yin topilmadi" });

    await game.destroy();
    res.json({ message: "O'yin o'chirildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};