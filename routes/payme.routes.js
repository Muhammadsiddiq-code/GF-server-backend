const express = require("express");
const router = express.Router();
const paymeController = require("../controllers/payme.controller");

// PAYME merchant API endpoint
// Barcha PAYME so'rovlari shu endpointga keladi
router.post("/", paymeController.handlePayme);

module.exports = router;
