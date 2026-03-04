const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autentifikatsiya (User va Admin login)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLoginInput:
 *       type: object
 *       required:
 *         - telegramId
 *       properties:
 *         telegramId:
 *           type: string
 *           example: "123456789"
 *           description: Telegram foydalanuvchi ID si
 *         firstName:
 *           type: string
 *           example: "Ali"
 *         username:
 *           type: string
 *           example: "ali_dev"
 *         photo_url:
 *           type: string
 *           example: "https://t.me/i/userpic/320/ali.jpg"
 *         start_param:
 *           type: string
 *           example: "987654321"
 *           description: Referral - taklif qilgan odamning telegramId si
 *
 *     UserLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             telegramId:
 *               type: string
 *               example: "123456789"
 *             firstName:
 *               type: string
 *               example: "Ali"
 *             username:
 *               type: string
 *               example: "ali_dev"
 *             balance:
 *               type: number
 *               example: 0
 *             xp:
 *               type: integer
 *               example: 500
 *             walletCardNumber:
 *               type: string
 *               example: "GF-8600-1234-5678-9012"
 *
 *     AdminLoginInput:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: "admin"
 *         password:
 *           type: string
 *           example: "123"
 *
 *     AdminLoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Muvaffaqiyatli kirildi"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         admin:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             username:
 *               type: string
 *               example: "admin"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Telegram orqali foydalanuvchi login/registratsiya
 *     tags: [Auth]
 *     description: |
 *       Telegram foydalanuvchisi login qiladi.
 *       Agar foydalanuvchi bazada bo'lmasa, yangi yaratiladi.
 *       Agar start_param berilsa, referral bonus beriladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoginResponse'
 *       400:
 *         description: Telegram ID talab qilinadi
 *       500:
 *         description: Server xatosi
 */
// Userlar uchun (Telegram)
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/admin-login:
 *   post:
 *     summary: Admin panel uchun login
 *     tags: [Auth]
 *     description: Admin username va parol bilan kiradi. JWT token qaytariladi (24 soatga).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginInput'
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli kirildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginResponse'
 *       400:
 *         description: Login va parol kiritilishi shart
 *       401:
 *         description: Parol noto'g'ri
 *       404:
 *         description: Admin topilmadi
 *       500:
 *         description: Server xatosi
 */
// Adminlar uchun (Web Panel)
router.post("/admin-login", authController.adminLogin);

module.exports = router;
