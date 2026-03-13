// const express = require("express");
// const createError = require("http-errors");

// const { createNotification, createUserNotification, createUserNotificationsForAllUsers } = require("../models/notificationModel.js");
// const db = require("../models/index.js");

// const router = express.Router();

// // Validation helper
// function validateNotificationPayload({ message, type }) {
//   const allowedTypes = ["info", "success", "warning", "error"];
//   if (!message || typeof message !== "string" || message.trim().length < 3) {
//     throw createError(400, "Message must be at least 3 characters");
//   }
//   if (!allowedTypes.includes(type)) {
//     throw createError(400, "Invalid notification type");
//   }
// }

// // POST /api/admin/notifications/broadcast
// // Body: { title?, message, type }
// router.post("/broadcast", async (req, res, next) => {
//   try {
//     const { title, message, type } = req.body;
//     validateNotificationPayload({ message, type });

//     const notification = await createNotification({
//       title: title?.trim() || null,
//       message: message.trim(),
//       type,
//       isGlobal: true,
//       createdByAdminId: null, // attach real admin id if you have auth
//     });

//     const userNotifications = await createUserNotificationsForAllUsers(notification.id);
//     const recipientsCount = userNotifications.length;

//     // Emit to all connected users: they will refetch list & unread count
//     const io = req.app.get("io");
//     io.emit("notification:broadcast", {
//       notificationId: notification.id,
//       type: notification.type,
//       title: notification.title,
//       message: notification.message,
//       createdAt: notification.created_at,
//     });

//     res.status(201).json({
//       notificationId: notification.id,
//       recipientsCount,
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// // POST /api/admin/notifications/personal
// // Body: { telegramId, title?, message, type }
// router.post("/personal", async (req, res, next) => {
//   try {
//     const { telegramId, title, message, type } = req.body;
//     if (!telegramId) {
//       throw createError(400, "telegramId is required");
//     }

//     validateNotificationPayload({ message, type });

//     const user = await db.User.findUserByTelegramId(String(telegramId));
//     if (!user) {
//       throw createError(404, "Target user not found");
//     }

//     const notification = await createNotification({
//       title: title?.trim() || null,
//       message: message.trim(),
//       type,
//       isGlobal: false,
//       createdByAdminId: null,
//     });

//     const userNotification = await createUserNotification({
//       userId: user.id,
//       notificationId: notification.id,
//     });

//     // Emit only to this user's room
//     const io = req.app.get("io");
//     io.to(`user:${user.telegram_id}`).emit("notification:broadcast", {
//       notificationId: notification.id,
//       userNotificationId: userNotification.id,
//       type: notification.type,
//       title: notification.title,
//       message: notification.message,
//       createdAt: notification.created_at,
//     });

//     res.status(201).json({
//       notificationId: notification.id,
//       userNotificationId: userNotification.id,
//       recipientTelegramId: user.telegram_id,
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;










































const express = require("express");
const createError = require("http-errors");

const { createNotification, createUserNotification, createUserNotificationsForAllUsers } = require("../models/notificationModel.js");
const db = require("../models/index.js");

const router = express.Router();

// =========================================================
// HELPERS
// =========================================================

function validateNotificationPayload({ message, type }) {
  const allowedTypes = ["info", "success", "warning", "error"];
  if (!message || typeof message !== "string" || message.trim().length < 3) {
    throw createError(400, "Message must be at least 3 characters");
  }
  if (!allowedTypes.includes(type)) {
    throw createError(400, "Invalid notification type");
  }
}

/**
 * Barcha userlarning telegramId lari orqali Telegram xabar yuborish.
 * Individual xatolarni to'xtatib qo'ymaydi — hammaga yuborishga harakat qiladi.
 */
async function sendTelegramBroadcast({ bot, title, message, type }) {
  if (!bot) {
    return { sentCount: 0, failedCount: 0, skipped: true, reason: "Bot instance not available" };
  }

  // Barcha userlarni DB dan olish (telegramId not null model constraint yordamida kafolatlanadi)
  const users = await db.User.findAll({
    attributes: ["telegramId"],
    raw: true,
  });

  if (!users.length) {
    return { sentCount: 0, failedCount: 0, totalUsers: 0 };
  }

  // Emoji type ga qarab
  const typeEmoji = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };
  const emoji = typeEmoji[type] || "📢";

  // Telegram Markdown xabar matni
  const titleLine = title ? `*${title}*\n\n` : "";
  const text = `${emoji} ${titleLine}${message}`;

  const results = await Promise.allSettled(
    users.map((u) =>
      bot.sendMessage(String(u.telegramId), text, { parse_mode: "Markdown" })
    )
  );

  const sentCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.filter((r) => r.status === "rejected").length;

  return { sentCount, failedCount, totalUsers: users.length };
}

// =========================================================
// POST /api/admin/notifications/broadcast
// Body: { title?, message, type, sendViaTelegram?, sendInApp? }
//
// sendInApp    (default: true)  — DB + Socket.IO orqali in-app notification
// sendViaTelegram (default: false) — Telegram bot orqali to'g'ridan-to'g'ri
// =========================================================
router.post("/broadcast", async (req, res, next) => {
  try {
    const {
      title,
      message,
      type,
      sendInApp = true,
      sendViaTelegram = false,
    } = req.body;

    validateNotificationPayload({ message, type });

    if (!sendInApp && !sendViaTelegram) {
      throw createError(400, "Kamida bitta kanal tanlang (sendInApp yoki sendViaTelegram)");
    }

    const response = {
      channels: { inApp: sendInApp, telegram: sendViaTelegram },
    };

    // ---- 1. IN-APP (DB + Socket.IO) ----
    if (sendInApp) {
      const notification = await createNotification({
        title: title?.trim() || null,
        message: message.trim(),
        type,
        isGlobal: true,
        createdByAdminId: null,
      });

      const userNotifications = await createUserNotificationsForAllUsers(notification.id);
      response.inApp = {
        notificationId: notification.id,
        recipientsCount: userNotifications.length,
      };

      // Socket.IO — real-time push
      const io = req.app.get("io");
      if (io) {
        io.emit("notification:broadcast", {
          notificationId: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: notification.created_at,
        });
      }
    }

    // ---- 2. TELEGRAM BOT ----
    if (sendViaTelegram) {
      const bot = req.bot;
      const telegramResult = await sendTelegramBroadcast({
        bot,
        title: title?.trim() || null,
        message: message.trim(),
        type,
      });
      response.telegram = telegramResult;
    }

    // Eski API compatibility uchun
    if (sendInApp) {
      response.notificationId = response.inApp.notificationId;
      response.recipientsCount = response.inApp.recipientsCount;
    }

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// =========================================================
// POST /api/admin/notifications/personal
// Body: { telegramId, title?, message, type, sendViaTelegram? }
// =========================================================
router.post("/personal", async (req, res, next) => {
  try {
    const { telegramId, title, message, type, sendViaTelegram = false } = req.body;
    if (!telegramId) {
      throw createError(400, "telegramId is required");
    }

    validateNotificationPayload({ message, type });

    const user = await db.User.findUserByTelegramId(String(telegramId));
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
    if (io) {
      io.to(`user:${user.telegram_id}`).emit("notification:broadcast", {
        notificationId: notification.id,
        userNotificationId: userNotification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.created_at,
      });
    }

    const response = {
      notificationId: notification.id,
      userNotificationId: userNotification.id,
      recipientTelegramId: user.telegram_id,
    };

    // Optionally also send via Telegram
    if (sendViaTelegram) {
      const bot = req.bot;
      if (bot) {
        try {
          const typeEmoji = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };
          const emoji = typeEmoji[type] || "📢";
          const titleLine = title ? `*${title.trim()}*\n\n` : "";
          const text = `${emoji} ${titleLine}${message.trim()}`;
          await bot.sendMessage(String(telegramId), text, { parse_mode: "Markdown" });
          response.telegramSent = true;
        } catch (tgErr) {
          response.telegramSent = false;
          response.telegramError = tgErr.message;
        }
      } else {
        response.telegramSent = false;
        response.telegramError = "Bot instance not available";
      }
    }

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;