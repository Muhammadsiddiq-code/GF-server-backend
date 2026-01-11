const User = require("../models/userModel");

exports.telegramAuth = async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username } = req.body;

    // 1. User bazada bormi tekshiramiz
    let user = await User.findOne({ where: { telegramId } });

    // 2. Agar yo'q bo'lsa, yangi yaratamiz (Ro'yxatdan o'tkazish)
    if (!user) {
      user = await User.create({
        telegramId,
        firstName,
        lastName,
        username,
      });
    } else {
      // Agar bo'lsa, ma'lumotlarini yangilab qo'yamiz (masalan username o'zgargan bo'lsa)
      await user.update({ firstName, lastName, username });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
