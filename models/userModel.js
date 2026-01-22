// // models/user.model.js
// module.exports = (sequelize, DataTypes) => {
//   const User = sequelize.define("users", { // "users" - jadval nomi
//     telegramId: {
//       type: DataTypes.BIGINT,
//       allowNull: false,
//       unique: true
//     },
//     firstName: {
//       type: DataTypes.STRING
//     },
//     lastName: {
//       type: DataTypes.STRING
//     },
//     username: {
//       type: DataTypes.STRING
//     },
//     xp: {
//       type: DataTypes.INTEGER,
//       defaultValue: 500
//     },
//     role: {
//       type: DataTypes.STRING,
//       defaultValue: "player"
//     }
//   });

//   return User;
// };










module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", {
    telegramId: {
      type: DataTypes.STRING, // BIGINT o'rniga STRING ishlatamiz (Xavfsizroq)
      allowNull: false,
      unique: true,
      primaryKey: true, // Qidirish tezroq bo'lishi uchun
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    username: {
      type: DataTypes.STRING,
    },
    // YANGI QO'SHILGAN MAYDONLAR:
    phone: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: "-",
    },
    position: {
      type: DataTypes.STRING,
      defaultValue: "Mid",
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "player",
    },
  });

  return User;
};