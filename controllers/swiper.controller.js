const { Swiper } = require("../models"); // ✅ TO‘G‘RI

exports.createSwiper = async (req, res) => {
  try {
    const { img } = req.body;

    if (!img) {
      return res.status(400).json({ message: "Swiper talab qilinadi" });
    }

    const newSwiper = await Swiper.create({ img });

    res.status(201).json({
      message: "Swiper yaratildi, hursand bolaver",
      swiper: newSwiper,
    });
  } catch (err) {
    res.status(500).json({
      message: "Xatolik bor server error",
      err: err.message,
    });
  }
};

exports.getSwipers = async (req, res) => {
  try {
    const swipers = await Swiper.findAll();
    res.status(200).json(swipers);
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
};

exports.getSwiperById = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) return res.status(404).json({ message: "Swiper topilmadi" });
    res.status(200).json(swiper);
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
};

exports.deleteSwiper = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) return res.status(404).json({ message: "Swiper topilmadi" });

    await swiper.destroy();
    res.status(200).json({ message: "Ochirildi, hotirjam bol" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
};
