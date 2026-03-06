const { Op } = require("sequelize");
const { Notification, UserNotification, User, sequelize } = require("../models");
const {
  broadcastNotificationSchema,
  notificationsQuerySchema,
} = require("../validators/notification.validator");
const { emitBroadcastNotification } = require("../utils/notification-events");

const USER_BATCH_SIZE = 2000;

const formatValidationErrors = (validationError) =>
  (validationError?.details || []).map((detail) => detail.message);

const mapNotificationRow = (row) => ({
  id: row.id,
  notificationId: row.notificationId,
  title: row.notification?.title || null,
  message: row.notification?.message || "",
  type: row.notification?.type || "info",
  isRead: row.isRead,
  readAt: row.readAt,
  createdAt: row.notification?.createdAt || row.createdAt,
  userNotificationCreatedAt: row.createdAt,
});

// ADMIN: Broadcast notification to all users
exports.broadcastNotification = async (req, res) => {
  const { value, error } = broadcastNotificationSchema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Invalid notification payload",
      errors: formatValidationErrors(error),
    });
  }

  const { title = null, message, type } = value;
  const createdBy = req.admin?.id || null;

  let notification;
  let recipientsCount = 0;

  try {
    await sequelize.transaction(async (transaction) => {
      notification = await Notification.create(
        {
          title,
          message,
          type,
          createdBy,
        },
        { transaction }
      );

      let lastUserId = 0;

      while (true) {
        // Paginate through users by id to avoid loading the full user table into memory.
        // eslint-disable-next-line no-await-in-loop
        const usersBatch = await User.findAll({
          attributes: ["id"],
          where: lastUserId ? { id: { [Op.gt]: lastUserId } } : undefined,
          order: [["id", "ASC"]],
          limit: USER_BATCH_SIZE,
          raw: true,
          transaction,
        });

        if (!usersBatch.length) {
          break;
        }

        lastUserId = usersBatch[usersBatch.length - 1].id;
        recipientsCount += usersBatch.length;

        const userNotificationRows = usersBatch.map((user) => ({
          userId: user.id,
          notificationId: notification.id,
          isRead: false,
          readAt: null,
        }));

        // eslint-disable-next-line no-await-in-loop
        await UserNotification.bulkCreate(userNotificationRows, {
          transaction,
          validate: false,
          ignoreDuplicates: true,
        });
      }
    });

    emitBroadcastNotification(req.app.get("io"), notification);

    return res.status(201).json({
      notification,
      recipientsCount,
    });
  } catch (broadcastError) {
    console.error("Broadcast notification error:", broadcastError);
    return res.status(500).json({
      message: "Broadcast xatosi",
      error: broadcastError.message,
    });
  }
};

// USER: Get current user's notifications (paginated)
exports.getUserNotifications = async (req, res) => {
  const { value, error } = notificationsQuerySchema.validate(req.query || {}, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Invalid query params",
      errors: formatValidationErrors(error),
    });
  }

  const { limit, page } = value;
  const offset = (page - 1) * limit;

  try {
    const { rows, count } = await UserNotification.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Notification,
          as: "notification",
          required: true,
          attributes: ["id", "title", "message", "type", "createdAt"],
        },
      ],
      order: [
        [{ model: Notification, as: "notification" }, "createdAt", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(count / limit));

    return res.json({
      data: rows.map(mapNotificationRow),
      page,
      limit,
      total: count,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (getError) {
    console.error("Get notifications error:", getError);
    return res.status(500).json({
      message: "Xabarnomalarni olishda xatolik",
      error: getError.message,
    });
  }
};

// USER: Mark single notification as read
exports.markNotificationRead = async (req, res) => {
  const notificationId = Number(req.params.notificationId);

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return res.status(400).json({ message: "notificationId noto'g'ri" });
  }

  try {
    const userNotification = await UserNotification.findOne({
      where: {
        userId: req.user.id,
        notificationId,
      },
    });

    if (!userNotification) {
      return res.status(404).json({ message: "Xabarnoma topilmadi" });
    }

    if (!userNotification.isRead) {
      userNotification.isRead = true;
      userNotification.readAt = new Date();
      await userNotification.save();
    }

    const unreadCount = await UserNotification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return res.json({
      message: "Xabarnoma o'qilgan deb belgilandi",
      notification: {
        id: userNotification.id,
        notificationId: userNotification.notificationId,
        isRead: userNotification.isRead,
        readAt: userNotification.readAt,
      },
      unreadCount,
    });
  } catch (markError) {
    console.error("Mark notification read error:", markError);
    return res.status(500).json({
      message: "Xatolik yuz berdi",
      error: markError.message,
    });
  }
};

// USER: Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  const readAt = new Date();

  try {
    const [updatedCount] = await UserNotification.update(
      { isRead: true, readAt },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );

    return res.json({
      message: "Barcha xabarnomalar o'qilgan deb belgilandi",
      updated: updatedCount,
      readAt,
    });
  } catch (markAllError) {
    console.error("Mark all notifications read error:", markAllError);
    return res.status(500).json({
      message: "Xatolik yuz berdi",
      error: markAllError.message,
    });
  }
};

// USER: Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await UserNotification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return res.json({ count });
  } catch (countError) {
    console.error("Get unread count error:", countError);
    return res.status(500).json({
      message: "Xatolik yuz berdi",
      error: countError.message,
    });
  }
};
