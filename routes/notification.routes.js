const express = require("express");

const notificationController = require("../controllers/notification.controller");
const {
  authenticateAdmin,
  authenticateUser,
  isAdmin,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// ADMIN ONLY
router.post(
  "/admin/notifications/broadcast",
  authenticateAdmin,
  isAdmin,
  notificationController.broadcastNotification
);

// USER ROUTES
router.get("/notifications", authenticateUser, notificationController.getUserNotifications);
router.get(
  "/notifications/unread-count",
  authenticateUser,
  notificationController.getUnreadCount
);
router.patch(
  "/notifications/read-all",
  authenticateUser,
  notificationController.markAllNotificationsRead
);
router.patch(
  "/notifications/:notificationId/read",
  authenticateUser,
  notificationController.markNotificationRead
);

module.exports = router;
