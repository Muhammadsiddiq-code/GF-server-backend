const { Game } = require("../models");
const { Op } = require("sequelize");
const {
  deleteLocalUpload,
  normalizeImageList,
  toUploadRoute,
} = require("../utils/upload-utils");

const normalizeRules = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item || ""}`.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeRules(parsed);
    } catch (error) {
      return [trimmed];
    }
  }

  return [];
};

const getExistingImages = (game) =>
  normalizeImageList(game?.images?.length ? game.images : game?.imageUrl);

const getGamePayload = (payload, fallbackGame = null) => {
  const fallbackImages = getExistingImages(fallbackGame);
  const requestImages = normalizeImageList(payload.images);
  const requestImageUrl = payload.imageUrl ? [payload.imageUrl] : [];
  const images = (
    requestImages.length ? requestImages : requestImageUrl.length ? requestImageUrl : fallbackImages
  )
    .map((item) => `${item || ""}`.trim())
    .filter(Boolean);

  return {
    ...payload,
    imageUrl: images[0] || null,
    images,
    rules: normalizeRules(payload.rules),
    team1Name: payload.team1Name || fallbackGame?.team1Name || "Jamoa 1",
    team2Name: payload.team2Name || fallbackGame?.team2Name || "Jamoa 2",
  };
};

const cleanupRemovedGameImages = (previousImages = [], nextImages = []) => {
  const nextImageSet = new Set(nextImages);

  previousImages.forEach((imagePath) => {
    if (!nextImageSet.has(imagePath)) {
      deleteLocalUpload(imagePath);
    }
  });
};

exports.uploadGameImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Rasm fayli talab qilinadi" });
    }

    const url = toUploadRoute(req.file.filename);
    return res.json({ url, filename: req.file.filename });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllGames = async (req, res) => {
  try {
    const { city, date } = req.query;
    const whereClause = {};

    if (city && city !== "Barchasi") {
      whereClause.location = { [Op.like]: `%${city}%` };
    }

    if (date) {
      whereClause.playDate = date;
    }

    const games = await Game.findAll({
      where: whereClause,
      order: [
        ["playDate", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    const now = new Date();
    const activeGames = games.filter((game) => {
      try {
        const gameDateTime = new Date(`${game.playDate}T${game.startTime}:00`);
        return gameDateTime > now;
      } catch (error) {
        return true;
      }
    });

    return res.json(activeGames);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "O'yin topilmadi" });
    }

    return res.json(game);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createGame = async (req, res) => {
  try {
    const { title, playDate, startTime, price } = req.body;

    if (!title || !playDate || !startTime || !price) {
      return res.status(400).json({
        message: "Majburiy maydonlar to'ldirilmagan (Title, Date, Time, Price)",
      });
    }

    const payload = getGamePayload(req.body);
    if (!payload.images.length) {
      return res.status(400).json({
        message: "Kamida 1 ta rasm majburiy (URL yoki galereyadan yuklang)",
      });
    }

    const newGame = await Game.create(payload);
    return res.status(201).json(newGame);
  } catch (err) {
    console.error("Create Game Error:", err);
    return res.status(400).json({ message: `Yaratishda xatolik: ${err.message}` });
  }
};

exports.updateGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "O'yin topilmadi" });
    }

    const previousImages = getExistingImages(game);
    const payload = getGamePayload(req.body, game);

    if (!payload.images.length) {
      return res.status(400).json({
        message: "Kamida 1 ta rasm majburiy (URL yoki galereyadan yuklang)",
      });
    }

    await game.update(payload);
    cleanupRemovedGameImages(previousImages, payload.images);

    return res.json(game);
  } catch (err) {
    console.error("Update Game Error:", err);
    return res.status(400).json({ message: `Yangilashda xatolik: ${err.message}` });
  }
};

exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "O'yin topilmadi" });
    }

    const gameImages = getExistingImages(game);

    await game.destroy();
    gameImages.forEach((imagePath) => deleteLocalUpload(imagePath));

    return res.json({ message: "O'yin o'chirildi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
