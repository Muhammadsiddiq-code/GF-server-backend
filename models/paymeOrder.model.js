module.exports = (sequelize, DataTypes) => {
  const PaymeOrder = sequelize.define("PaymeOrder", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    telegramId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gameId: {
      type: DataTypes.STRING,
      defaultValue: "0",
    },
    team: {
      type: DataTypes.STRING,
      defaultValue: "NA",
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  });

  return PaymeOrder;
};
