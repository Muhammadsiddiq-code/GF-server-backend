const express = require("express");
const createError = require("http-errors");

const { createNotification, createUserNotification, createUserNotificationsForAllUsers } = require("../models/notificationModel.js");
const { findUserByTelegramId } = require("../models/userModel.js");

const router = express.Router();

// Validation helper
function validateNotificationPayload({ message, type }) {
  const allowedTypes = ["info", "success", "warning", "error"];
  if (!message || typeof message !== "string" || message.trim().length < 3) {
    throw createError(400, "Message must be at least 3 characters");
  }
  if (!allowedTypes.includes(type)) {
    throw createError(400, "Invalid notification type");
  }
}

// POST /api/admin/notifications/broadcast
// Body: { title?, message, type }
router.post("/broadcast", async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    validateNotificationPayload({ message, type });

    const notification = await createNotification({
      title: title?.trim() || null,
      message: message.trim(),
      type,
      isGlobal: true,
      createdByAdminId: null, // attach real admin id if you have auth
    });

    const userNotifications = await createUserNotificationsForAllUsers(notification.id);
    const recipientsCount = userNotifications.length;

    // Emit to all connected users: they will refetch list & unread count
    const io = req.app.get("io");
    io.emit("notification:broadcast", {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.created_at,
    });

    res.status(201).json({
      notificationId: notification.id,
      recipientsCount,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications/personal
// Body: { telegramId, title?, message, type }
router.post("/personal", async (req, res, next) => {
  try {
    const { telegramId, title, message, type } = req.body;
    if (!telegramId) {
      throw createError(400, "telegramId is required");
    }

    validateNotificationPayload({ message, type });

    const user = await findUserByTelegramId(String(telegramId));
    if (!user) {
      throw createError(404, "Target user not found");
    }

    const notification = await createNotification({
      title: title?.trim() || null,
      message: message.trim(),
      type,
      isGlobal: false,
      createdByAdminId: null,
    });

    const userNotification = await createUserNotification({
      userId: user.id,
      notificationId: notification.id,
    });

    // Emit only to this user's room
    const io = req.app.get("io");
    io.to(`user:${user.telegram_id}`).emit("notification:broadcast", {
      notificationId: notification.id,
      userNotificationId: userNotification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.created_at,
    });

    res.status(201).json({
      notificationId: notification.id,
      userNotificationId: userNotification.id,
      recipientTelegramId: user.telegram_id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;