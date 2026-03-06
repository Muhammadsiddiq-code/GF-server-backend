const jwt = require("jsonwebtoken");
const { User, Admin } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_gf_admin";

/**
 * Admin auth middleware
 * - Expects Authorization: Bearer <token>
 * - Token is issued by auth.controller.adminLogin
 */
exports.authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (!token || scheme.toLowerCase() !== "bearer") {
      return res.status(401).json({ message: "Admin token talab qilinadi" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token noto'g'ri yoki muddati tugagan" });
    }

    if (!payload || payload.role !== "admin" || !payload.id) {
      return res.status(403).json({ message: "Admin huquqi yetarli emas" });
    }

    const admin = await Admin.findByPk(payload.id);
    if (!admin) {
      return res.status(401).json({ message: "Admin topilmadi" });
    }

    req.admin = { id: admin.id, username: admin.username };
    next();
  } catch (error) {
    console.error("authenticateAdmin error:", error);
    res.status(500).json({ message: "Auth xatosi", error: error.message });
  }
};

/**
 * Role middleware for already authenticated admins.
 */
exports.isAdmin = (req, res, next) => {
  if (!req.admin || !req.admin.id) {
    return res.status(403).json({ message: "Admin huquqi talab qilinadi" });
  }

  return next();
};

/**
 * User auth middleware (Telegram-based)
 * - Expects X-Telegram-Id header with telegramId string
 * - Matches existing login/session flow which stores telegramId on backend
 */
exports.authenticateUser = async (req, res, next) => {
  try {
    const telegramId = req.headers["x-telegram-id"];

    if (!telegramId) {
      return res
        .status(401)
        .json({ message: "X-Telegram-Id header orqali foydalanuvchi aniqlanishi kerak" });
    }

    const user = await User.findOne({
      where: { telegramId: String(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authenticateUser error:", error);
    res.status(500).json({ message: "Auth xatosi", error: error.message });
  }
};
