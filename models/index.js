// require("dotenv").config();
// const { Sequelize, DataTypes } = require("sequelize");

// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: "postgres",
//   logging: false,
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     },
//   },
// });

// const db = {};

// db.Sequelize = Sequelize;
// db.sequelize = sequelize;

// // --- MODELLARNI YUKLASH ---
// db.User = require("./userModel")(sequelize, DataTypes); // Fayl nomi to'g'riligini tekshiring (user.model.js bo'lsa shuni yozing)
// db.Game = require("./gameModel")(sequelize, DataTypes); // game.model.js bo'lishi mumkin
// db.UserGame = require("./UserGame")(sequelize, DataTypes); // userGame.model.js bo'lishi mumkin
// db.Swiper = require("./swiper")(sequelize, DataTypes);
// db.Transaction = require("./transaction.model")(sequelize, DataTypes); // <-- YANGI MODEL QO'SHILDI

// // --- MUNOSABATLAR (RELATIONSHIPS) ---

// // User va Game (Many-to-Many)
// db.User.belongsToMany(db.Game, {
//   through: db.UserGame,
//   foreignKey: "userId",
//   otherKey: "gameId",
// });
// db.Game.belongsToMany(db.User, {
//   through: db.UserGame,
//   foreignKey: "gameId",
//   otherKey: "userId",
// });

// db.UserGame.belongsTo(db.Game, { foreignKey: "gameId" });
// db.Game.hasMany(db.UserGame, { foreignKey: "gameId" });

// db.UserGame.belongsTo(db.User, { foreignKey: "userId" });
// db.User.hasMany(db.UserGame, { foreignKey: "userId" });

// // --- YANGI: TRANSACTION MUNOSABATI ---
// db.User.hasMany(db.Transaction, { foreignKey: "userId" });
// db.Transaction.belongsTo(db.User, { foreignKey: "userId" });

// module.exports = db;










const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
require("dotenv").config();

let sequelize;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isProduction = process.env.NODE_ENV === "production";

if (hasDatabaseUrl) {
  // Use PostgreSQL whenever DATABASE_URL is present to avoid accidental SQLite fallback on servers.
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
  });
  console.log("Database: PostgreSQL (DATABASE_URL)");
} else if (isProduction) {
  throw new Error("DATABASE_URL is required in production. Refusing to start with SQLite fallback.");
} else {
  // Local development fallback
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database.sqlite"),
    logging: false,
  });
  console.log("Database: SQLite (local development)");
}


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- MODELLARNI YUKLASH ---
db.User = require("./userModel")(sequelize, DataTypes);
db.Game = require("./gameModel")(sequelize, DataTypes);
db.UserGame = require("./UserGame")(sequelize, DataTypes);
db.Swiper = require("./swiper")(sequelize, DataTypes);
db.Transaction = require("./transaction.model")(sequelize, DataTypes);
const PaymeTransactionModel = require("./paymeTransaction.model");
db.PaymeTransaction = PaymeTransactionModel(sequelize, DataTypes);

// Core models
db.Admin = require("./admin.model.js")(sequelize, Sequelize);
db.Referral = require("./referral.model")(sequelize, DataTypes);
db.Setting = require("./setting.model")(sequelize, DataTypes);
db.ClickTransaction = require("./clickTransaction.model")(sequelize, DataTypes);

// Notifications
db.Notification = require("./notification.model")(sequelize, DataTypes);
db.UserNotification = require("./userNotification.model")(sequelize, DataTypes);

// --- MUNOSABATLAR (RELATIONSHIPS) ---

// 1. User va Game (Many-to-Many)
db.User.belongsToMany(db.Game, {
  through: db.UserGame,
  foreignKey: "userId",
  otherKey: "gameId",
  onDelete: "CASCADE", // User o'chsa, o'yinga yozilgani ham o'chadi
});
db.Game.belongsToMany(db.User, {
  through: db.UserGame,
  foreignKey: "gameId",
  otherKey: "userId",
  onDelete: "CASCADE",
});

db.UserGame.belongsTo(db.Game, { foreignKey: "gameId" });
db.Game.hasMany(db.UserGame, { foreignKey: "gameId" });

db.UserGame.belongsTo(db.User, { foreignKey: "userId" });
db.User.hasMany(db.UserGame, { foreignKey: "userId" });

// 2. Transaction (One-to-Many)
// MUHIM: onDelete: 'CASCADE' qo'shildi. User o'chsa, tarixi ham o'chadi (xato bermasligi uchun)
db.User.hasMany(db.Transaction, {
  foreignKey: "userId",
  as: "transactions",
  onDelete: "CASCADE",
});
db.Transaction.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});

// 3. Referral (One-to-Many)
db.User.hasMany(db.Referral, {
  foreignKey: "referrerUserId",
  as: "referralsMade",
  onDelete: "CASCADE",
});
db.User.hasMany(db.Referral, {
  foreignKey: "referredUserId",
  as: "referralsReceived",
  onDelete: "CASCADE",
});
db.Referral.belongsTo(db.User, {
  foreignKey: "referrerUserId",
  as: "referrer",
});
db.Referral.belongsTo(db.User, {
  foreignKey: "referredUserId",
  as: "referred",
});

// 4. ClickTransaction (One-to-Many)
db.User.hasMany(db.ClickTransaction, {
  foreignKey: "userId",
  as: "clickTransactions",
  onDelete: "CASCADE",
});
db.ClickTransaction.belongsTo(db.User, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

// 5. Notifications (One-to-Many + Join Table)
db.Notification.hasMany(db.UserNotification, {
  foreignKey: "notificationId",
  as: "userNotifications",
  onDelete: "CASCADE",
});
db.UserNotification.belongsTo(db.Notification, {
  foreignKey: "notificationId",
  as: "notification",
});

db.User.hasMany(db.UserNotification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
});
db.UserNotification.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = db;



