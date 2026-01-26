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

    // 1. Agar fayl yuklangan bo'lsa (Galereyadan)
    if (req.file) {
      // Backend to'liq URL qaytarishi uchun (masalan: http://localhost:5000/uploads/nomi.jpg)
      // Yoki shunchaki "/uploads/nomi.jpg" qilib saqlash mumkin.
      // Hozircha nisbiy yo'l saqlaymiz:
      imagePath = `/uploads/${req.file.filename}`;
    }
    // 2. Agar shunchaki URL yuborilgan bo'lsa
    else if (req.body.img) {
      imagePath = req.body.img;
    }

    if (!imagePath) {
      return res
        .status(400)
        .json({ message: "Rasm fayli yoki URL talab qilinadi" });
    }

    const newSwiper = await Swiper.create({ img: imagePath });

    res.status(201).json({
      message: "Swiper muvaffaqiyatli yaratildi",
      swiper: newSwiper,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server xatosi",
      err: err.message,
    });
  }
};

exports.getSwipers = async (req, res) => {
  try {
    const swipers = await Swiper.findAll();

    // Agar serverda to'g'ri ko'rinishi kerak bo'lsa, domen qo'shib berishimiz mumkin (Optional)
    // Frontend o'zi domen qo'shib olgani ma'qul.

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

    // Agar bu lokal fayl bo'lsa ("/uploads/" bilan boshlansa), uni papkadan ham o'chiramiz
    if (swiper.img && swiper.img.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", swiper.img);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Faylni o'chirish
      }
    }

    await swiper.destroy();
    res.status(200).json({ message: "Ochirildi, rasm ham tozalandi" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
};