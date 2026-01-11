// const express = require("express");
// const router = express.Router();
// const userGameController = require("../controllers/userGame.controller");

// router.post("/join", userGameController.joinGame);
// router.get("/history/:userId", userGameController.getUserHistory);

// module.exports = router;










const express = require("express");
const router = express.Router();
const userGameController = require("../controllers/userGame.controller");

/**
 * @swagger
 * tags:
 *   name: UserGame
 *   description: Foydalanuvchi va o‘yinlar o‘rtasidagi bog‘lanish
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserGame:
 *       type: object
 *       required:
 *         - userId
 *         - gameId
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 12
 *         gameId:
 *           type: integer
 *           example: 5
 *         team:
 *           type: string
 *           enum: [A, B]
 *           example: A
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-01-11T10:20:30Z
 */

/**
 * @swagger
 * /api/user-game/join:
 *   post:
 *     summary: Foydalanuvchini o‘yinga qo‘shish
 *     tags: [UserGame]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - gameId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 12
 *               gameId:
 *                 type: integer
 *                 example: 5
 *               team:
 *                 type: string
 *                 enum: [A, B]
 *                 example: A
 *     responses:
 *       201:
 *         description: Foydalanuvchi muvaffaqiyatli o‘yinga qo‘shildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGame'
 *       400:
 *         description: Noto‘g‘ri so‘rov (ma’lumot yetishmaydi)
 *       500:
 *         description: Server xatosi
 */
router.post("/join", userGameController.joinGame);

/**
 * @swagger
 * /api/user-game/history/{userId}:
 *   get:
 *     summary: Foydalanuvchining o‘yinlar tarixini olish
 *     tags: [UserGame]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *     responses:
 *       200:
 *         description: Foydalanuvchining o‘yinlar tarixi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserGame'
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.get("/history/:userId", userGameController.getUserHistory);

module.exports = router;
