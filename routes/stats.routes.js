const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");

// GET /api/stats/dashboard — Admin Dashboard statistikalari
router.get("/dashboard", statsController.getDashboardStats);

module.exports = router;
