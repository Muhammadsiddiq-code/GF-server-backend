module.exports = (sequelize, DataTypes) => {
  const Swiper = sequelize.define("Swiper", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    img: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Swiper;
};
