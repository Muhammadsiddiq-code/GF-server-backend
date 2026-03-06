const express = require("express");
const Joi = require("joi");
const createError = require("http-errors");
const {
  listUserNotifications,
  getUnreadCount,
  markNotificationAsReadForUser,
  markAllAsReadForUser,
} = require("../models/notificationModel");

const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const notificationsRouter = express.Router();

notificationsRouter.use((req, res, next) => {
  const telegramId = req.header("X-Telegram-Id");
  if (!telegramId) {
    return next(createError(400, "X-Telegram-Id header is required"));
  }
  req.telegramId = String(telegramId);
  next();
});

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const { value, error } = listSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      throw createError(400, error.details.map((d) => d.message).join(", "));
    }

    const result = await listUserNotifications({
      telegramId: req.telegramId,
      page: value.page,
      limit: value.limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

notificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const count = await getUnreadCount({ telegramId: req.telegramId });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/:notificationId/read", async (req, res, next) => {
  try {
    const notificationId = Number(req.params.notificationId);
    if (!Number.isFinite(notificationId) || notificationId <= 0) {
      throw createError(400, "notificationId must be a positive number");
    }

    const result = await markNotificationAsReadForUser({
      telegramId: req.telegramId,
      notificationId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    const result = await markAllAsReadForUser({ telegramId: req.telegramId });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = notificationsRouter;

