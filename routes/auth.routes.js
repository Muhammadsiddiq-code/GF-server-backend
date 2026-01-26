const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Userlar uchun (Telegram)
router.post("/login", authController.login);

// Adminlar uchun (Yangi)
router.post("/admin-login", authController.adminLogin);

module.exports = router;
