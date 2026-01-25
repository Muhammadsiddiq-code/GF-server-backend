// routes/payment.routes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Invoice yaratish (BotFather link olish uchun)
router.post("/create-invoice", paymentController.createInvoice);

// Hamyon orqali to'lash
router.post("/pay-wallet", paymentController.payWithWallet);

// User profilini olish (Balans va Karta raqami uchun)
router.get("/user/:telegramId", paymentController.getUserProfile);

module.exports = router;
