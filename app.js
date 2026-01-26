
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
// // userController va paymentController routelar ichida ishlatiladi

// // 3. Route importlari
// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paymentRoutes = require("./routes/payment.routes");
// const path = require("path");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;
// const token = process.env.TELEGRAM_BOT_TOKEN;

// app.set("trust proxy", true);
// app.use(express.json());
// app.use(cors({ origin: "*" }));
// app.options("*", cors());

// // ------------------------------------------------------------------
// // --- TELEGRAM BOT (GLOBAL) ---
// // ------------------------------------------------------------------
// let bot;
// if (token) {
//   if (process.env.RAILWAY_PUBLIC_DOMAIN) {
//     // Webhook rejimi (Serverda)
//     bot = new TelegramBot(token, { webHook: true });
//     const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
//     bot.setWebHook(`${url}/bot${token}`);
//     console.log(`🚀 Bot Webhook rejimida: ${url}/bot${token}`);

//     // Webhookni eshitish
//     app.post(`/bot${token}`, (req, res) => {
//       bot.processUpdate(req.body);
//       res.sendStatus(200);
//     });
//   } else {
//     // Polling rejimi (Localhostda)
//     bot = new TelegramBot(token, { polling: true });
//     console.log("🤖 Bot Polling (Local) rejimida");
//   }
// } else {
//   console.error("❌ TELEGRAM_BOT_TOKEN topilmadi!");
// }

// // --- MUHIM: BOTNI CONTROLLERLARGA UZATISH (MIDDLEWARE) ---
// app.use((req, res, next) => {
//   req.bot = bot; // Endi istalgan joyda req.bot.sendMessage() qilish mumkin
//   next();
// });


// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // --- API Routes ---
// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// app.use("/api/payment", paymentRoutes);

// app.post("/api/auth/login", authController.login);

// // Service routes (agar kerak bo'lsa)
// const serviceRouter = express.Router();
// serviceRouter.post("/", serviceController.createService);
// serviceRouter.get("/", serviceController.getAllServices);
// serviceRouter.delete("/:id", serviceController.deleteService);
// app.use("/api/services", serviceRouter);

// setupSwagger(app);

// // ------------------------------------------------------------------
// // --- BOT EVENTLARI (NATIVE PAYMENT UCHUN) ---
// // ------------------------------------------------------------------
// if (bot) {
//   bot.on("pre_checkout_query", async (query) => {
//     try {
//       await bot.answerPreCheckoutQuery(query.id, true);
//     } catch (error) {
//       console.error("⚠️ Pre-checkout error:", error.message);
//     }
//   });

//   bot.on("successful_payment", async (msg) => {
//     // ... (Bu yerda eski kodlaringiz qolaveradi, Telegramdan to'lov qilganda ishlaydi)
//     const payment = msg.successful_payment;
//     const payload = payment.invoice_payload;
//     const amountSum = payment.total_amount / 100;

//     try {
//       const parts = payload.split("_");
//       const type = parts[0];
//       // ... (Qolgan logika o'zgarishsiz) ...
//       // ...
//       await bot.sendMessage(msg.chat.id, "✅ To'lov qabul qilindi!");
//     } catch (e) {
//       console.error(e);
//     }
//   });
// }

// // ------------------------------------------------------------------
// // --- SERVER START ---
// // ------------------------------------------------------------------
// sequelize
//   .sync({ alter: true })
//   .then(() => {
//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running on port: ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB Error:", err);
//   });


















const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// 1. Modellarni import qilish
const { sequelize, User, Game, UserGame, Transaction } = require("./models");
const setupSwagger = require("./swagger/swagger");

// 2. Controllerlar
const authController = require("./controllers/auth.controller");
const serviceController = require("./controllers/service.controller");

// 3. Route importlari
const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paymentRoutes = require("./routes/payment.routes");
const authRoutes = require("./routes/auth.routes"); // ✅ YANGI: Auth routelar (Admin uchun)

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const token = process.env.TELEGRAM_BOT_TOKEN;

app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ QOSHIMCHA: Form data uchun
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
  req.bot = bot;
  next();
});

// --- STATIC FILES ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- API Routes ---
app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-game", userGameRoutes);
app.use("/api/payment", paymentRoutes);

// ⚠️ O'ZGARISH: Eski bittalik login o'rniga to'liq routerni ulaymiz
// Bu yerda endi /api/auth/login (User) va /api/auth/admin-login (Admin) ikkalasi ham ishlaydi
app.use("/api/auth", authRoutes);

// Service routes
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
    const payment = msg.successful_payment;
    const payload = payment.invoice_payload;

    try {
      // To'lov logikangiz shu yerda qolaveradi...
      console.log("To'lov muvaffaqiyatli:", payload);
      await bot.sendMessage(msg.chat.id, "✅ To'lov qabul qilindi!");
    } catch (e) {
      console.error("Payment Error:", e);
    }
  });
}

// ------------------------------------------------------------------
// --- SERVER START ---
// ------------------------------------------------------------------
sequelize
  .sync({ alter: true })
  .then(async () => {
    // ✅ ASYNC qo'shildi
    console.log("✅ Baza bilan ulandi.");

    // ✅ YANGI: Default Adminni tekshirish va yaratish
    // Agar baza bo'sh bo'lsa, 'admin' / '123' ni yaratadi
    if (authController.initDefaultAdmin) {
      await authController.initDefaultAdmin();
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
  });