const { query } = require("../src/db.js");

async function createNotification({ title, message, type, isGlobal, createdByAdminId }) {
  const { rows } = await query(
    `
    INSERT INTO notifications (title, message, type, is_global, created_by_admin_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [title, message, type, isGlobal, createdByAdminId || null]
  );
  return rows[0];
}

async function createUserNotification({ userId, notificationId }) {
  const { rows } = await query(
    `
    INSERT INTO user_notifications (user_id, notification_id)
    VALUES ($1, $2)
    RETURNING *
    `,
    [userId, notificationId]
  );
  return rows[0];
}

async function createUserNotificationsForAllUsers(notificationId) {
  const { rows } = await query(
    `
    INSERT INTO user_notifications (user_id, notification_id)
    SELECT id, $1
    FROM users
    RETURNING *
    `,
    [notificationId]
  );
  return rows;
}

async function getUserNotificationsPaginated({ userId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `
    SELECT
      un.id,
      un.notification_id,
      n.title,
      n.message,
      n.type,
      un.is_read,
      un.read_at,
      n.created_at
    FROM user_notifications un
    JOIN notifications n ON n.id = un.notification_id
    WHERE un.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  const countRes = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM user_notifications
    WHERE user_id = $1
    `,
    [userId]
  );
  const total = countRes.rows[0]?.count || 0;

  return {
    data: rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getUnreadCountForUser(userId) {
  const { rows } = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM user_notifications
    WHERE user_id = $1 AND is_read = false
    `,
    [userId]
  );
  return rows[0]?.count || 0;
}

async function markNotificationReadForUser({ userId, notificationId }) {
  const { rows } = await query(
    `
    UPDATE user_notifications
    SET is_read = true,
        read_at = COALESCE(read_at, now())
    WHERE user_id = $1 AND notification_id = $2
    RETURNING *
    `,
    [userId, notificationId]
  );
  return rows[0] || null;
}

async function markAllNotificationsReadForUser(userId) {
  const { rows } = await query(
    `
    UPDATE user_notifications
    SET is_read = true,
        read_at = COALESCE(read_at, now())
    WHERE user_id = $1 AND is_read = false
    RETURNING now() AS read_at
    `,
    [userId]
  );
  return rows[0] || null;
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