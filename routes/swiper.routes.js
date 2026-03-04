// const express = require("express");
// const router = express.Router();
// const swiper = require("../controllers/swiper.controller");

// /**
//  * @swagger
//  * tags:
//  *   name: Swiper
//  *   description: Home.jsx dagi swiper
//  */

// /**
//  * @swagger
//  * /api/swiper:
//  *   post:
//  *     tags: [Swiper]
//  *     summary: Yangi swiper qo‘shish
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - img
//  *             properties:
//  *               img:
//  *                 type: string
//  *                 example: "https://avatars.mds.yandex.net/i?id=bf1fdc25fd193cbe1957497105cf1cf0_l-5449367-images-thumbs&n=13"
//  *     responses:
//  *       201:
//  *         description: Swiper qo‘shildi
//  *       400:
//  *         description: Malumot noto‘g‘ri yoki hato
//  *       500:
//  *         description: Server error
//  */
// router.post("/", swiper.createSwiper);

// /**
//  * @swagger
//  * /api/swiper:
//  *   get:
//  *     tags: [Swiper]
//  *     summary: Barcha swiperlarni olish
//  *     responses:
//  *       200:
//  *         description: Swiperlar ro‘yxati
//  *       500:
//  *         description: Server error
//  */
// router.get("/", swiper.getSwipers);

// /**
//  * @swagger
//  * /api/swiper/{id}:
//  *   get:
//  *     tags: [Swiper]
//  *     summary: ID bo‘yicha swiper olish
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: Swiper ID raqami
//  *     responses:
//  *       200:
//  *         description: Swiper topildi
//  *       404:
//  *         description: Swiper topilmadi
//  *       500:
//  *         description: Server error
//  */
// router.get("/:id", swiper.getSwiperById);

// /**
//  * @swagger
//  * /api/swiper/{id}:
//  *   delete:
//  *     tags: [Swiper]
//  *     summary: ID bo‘yicha swiperni o‘chirish
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: Swiper ID raqami
//  *     responses:
//  *       200:
//  *         description: Swiper muvaffaqiyatli o‘chirildi
//  *       404:
//  *         description: Swiper topilmadi
//  *       500:
//  *         description: Server error
//  */
// router.delete("/:id", swiper.deleteSwiper);

// module.exports = router;





























const express = require("express");
const router = express.Router();
const swiper = require("../controllers/swiper.controller");
const upload = require("../middleware/upload");

/**
 * @swagger
 * tags:
 *   name: Swiper
 *   description: Home sahifadagi Swiper rasmlari (URL yoki galereyadan upload)
 */

/**
 * @swagger
 * /api/swiper:
 *   post:
 *     tags: [Swiper]
 *     summary: Yangi swiper qo‘shish (URL yoki fayl)
 *     description: |
 *       Swiper rasm qo‘shish.
 *       - Galereyadan rasm yuborish uchun `image` field ishlatiladi
 *       - Agar URL bo‘lsa `img` field yuboriladi
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Galereyadan rasm yuklash
 *               img:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *                 description: Rasm URL manzili
 *     responses:
 *       201:
 *         description: Swiper muvaffaqiyatli qo‘shildi
 *       400:
 *         description: Rasm fayli yoki URL talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.post("/", upload.single("image"), swiper.createSwiper);

/**
 * @swagger
 * /api/swiper:
 *   get:
 *     tags: [Swiper]
 *     summary: Barcha swiperlarni olish
 *     responses:
 *       200:
 *         description: Swiperlar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   img:
 *                     type: string
 *                     example: /uploads/12345.jpg
 *       500:
 *         description: Server xatosi
 */
router.get("/", swiper.getSwipers);

/**
 * @swagger
 * /api/swiper/{id}:
 *   get:
 *     tags: [Swiper]
 *     summary: Swiperni ID bo‘yicha olish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Swiper ID raqami
 *     responses:
 *       200:
 *         description: Swiper topildi
 *       404:
 *         description: Swiper topilmadi
 *       500:
 *         description: Server xatosi
 */
router.get("/:id", swiper.getSwiperById);

/**
 * @swagger
 * /api/swiper/{id}:
 *   put:
 *     tags: [Swiper]
 *     summary: Swiperni yangilash
 *     description: Yangi URL yoki rasm fayl yuborish mumkin
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               img:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *     responses:
 *       200:
 *         description: Swiper muvaffaqiyatli yangilandi
 *       404:
 *         description: Swiper topilmadi
 *       500:
 *         description: Server xatosi
 */
router.put("/:id", upload.single("image"), swiper.updateSwiper);

/**
 * @swagger
 * /api/swiper/{id}:
 *   delete:
 *     tags: [Swiper]
 *     summary: Swiperni o‘chirish
 *     description: Agar rasm lokal bo‘lsa (`/uploads/`), fayl ham o‘chiriladi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Swiper ID raqami
 *     responses:
 *       200:
 *         description: Swiper muvaffaqiyatli o‘chirildi
 *       404:
 *         description: Swiper topilmadi
 *       500:
 *         description: Server xatosi
 */
router.delete("/:id", swiper.deleteSwiper);

module.exports = router;
