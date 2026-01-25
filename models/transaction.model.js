module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.FLOAT, // Yoki DECIMAL(10, 2)
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"), // income = kirim, expense = chiqim
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    paymentMethod: {
      type: DataTypes.ENUM("telegram_payment", "wallet", "cash"),
      defaultValue: "telegram_payment",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "completed",
    },
  });

  return Transaction;
};
