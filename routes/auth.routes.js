const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");

// /api/auth/login
router.post("/login", controller.login);

module.exports = router;
