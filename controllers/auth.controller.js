const { User } = require("../models");
const jwt = require("jsonwebtoken");

// Hozircha oddiy login (bcryptsiz, agar bazada parollar ochiq bo'lsa)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Userni izlash
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    // Parolni tekshirish (Agar bcrypt ishlatsangiz: await bcrypt.compare(password, user.password))
    // Hozircha oddiy solishtirish:
    if (user.password !== password) {
      return res.status(401).json({ message: "Parol noto'g'ri" });
    }

    // Token yaratish
    const token = jwt.sign({ id: user.id, role: user.role }, "SECRET_KEY_123", {
      expiresIn: "24h",
    });

    res.json({
      message: "Login muvaffaqiyatli",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
