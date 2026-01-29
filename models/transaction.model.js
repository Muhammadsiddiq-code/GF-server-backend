module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },

    // To'lov holati: pending, approved, declined
    status: {
      type: DataTypes.ENUM("pending", "approved", "declined"),
      defaultValue: "pending",
    },

    // To'lov turi: payme, click, admin, bonus, cash
    paymentType: {
      type: DataTypes.ENUM("payme", "click"),
      defaultValue: "payme",
    },

    // Telegram message ID (agar kerak bo'lsa)
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // CLICK uchun
    clickTransId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchantTransId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchantPrepareId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // PAYME uchun
    paymeTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymeTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Transaction;
};
