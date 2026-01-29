const express = require("express");
const router = express.Router();
const controller = require("../controllers/notification.controller");

router.get("/:userId", controller.getUserNotifications);
router.put("/read-all/:userId", controller.markAllAsRead);

module.exports = router;
