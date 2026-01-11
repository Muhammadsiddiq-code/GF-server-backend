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

if (!databaseUrl) {
  console.error("❌ XATOLIK: DATABASE_URL topilmadi! .env faylini tekshiring.");
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

/**
 * 2. Modellarni import qilish
 * Senda modellaring Class ko'rinishida bo'lgani uchun ularni shunchaki require qilamiz
 */
const User = require("./userModel");
const Game = require("./gameModel");
const UserGame = require("./UserGame");
const Swiper = require("./swiper");

/**
 * 3. MUNOSABATLAR (RELATIONSHIPS)
 */

// User <-> Game (Many-to-Many)
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

// History (Tarix) so'rovlari uchun
UserGame.belongsTo(Game, { foreignKey: "gameId" });
Game.hasMany(UserGame, { foreignKey: "gameId" });

UserGame.belongsTo(User, { foreignKey: "userId" });
User.hasMany(UserGame, { foreignKey: "userId" });

/**
 * 4. Eksport qilish
 */
module.exports = {
  sequelize,
  Sequelize,
  User,
  Game,
  UserGame,
  Swiper,
};