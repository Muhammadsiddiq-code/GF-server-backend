const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: To'lov operatsiyalari (Invoice, Wallet, Payme checkout)
 */

/**
 * @swagger
 * /api/payment/create-invoice:
 *   post:
 *     summary: Telegram Invoice yaratish
 *     tags: [Payment]
 *     description: |
 *       Telegram bot orqali foydalanuvchiga invoice yuboradi.
 *       - type=GAME: O'yin uchun to'lov
 *       - type=TOPUP: Hamyonni to'ldirish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *               - amount
 *             properties:
 *               telegramId:
 *                 type: string
 *                 example: "123456789"
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: To'lov summasi (so'mda)
 *               type:
 *                 type: string
 *                 enum: [GAME, TOPUP]
 *                 example: "TOPUP"
 *               gameId:
 *                 type: integer
 *                 example: 5
 *                 description: O'yin ID (faqat type=GAME bo'lganda)
 *               team:
 *                 type: string
 *                 example: "Jamoa 1"
 *     responses:
 *       200:
 *         description: Invoice yuborildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invoice yuborildi"
 *       400:
 *         description: Noto'g'ri ma'lumot
 *       404:
 *         description: Game topilmadi
 *       500:
 *         description: Server xatosi (Bot ishlamayapti yoki PROVIDER_TOKEN yo'q)
 */
router.post("/create-invoice", paymentController.createInvoice);

/**
 * @swagger
 * /api/payment/pay-wallet:
 *   post:
 *     summary: Hamyon orqali o'yinga to'lash
 *     tags: [Payment]
 *     description: |
 *       Foydalanuvchi balansidan pul yechib o'yinga qo'shadi.
 *       - Minimal to'lov tekshiriladi
 *       - UserGame yaratiladi yoki yangilanadi
 *       - Transaction tarixga yoziladi
 *       - Bot orqali tasdiqlash xabari yuboriladi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *               - gameId
 *             properties:
 *               telegramId:
 *                 type: string
 *                 example: "123456789"
 *               gameId:
 *                 type: integer
 *                 example: 5
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: To'lov summasi (bo'sh qolsa, kishi boshiga narx hisoblanadi)
 *               team:
 *                 type: string
 *                 example: "Jamoa 1"
 *     responses:
 *       200:
 *         description: To'lov muvaffaqiyatli
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "To'lov muvaffaqiyatli!"
 *       400:
 *         description: Mablag' yetarli emas yoki minimal to'lov
 *       404:
 *         description: User yoki O'yin topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post("/pay-wallet", paymentController.payWithWallet);

/**
 * @swagger
 * /api/payment/user/{telegramId}:
 *   get:
 *     summary: Foydalanuvchi hamyon ma'lumotlarini olish
 *     tags: [Payment]
 *     description: |
 *       Foydalanuvchining balans, karta raqami va tranzaksiya tarixini qaytaradi.
 *       Agar karta raqami yo'q bo'lsa, avtomatik generatsiya qilinadi.
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *         example: "123456789"
 *     responses:
 *       200:
 *         description: Foydalanuvchi hamyon ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 telegramId:
 *                   type: string
 *                   example: "123456789"
 *                 balance:
 *                   type: number
 *                   example: 100000
 *                 walletCardNumber:
 *                   type: string
 *                   example: "GF-8600-1234-5678-9012"
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [income, expense]
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: User topilmadi
 *       500:
 *         description: Server xatosi
 */
router.get("/user/:telegramId", paymentController.getUserWallet);

/**
 * @swagger
 * /api/payment/payme/checkout-url:
 *   post:
 *     summary: Payme checkout URL olish (Hamyon to'ldirish)
 *     tags: [Payment]
 *     description: |
 *       Frontend uchun Payme checkout URL qaytaradi.
 *       Foydalanuvchi shu URL orqali Payme sahifasiga yo'naltiriladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *               - amount
 *             properties:
 *               telegramId:
 *                 type: string
 *                 example: "123456789"
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: To'lov summasi (so'mda)
 *     responses:
 *       200:
 *         description: Payme checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *                   example: "https://checkout.test.paycom.uz/base64encodedparams"
 *                 amountSom:
 *                   type: number
 *                   example: 50000
 *                 amountTiyin:
 *                   type: integer
 *                   example: 5000000
 *                 account:
 *                   type: object
 *                   properties:
 *                     telegram_id:
 *                       type: string
 *                       example: "123456789"
 *       400:
 *         description: Noto'g'ri ma'lumot
 *       404:
 *         description: User topilmadi
 *       500:
 *         description: PAYME_MERCHANT_ID yo'q yoki server xatosi
 */
router.post("/payme/checkout-url", paymentController.getPaymeCheckoutUrl);

/**
 * @swagger
 * /api/payment/payme/game-checkout:
 *   post:
 *     summary: Payme orqali o'yinga to'g'ridan-to'g'ri to'lash
 *     tags: [Payment]
 *     description: |
 *       O'yin uchun Payme checkout URL qaytaradi.
 *       To'lov muvaffaqiyatli bo'lgandan keyin, Payme callback orqali
 *       avtomatik ravishda o'yinga qo'shiladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *               - gameId
 *               - amount
 *             properties:
 *               telegramId:
 *                 type: string
 *                 example: "123456789"
 *               gameId:
 *                 type: integer
 *                 example: 5
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: To'lov summasi (so'mda)
 *               team:
 *                 type: string
 *                 example: "Jamoa 1"
 *     responses:
 *       200:
 *         description: Payme game checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 checkoutUrl:
 *                   type: string
 *                   example: "https://checkout.test.paycom.uz/base64params"
 *                 amountSom:
 *                   type: number
 *                   example: 50000
 *                 amountTiyin:
 *                   type: integer
 *                   example: 5000000
 *                 account:
 *                   type: object
 *                   properties:
 *                     telegram_id:
 *                       type: string
 *                     game_id:
 *                       type: string
 *                     team:
 *                       type: string
 *       400:
 *         description: Noto'g'ri ma'lumot yoki joylar to'lgan
 *       404:
 *         description: User yoki O'yin topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post("/payme/game-checkout", paymentController.createGamePaymeCheckout);

/**
 * @swagger
 * /api/payment/all:
 *   get:
 *     summary: Barcha tranzaksiyalarni olish (Admin uchun)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Tranzaksiyalar ro'yxati
 */
router.get("/all", paymentController.getAllTransactions);

module.exports = router;
