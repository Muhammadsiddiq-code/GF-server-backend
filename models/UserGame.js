// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db"); // database config yo'lini tekshiring

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
//     type: DataTypes.ENUM("A", "B"),
//     defaultValue: "A",
//   },
// });

// module.exports = UserGame;











module.exports = (sequelize, DataTypes) => {
  const UserGame = sequelize.define("UserGame", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" }, // Users jadvalidagi DB ID ga bog'lanadi
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "games", key: "id" },
    },
    team: { type: DataTypes.ENUM("A", "B"), defaultValue: "A" },
    status: { type: DataTypes.STRING, defaultValue: "pending" },
    paymentAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  });
  return UserGame;
};