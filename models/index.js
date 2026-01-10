const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const Swiper = require("./swiper")(sequelize, Sequelize.DataTypes)

module.exports = {
  sequelize,
  Sequelize,
  Swiper
};
