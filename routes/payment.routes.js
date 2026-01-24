const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Yagona endpoint: providerni body ichida yuboramiz
router.post("/create-invoice", paymentController.createInvoiceLink);

module.exports = router;
