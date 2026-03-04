const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const referralController = require("../controllers/referral.controller");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_gf_admin";

// ============================================================
// ADMIN AUTH MIDDLEWARE
// ============================================================
const adminAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ msg: "Token kerak" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ msg: "Admin huquqi kerak" });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ msg: "Token noto'g'ri yoki muddati o'tgan" });
    }
};

// ============================================================
// USER ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/referral/my/{telegramId}:
 *   get:
 *     summary: Foydalanuvchining referral ma'lumotlari
 *     tags: [Referral]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Referral ma'lumotlari
 */
router.get("/my/:telegramId", referralController.getMyReferralInfo);
router.get("/settings/stream", referralController.streamPublicSettings);

// ============================================================
// ADMIN ENDPOINTS (JWT token kerak)
// ============================================================

/**
 * @swagger
 * /api/referral/admin/settings:
 *   get:
 *     summary: Referral XP sozlamalarini olish
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/settings", adminAuth, referralController.getSettings);

/**
 * @swagger
 * /api/referral/admin/settings:
 *   put:
 *     summary: Referral XP sozlamalarini yangilash
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/admin/settings", adminAuth, referralController.updateSettings);

/**
 * @swagger
 * /api/referral/admin/stats:
 *   get:
 *     summary: Referral statistikasi
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/stats", adminAuth, referralController.getReferralStats);

/**
 * @swagger
 * /api/referral/admin/top-referrers:
 *   get:
 *     summary: Top referrerlar (Leaderboard)
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/top-referrers", adminAuth, referralController.getTopReferrers);

/**
 * @swagger
 * /api/referral/admin/history:
 *   get:
 *     summary: Referral tarixi (filtrlar bilan)
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, revoked]
 *       - in: query
 *         name: referralCode
 *         schema:
 *           type: string
 */
router.get("/admin/history", adminAuth, referralController.getReferralHistory);

/**
 * @swagger
 * /api/referral/admin/referred-users:
 *   get:
 *     summary: Taklif qilingan userlar ro'yxati
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/referred-users", adminAuth, referralController.getReferredUsers);

/**
 * @swagger
 * /api/referral/admin/referrers:
 *   get:
 *     summary: Taklif qilganlar ro'yxati
 *     tags: [Referral Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/referrers", adminAuth, referralController.getReferrers);

module.exports = router;
