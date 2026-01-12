// // routes/user.routes.js
// const express = require("express");
// const router = express.Router();
// const userController = require("../controllers/user.controller");

// router.post("/telegram-auth", userController.telegramAuth);
// router.get("/all", userController.getAllUsers); // Hamma userlarni ko'rish uchun

// module.exports = router;




const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// Diqqat: Funksiya nomlari controllerdagi bilan bir xil bo'lishi shart!
router.post("/login", userController.loginOrRegister);
router.get("/all", userController.getAllUsers);

module.exports = router;