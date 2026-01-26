// const { Swiper } = require("../models"); // ✅ TO‘G‘RI

// exports.createSwiper = async (req, res) => {
//   try {
//     const { img } = req.body;

//     if (!img) {
//       return res.status(400).json({ message: "Swiper talab qilinadi" });
//     }

//     const newSwiper = await Swiper.create({ img });

//     res.status(201).json({
//       message: "Swiper yaratildi, hursand bolaver",
//       swiper: newSwiper,
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: "Xatolik bor server error",
//       err: err.message,
//     });
//   }
// };

// exports.getSwipers = async (req, res) => {
//   try {
//     const swipers = await Swiper.findAll();
//     res.status(200).json(swipers);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err: err.message });
//   }
// };

// exports.getSwiperById = async (req, res) => {
//   try {
//     const swiper = await Swiper.findByPk(req.params.id);
//     if (!swiper) return res.status(404).json({ message: "Swiper topilmadi" });
//     res.status(200).json(swiper);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err: err.message });
//   }
// };

// exports.deleteSwiper = async (req, res) => {
//   try {
//     const swiper = await Swiper.findByPk(req.params.id);
//     if (!swiper) return res.status(404).json({ message: "Swiper topilmadi" });

//     await swiper.destroy();
//     res.status(200).json({ message: "Ochirildi, hotirjam bol" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err: err.message });
//   }
// };



















const { Swiper } = require("../models");
const fs = require("fs");
const path = require("path");

exports.createSwiper = async (req, res) => {
  try {
    let imagePath = null;

    // 1️⃣ Galereyadan fayl kelsa
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    // 2️⃣ URL kelsa
    else if (req.body.img && req.body.img.startsWith("http")) {
      imagePath = req.body.img;
    }

    if (!imagePath) {
      return res.status(400).json({
        message: "Rasm fayli yoki URL majburiy",
      });
    }

    const swiper = await Swiper.create({ img: imagePath });

    res.status(201).json({
      message: "Swiper muvaffaqiyatli qo‘shildi",
      swiper,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
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
    res.status(200).json(swipers);
  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
};

exports.getSwiperById = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) {
      return res.status(404).json({ message: "Swiper topilmadi" });
    }
    res.json(swiper);
  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
};

exports.deleteSwiper = async (req, res) => {
  try {
    const swiper = await Swiper.findByPk(req.params.id);
    if (!swiper) {
      return res.status(404).json({ message: "Swiper topilmadi" });
    }

    // agar lokal rasm bo‘lsa — faylni ham o‘chiramiz
    if (swiper.img.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", swiper.img);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await swiper.destroy();
    res.json({ message: "Swiper o‘chirildi" });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
};
