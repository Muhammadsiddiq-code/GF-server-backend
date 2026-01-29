module.exports = (sequelize, DataTypes) => {
  const ClickTransaction = sequelize.define("ClickTransaction", {
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

    // CLICK transaction identifikatorlari
    clickTransId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    merchantTransId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    merchantPrepareId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // State: 1=Pending, 2=Paid, -1=PendingCanceled, -2=PaidCanceled
    state: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    // Action: 0=prepare, 1=complete
    action: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // Xatolik
    error: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    errorNote: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Imzo
    signTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    signToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Vaqtlar
    prepareTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completeTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return ClickTransaction;
};
