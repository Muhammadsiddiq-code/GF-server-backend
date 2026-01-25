const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Yagona endpoint: providerni body ichida yuboramiz
router.post("/create-invoice", paymentController.createInvoiceLink);
router.get("/history", paymentController.getHistory); // <-- YANGI

module.exports = router;
