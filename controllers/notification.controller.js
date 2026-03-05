const { Op } = require("sequelize");
const { Notification, UserNotification, User, sequelize } = require("../models");

const NOTIFICATION_TYPES = ["info", "success", "warning", "error"];

// ADMIN: Broadcast notification to all users
exports.broadcastNotification = async (req, res) => {
  const { title, message, type = "info" } = req.body || {};

  try {
    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Xabar matni kamida 3 ta belgidan iborat bo'lishi kerak" });
    }

    const normalizedType = NOTIFICATION_TYPES.includes(type) ? type : "info";
    const adminId = req.admin ? req.admin.id : null;

    let notification;
    let userIds = [];

    await sequelize.transaction(async (t) => {
      notification = await Notification.create(
        {
          title: title || null,
          message: message.trim(),
          type: normalizedType,
          createdBy: adminId,
        },
        { transaction: t }
      );

      const users = await User.findAll({
        attributes: ["id"],
        transaction: t,
      });

      userIds = users.map((u) => u.id);

      if (userIds.length === 0) {
        return;
      }

      const rows = userIds.map((userId) => ({
        userId,
        notificationId: notification.id,
        isRead: false,
      }));

      // Efficient bulk insert with batching for large user counts
      const BATCH_SIZE = 1000;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const slice = rows.slice(i, i + BATCH_SIZE);
        // validate: false for slightly faster inserts (we trust schema)
        // ignoreDuplicates: false because each broadcast is unique
        // transaction: t to keep in the same atomic operation
        // eslint-disable-next-line no-await-in-loop
        await UserNotification.bulkCreate(slice, {
          transaction: t,
          validate: false,
        });
      }
    });

    const io = req.app.get("io");
    if (io && notification && userIds.length > 0) {
      io.emit("notification:broadcast", {
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          isRead: false,
        },
      });
    }

    return res.status(201).json({
      notification,
      recipientsCount: userIds.length,
    });
  } catch (error) {
    console.error("Broadcast notification error:", error);
    return res.status(500).json({ message: "Broadcast xatosi", error: error.message });
  }
};

// USER: Get current user's notifications (paginated)
exports.getUserNotifications = async (req, res) => {
  try {
    const user = req.user;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const { rows, count } = await UserNotification.findAndCountAll({
      where: { userId: user.id },
      include: [
        {
          model: Notification,
          as: "notification",
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const data = rows.map((row) => ({
      id: row.id,
      notificationId: row.notificationId,
      title: row.notification.title,
      message: row.notification.message,
      type: row.notification.type,
      isRead: row.isRead,
      readAt: row.readAt,
      createdAt: row.createdAt,
    }));

    return res.json({
      data,
      page,
      limit,
      total: count,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Xabarnomalarni olishda xatolik", error: error.message });
  }
};

// USER: Mark single notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const user = req.user;
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ message: "notificationId talab qilinadi" });
    }

    const userNotification = await UserNotification.findOne({
      where: {
        userId: user.id,
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

    return res.json({
      message: "Xabarnoma o'qilgan deb belgilandi",
      notification: {
        id: userNotification.id,
        notificationId: userNotification.notificationId,
        isRead: userNotification.isRead,
        readAt: userNotification.readAt,
      },
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Xatolik yuz berdi", error: error.message });
  }
};

// USER: Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const user = req.user;

    const [updatedCount] = await UserNotification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          userId: user.id,
          isRead: false,
        },
      }
    );

    return res.json({
      message: "Barcha xabarnomalar o'qilgan deb belgilandi",
      updated: updatedCount,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Xatolik yuz berdi", error: error.message });
  }
};

// USER: Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;

    const count = await UserNotification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({ message: "Xatolik yuz berdi", error: error.message });
  }
};

