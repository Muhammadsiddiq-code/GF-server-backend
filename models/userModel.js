// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const User = sequelize.define("User", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   telegramId: {
//     type: DataTypes.BIGINT,
//     unique: true, // Takrorlanmasligi uchun
//     allowNull: false,
//   },
//   firstName: DataTypes.STRING,
//   lastName: DataTypes.STRING,
//   username: DataTypes.STRING,
//   role: {
//     type: DataTypes.STRING,
//     defaultValue: "player",
//   },
// });

// module.exports = User;












// models/user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", { // "users" - jadval nomi
    telegramId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    username: {
      type: DataTypes.STRING
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 500
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "player"
    }
  });

  return User;
};