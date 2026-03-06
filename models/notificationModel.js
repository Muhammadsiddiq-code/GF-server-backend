const db = require("./index.js");

async function createNotification({ title, message, type, isGlobal, createdByAdminId }) {
  const notification = await db.Notification.create({
    title,
    message,
    type,
    createdBy: createdByAdminId || null
  });

  const data = notification.toJSON();
  data.created_at = data.createdAt;
  // We attach isGlobal here even if it's not saved to the DB by Sequelize
  // to return a consistent object for routes.
  data.is_global = isGlobal;
  return data;
}

async function createUserNotification({ userId, notificationId }) {
  const userNotification = await db.UserNotification.create({
    userId,
    notificationId
  });
  return userNotification.toJSON();
}

async function createUserNotificationsForAllUsers(notificationId) {
  const users = await db.User.findAll({ attributes: ['id'] });
  const records = users.map(u => ({
    userId: u.id,
    notificationId
  }));
  const userNotifications = await db.UserNotification.bulkCreate(records);
  return userNotifications.map(un => un.toJSON());
}

async function getUserNotificationsPaginated({ userId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const { count, rows } = await db.UserNotification.findAndCountAll({
    where: { userId },
    include: [{
      model: db.Notification,
      as: 'notification',
      attributes: ['title', 'message', 'type', 'createdAt']
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const data = rows.map(row => ({
    id: row.id,
    notification_id: row.notificationId,
    title: row.notification.title,
    message: row.notification.message,
    type: row.notification.type,
    is_read: row.isRead,
    read_at: row.readAt,
    created_at: row.notification.createdAt
  }));

  return {
    data,
    total: count,
    page,
    totalPages: Math.max(1, Math.ceil(count / limit)),
  };
}

async function getUnreadCountForUser(userId) {
  const count = await db.UserNotification.count({
    where: { userId, isRead: false }
  });
  return count;
}

async function markNotificationReadForUser({ userId, notificationId }) {
  const userNotification = await db.UserNotification.findOne({
    where: { userId, notificationId }
  });

  if (!userNotification) return null;

  userNotification.isRead = true;
  userNotification.readAt = userNotification.readAt || new Date();
  await userNotification.save();

  const data = userNotification.toJSON();
  data.notification_id = data.notificationId;
  data.is_read = data.isRead;
  data.read_at = data.readAt;
  return data;
}

async function markAllNotificationsReadForUser(userId) {
  const now = new Date();
  await db.UserNotification.update({
    isRead: true,
    readAt: now
  }, {
    where: { userId, isRead: false }
  });

  return { read_at: now };
}

module.exports = {
  createNotification,
  createUserNotification,
  createUserNotificationsForAllUsers,
  getUserNotificationsPaginated,
  getUnreadCountForUser,
  markNotificationReadForUser,
  markAllNotificationsReadForUser
};