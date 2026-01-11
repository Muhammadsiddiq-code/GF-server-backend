// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.post("/telegram-auth", userController.telegramAuth);
router.get("/all", userController.getAllUsers); // Hamma userlarni ko'rish uchun

module.exports = router;
