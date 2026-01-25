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

// 1. Modellarni import qilish
const { sequelize, User, Game, UserGame, Transaction } = require("./models");
const setupSwagger = require("./swagger/swagger");

// Route importlari
const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paymentRoutes = require("./routes/payment.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Railway va NGROK uchun
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

// Auth & Service Routes
const authController = require("./controllers/auth.controller");
app.post("/api/auth/login", authController.login);

const serviceController = require("./controllers/service.controller");
const serviceRouter = require("express").Router();
serviceRouter.post("/", serviceController.createService);
serviceRouter.get("/", serviceController.getAllServices);
serviceRouter.delete("/:id", serviceController.deleteService);
app.use("/api/services", serviceRouter);

// Swagger
setupSwagger(app);

// ------------------------------------------------------------------
// --- TELEGRAM BOT LOGIKASI (WEBHOOK & PAYMENTS) ---
// ------------------------------------------------------------------

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (!token) {
  console.error("❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!");
} else {
  // 1. Botni ishga tushirish (Conflict oldini olish uchun)
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

  // 2. To'lovdan oldin tekshiruv (Pre-checkout)
  bot.on("pre_checkout_query", async (query) => {
    try {
      await bot.answerPreCheckoutQuery(query.id, true);
    } catch (error) {
      console.error("⚠️ Pre-checkout error:", error.message);
    }
  });

  // // 3. Muvaffaqiyatli to'lov (Successful Payment)
  // bot.on("successful_payment", async (msg) => {
  //   console.log("✅ TO'LOV QABUL QILINDI!");

  //   const payment = msg.successful_payment;
  //   const payload = payment.invoice_payload;
  //   const amountSum = payment.total_amount / 100;

  //   try {
  //     const parts = payload.split("_");
  //     const type = parts[0]; // GAME yoki TOPUP

  //     // --- A) O'YINGA QO'SHILISH (GAME_gameId_telegramId) ---
  //     if (type === "GAME") {
  //       const gameId = parts[1];
  //       const telegramId = String(parts[2]);

  //       // Avval foydalanuvchini bazadagi ID-sini topamiz (Primary Key uchun)
  //       const user = await User.findOne({ where: { telegramId: telegramId } });

  //       if (user) {
  //         // UserGame yaratish (Database ID ishlatiladi)
  //         const [entry, created] = await UserGame.findOrCreate({
  //           where: { userId: user.id, gameId: gameId },
  //           defaults: {
  //             status: "paid",
  //             paymentAmount: amountSum,
  //             team: "A",
  //           },
  //         });

  //         if (created) {
  //           const game = await Game.findByPk(gameId);
  //           if (game) await game.increment("playersJoined");

  //           // Transaction yozish
  //           await Transaction.create({
  //             userId: user.id,
  //             amount: amountSum,
  //             type: "expense",
  //             description: `${game?.title || "O'yin"} uchun to'lov (Bot)`,
  //             paymentMethod: "telegram_payment",
  //           });

  //           await bot.sendMessage(
  //             msg.chat.id,
  //             "✅ To'lov qabul qilindi! Siz o'yinga yozildingiz."
  //           );
  //         } else {
  //           await bot.sendMessage(
  //             msg.chat.id,
  //             "⚠️ Siz allaqachon bu o'yinga yozilgansiz."
  //           );
  //         }
  //       }
  //     }

  //     // --- B) HAMYONNI TO'LDIRISH (TOPUP_telegramId_summa) ---
  //     else if (type === "TOPUP") {
  //       const telegramId = String(parts[1]);

  //       const user = await User.findOne({ where: { telegramId: telegramId } });
  //       if (user) {
  //         // Balansni oshirish
  //         await user.update({
  //           balance: parseFloat(user.balance || 0) + amountSum,
  //         });

  //         // Transaction yozish
  //         await Transaction.create({
  //           userId: user.id,
  //           amount: amountSum,
  //           type: "income",
  //           description: "Hamyon to'ldirildi (Bot)",
  //           paymentMethod: "telegram_payment",
  //         });

  //         await bot.sendMessage(
  //           msg.chat.id,
  //           `✅ Balans to'ldirildi! +${amountSum.toLocaleString()} UZS`
  //         );
  //       }
  //     }
  //   } catch (err) {
  //     console.error("❌ To'lovni qayta ishlashda xatolik:", err);
  //   }
  // });

  // app.js ichidagi bot.on("successful_payment", ...) qismini shunga almashtiring:

  bot.on("successful_payment", async (msg) => {
    const payment = msg.successful_payment;
    const payload = payment.invoice_payload;
    const amountSum = payment.total_amount / 100;

    try {
      const parts = payload.split("_");
      const type = parts[0];

      if (type === "GAME") {
        const gameId = parts[1];
        const telegramId = String(parts[2]);

        // Bazadan foydalanuvchini topamiz
        const user = await User.findOne({ where: { telegramId: telegramId } });
        if (user) {
          // user.id (tartib raqami) orqali UserGame yaratish
          await UserGame.findOrCreate({
            where: { userId: user.id, gameId: gameId },
            defaults: { status: "paid", paymentAmount: amountSum, team: "A" },
          });

          const game = await Game.findByPk(gameId);
          if (game) await game.increment("playersJoined");

          await Transaction.create({
            userId: user.id,
            amount: amountSum,
            type: "expense",
            description: `${game?.title || "O'yin"} uchun to'lov (Telegram)`,
            paymentMethod: "telegram_payment",
          });

          await bot.sendMessage(msg.chat.id, "✅ To'lov qabul qilindi!");
        }
      } else if (type === "TOPUP") {
        const telegramId = String(parts[1]);
        const user = await User.findOne({ where: { telegramId: telegramId } });
        if (user) {
          await user.update({
            balance: parseFloat(user.balance || 0) + amountSum,
          });
          await Transaction.create({
            userId: user.id,
            amount: amountSum,
            type: "income",
            description: "Hamyon to'ldirildi",
            paymentMethod: "telegram_payment",
          });
          await bot.sendMessage(msg.chat.id, "✅ Balans to'ldirildi!");
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

sequelize
  .sync({ alter: true }) // Yangi ustunlarni (status, balance) qo'shish uchun
  .then(async () => {
    console.log("✅ Database muvaffaqiyatli ulandi");

    // Admin (kolizey) yaratish logikasi
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
          balance: 0,
          walletCardNumber: "GF-8600-0000-0000-0000",
        });
        console.log("🔥 Admin 'kolizey' yaratildi!");
      }
    } catch (e) {
      console.log("⚠️ Admin yaratishda xato:", e.message);
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