const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegramId: {
    type: DataTypes.BIGINT,
    unique: true, // Takrorlanmasligi uchun
    allowNull: false,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  username: DataTypes.STRING,
  role: {
    type: DataTypes.STRING,
    defaultValue: "player",
  },
});

module.exports = User;
