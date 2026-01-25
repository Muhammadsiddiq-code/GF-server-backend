const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// 1. Hamyondan to'lash (Eng muhimi shu)
router.post("/pay-from-balance", paymentController.payFromBalance);

// 2. Payme/Click invoice yaratish
router.post("/create-invoice", paymentController.createInvoice);

// 3. Tarixni olish (Agar kerak bo'lsa)
router.get("/history", paymentController.getHistory);

module.exports = router;
