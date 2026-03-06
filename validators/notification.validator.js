const Joi = require("joi");

const NOTIFICATION_TYPES = ["info", "success", "warning", "error"];

const broadcastNotificationSchema = Joi.object({
  title: Joi.string().trim().allow("", null).max(255).optional(),
  message: Joi.string().trim().min(3).max(5000).required(),
  type: Joi.string()
    .valid(...NOTIFICATION_TYPES)
    .optional()
    .default("info"),
});

const notificationsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1),
});

module.exports = {
  NOTIFICATION_TYPES,
  broadcastNotificationSchema,
  notificationsQuerySchema,
};
