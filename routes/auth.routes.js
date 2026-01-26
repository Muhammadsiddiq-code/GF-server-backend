const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Userlar uchun (Telegram)
router.post("/login", authController.login);

// Adminlar uchun (Web Panel) - MANA SHU QATOR BO'LISHI KERAK
router.post("/admin-login", authController.adminLogin);

module.exports = router;
