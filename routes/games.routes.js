const express = require("express");
const router = express.Router();
const gameController = require("../controllers/game.controller");

/**
 * @swagger
 * tags:
 *   - name: Games
 *     description: Futbol o‘yinlari API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Mini futbol
 *         subtitle:
 *           type: string
 *           example: Kechki o‘yin
 *         location:
 *           type: string
 *           example: Namangan Arena
 *         playDate:
 *           type: string
 *           format: date-time
 *           example: 2026-01-20T18:00:00Z
 *         startTime:
 *           type: string
 *           example: "18:00"
 *         endTime:
 *           type: string
 *           example: "20:00"
 *         price:
 *           type: number
 *           example: 50000
 *         totalPlayers:
 *           type: integer
 *           example: 14
 *         playersJoined:
 *           type: integer
 *           example: 5
 *         isOutdoor:
 *           type: boolean
 *           example: true
 *         hasLockers:
 *           type: boolean
 *           example: true
 *         hasShowers:
 *           type: boolean
 *           example: true
 *         type:
 *           type: string
 *           example: 7v7
 *         advance:
 *           type: integer
 *           example: 0
 *         imageUrl:
 *           type: string
 *           example: https://image.png
 *         rules:
 *           type: array
 *           items:
 *             type: string
 *
 *     GameInput:
 *       type: object
 *       required:
 *         - title
 *         - location
 *         - playDate
 *         - startTime
 *         - endTime
 *         - price
 *       properties:
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         location:
 *           type: string
 *         playDate:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         price:
 *           type: number
 *         totalPlayers:
 *           type: integer
 *         isOutdoor:
 *           type: boolean
 *         hasLockers:
 *           type: boolean
 *         hasShowers:
 *           type: boolean
 *         type:
 *           type: string
 *         advance:
 *           type: integer
 *         imageUrl:
 *           type: string
 *         rules:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Barcha o‘yinlarni olish
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: O‘yinlar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 */
router.get("/", gameController.getAllGames);

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: ID bo‘yicha o‘yinni olish
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: O‘yin topildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.get("/:id", gameController.getGameById);

/**
 * @swagger
 * /api/games:
 *   post:
 *     summary: Yangi o‘yin yaratish
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameInput'
 *     responses:
 *       201:
 *         description: O‘yin yaratildi
 */
router.post("/", gameController.createGame);

/**
 * @swagger
 * /api/games/{id}:
 *   put:
 *     summary: O‘yinni yangilash
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameInput'
 *     responses:
 *       200:
 *         description: O‘yin yangilandi
 */
router.put("/:id", gameController.updateGame);

/**
 * @swagger
 * /api/games/{id}:
 *   delete:
 *     summary: O‘yinni o‘chirish
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: O‘yin o‘chirildi
 */
router.delete("/:id", gameController.deleteGame);

module.exports = router;
