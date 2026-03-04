module.exports = (sequelize, DataTypes) => {
    const Setting = sequelize.define("Setting", {
        key: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            defaultValue: "",
        },
    });

    return Setting;
};
