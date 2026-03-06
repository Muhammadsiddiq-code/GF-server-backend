const { Pool } = require("pg");

const createPool = () => {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.PGSSL === "false"
          ? false
          : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "false" ? false : true },
    });
  }

  return new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "gff",
  });
};

const pool = createPool();

pool.on("error", (err) => {
  // In production you would ship this to your logger/alerts
  console.error("Unexpected PostgreSQL client error", err);
});

const query = (text, params) => {
  return pool.query(text, params);
};

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const initDb = async () => {
  // Minimal schema required for notifications feature.
  // This is idempotent and safe to run on every startup.
  await query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id BIGSERIAL PRIMARY KEY,
      telegram_id TEXT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      title TEXT,
      message TEXT NOT NULL,
      type VARCHAR(32) NOT NULL DEFAULT 'info',
      is_global BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, notification_id)
    );
  `);
};

module.exports = {
  query,
  withTransaction,
  initDb,
};

