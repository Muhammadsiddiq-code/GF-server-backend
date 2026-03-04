// models/clickTransaction.model.js
// CLICK SHOP API tranzaksiyalari uchun model
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

        // Bizning Transaction jadvalidagi yozuv (income/expense)
        transactionId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Transactions",
                key: "id",
            },
        },

        // CLICK tizimidagi tranzaksiya ID
        clickTransId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },

        // CLICK service_id
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        // Bizning buyurtma identifikatorimiz (telegramId yoki GAME_1_12345_team)
        merchantTransId: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // Prepare bosqichida qaytariladigan ID (= shu recordning id'si)
        merchantPrepareId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        // To'lov summasi (UZS, so'mda)
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        // CLICK sign_time
        signTime: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        // CLICK xatolik kodi (0 = muvaffaqiyatli)
        error: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        // Xatolik bayoni
        errorNote: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        // Holat: 0=Created, 1=Prepared, 2=Completed, -1=Cancelled
        state: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        // Qo'shimcha ma'lumotlar: { telegram_id, game_id, team }
        account: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
    });

    return ClickTransaction;
};
