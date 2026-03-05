const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const { authenticateAdmin, authenticateUser } = require("../middlewares/auth.middleware");

// ADMIN ONLY
// POST /api/admin/notifications/broadcast
router.post(
  "/admin/notifications/broadcast",
  authenticateAdmin,
  notificationController.broadcastNotification
);

// USER ROUTES (require authenticated user via X-Telegram-Id header)
// GET /api/notifications?limit=20&page=1
router.get("/notifications", authenticateUser, notificationController.getUserNotifications);

// PATCH /api/notifications/:notificationId/read
router.patch(
  "/notifications/:notificationId/read",
  authenticateUser,
  notificationController.markNotificationRead
);

// PATCH /api/notifications/read-all
router.patch(
  "/notifications/read-all",
  authenticateUser,
  notificationController.markAllNotificationsRead
);

// GET /api/notifications/unread-count
router.get(
  "/notifications/unread-count",
  authenticateUser,
  notificationController.getUnreadCount
);

module.exports = router;

