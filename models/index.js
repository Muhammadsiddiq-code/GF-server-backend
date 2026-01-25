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
// Agar service.model.js bo'lsa uni ham qo'shing, bo'lmasa shart emas

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

module.exports = db;