// routes/click.routes.js
// CLICK SHOP API callback endpointlari
const express = require("express");
const router = express.Router();
const clickController = require("../controllers/click.controller");

/**
 * @swagger
 * tags:
 *   - name: Click
 *     description: CLICK SHOP API callback endpointlari (Prepare/Complete)
 */

/**
 * @swagger
 * /api/payments/click/prepare:
 *   post:
 *     summary: CLICK Prepare callback (action=0)
 *     tags: [Click]
 *     description: |
 *       CLICK tizimi shu endpointga so'rov yuboradi.
 *       Bu endpoint qo'lda chaqirilmaydi!
 *       CLICK kabinetida Prepare URL sifatida ko'rsatiladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               click_trans_id:
 *                 type: integer
 *               service_id:
 *                 type: integer
 *               merchant_trans_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               action:
 *                 type: integer
 *                 example: 0
 *               sign_time:
 *                 type: string
 *               sign_string:
 *                 type: string
 *     responses:
 *       200:
 *         description: CLICK Prepare javobi
 */
router.post("/prepare", clickController.handlePrepare);

/**
 * @swagger
 * /api/payments/click/complete:
 *   post:
 *     summary: CLICK Complete callback (action=1)
 *     tags: [Click]
 *     description: |
 *       CLICK tizimi shu endpointga so'rov yuboradi.
 *       Bu endpoint qo'lda chaqirilmaydi!
 *       CLICK kabinetida Complete URL sifatida ko'rsatiladi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               click_trans_id:
 *                 type: integer
 *               service_id:
 *                 type: integer
 *               merchant_trans_id:
 *                 type: string
 *               merchant_prepare_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               action:
 *                 type: integer
 *                 example: 1
 *               error:
 *                 type: integer
 *               sign_time:
 *                 type: string
 *               sign_string:
 *                 type: string
 *     responses:
 *       200:
 *         description: CLICK Complete javobi
 */
router.post("/complete", clickController.handleComplete);

module.exports = router;
