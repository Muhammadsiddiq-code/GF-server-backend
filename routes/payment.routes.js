const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// 1. O'yin uchun to'lov linki (Payme/Click)
router.post("/create-invoice", paymentController.createInvoiceLink);

// 2. Balansni to'ldirish uchun link (Payme/Click) <-- MANA SHU YETISHMAYOTGAN EDI
router.post("/create-topup-invoice", paymentController.createTopUpInvoice);

// 3. Balansdan to'lash (Hamyon)
router.post("/pay-from-balance", paymentController.payFromBalance);

// 4. Tarixni olish
router.get("/history", paymentController.getHistory);

module.exports = router;
