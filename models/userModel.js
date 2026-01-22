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
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    telegramId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    username: { type: DataTypes.STRING },

    // --- YANGI QO'SHILGAN ---
    photo: {
      type: DataTypes.STRING, // Rasm URL manzili
      defaultValue: null,
    },
    // ------------------------

    phone: { type: DataTypes.STRING, defaultValue: "" },
    city: { type: DataTypes.STRING, defaultValue: "-" },
    position: { type: DataTypes.STRING, defaultValue: "Mid" },
    xp: { type: DataTypes.INTEGER, defaultValue: 500 },
    role: { type: DataTypes.STRING, defaultValue: "player" },
  });

  return User;
};