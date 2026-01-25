// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const TelegramBot = require("node-telegram-bot-api");

// // 1. Modellarni import qilish
// const { sequelize, User, Game, UserGame, Transaction } = require("./models");
// const setupSwagger = require("./swagger/swagger");

// // Route importlari
// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paymentRoutes = require("./routes/payment.routes");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;

// // Railway va NGROK uchun
// app.set("trust proxy", true);

// // Middlewares
// app.use(express.json());
// app.use(cors({ origin: "*" }));
// app.options("*", cors());

// // --- API Routes ---
// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// app.use("/api/payment", paymentRoutes);

// // Auth & Service Routes
// const authController = require("./controllers/auth.controller");
// app.post("/api/auth/login", authController.login);

// const serviceController = require("./controllers/service.controller");
// const serviceRouter = require("express").Router();
// serviceRouter.post("/", serviceController.createService);
// serviceRouter.get("/", serviceController.getAllServices);
// serviceRouter.delete("/:id", serviceController.deleteService);
// app.use("/api/services", serviceRouter);

// // Swagger
// setupSwagger(app);

// // ------------------------------------------------------------------
// // --- TELEGRAM BOT LOGIKASI (WEBHOOK & PAYMENTS) ---
// // ------------------------------------------------------------------

// const token = process.env.TELEGRAM_BOT_TOKEN;
// let bot;

// if (!token) {
//   console.error("❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!");
// } else {
//   // 1. Botni ishga tushirish (Conflict oldini olish uchun)
//   if (process.env.RAILWAY_PUBLIC_DOMAIN) {
//     bot = new TelegramBot(token, { webHook: true });
//     const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
//     bot.setWebHook(`${url}/bot${token}`);
//     console.log(`🚀 Bot Webhook rejimida ulandi: ${url}/bot${token}`);

//     app.post(`/bot${token}`, (req, res) => {
//       bot.processUpdate(req.body);
//       res.sendStatus(200);
//     });
//   } else {
//     bot = new TelegramBot(token, { polling: true });
//     console.log("🤖 Bot Polling (Local) rejimida ulandi");
//   }

//   // 2. To'lovdan oldin tekshiruv (Pre-checkout)
//   bot.on("pre_checkout_query", async (query) => {
//     try {
//       await bot.answerPreCheckoutQuery(query.id, true);
//     } catch (error) {
//       console.error("⚠️ Pre-checkout error:", error.message);
//     }
//   });

//   bot.on("successful_payment", async (msg) => {
//     const payment = msg.successful_payment;
//     const payload = payment.invoice_payload;
//     const amountSum = payment.total_amount / 100;

//     try {
//       const parts = payload.split("_");
//       const type = parts[0];

//       if (type === "GAME") {
//         const gameId = parts[1];
//         const telegramId = String(parts[2]);

//         // Bazadan foydalanuvchini topamiz
//         const user = await User.findOne({ where: { telegramId: telegramId } });
//         if (user) {
//           // user.id (tartib raqami) orqali UserGame yaratish
//           await UserGame.findOrCreate({
//             where: { userId: user.id, gameId: gameId },
//             defaults: { status: "paid", paymentAmount: amountSum, team: "A" },
//           });

//           const game = await Game.findByPk(gameId);
//           if (game) await game.increment("playersJoined");

//           await Transaction.create({
//             userId: user.id,
//             amount: amountSum,
//             type: "expense",
//             description: `${game?.title || "O'yin"} uchun to'lov (Telegram)`,
//             paymentMethod: "telegram_payment",
//           });

//           await bot.sendMessage(msg.chat.id, "✅ To'lov qabul qilindi!");
//         }
//       } else if (type === "TOPUP") {
//         const telegramId = String(parts[1]);
//         const user = await User.findOne({ where: { telegramId: telegramId } });
//         if (user) {
//           await user.update({
//             balance: parseFloat(user.balance || 0) + amountSum,
//           });
//           await Transaction.create({
//             userId: user.id,
//             amount: amountSum,
//             type: "income",
//             description: "Hamyon to'ldirildi",
//             paymentMethod: "telegram_payment",
//           });
//           await bot.sendMessage(msg.chat.id, "✅ Balans to'ldirildi!");
//         }
//       }
//     } catch (err) {
//       console.error("❌ To'lovda xatolik:", err);
//     }
//   });
// }

// // ------------------------------------------------------------------
// // --- DB Sync & Server Start ---
// // ------------------------------------------------------------------

// sequelize
//   .sync({ alter: true }) // Yangi ustunlarni (status, balance) qo'shish uchun
//   .then(async () => {
//     console.log("✅ Database muvaffaqiyatli ulandi");

//     // Admin (kolizey) yaratish logikasi
//     try {
//       const adminExists = await User.findOne({
//         where: { username: "kolizey" },
//       });
//       if (!adminExists) {
//         await User.create({
//           firstName: "Muhammad Siddiq",
//           lastName: "Xamidullayev",
//           username: "kolizey",
//           password: "55775577",
//           role: "admin",
//           phone: "+998 97 827-55-77",
//           xp: 99999,
//           telegramId: "000000",
//           balance: 0,
//           walletCardNumber: "GF-8600-0000-0000-0000",
//         });
//         console.log("🔥 Admin 'kolizey' yaratildi!");
//       }
//     } catch (e) {
//       console.log("⚠️ Admin yaratishda xato:", e.message);
//     }

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running on port: ${PORT}`);
//       const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${PORT}`;
//       console.log(`🔗 Swagger: https://${domain}/swagger`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB ulanishda xato:", err);
//   });











const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const { v4: uuidv4 } = require("uuid");

// 1. Modellarni import qilish
const { sequelize, User, Game, UserGame, Transaction } = require("./models");
const setupSwagger = require("./swagger/swagger");

// 2. Controllerlarni import qilish
const authController = require("./controllers/auth.controller");
const serviceController = require("./controllers/service.controller");
const userController = require("./controllers/user.controller"); // User controller kerak

// 3. Route importlari
const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paymentRoutes = require("./routes/payment.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(cors({ origin: "*" }));
app.options("*", cors());

// --- API Routes ---
app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-game", userGameRoutes);
app.use("/api/payment", paymentRoutes);

// Auth Route
app.post("/api/auth/login", authController.login);

// Service Routes
const serviceRouter = express.Router();
serviceRouter.post("/", serviceController.createService);
serviceRouter.get("/", serviceController.getAllServices);
serviceRouter.delete("/:id", serviceController.deleteService);
app.use("/api/services", serviceRouter);

// Swagger
setupSwagger(app);

// ------------------------------------------------------------------
// --- TELEGRAM BOT LOGIKASI ---
// ------------------------------------------------------------------

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (!token) {
  console.error("❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!");
} else {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    bot = new TelegramBot(token, { webHook: true });
    const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    bot.setWebHook(`${url}/bot${token}`);
    console.log(`🚀 Bot Webhook rejimida ulandi: ${url}/bot${token}`);

    app.post(`/bot${token}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  } else {
    bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Bot Polling (Local) rejimida ulandi");
  }

  bot.on("pre_checkout_query", async (query) => {
    try {
      await bot.answerPreCheckoutQuery(query.id, true);
    } catch (error) {
      console.error("⚠️ Pre-checkout error:", error.message);
    }
  });

  bot.on("successful_payment", async (msg) => {
    const payment = msg.successful_payment;
    const payload = payment.invoice_payload;
    const amountSum = payment.total_amount / 100;

    try {
      const parts = payload.split("_");
      const type = parts[0];

      if (type === "GAME") {
        const gameId = parts[1];
        const telegramId = parts[2]; // String ID

        const user = await User.findOne({
          where: { telegramId: String(telegramId) },
        });

        if (user) {
          await UserGame.create({
            userId: user.id,
            gameId: gameId,
            status: "paid",
            paymentAmount: amountSum,
            team: "A",
          });

          const game = await Game.findByPk(gameId);
          if (game) await game.increment("playersJoined");

          await Transaction.create({
            userId: user.id,
            amount: amountSum,
            type: "expense",
            description: `${game?.title || "O'yin"} uchun to'lov (Karta)`,
            paymentMethod: "telegram_payment",
          });

          await bot.sendMessage(
            msg.chat.id,
            `✅ To'lov qabul qilindi! Siz ${game?.title} o'yiniga yozildingiz.`
          );
        }
      } else if (type === "TOPUP") {
        const telegramId = parts[1]; // String ID
        const user = await User.findOne({
          where: { telegramId: String(telegramId) },
        });

        if (user) {
          const newBalance = parseFloat(user.balance || 0) + amountSum;
          await user.update({ balance: newBalance });

          if (!user.walletCardNumber) {
            const cardNum = "GF-" + uuidv4().split("-")[0].toUpperCase();
            await user.update({ walletCardNumber: cardNum });
          }

          await Transaction.create({
            userId: user.id,
            amount: amountSum,
            type: "income",
            description: "Hamyon to'ldirildi",
            paymentMethod: "telegram_payment",
          });

          await bot.sendMessage(
            msg.chat.id,
            `✅ Balans to'ldirildi! Hisobingizda: ${newBalance} so'm.`
          );
        }
      }
    } catch (err) {
      console.error("❌ To'lovda xatolik:", err);
    }
  });
}

// ------------------------------------------------------------------
// --- DB Sync & Server Start ---
// ------------------------------------------------------------------

// DIQQAT: force: true qildim. Bu bazadagi xatolarni tozalab tashlaydi.
// Bir marta ishlagandan keyin, keyingi safar 'alter: true' ga qaytarishingiz mumkin.
sequelize
  .sync({ force: true })
  .then(async () => {
    console.log("✅ Database tozalandi va qayta ulandi (Force Sync)");

    try {
      // Default Admin yaratish
      await User.create({
        firstName: "Muhammad Siddiq",
        lastName: "Xamidullayev",
        username: "kolizey",
        // Admin telegram ID si string bo'lishi kerak
        telegramId: "000000",
        balance: 1000000,
        role: "admin",
        walletCardNumber: "GF-ADMIN-8888",
        phone: "+998901234567",
      });
      console.log("🔥 Admin 'kolizey' yaratildi!");
    } catch (e) {
      console.log("⚠️ Admin yaratishda info:", e.message);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port: ${PORT}`);
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${PORT}`;
      console.log(`🔗 Swagger: https://${domain}/swagger`);
    });
  })
  .catch((err) => {
    console.error("❌ DB ulanishda xato:", err);
  });