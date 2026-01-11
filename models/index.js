// const sequelize = require("../config/db");
// const Game = require("./gameModel");
// const User = require("./userModel");
// const UserGame = require("./UserGame");
// const Sequelize = require("sequelize");
// const Swiper = require("./swiper")(sequelize, Sequelize.DataTypes)

// // RELATIONSHIPS (Munosabatlar)
// // User ko'p o'yinlarda qatnashishi mumkin
// User.belongsToMany(Game, { through: UserGame, foreignKey: "userId" });
// Game.belongsToMany(User, { through: UserGame, foreignKey: "gameId" });

// // History so'rovlari uchun to'g'ridan-to'g'ri bog'lanish
// UserGame.belongsTo(Game, { foreignKey: "gameId" });
// Game.hasMany(UserGame, { foreignKey: "gameId" });

// UserGame.belongsTo(User, { foreignKey: "userId" });
// User.hasMany(UserGame, { foreignKey: "userId" });

// module.exports = {
//   sequelize,
//   Game,
//   User,
//   UserGame,
//   Swiper,
// };





require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Railway uchun bu juda muhim!
    },
  },
});

// Modellarni ishga tushirish (Shunday yozilishi shart)
const User = require("./userModel")(sequelize, DataTypes);
const Game = require("./gameModel")(sequelize, DataTypes);
const UserGame = require("./UserGame")(sequelize, DataTypes);
const Swiper = require("./swiper")(sequelize, DataTypes);

// MUNOSABATLAR
User.belongsToMany(Game, {
  through: UserGame,
  foreignKey: "userId",
  otherKey: "gameId",
});
Game.belongsToMany(User, {
  through: UserGame,
  foreignKey: "gameId",
  otherKey: "userId",
});

UserGame.belongsTo(Game, { foreignKey: "gameId" });
Game.hasMany(UserGame, { foreignKey: "gameId" });

UserGame.belongsTo(User, { foreignKey: "userId" });
User.hasMany(UserGame, { foreignKey: "userId" });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Game,
  UserGame,
  Swiper,
};