"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("info", "success", "warning", "error"),
        allowNull: false,
        defaultValue: "info",
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("notifications", ["createdAt"], {
      name: "idx_notifications_createdAt",
    });

    await queryInterface.createTable("user_notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      notificationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("user_notifications", ["userId", "isRead"], {
      name: "idx_user_notifications_user_isRead",
    });
    await queryInterface.addIndex("user_notifications", ["notificationId"], {
      name: "idx_user_notifications_notification",
    });
    await queryInterface.addIndex("user_notifications", ["userId", "notificationId"], {
      unique: true,
      name: "uq_user_notifications_user_notification",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_notifications");
    await queryInterface.dropTable("notifications");
  },
};
