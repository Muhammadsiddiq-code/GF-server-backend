module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: {
            args: [3, 5000],
            msg: "Notification message must be between 3 and 5000 characters",
          },
        },
      },
      type: {
        type: DataTypes.ENUM("info", "success", "warning", "error"),
        allowNull: false,
        defaultValue: "info",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Admin ID who created the notification",
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
      indexes: [
        {
          name: "idx_notifications_createdAt",
          fields: ["createdAt"],
        },
      ],
    }
  );

  return Notification;
};
