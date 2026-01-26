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
const upload = require("../middleware/upload"); // Multer ulash

/**
 * @swagger
 * tags:
 * name: Swiper
 * description: Home.jsx dagi swiper (Rasm fayl yoki URL)
 */

/**
 * @swagger
 * /api/swiper:
 * post:
 * tags: [Swiper]
 * summary: Yangi swiper qo‘shish (Fayl yoki URL)
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * image:
 * type: string
 * format: binary
 * description: Galereyadan rasm yuklash uchun
 * img:
 * type: string
 * description: Yoki rasm URL manzilini yozish uchun
 * responses:
 * 201:
 * description: Swiper qo‘shildi
 * 400:
 * description: Malumot yetarli emas
 * 500:
 * description: Server error
 */
// "image" - bu frontenddan yuboriladigan fayl keyi (formData.append('image', file))
router.post("/", upload.single("image"), swiper.createSwiper);

/**
 * @swagger
 * /api/swiper:
 * get:
 * tags: [Swiper]
 * summary: Barcha swiperlarni olish
 * responses:
 * 200:
 * description: Ro'yxat
 */
router.get("/", swiper.getSwipers);

/**
 * @swagger
 * /api/swiper/{id}:
 * get:
 * tags: [Swiper]
 * summary: ID bo‘yicha olish
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Topildi
 */
router.get("/:id", swiper.getSwiperById);

/**
 * @swagger
 * /api/swiper/{id}:
 * delete:
 * tags: [Swiper]
 * summary: O'chirish
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: O'chirildi
 */
router.delete("/:id", swiper.deleteSwiper);

module.exports = router;