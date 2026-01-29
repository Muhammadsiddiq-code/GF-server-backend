// const { Sequelize, DataTypes } = require("sequelize");
// require("dotenv").config();

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
// db.User = require("./userModel")(sequelize, DataTypes);
// db.Game = require("./gameModel")(sequelize, DataTypes);
// db.UserGame = require("./UserGame")(sequelize, DataTypes);
// db.Swiper = require("./swiper")(sequelize, DataTypes);
// db.Transaction = require("./transaction.model")(sequelize, DataTypes);

// // Modellarni ulash
// db.Admin = require("./admin.model.js")(sequelize, Sequelize);
// // Agar service.model.js bo'lsa uni ham qo'shing, bo'lmasa shart emas

// // --- MUNOSABATLAR (RELATIONSHIPS) ---

// // 1. User va Game (Many-to-Many)
// db.User.belongsToMany(db.Game, {
//   through: db.UserGame,
//   foreignKey: "userId",
//   otherKey: "gameId",
//   onDelete: "CASCADE", // User o'chsa, o'yinga yozilgani ham o'chadi
// });
// db.Game.belongsToMany(db.User, {
//   through: db.UserGame,
//   foreignKey: "gameId",
//   otherKey: "userId",
//   onDelete: "CASCADE",
// });

// db.UserGame.belongsTo(db.Game, { foreignKey: "gameId" });
// db.Game.hasMany(db.UserGame, { foreignKey: "gameId" });

// db.UserGame.belongsTo(db.User, { foreignKey: "userId" });
// db.User.hasMany(db.UserGame, { foreignKey: "userId" });

// // 2. Transaction (One-to-Many)
// // MUHIM: onDelete: 'CASCADE' qo'shildi. User o'chsa, tarixi ham o'chadi (xato bermasligi uchun)
// db.User.hasMany(db.Transaction, {
//   foreignKey: "userId",
//   as: "transactions",
//   onDelete: "CASCADE",
// });
// db.Transaction.belongsTo(db.User, {
//   foreignKey: "userId",
//   as: "user",
//   onDelete: "CASCADE",
// });

// module.exports = db;

































const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- MODELLARNI YUKLASH ---
db.User = require("./userModel")(sequelize, DataTypes);
db.Game = require("./gameModel")(sequelize, DataTypes);
db.UserGame = require("./UserGame")(sequelize, DataTypes);
db.Swiper = require("./swiper")(sequelize, DataTypes);
db.Transaction = require("./transaction.model")(sequelize, DataTypes);
db.Admin = require("./admin.model.js")(sequelize, Sequelize);
// ✅ YANGI: Notification modeli
db.Notification = require("./notification.model")(sequelize, DataTypes);

// --- MUNOSABATLAR (RELATIONSHIPS) ---

// 1. User va Game (Many-to-Many)
db.User.belongsToMany(db.Game, {
  through: db.UserGame,
  foreignKey: "userId",
  otherKey: "gameId",
  onDelete: "CASCADE",
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

// ✅ 3. Notification (One-to-Many)
// Bir Userda ko'plab Notification bo'lishi mumkin
db.User.hasMany(db.Notification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
});
db.Notification.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = db;