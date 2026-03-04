const { Swiper } = require("../models");
const {
  deleteLocalUpload,
  isRemoteUrl,
  toUploadRoute,
} = require("../utils/upload-utils");

const resolveSwiperImage = (req, fallbackValue = "") => {
  if (req.file) {
    return toUploadRoute(req.file.filename);
  }

  if (typeof req.body.img === "string" && req.body.img.trim()) {
    return req.body.img.trim();
  }

  return fallbackValue;
};

exports.createSwiper = async (req, res) => {
  try {
    const imagePath = resolveSwiperImage(req);

    if (!imagePath) {
      return res.status(400).json({
        message: "Rasm fayli yoki URL majburiy",
      });
    }

    const swiper = await Swiper.create({ img: imagePath });

    return res.status(201).json({
      message: "Swiper muvaffaqiyatli qo'shildi",
      swiper,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server xatosi",
      error: err.message,
    });
  }
};

exports.getSwipers = async (req, res) => {
  try {
    const swipers = await Swiper.findAll({
      order: [["id", "DESC"]],
    });
    return res.status(200).json(swipers);
  } catch (err) {
    return res.status(500).json({ message: "Server xatosi" });
  }
};

exports.getSwiperById = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) {
      return res.status(404).json({ message: "Swiper topilmadi" });
    }

    return res.json(swiper);
  } catch (err) {
    return res.status(500).json({ message: "Server xatosi" });
  }
};

exports.updateSwiper = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) {
      return res.status(404).json({ message: "Swiper topilmadi" });
    }

    const nextImage = resolveSwiperImage(req, swiper.img);
    if (!nextImage) {
      return res.status(400).json({ message: "Rasm fayli yoki URL majburiy" });
    }

    const previousImage = swiper.img;
    await swiper.update({ img: nextImage });

    if (previousImage !== nextImage) {
      deleteLocalUpload(previousImage);
    }

    return res.json({
      message: "Swiper yangilandi",
      swiper,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};

exports.deleteSwiper = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) {
      return res.status(404).json({ message: "Swiper topilmadi" });
    }

    const imagePath = swiper.img;
    await swiper.destroy();

    if (!isRemoteUrl(imagePath)) {
      deleteLocalUpload(imagePath);
    }

    return res.json({ message: "Swiper o'chirildi" });
  } catch (err) {
    return res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};
