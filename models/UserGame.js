// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const UserGame = sequelize.define("UserGame", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   userId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   gameId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   team: {
//     type: DataTypes.ENUM("A", "B"), // Qaysi jamoada o'ynagani
//     defaultValue: "A",
//   },
//   status: {
//     type: DataTypes.STRING, // 'paid', 'cancelled'
//     defaultValue: "paid",
//   },
// });

// module.exports = UserGame;









const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // database config yo'lini tekshiring

const UserGame = sequelize.define("UserGame", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  team: {
    type: DataTypes.ENUM("A", "B"),
    defaultValue: "A",
  },
});

module.exports = UserGame;