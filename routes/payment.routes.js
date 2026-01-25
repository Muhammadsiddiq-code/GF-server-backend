const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// 1. Hamyondan to'lash
router.post("/pay-from-balance", paymentController.payFromBalance);

// 2. O'yin uchun to'lov linki (Payme/Click)
router.post("/create-invoice", paymentController.createInvoice);

// 3. Balansni to'ldirish uchun link
router.post("/create-topup-invoice", paymentController.createTopUpInvoice);

// 4. Tarixni olish (Mana shu qator xato berayotgan edi)
router.get("/history", paymentController.getHistory);

module.exports = router;
