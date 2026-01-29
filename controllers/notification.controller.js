const { Notification } = require("../models");

// Userga tegishli barcha xabarlarni olish
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]], // Eng yangisi tepada
      limit: 20, // Faqat oxirgi 20 tasini olish
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Hamma xabarlarni o'qilgan deb belgilash
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    res.send({ message: "All marked as read" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
