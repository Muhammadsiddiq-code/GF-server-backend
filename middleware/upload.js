const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Uploads papkasi borligini tekshirish va yaratish
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Saqlash joyi va fayl nomi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Rasmlar shu papkaga tushadi
  },
  filename: (req, file, cb) => {
    // Fayl nomi: timestamp + original nom (masalan: 17123456-image.jpg)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Fayl turini tekshirish (faqat rasmlar)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|webp|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Faqat rasm fayllari (jpeg, jpg, png, webp, gif) yuklash mumkin!"
      )
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
