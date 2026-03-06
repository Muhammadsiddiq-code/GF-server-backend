const { query, withTransaction } = require("../db");
const { findByTelegramId, upsertUserByTelegram } = require("./userModel");

const NOTIFICATION_TYPES = new Set(["info", "success", "warning", "error"]);

const normalizeType = (type) => {
  const normalized = String(type || "info").toLowerCase();
  return NOTIFICATION_TYPES.has(normalized) ? normalized : "info";
};

const createNotification = async ({ title, message, type, isGlobal }) => {
  const res = await query(
    `
      INSERT INTO notifications (title, message, type, is_global)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, message, type, is_global, created_at
    `,
    [title || null, message, normalizeType(type), Boolean(isGlobal)]
  );
  return res.rows[0];
};

const createBroadcastNotification = async ({ title, message, type }, { io } = {}) => {
  return withTransaction(async (client) => {
    const notifRes = await client.query(
      `
        INSERT INTO notifications (title, message, type, is_global)
        VALUES ($1, $2, $3, TRUE)
        RETURNING id, title, message, type, is_global, created_at
      `,
      [title || null, message, normalizeType(type)]
    );
    const notification = notifRes.rows[0];

    // Materialize for all users
    const usersRes = await client.query(
      `
        SELECT id
        FROM app_users
      `
    );

    let recipientsCount = 0;
    if (usersRes.rows.length > 0) {
      const values = [];
      const placeholders = [];
      usersRes.rows.forEach((row, index) => {
        const base = index * 2;
        values.push(row.id, notification.id);
        placeholders.push(`($${base + 1}, $${base + 2})`);
      });

      await client.query(
        `
          INSERT INTO user_notifications (user_id, notification_id)
          VALUES ${placeholders.join(", ")}
          ON CONFLICT (user_id, notification_id) DO NOTHING
        `,
        values
      );
      recipientsCount = usersRes.rows.length;
    }

    if (io) {
      io.emit("notification:broadcast", {
        notificationId: notification.id,
        type: notification.type,
        isGlobal: true,
        createdAt: notification.created_at,
      });
    }

    return {
      notificationId: notification.id,
      recipientsCount,
    };
  });
};

const createPersonalNotification = async (
  { telegramId, username, firstName, lastName, title, message, type },
  { io } = {}
) => {
  if (!telegramId) {
    throw new Error("telegramId is required");
  }

  return withTransaction(async (client) => {
    // Ensure user exists
    const userRes = await client.query(
      `
        INSERT INTO app_users (telegram_id, username, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (telegram_id)
        DO UPDATE SET
          username = COALESCE(EXCLUDED.username, app_users.username),
          first_name = COALESCE(EXCLUDED.first_name, app_users.first_name),
          last_name = COALESCE(EXCLUDED.last_name, app_users.last_name)
        RETURNING id, telegram_id
      `,
      [String(telegramId), username || null, firstName || null, lastName || null]
    );
    const user = userRes.rows[0];

    const notifRes = await client.query(
      `
        INSERT INTO notifications (title, message, type, is_global)
        VALUES ($1, $2, $3, FALSE)
        RETURNING id, title, message, type, is_global, created_at
      `,
      [title || null, message, normalizeType(type)]
    );
    const notification = notifRes.rows[0];

    const userNotifRes = await client.query(
      `
        INSERT INTO user_notifications (user_id, notification_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, notification_id) DO NOTHING
        RETURNING id, user_id, notification_id, is_read, read_at, created_at
      `,
      [user.id, notification.id]
    );

    const userNotification =
      userNotifRes.rows[0] ||
      (
        await client.query(
          `
            SELECT id, user_id, notification_id, is_read, read_at, created_at
            FROM user_notifications
            WHERE user_id = $1 AND notification_id = $2
          `,
          [user.id, notification.id]
        )
      ).rows[0];

    if (io) {
      io.to(String(user.telegram_id)).emit("notification:broadcast", {
        notificationId: notification.id,
        type: notification.type,
        isGlobal: false,
        createdAt: notification.created_at,
      });
    }

    return {
      notificationId: notification.id,
      userNotificationId: userNotification.id,
      recipientTelegramId: user.telegram_id,
    };
  });
};

const listUserNotifications = async ({ telegramId, page = 1, limit = 20 }) => {
  if (!telegramId) {
    throw new Error("telegramId is required");
  }

  const user = await findByTelegramId(telegramId);
  if (!user) {
    return {
      data: [],
      page: 1,
      limit,
      total: 0,
      totalPages: 1,
      hasMore: false,
    };
  }

  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit =
    Number.isFinite(Number(limit)) && Number(limit) > 0 && Number(limit) <= 100
      ? Number(limit)
      : 20;
  const offset = (safePage - 1) * safeLimit;

  const countRes = await query(
    `
      SELECT COUNT(*)::BIGINT AS total
      FROM user_notifications un
      WHERE un.user_id = $1
    `,
    [user.id]
  );
  const total = Number(countRes.rows[0]?.total || 0);

  const dataRes = await query(
    `
      SELECT
        un.id,
        n.id AS notification_id,
        n.title,
        n.message,
        n.type,
        n.is_global,
        un.is_read,
        un.read_at,
        n.created_at
      FROM user_notifications un
      JOIN notifications n ON n.id = un.notification_id
      WHERE un.user_id = $1
      ORDER BY n.created_at DESC, un.id DESC
      LIMIT $2 OFFSET $3
    `,
    [user.id, safeLimit, offset]
  );

  const items = dataRes.rows.map((row) => ({
    id: row.notification_id,
    userNotificationId: row.id,
    title: row.title || "Xabarnoma",
    message: row.message,
    type: row.type || "info",
    isGlobal: row.is_global,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);
  const hasMore = safePage < totalPages;

  return {
    data: items,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasMore,
  };
};

const getUnreadCount = async ({ telegramId }) => {
  if (!telegramId) {
    throw new Error("telegramId is required");
  }
  const user = await findByTelegramId(telegramId);
  if (!user) return 0;

  const res = await query(
    `
      SELECT COUNT(*)::BIGINT AS cnt
      FROM user_notifications
      WHERE user_id = $1 AND is_read = FALSE
    `,
    [user.id]
  );
  return Number(res.rows[0]?.cnt || 0);
};

const markNotificationAsReadForUser = async ({ telegramId, notificationId }) => {
  if (!telegramId) {
    throw new Error("telegramId is required");
  }
  const user = await findByTelegramId(telegramId);
  if (!user) {
    throw new Error("User not found for telegramId");
  }

  const nowRes = await query("SELECT NOW() AS now");
  const now = nowRes.rows[0].now;

  const res = await query(
    `
      UPDATE user_notifications
      SET is_read = TRUE,
          read_at = COALESCE(read_at, $3)
      WHERE user_id = $1 AND notification_id = $2
      RETURNING id, user_id, notification_id, is_read, read_at, created_at
    `,
    [user.id, notificationId, now]
  );

  const unreadCount = await getUnreadCount({ telegramId });

  const row = res.rows[0];
  if (!row) {
    return {
      notification: null,
      unreadCount,
    };
  }

  return {
    notification: {
      id: row.notification_id,
      userNotificationId: row.id,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
    },
    unreadCount,
  };
};

const markAllAsReadForUser = async ({ telegramId }) => {
  if (!telegramId) {
    throw new Error("telegramId is required");
  }
  const user = await findByTelegramId(telegramId);
  if (!user) {
    return { readAt: null };
  }

  const nowRes = await query("SELECT NOW() AS now");
  const now = nowRes.rows[0].now;

  await query(
    `
      UPDATE user_notifications
      SET is_read = TRUE,
          read_at = COALESCE(read_at, $2)
      WHERE user_id = $1 AND is_read = FALSE
    `,
    [user.id, now]
  );

  return { readAt: now };
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  createBroadcastNotification,
  createPersonalNotification,
  listUserNotifications,
  getUnreadCount,
  markNotificationAsReadForUser,
  markAllAsReadForUser,
};

