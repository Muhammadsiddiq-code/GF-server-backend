module.exports = (sequelize, DataTypes) => {
    const Referral = sequelize.define("Referral", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        referrerUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        referredUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true, // Har bir user faqat 1 marta referred bo'lishi mumkin
        },
        referralCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        xpAwardedToReferrer: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        xpAwardedToReferred: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "completed", // 'completed' | 'revoked'
        },
    });

    return Referral;
};
