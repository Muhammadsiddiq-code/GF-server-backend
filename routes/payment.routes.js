const express = require("express");
const router = express.Router();
// Controller to'g'ri import qilinganiga ishonch hosil qiling
const paymentController = require("../controllers/payment.controller");

// 1. Invoice yaratish
router.post("/create-invoice", paymentController.createInvoice);

// 2. Hamyon orqali to'lash
router.post("/pay-wallet", paymentController.payWithWallet);

// 3. User profilini olish (Xatolik chiqqan joy shu yer edi)
// Bu yerda paymentController.getUserWallet funksiyasi mavjud bo'lishi kerak
router.get("/user/:telegramId", paymentController.getUserWallet);

module.exports = router;
