module.exports = (sequelize, DataTypes) => {
  const PaymeTransaction = sequelize.define("PaymeTransaction", {
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
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Transactions",
        key: "id",
      },
    },

    // PAYME transaction identifikatorlari
    paymeTransactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    paymeTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // State: 1=Created, 2=Completed, -1=Cancelled, -2=CancelledAfterComplete
    state: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    // Bekor qilish sababi
    reason: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Vaqtlar (Unix timestamp millisekundlarda)
    createTime: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    performTime: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    cancelTime: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    // Account ma'lumotlari (order_id va boshqalar)
    account: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  return PaymeTransaction;
};
