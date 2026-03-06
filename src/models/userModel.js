const { query } = require("../db");

const mapUserRow = (row) => ({
  id: row.id,
  telegramId: row.telegram_id,
  username: row.username,
  firstName: row.first_name,
  lastName: row.last_name,
  createdAt: row.created_at,
});

const findByTelegramId = async (telegramId) => {
  const res = await query(
    `
      SELECT id, telegram_id, username, first_name, last_name, created_at
      FROM app_users
      WHERE telegram_id = $1
    `,
    [String(telegramId)]
  );
  return res.rows[0] ? mapUserRow(res.rows[0]) : null;
};

const upsertUserByTelegram = async ({ telegramId, username, firstName, lastName }) => {
  const res = await query(
    `
      INSERT INTO app_users (telegram_id, username, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        username = COALESCE(EXCLUDED.username, app_users.username),
        first_name = COALESCE(EXCLUDED.first_name, app_users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, app_users.last_name)
      RETURNING id, telegram_id, username, first_name, last_name, created_at
    `,
    [String(telegramId), username || null, firstName || null, lastName || null]
  );

  return mapUserRow(res.rows[0]);
};

const listUsers = async ({ page = 1, limit = 20, search = "" }) => {
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit =
    Number.isFinite(Number(limit)) && Number(limit) > 0 && Number(limit) <= 100
      ? Number(limit)
      : 20;
  const offset = (safePage - 1) * safeLimit;

  const values = [];
  let whereSql = "";
  if (search && search.trim()) {
    values.push(`%${search.trim().toLowerCase()}%`);
    whereSql = `
      WHERE
        LOWER(username) LIKE $1
        OR LOWER(first_name) LIKE $1
        OR LOWER(last_name) LIKE $1
        OR telegram_id LIKE $1
    `;
  }

  const countSql = `
    SELECT COUNT(*)::BIGINT AS total
    FROM app_users
    ${whereSql}
  `;
  const countRes = await query(countSql, values);
  const total = Number(countRes.rows[0]?.total || 0);

  const dataSql = `
    SELECT id, telegram_id, username, first_name, last_name, created_at
    FROM app_users
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  const dataRes = await query(dataSql, [...values, safeLimit, offset]);

  const rows = dataRes.rows.map(mapUserRow);
  const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);
  const hasMore = safePage < totalPages;

  return {
    data: rows,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasMore,
  };
};

module.exports = {
  findByTelegramId,
  upsertUserByTelegram,
  listUsers,
};

