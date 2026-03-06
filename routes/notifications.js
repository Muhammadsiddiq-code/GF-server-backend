// const express = require("express");

// const notificationController = require("../controllers/notification.controller");
// const {
//   authenticateAdmin,
//   authenticateUser,
//   isAdmin,
// } = require("../middlewares/auth.middleware");

// const router = express.Router();

// // ADMIN ONLY
// router.post(
//   "/admin/notifications/broadcast",
//   authenticateAdmin,
//   isAdmin,
//   notificationController.broadcastNotification
// );

// // USER ROUTES
// router.get("/notifications", authenticateUser, notificationController.getUserNotifications);
// router.get(
//   "/notifications/unread-count",
//   authenticateUser,
//   notificationController.getUnreadCount
// );
// router.patch(
//   "/notifications/read-all",
//   authenticateUser,
//   notificationController.markAllNotificationsRead
// );
// router.patch(
//   "/notifications/:notificationId/read",
//   authenticateUser,
//   notificationController.markNotificationRead
// );

// module.exports = router;





















const express = require("express");
const createError = require("http-errors");
const { findUserByTelegramId } = require("../models/userModel.js");
const {
  getUserNotificationsPaginated,
  getUnreadCountForUser,
  markNotificationReadForUser,
  markAllNotificationsReadForUser,
} = require("../models/notificationModel.js");

const router = express.Router();

// Helper to resolve user from X-Telegram-Id
async function getUserFromRequest(req) {
  if (!req.telegramId) {
    throw createError(400, "X-Telegram-Id header is required");
  }

  const user = await findUserByTelegramId(req.telegramId);
  if (!user) {
    throw createError(404, "User not found");
  }

  return user;
}

// GET /api/notifications?page&limit
router.get("/", async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

    const result = await getUserNotificationsPaginated({
      userId: user.id,
      page,
      limit,
    });

    const hasMore = page < result.totalPages;

    res.json({
      data: result.data.map((row) => ({
        id: row.notification_id,        // logical notification id
        notificationId: row.notification_id,
        userNotificationId: row.id,     // row id in user_notifications
        title: row.title,
        message: row.message,
        type: row.type,
        isRead: row.is_read,
        readAt: row.read_at,
        createdAt: row.created_at,
      })),
      page: result.page,
      total: result.total,
      totalPages: result.totalPages,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    const count = await getUnreadCountForUser(user.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:notificationId/read
router.patch("/:notificationId/read", async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    const { notificationId } = req.params;

    if (!notificationId) {
      throw createError(400, "notificationId is required");
    }

    const updated = await markNotificationReadForUser({
      userId: user.id,
      notificationId,
    });

    if (!updated) {
      throw createError(404, "Notification not found for this user");
    }

    const unreadCount = await getUnreadCountForUser(user.id);

    res.json({
      notification: {
        id: updated.notification_id,
        userNotificationId: updated.id,
        isRead: updated.is_read,
        readAt: updated.read_at,
      },
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);

    const result = await markAllNotificationsReadForUser(user.id);
    const readAt = result?.read_at || new Date().toISOString();

    res.json({
      readAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;