const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/login", authController.login);
router.post("/create-admin", authController.createAdmin); // Admin yaratish uchun yo'l

module.exports = router;
