const express = require("express");
const router = express.Router();

const paymeController = require("../controllers/payme.controller");
const paymentController = require("../controllers/payment.controller");

/**
 * @swagger
 * tags:
 *   - name: Payme
 *     description: Payme integratsiyasi (JSON-RPC callback va checkout)
 */

/**
 * @swagger
 * /api/payme:
 *   post:
 *     summary: Payme JSON-RPC callback
 *     tags: [Payme]
 *     description: |
 *       Payme serveri shu endpointga so'rov yuboradi.
 *       Bu endpoint qo'lda chaqirilmaydi!
 *       Payme kabinetida callback URL sifatida ko'rsatiladi.
 *       
 *       Qo'llab-quvvatlanadigan metodlar:
 *       - CheckPerformTransaction
 *       - CreateTransaction
 *       - PerformTransaction
 *       - CancelTransaction
 *       - CheckTransaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *                 example: "CheckPerformTransaction"
 *               params:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: integer
 *                     example: 5000000
 *                     description: Summa tiyinda
 *                   account:
 *                     type: object
 *                     properties:
 *                       telegram_id:
 *                         type: string
 *                         example: "123456789"
 *     responses:
 *       200:
 *         description: JSON-RPC javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: object
 *                   nullable: true
 */
// 1) Payme JSON-RPC callback (Payme server uradi)
router.post("/", paymeController.handlePayme);

/**
 * @swagger
 * /api/payme/checkout-url:
 *   post:
 *     summary: Payme checkout URL olish
 *     tags: [Payme]
 *     description: |
 *       Frontend uchun Payme checkout URL qaytaradi.
 *       Bu endpoint `/api/payment/payme/checkout-url` bilan bir xil ishlaydi.
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
 *         description: Checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *                   example: "https://checkout.test.paycom.uz/base64params"
 *                 amountSom:
 *                   type: number
 *                   example: 50000
 *                 amountTiyin:
 *                   type: integer
 *                   example: 5000000
 *       400:
 *         description: Noto'g'ri ma'lumot
 *       404:
 *         description: User topilmadi
 *       500:
 *         description: Server xatosi
 */
// 2) Frontend uchun checkout URL chiqarish
router.post("/checkout-url", paymentController.getPaymeCheckoutUrl);

module.exports = router;
