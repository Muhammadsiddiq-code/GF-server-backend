const express = require("express");
const Joi = require("joi");
const createError = require("http-errors");
const {
  NOTIFICATION_TYPES,
  createBroadcastNotification,
  createPersonalNotification,
} = require("../models/notificationModel");

const broadcastSchema = Joi.object({
  title: Joi.string().allow(null, "").max(255),
  message: Joi.string().min(3).max(2000).required(),
  type: Joi.string()
    .valid(...Array.from(NOTIFICATION_TYPES))
    .default("info"),
});

const personalSchema = Joi.object({
  telegramId: Joi.alternatives(Joi.string(), Joi.number()).required(),
  username: Joi.string().allow(null, "").optional(),
  firstName: Joi.string().allow(null, "").optional(),
  lastName: Joi.string().allow(null, "").optional(),
  title: Joi.string().allow(null, "").max(255),
  message: Joi.string().min(3).max(2000).required(),
  type: Joi.string()
    .valid(...Array.from(NOTIFICATION_TYPES))
    .default("info"),
});

const createAdminNotificationsRouter = ({ io }) => {
  const router = express.Router();

  router.post("/broadcast", async (req, res, next) => {
    try {
      const { value, error } = broadcastSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        throw createError(400, error.details.map((d) => d.message).join(", "));
      }

      const result = await createBroadcastNotification(value, { io });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/personal", async (req, res, next) => {
    try {
      const { value, error } = personalSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        throw createError(400, error.details.map((d) => d.message).join(", "));
      }

      const result = await createPersonalNotification(value, { io });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
};

module.exports = createAdminNotificationsRouter;

