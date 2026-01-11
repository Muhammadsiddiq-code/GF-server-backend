const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { Game, UserGame } = require("../models");

const PAYNET_MERCHANT_ID = process.env.PAYNET_MERCHANT_ID;
const PAYNET_SECRET = process.env.PAYNET_SECRET;
const PAYNET_URL = "https://checkout.paynet.uz"; // prod
// test bo‘lsa keyin almashtiramiz

// 1️⃣ TO‘LOV YARATISH
router.post("/create", async (req, res) => {
  const { gameId, userId } = req.body;

  const game = await Game.findByPk(gameId);
  if (!game) {
    return res.status(404).json({ message: "O'yin topilmadi" });
  }

  const amount = game.price * 100; // tiyinda

  const orderId = `GAME_${gameId}_USER_${userId}_${Date.now()}`;

  const sign = crypto
    .createHash("md5")
    .update(`${PAYNET_MERCHANT_ID}${orderId}${amount}${PAYNET_SECRET}`)
    .digest("hex");

  const payUrl = `${PAYNET_URL}?merchant=${PAYNET_MERCHANT_ID}&amount=${amount}&order_id=${orderId}&sign=${sign}`;

  res.json({
    payUrl,
  });
});

// 2️⃣ PAYNET CALLBACK
router.post("/callback", async (req, res) => {
  const { order_id, status } = req.body;

  if (status !== "success") {
    return res.json({ ok: false });
  }

  const [, gameId, , userId] = order_id.split("_");

  const game = await Game.findByPk(gameId);

  const alreadyJoined = await UserGame.findOne({
    where: { gameId, userId },
  });

  if (!alreadyJoined) {
    await UserGame.create({
      gameId,
      userId,
      team: "A",
    });
    await game.increment("playersJoined");
  }

  res.json({ ok: true });
});

module.exports = router;
