// module.exports = (sequelize, DataTypes) => {
//   const User = sequelize.define("users", {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//       allowNull: false,
//     },
//     telegramId: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     firstName: { type: DataTypes.STRING },
//     lastName: { type: DataTypes.STRING },
//     username: { type: DataTypes.STRING },
//     photo: { type: DataTypes.TEXT },

//     // --- YANGI QO'SHILGAN ---
//     invitedBy: {
//       type: DataTypes.STRING, // Kim taklif qilgani (ID si)
//       defaultValue: null,
//     },
//     // ------------------------

//     phone: { type: DataTypes.STRING, defaultValue: "" },
//     city: { type: DataTypes.STRING, defaultValue: "-" },
//     position: { type: DataTypes.STRING, defaultValue: "Mid" },
//     xp: { type: DataTypes.INTEGER, defaultValue: 500 },
//     role: { type: DataTypes.STRING, defaultValue: "player" },
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
    photo: { type: DataTypes.TEXT },

    // --- REFERRAL ---
    invitedBy: {
      type: DataTypes.STRING,
      defaultValue: null,
    },

    // --- PROFILE ---
    phone: { type: DataTypes.STRING, defaultValue: "" },
    city: { type: DataTypes.STRING, defaultValue: "-" },
    position: { type: DataTypes.STRING, defaultValue: "Mid" },
    xp: { type: DataTypes.INTEGER, defaultValue: 500 },
    role: { type: DataTypes.STRING, defaultValue: "player" },

    // --- YANGI: KASHALOK (HAMYON) ---
    balance: {
      type: DataTypes.FLOAT, // Pul o'nlik bo'lishi mumkin
      defaultValue: 0,
    },
    walletCardNumber: {
      type: DataTypes.STRING,
      unique: true, // Har bir userda unikal bo'lishi shart
      allowNull: true,
    },
    // ---------------------------------
  });

  return User;
};