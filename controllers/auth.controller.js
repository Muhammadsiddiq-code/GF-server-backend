const { User } = require("../models");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Login urinish:", username, password);

    // O'ZGARISH SHU YERDA: .unscoped() qo'shildi
    // Bu funksiya yashiringan maydonlarni (parolni) ham olib keladi
    const user = await User.unscoped().findOne({ where: { username } });

    if (!user) {
      console.log("User topilmadi");
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    // Endi user.password undefined bo'lmaydi
    if (user.password !== password) {
      console.log("Parol xato. Kutilgan:", user.password, "Kelgan:", password);
      return res.status(401).json({ message: "Parol noto'g'ri" });
    }

    // Token beramiz
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
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error("Login xatosi:", error);
    res.status(500).json({ message: error.message });
  }
};
