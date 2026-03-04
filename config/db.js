require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require("path");

let sequelize;

if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  // ✅ Production: PostgreSQL (Railway/Render)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "production" ? false : console.log,

    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      keepAlive: true,
      keepAliveInitialDelayMs: 10000,
    },

    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /Connection terminated unexpectedly/,
      ],
    },

    query: {
      timeout: 30000,
    },
  });
  console.log("🔗 Config DB: PostgreSQL (production)");
} else {
  // ✅ Local development: SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database.sqlite"),
    logging: console.log,
  });
  console.log("🔗 Config DB: SQLite (local development)");
}

// ✅ CONNECTION TEST
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful!");
  })
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
  });

module.exports = sequelize;
