const { User } = require("../models"); // User modelini chaqiramiz
const { v4: uuidv4 } = require("uuid");

exports.login = async (req, res) => {
  try {
    const { telegramId, firstName, username, photo_url } = req.body;

    // 1. Telegram ID kelganini tekshirish
    if (!telegramId) {
      return res.status(400).json({ msg: "Telegram ID talab qilinadi!" });
    }

    // 2. Bazadan userni qidirish
    let user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });

    // 3. Agar user yo'q bo'lsa, yangi yaratish
    if (!user) {
      // Yangi karta raqami generatsiya qilish
      const newCardNumber =
        "GF-" +
        uuidv4().split("-")[0].toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);

      user = await User.create({
        telegramId: String(telegramId),
        firstName: firstName || "Noma'lum",
        username: username || "",
        balance: 0,
        xp: 0,
        walletCardNumber: newCardNumber,
        photo: photo_url || null,
      });
      console.log("Yangi foydalanuvchi yaratildi:", user.firstName);
    } else {
      // Agar user bor bo'lsa, ma'lumotlarini yangilash (masalan rasm yoki ism o'zgargan bo'lsa)
      if (firstName || username || photo_url) {
        await user.update({
          firstName: firstName || user.firstName,
          username: username || user.username,
          photo: photo_url || user.photo, // Rasm URL ni saqlash
        });
      }
    }

    // 4. Frontendga javob qaytarish
    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Auth Login Xatosi:", error);
    res
      .status(500)
      .json({ msg: "Serverda xatolik yuz berdi: " + error.message });
  }
};
