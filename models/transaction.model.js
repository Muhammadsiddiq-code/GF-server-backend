// module.exports = (sequelize, DataTypes) => {
//   const Transaction = sequelize.define("Transaction", {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     userId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "Users",
//         key: "id",
//       },
//     },
//     amount: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//     },
//     type: {
//       type: DataTypes.ENUM("income", "expense"),
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.STRING,
//     },

//     // To'lov holati: pending, approved, declined
//     status: {
//       type: DataTypes.ENUM("pending", "approved", "declined"),
//       defaultValue: "pending",
//     },

//     // To'lov turi: payme, click, admin, bonus, cash
//     paymentType: {
//       type: DataTypes.ENUM("payme", "click"),
//       defaultValue: "payme",
//     },

//     // Telegram message ID (agar kerak bo'lsa)
//     messageId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     // CLICK uchun
//     clickTransId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     merchantTransId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     merchantPrepareId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     // PAYME uchun
//     paymeTransactionId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     paymeTime: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   });

//   return Transaction;
// };











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
    },

    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    // income | expense
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ❌ ENUM YO‘Q
    // ✅ STRING (Postgres bilan muammosiz)
    status: {
      type: DataTypes.STRING, // pending | approved | declined
      allowNull: false,
      defaultValue: "pending",
    },

    // ❌ ENUM YO‘Q
    // ✅ STRING
    paymentType: {
      type: DataTypes.STRING, // payme | click | wallet
      allowNull: true,
      defaultValue: "payme",
    },

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
