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

// const db = {}; // Hamma modellarni shu ob'ektga yig'amiz

// db.Sequelize = Sequelize;
// db.sequelize = sequelize;

// // Modellarni yuklash
// db.User = require("./userModel")(sequelize, DataTypes);
// db.Game = require("./gameModel")(sequelize, DataTypes);
// db.UserGame = require("./UserGame")(sequelize, DataTypes);
// db.Swiper = require("./swiper")(sequelize, DataTypes);

// // MUNOSABATLAR (RELATIONSHIPS)
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

// module.exports = db; // Butun boshli 'db' ob'ektini eksport qilamiz















require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

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
db.Transaction = require("./transaction.model")(sequelize, DataTypes); // <-- YANGI: Transaction qo'shildi

// --- MUNOSABATLAR (RELATIONSHIPS) ---

// User va Game (Many-to-Many)
db.User.belongsToMany(db.Game, {
  through: db.UserGame,
  foreignKey: "userId",
  otherKey: "gameId",
});
db.Game.belongsToMany(db.User, {
  through: db.UserGame,
  foreignKey: "gameId",
  otherKey: "userId",
});

// UserGame bog'lanishlari
db.UserGame.belongsTo(db.Game, { foreignKey: "gameId" });
db.Game.hasMany(db.UserGame, { foreignKey: "gameId" });

db.UserGame.belongsTo(db.User, { foreignKey: "userId" });
db.User.hasMany(db.UserGame, { foreignKey: "userId" });

// Transaction bog'lanishlari (YANGI)
db.User.hasMany(db.Transaction, { foreignKey: "userId" });
db.Transaction.belongsTo(db.User, { foreignKey: "userId" });

module.exports = db;