module.exports = (sequelize, DataTypes) => {
  const UserNotification = sequelize.define(
    "UserNotification",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      notificationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "user_notifications",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
      indexes: [
        {
          name: "idx_user_notifications_user_isRead",
          fields: ["userId", "isRead"],
        },
        {
          name: "idx_user_notifications_notification",
          fields: ["notificationId"],
        },
      ],
    }
  );

  return UserNotification;
};

