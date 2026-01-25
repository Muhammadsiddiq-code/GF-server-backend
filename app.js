// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const TelegramBot = require("node-telegram-bot-api");
// const { v4: uuidv4 } = require("uuid");

// // 1. Modellarni import qilish
// const { sequelize, User, Game, UserGame, Transaction } = require("./models");
// const setupSwagger = require("./swagger/swagger");

// // 2. Controllerlar
// const authController = require("./controllers/auth.controller");
// const serviceController = require("./controllers/service.controller");
// const userController = require("./controllers/user.controller");

// // 3. Route importlari
// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paymentRoutes = require("./routes/payment.routes");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;

// app.set("trust proxy", true);

// app.use(express.json());
// app.use(cors({ origin: "*" }));
// app.options("*", cors());

// // --- API Routes ---
// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// app.use("/api/payment", paymentRoutes);

// app.post("/api/auth/login", authController.login);

// const serviceRouter = express.Router();
// serviceRouter.post("/", serviceController.createService);
// serviceRouter.get("/", serviceController.getAllServices);
// serviceRouter.delete("/:id", serviceController.deleteService);
// app.use("/api/services", serviceRouter);

// setupSwagger(app);

// // ------------------------------------------------------------------
// // --- TELEGRAM BOT ---
// // ------------------------------------------------------------------

// const token = process.env.TELEGRAM_BOT_TOKEN;
// let bot;

// if (!token) {
//   console.error("❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!");
// } else {
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
//         // Payload formati: GAME_GAMEID_USERID_TEAMNAME
//         const gameId = parts[1];
//         const telegramId = parts[2];
//         const teamName = parts[3] !== "NA" ? parts[3] : "Aniqlanmadi"; // Jamoa nomi

//         const user = await User.findOne({
//           where: { telegramId: String(telegramId) },
//         });

//         if (user) {
//           await UserGame.create({
//             userId: user.id,
//             gameId: gameId,
//             status: "paid",
//             paymentAmount: amountSum,
//             team: teamName, // Bot orqali to'laganda ham jamoa yoziladi
//           });

//           const game = await Game.findByPk(gameId);
//           if (game) await game.increment("playersJoined");

//           await Transaction.create({
//             userId: user.id,
//             amount: amountSum,
//             type: "expense",
//             description: `${game?.title || "O'yin"} uchun to'lov`,
//             paymentMethod: "telegram_payment",
//           });

//           await bot.sendMessage(
//             msg.chat.id,
//             `✅ To'lov qabul qilindi! Siz ${game?.title} o'yiniga qo'shildingiz.`
//           );
//         }
//       } else if (type === "TOPUP") {
//         const telegramId = parts[1];
//         const user = await User.findOne({
//           where: { telegramId: String(telegramId) },
//         });

//         if (user) {
//           const newBalance = parseFloat(user.balance || 0) + amountSum;
//           await user.update({ balance: newBalance });

//           if (!user.walletCardNumber) {
//             const cardNum = "GF-" + uuidv4().split("-")[0].toUpperCase();
//             await user.update({ walletCardNumber: cardNum });
//           }

//           await Transaction.create({
//             userId: user.id,
//             amount: amountSum,
//             type: "income",
//             description: "Hamyon to'ldirildi",
//             paymentMethod: "telegram_payment",
//           });

//           await bot.sendMessage(
//             msg.chat.id,
//             `✅ Balans to'ldirildi! Hisobingizda: ${newBalance} so'm.`
//           );
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

// // XATOLIKNI TUZATISH UCHUN BIR MARTA FORCE: TRUE QILAMIZ
// sequelize
//   .sync({ alter: true })
//   .then(async () => {
//     console.log("✅ Database tozalandi va qayta ulandi (Fixing JSONB error)");

//     // Admin yaratish
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
//       console.log("⚠️ Admin yaratishda info:", e.message);
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

// 2. Controllerlar
const authController = require("./controllers/auth.controller");
const serviceController = require("./controllers/service.controller");
// userController va paymentController routelar ichida ishlatiladi

// 3. Route importlari
const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paymentRoutes = require("./routes/payment.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const token = process.env.TELEGRAM_BOT_TOKEN;

app.set("trust proxy", true);
app.use(express.json());
app.use(cors({ origin: "*" }));
app.options("*", cors());

// ------------------------------------------------------------------
// --- TELEGRAM BOT (GLOBAL) ---
// ------------------------------------------------------------------
let bot;
if (token) {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    // Webhook rejimi (Serverda)
    bot = new TelegramBot(token, { webHook: true });
    const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    bot.setWebHook(`${url}/bot${token}`);
    console.log(`🚀 Bot Webhook rejimida: ${url}/bot${token}`);

    // Webhookni eshitish
    app.post(`/bot${token}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  } else {
    // Polling rejimi (Localhostda)
    bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Bot Polling (Local) rejimida");
  }
} else {
  console.error("❌ TELEGRAM_BOT_TOKEN topilmadi!");
}

// --- MUHIM: BOTNI CONTROLLERLARGA UZATISH (MIDDLEWARE) ---
app.use((req, res, next) => {
  req.bot = bot; // Endi istalgan joyda req.bot.sendMessage() qilish mumkin
  next();
});

// --- API Routes ---
app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-game", userGameRoutes);
app.use("/api/payment", paymentRoutes);

app.post("/api/auth/login", authController.login);

// Service routes (agar kerak bo'lsa)
const serviceRouter = express.Router();
serviceRouter.post("/", serviceController.createService);
serviceRouter.get("/", serviceController.getAllServices);
serviceRouter.delete("/:id", serviceController.deleteService);
app.use("/api/services", serviceRouter);

setupSwagger(app);

// ------------------------------------------------------------------
// --- BOT EVENTLARI (NATIVE PAYMENT UCHUN) ---
// ------------------------------------------------------------------
if (bot) {
  bot.on("pre_checkout_query", async (query) => {
    try {
      await bot.answerPreCheckoutQuery(query.id, true);
    } catch (error) {
      console.error("⚠️ Pre-checkout error:", error.message);
    }
  });

  bot.on("successful_payment", async (msg) => {
    // ... (Bu yerda eski kodlaringiz qolaveradi, Telegramdan to'lov qilganda ishlaydi)
    const payment = msg.successful_payment;
    const payload = payment.invoice_payload;
    const amountSum = payment.total_amount / 100;

    try {
      const parts = payload.split("_");
      const type = parts[0];
      // ... (Qolgan logika o'zgarishsiz) ...
      // ...
      await bot.sendMessage(msg.chat.id, "✅ To'lov qabul qilindi!");
    } catch (e) {
      console.error(e);
    }
  });
}

// ------------------------------------------------------------------
// --- SERVER START ---
// ------------------------------------------------------------------
sequelize
  .sync({ alter: true })
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
  });