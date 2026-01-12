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

// // Modellarni chaqirish (Endi xato bermaydi!)
// const User = require("./userModel")(sequelize, DataTypes);
// const Game = require("./gameModel")(sequelize, DataTypes);
// const UserGame = require("./UserGame")(sequelize, DataTypes);
// const Swiper = require("./swiper")(sequelize, DataTypes);

// // MUNOSABATLAR (RELATIONSHIPS)
// User.belongsToMany(Game, {
//   through: UserGame,
//   foreignKey: "userId",
//   otherKey: "gameId",
// });
// Game.belongsToMany(User, {
//   through: UserGame,
//   foreignKey: "gameId",
//   otherKey: "userId",
// });

// UserGame.belongsTo(Game, { foreignKey: "gameId" });
// Game.hasMany(UserGame, { foreignKey: "gameId" });

// UserGame.belongsTo(User, { foreignKey: "userId" });
// User.hasMany(UserGame, { foreignKey: "userId" });

// module.exports = {
//   sequelize,
//   Sequelize,
//   User,
//   Game,
//   UserGame,
//   Swiper,
// };















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

const db = {}; // Hamma modellarni shu ob'ektga yig'amiz

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Modellarni yuklash
db.User = require("./userModel")(sequelize, DataTypes);
db.Game = require("./gameModel")(sequelize, DataTypes);
db.UserGame = require("./UserGame")(sequelize, DataTypes);
db.Swiper = require("./swiper")(sequelize, DataTypes);

// MUNOSABATLAR (RELATIONSHIPS)
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

db.UserGame.belongsTo(db.Game, { foreignKey: "gameId" });
db.Game.hasMany(db.UserGame, { foreignKey: "gameId" });

db.UserGame.belongsTo(db.User, { foreignKey: "userId" });
db.User.hasMany(db.UserGame, { foreignKey: "userId" });

module.exports = db; // Butun boshli 'db' ob'ektini eksport qilamiz