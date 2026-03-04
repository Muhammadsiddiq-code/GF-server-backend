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
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users", // Bazadagi jadval nomi (odatda ko'plikda bo'ladi)
        key: "id",
      },
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    team: {
      type: DataTypes.STRING,
      defaultValue: "A",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "signed_up", // yoki 'paid'
    },
    paymentAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  });

  return UserGame;
};