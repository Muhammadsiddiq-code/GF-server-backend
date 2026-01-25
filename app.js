// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");

// // 1. User modelini ham import qilish kerak (Admin yaratish uchun)
// const { sequelize, User } = require("./models");
// const setupSwagger = require("./swagger/swagger");

// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paynetRoutes = require("./routes/paynet.routes");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;

// // NGROK va Railway uchun
// app.set("trust proxy", true);

// // Middlewares
// app.use(express.json());
// app.use(
//   cors({
//     origin: "*",
//   })
// );

// app.options("*", cors());

// // Routes
// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// app.use("/api/paynet", paynetRoutes);

// // Auth Route
// const authController = require("./controllers/auth.controller");
// app.post("/api/auth/login", authController.login);

// // Service Routes
// const serviceController = require("./controllers/service.controller");
// const serviceRouter = require("express").Router();

// serviceRouter.post("/", serviceController.createService);
// serviceRouter.get("/", serviceController.getAllServices);
// serviceRouter.delete("/:id", serviceController.deleteService);

// app.use("/api/services", serviceRouter);

// // Swagger
// setupSwagger(app);

// // DB + Server
// sequelize
//   .sync({ alter: true })
//   .then(async () => {
//     console.log("✅ Database ulandi");

//     // --- ADMIN YARATISH LOGIKASI ---
//     try {
//       // 1. "kolizey" foydalanuvchisini qidiramiz
//       const adminExists = await User.findOne({
//         where: { username: "kolizey" },
//       });

//       if (!adminExists) {
//         // Agar yo'q bo'lsa, yaratamiz
//         await User.create({
//           firstName: "Muhammad Siddiq",
//           lastName: "Xamidullayev",
//           username: "kolizey", // LOGIN
//           password: "55775577", // PAROL
//           role: "admin",
//           phone: "+998 97 827-55-77",
//           xp: 99999,
//           telegramId: "000000",
//           photo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
//         });
//         console.log(
//           "🔥 DIQQAT: Admin yaratildi! Login: 'kolizey', Parol: '5577'"
//         );
//       } else {
//         console.log("👍 'kolizey' admini allaqachon mavjud.");
//       }
//     } catch (e) {
//       console.log("⚠️ Admin yaratishda xatolik:", e.message);
//     }
//     // -------------------------------

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 API running on port: ${PORT}`);
//       // Railway domenini to'g'ri olish
//       const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${PORT}`;
//       console.log(`🔗 Swagger UI: https://${domain}/swagger`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB error:", err);
//   });
















const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

// Modellarni import qilish
const { sequelize, User, Game, UserGame, Transaction } = require("./models"); // Transaction qo'shildi
const setupSwagger = require("./swagger/swagger");

const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paymentRoutes = require("./routes/payment.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// NGROK va Railway uchun
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(cors({ origin: "*" }));
app.options("*", cors());

// Routes
app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-game", userGameRoutes);
app.use("/api/payment", paymentRoutes);

// Auth Route
const authController = require("./controllers/auth.controller");
app.post("/api/auth/login", authController.login);

// Service Routes
const serviceController = require("./controllers/service.controller");
const serviceRouter = require("express").Router();
serviceRouter.post("/", serviceController.createService);
serviceRouter.get("/", serviceController.getAllServices);
serviceRouter.delete("/:id", serviceController.deleteService);
app.use("/api/services", serviceRouter);

// Swagger
setupSwagger(app);

// ------------------------------------------------------------------
// --- TELEGRAM BOT & PAYMENT LOGIKASI (YANGILANGAN) ---
// ------------------------------------------------------------------

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (!token) {
  console.error("❌ XATOLIK: TELEGRAM_BOT_TOKEN .env faylida yo'q!");
} else {
  // 1. WEBHOOK YOKI POLLINGNI ANIQLASH (409 Conflict oldini olish uchun)
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    // Railway (Production) -> Webhook
    bot = new TelegramBot(token, { webHook: true });
    const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    bot.setWebHook(`${url}/bot${token}`);
    console.log(`🚀 Bot Webhook rejimida: ${url}/bot${token}`);

    // Webhook Route
    app.post(`/bot${token}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  } else {
    // Lokal (Development) -> Polling
    bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Bot Polling (Test) rejimida");
  }

  // 2. PRE-CHECKOUT (To'lovdan oldin tekshiruv)
  bot.on("pre_checkout_query", async (query) => {
    try {
      await bot.answerPreCheckoutQuery(query.id, true);
    } catch (error) {
      console.error("⚠️ Pre-checkout xatosi:", error.message);
    }
  });

  // 3. SUCCESSFUL PAYMENT (To'lov muvaffaqiyatli o'tganda)
  bot.on("successful_payment", async (msg) => {
    console.log("✅ TO'LOV MUVAFFAQIYATLI BO'LDI!");

    const payment = msg.successful_payment;
    const payload = payment.invoice_payload; // Masalan: "GAME_5_12345" yoki "TOPUP_12345_10000"
    const amountSum = payment.total_amount / 100; // Tiyindan so'mga

    console.log("Payload:", payload);
    console.log("Summa:", amountSum);

    try {
      // Payloadni tahlil qilish (GAME yoki TOPUP)
      const parts = payload.split("_");
      const type = parts[0]; // GAME yoki TOPUP

      // --- A) O'YIN UCHUN TO'LOV (GAME_GameID_UserID) ---
      if (type === "GAME") {
        const gameId = parts[1];
        const telegramId = parts[2];

        const user = await User.findOne({ where: { telegramId: telegramId } });
        if (user) {
          // UserGame yaratish
          const existingEntry = await UserGame.findOne({
            where: { userId: user.id, gameId: gameId },
          });

          if (!existingEntry) {
            await UserGame.create({
              userId: user.id,
              gameId: gameId,
              status: "paid",
              paymentAmount: amountSum,
              team: "A",
            });

            // O'yin statistikasini yangilash
            const game = await Game.findByPk(gameId);
            if (game) await game.increment("playersJoined");

            // Tarixga yozish (Transaction)
            await Transaction.create({
              userId: user.id,
              amount: amountSum,
              type: "expense", // Chiqim
              description: `${game?.title || "O'yin"} uchun to'lov`,
              paymentMethod: "telegram_payment",
            });

            // Xabar yuborish
            await bot.sendMessage(
              msg.chat.id,
              `✅ <b>To'lov qabul qilindi!</b>\nSiz o'yinga yozildingiz.`,
              { parse_mode: "HTML" }
            );
          }
        }
      }

      // --- B) HISOB TO'LDIRISH (TOPUP_UserID_Amount) ---
      else if (type === "TOPUP") {
        const telegramId = parts[1];
        // const amount = parts[2]; // Payload dagi summa (tekshirish uchun)

        const user = await User.findOne({ where: { telegramId: telegramId } });
        if (user) {
          // Balansni oshirish
          await user.increment("balance", { by: amountSum });

          // Tarixga yozish (Transaction)
          await Transaction.create({
            userId: user.id,
            amount: amountSum,
            type: "income", // Kirim
            description: "Hamyonni to'ldirish",
            paymentMethod: "telegram_payment",
          });

          await bot.sendMessage(
            msg.chat.id,
            `✅ <b>Hisob to'ldirildi!</b>\nBalansingizga +${amountSum.toLocaleString()} so'm qo'shildi.`,
            { parse_mode: "HTML" }
          );
        }
      }
    } catch (err) {
      console.error("❌ To'lovni bazaga yozishda xatolik:", err);
    }
  });
}
// ------------------------------------------------------------------

// DB + Server
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("✅ Database ulandi");

    // Admin yaratish
    try {
      const adminExists = await User.findOne({
        where: { username: "kolizey" },
      });
      if (!adminExists) {
        await User.create({
          firstName: "Muhammad Siddiq",
          lastName: "Xamidullayev",
          username: "kolizey",
          password: "55775577",
          role: "admin",
          phone: "+998 97 827-55-77",
          xp: 99999,
          telegramId: "000000",
          photo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          balance: 0,
          walletCardNumber: "GF-8600-0000-0000-0000",
        });
        console.log("🔥 Admin yaratildi: 'kolizey'");
      }
    } catch (e) {
      console.log("⚠️ Admin yaratishda xatolik:", e.message);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API running on port: ${PORT}`);
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${PORT}`;
      console.log(`🔗 Swagger UI: https://${domain}/swagger`);
    });
  })
  .catch((err) => {
    console.error("❌ DB error:", err);
  });