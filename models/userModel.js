module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    // MUHIM: telegramId STRING bo'lishi shart, chunki katta sonlar sig'may qolishi mumkin
    telegramId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    walletCardNumber: {
      type: DataTypes.STRING,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    photo: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // --- REFERRAL TIZIMI ---
    invitedBy: {
      type: DataTypes.STRING, // Kim taklif qilgani (telegramId)
      defaultValue: null,
    },
    invitedCount: {
      type: DataTypes.INTEGER, // Nechta odam taklif qilgan
      defaultValue: 0,
    },
  }); const { query } = require("../src/db.js");

  User.findUserByTelegramId = async function (telegramId) {
    const { rows } = await query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );
    return rows[0] || null;
  };

  User.findAllUsers = async function ({ search, limit = 50, offset = 0 }) {
    const params = [];
    let where = "";
    if (search) {
      params.push(`%${search}%`);
      where = `
        WHERE username ILIKE $1
           OR first_name ILIKE $1
           OR last_name ILIKE $1
           OR telegram_id ILIKE $1
      `;
    }

    const { rows } = await query(
      `
        SELECT id, telegram_id, first_name, last_name, username, created_at
        FROM users
        ${where}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    const countRes = await query(
      `
        SELECT COUNT(*)::int AS count
        FROM users
        ${where}
      `,
      params
    );

    return {
      data: rows,
      total: countRes.rows[0]?.count || 0,
    };
  };

  return User;
};