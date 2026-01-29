// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db"); // database config yo'lini tekshiring

// const UserGame = sequelize.define("UserGame", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   userId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   gameId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   team: {
//     type: DataTypes.ENUM("A", "B"),
//     defaultValue: "A",
//   },
// });

// module.exports = UserGame;

module.exports = (sequelize, DataTypes) => {
  const UserGame = sequelize.define("UserGame", {
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
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    team: {
      type: DataTypes.STRING,
      defaultValue: "A",
    },

    // To'lov holati: pending (kutilmoqda), advance_paid (30% to'langan), fully_paid (to'liq to'langan)
    paymentStatus: {
      type: DataTypes.ENUM("pending", "advance_paid", "fully_paid"),
      defaultValue: "pending",
    },

    totalPrice: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    advancePaid: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    remainingAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    remainingDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return UserGame;
};
