const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Foydalanuvchilar boshqaruvi (Login, Profil, Balans, Referral)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         telegramId:
 *           type: string
 *           example: "123456789"
 *         firstName:
 *           type: string
 *           example: "Ali"
 *         lastName:
 *           type: string
 *           example: "Valiyev"
 *         username:
 *           type: string
 *           example: "ali_dev"
 *         balance:
 *           type: number
 *           example: 50000
 *         walletCardNumber:
 *           type: string
 *           example: "GF-8600-1234-5678-9012"
 *         phone:
 *           type: string
 *           example: "+998901234567"
 *         city:
 *           type: string
 *           example: "Toshkent"
 *         position:
 *           type: string
 *           example: "Mid"
 *         photo:
 *           type: string
 *           example: "https://t.me/photo.jpg"
 *         xp:
 *           type: integer
 *           example: 1500
 *         role:
 *           type: string
 *           example: "user"
 *         invitedBy:
 *           type: string
 *           example: "987654321"
 *         invitedCount:
 *           type: integer
 *           example: 3
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login yoki Registratsiya + Profil yangilash
 *     tags: [Users]
 *     description: |
 *       Foydalanuvchi telegramId orqali login qiladi.
 *       - Agar bazada bo'lmasa, yangi yaratiladi (registratsiya).
 *       - Agar bazada bo'lsa, berilgan ma'lumotlar yangilanadi.
 *       - start_param orqali referral bonus beriladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *             properties:
 *               telegramId:
 *                 type: string
 *                 example: "123456789"
 *               firstName:
 *                 type: string
 *                 example: "Ali"
 *               lastName:
 *                 type: string
 *                 example: "Valiyev"
 *               username:
 *                 type: string
 *                 example: "ali_dev"
 *               photo_url:
 *                 type: string
 *                 example: "https://t.me/photo.jpg"
 *               start_param:
 *                 type: string
 *                 example: "987654321"
 *                 description: Referral telegramId
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               city:
 *                 type: string
 *                 example: "Toshkent"
 *               position:
 *                 type: string
 *                 example: "Mid"
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli yangilandi (mavjud user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Muvaffaqiyatli yangilandi"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       201:
 *         description: Ro'yxatdan o'tildi (yangi user)
 *       400:
 *         description: Telegram ID yetishmayapti
 *       500:
 *         description: Server xatosi
 */
router.post("/login", userController.loginOrRegister);

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Barcha foydalanuvchilarni olish
 *     tags: [Users]
 *     description: XP bo'yicha kamayish tartibida barcha userlarni qaytaradi
 *     responses:
 *       200:
 *         description: Foydalanuvchilar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server xatosi
 */
router.get("/all", userController.getAllUsers);

/**
 * @swagger
 * /api/users/update-balance:
 *   post:
 *     summary: Foydalanuvchi balansini yangilash (Admin)
 *     tags: [Users]
 *     description: |
 *       Admin tomonidan foydalanuvchi balansini qo'shish yoki ayirish.
 *       Transaction tarixiga ham yoziladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - type
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *                 description: User ID (id, telegramId emas)
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: Qo'shiladigan yoki ayiriladigan summa
 *               type:
 *                 type: string
 *                 enum: [add, subtract]
 *                 example: "add"
 *                 description: "add = kirim, subtract = chiqim"
 *     responses:
 *       200:
 *         description: Balans yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Balans muvaffaqiyatli yangilandi"
 *                 newBalance:
 *                   type: number
 *                   example: 100000
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post("/update-balance", userController.updateUserBalance);

/**
 * @swagger
 * /api/users/referral-stats/{telegramId}:
 *   get:
 *     summary: Referral (taklif) statistikasini olish
 *     tags: [Users]
 *     description: |
 *       Foydalanuvchi nechta odam taklif qilgani va ularning ro'yxatini qaytaradi.
 *       Har bir taklif uchun 1000 XP beriladi.
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *         example: "123456789"
 *         description: Foydalanuvchining Telegram ID si
 *     responses:
 *       200:
 *         description: Referral statistikasi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInvited:
 *                   type: integer
 *                   example: 5
 *                 totalXpEarned:
 *                   type: integer
 *                   example: 5000
 *                 invitedCount:
 *                   type: integer
 *                   example: 5
 *                 invitedBy:
 *                   type: string
 *                   example: "111222333"
 *                   nullable: true
 *                 invitedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       username:
 *                         type: string
 *                       photo:
 *                         type: string
 *                       xp:
 *                         type: integer
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Telegram ID kerak
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.get("/referral-stats/:telegramId", userController.getReferralStats);

/**
 * @swagger
 * /api/users/{telegramId}:
 *   put:
 *     summary: Foydalanuvchi profilini yangilash
 *     tags: [Users]
 *     description: Telefon, shahar va pozitsiya ma'lumotlarini yangilash
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *         example: "123456789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               city:
 *                 type: string
 *                 example: "Toshkent"
 *               position:
 *                 type: string
 *                 example: "Forward"
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli saqlandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Muvaffaqiyatli saqlandi"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.put("/:telegramId", userController.updateUser);

/**
 * @swagger
 * /api/users/stats/{telegramId}:
 *   get:
 *     summary: Foydalanuvchi statistikasini olish (XP va O'yinlar)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Foydalanuvchi statistikasi
 */
router.get("/stats/:telegramId", userController.getUserStats);

/**
 * @swagger
 * /api/users/convert-xp/{telegramId}:
 *   post:
 *     summary: XP ni pulga almashtirish (User)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               xpAmount:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: XP muvaffaqiyatli konvertatsiya qilindi
 */
router.post("/convert-xp/:telegramId", userController.convertXpToMoney);

/**
 * @swagger
 * /api/users/admin/convert-xp:
 *   post:
 *     summary: XP ni pulga almashtirish (Admin)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               xpAmount:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: XP muvaffaqiyatli konvertatsiya qilindi
 */
router.post("/admin/convert-xp", userController.adminConvertXpToMoney);

module.exports = router;
