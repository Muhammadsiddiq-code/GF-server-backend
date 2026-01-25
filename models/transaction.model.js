module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("transactions", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING, // 'income' (kirim) yoki 'expense' (chiqim)
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING, // Masalan: "O'yin uchun to'lov" yoki "Hisob to'ldirish"
    },
    paymentMethod: {
      type: DataTypes.STRING, // 'payme', 'click', 'wallet'
    },
  });

  return Transaction;
};
