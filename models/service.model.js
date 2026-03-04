module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define("Service", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    icon: {
        type: DataTypes.STRING, // Masalan: rasm URL yoki icon nomi
    },
  });
  return Service;
};
