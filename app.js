// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const TelegramBot = require("node-telegram-bot-api");
// const { v4: uuidv4 } = require("uuid");
// const path = require("path");

// // 1. Modellarni import qilish
// const { sequelize, User, Game, UserGame, Transaction } = require("./models");
// const setupSwagger = require("./swagger/swagger");

// // 2. Controllerlar
// const authController = require("./controllers/auth.controller");
// const serviceController = require("./controllers/service.controller");

// // 3. Route importlari
// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paymentRoutes = require("./routes/payment.routes");
// const authRoutes = require("./routes/auth.routes"); // ✅ YANGI: Auth routelar (Admin uchun)
// const paymeRoutes = require("./routes/payme.routes");

// // ...
// app.use("/api/payment", paymentRoutes);

// // Payme JSON-RPC callback endpoint
// app.use("/api/payme", paymeRoutes);


// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;
// const token = process.env.TELEGRAM_BOT_TOKEN;

// app.set("trust proxy", true);
// app.use(express.json());
// app.use(express.urlencoded({ extended: true })); // ✅ QOSHIMCHA: Form data uchun
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
//   req.bot = bot;
//   next();
// });

// // --- STATIC FILES ---
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // --- API Routes ---
// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// // ⚠️ O'ZGARISH: Eski bittalik login o'rniga to'liq routerni ulaymiz
// // Bu yerda endi /api/auth/login (User) va /api/auth/admin-login (Admin) ikkalasi ham ishlaydi
// app.use("/api/auth", authRoutes);

// // Service routes
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
//     const payment = msg.successful_payment;
//     const payload = payment.invoice_payload;

//     try {
//       // To'lov logikangiz shu yerda qolaveradi...
//       console.log("To'lov muvaffaqiyatli:", payload);
//       await bot.sendMessage(msg.chat.id, "✅ To'lov qabul qilindi!");
//     } catch (e) {
//       console.error("Payment Error:", e);
//     }
//   });
// }

// // ------------------------------------------------------------------
// // --- SERVER START ---
// // ------------------------------------------------------------------
// sequelize
//   .sync({ alter: true })
//   .then(async () => {
//     // ✅ ASYNC qo'shildi
//     console.log("✅ Baza bilan ulandi.");

//     // ✅ YANGI: Default Adminni tekshirish va yaratish
//     // Agar baza bo'sh bo'lsa, 'admin' / '123' ni yaratadi
//     if (authController.initDefaultAdmin) {
//       await authController.initDefaultAdmin();
//     }

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running on port: ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB Error:", err);
//   });


















// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const TelegramBot = require("node-telegram-bot-api");
// const path = require("path");

// dotenv.config();

// const app = express();
// app.set("trust proxy", true);

// // ✅ Body parsers
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ CORS (dev + prod)
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://127.0.0.1:5173",
//   // agar ngrok yoki domen bo'lsa qo'shib qo'ying:
//   "https://scenic-noncomprehendible-garrison.ngrok-free.dev",
// ];

// app.use(
//   cors({
//     origin: (origin, cb) => {
//       // origin bo'lmasa (Postman/Server-to-server) ruxsat
//       if (!origin) return cb(null, true);
//       if (allowedOrigins.includes(origin)) return cb(null, true);
//       return cb(new Error("Not allowed by CORS: " + origin));
//     },
//     credentials: true,
//   })
// );
// app.options("*", cors());

// // ✅ Static
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // -------------------- BOT --------------------
// const token = process.env.TELEGRAM_BOT_TOKEN;
// let bot = null;

// if (token) {
//   if (process.env.RAILWAY_PUBLIC_DOMAIN) {
//     bot = new TelegramBot(token, { webHook: true });
//     const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
//     bot.setWebHook(`${url}/bot${token}`);
//     console.log(`🚀 Bot Webhook: ${url}/bot${token}`);

//     app.post(`/bot${token}`, (req, res) => {
//       bot.processUpdate(req.body);
//       res.sendStatus(200);
//     });
//   } else {
//     bot = new TelegramBot(token, { polling: true });
//     console.log("🤖 Bot polling (local)");
//   }
// } else {
//   console.error("❌ TELEGRAM_BOT_TOKEN topilmadi!");
// }

// // ✅ Botni controllerlarga uzatish
// app.use((req, res, next) => {
//   req.bot = bot;
//   next();
// });

// // ✅ Health endpoint (Railway test uchun)
// app.get("/health", (req, res) => res.json({ ok: true }));

// // -------------------- ROUTES --------------------
// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paymentRoutes = require("./routes/payment.routes");
// const authRoutes = require("./routes/auth.routes");
// const paymeRoutes = require("./routes/payme.routes");
// const setupSwagger = require("./swagger/swagger");

// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/auth", authRoutes);

// // Payme JSON-RPC callback
// app.use("/api/payme", paymeRoutes);

// setupSwagger(app);

// // -------------------- START --------------------
// const { sequelize } = require("./models");
// const authController = require("./controllers/auth.controller");

// const PORT = process.env.PORT || 8080;

// sequelize
//   .sync({ alter: true })
//   .then(async () => {
//     console.log("✅ DB connected & synced");

//     if (authController.initDefaultAdmin) {
//       await authController.initDefaultAdmin();
//     }

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server running: ${PORT}`);
//     });
//   })
//   .catch((err) => console.error("❌ DB Error:", err));
























const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

dotenv.config();

// ✅ Rate Limiting - Payment endpointlar uchun (hackerlardan himoya)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 30,                   // Har 15 daqiqada max 30 ta so'rov
  message: { msg: "Juda ko'p so'rov. Iltimos 15 daqiqadan keyin urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { msg: "Juda ko'p so'rov yuborildi." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------- DIQQAT! SHU YERGA FRONTEND LINKINI QOYING ----------------
// Foydalanuvchi Web App tugmasini bosganda ochiladigan sayt (Sizning React saytingiz)
const WEB_APP_URL = "https://goforfun.vercel.app";
// ---------------------------------------------------------------------------

const app = express();
app.set("trust proxy", 1);

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS (ALLOW ALL)
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
    "baggage",
    "sentry-trace"
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---------------- SOCKET.IO SERVER ----------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

io.on("connection", (socket) => {
  // Foydalanuvchi ulandi
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ✅ Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- BOT SETUP --------------------
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (token) {
  // 1. Botni ishga tushirish (Webhook yoki Polling)
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    bot = new TelegramBot(token, { webHook: true });
    const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    bot.setWebHook(`${url}/bot${token}`);
    console.log(`🚀 Bot Webhook: ${url}/bot${token}`);

    // Webhook orqali kelgan xabarlarni qabul qilish
    app.post(`/bot${token}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  } else {
    bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Bot polling (local)");
  }

  // 2. /start bosilganda Web App tugmasini chiqarish
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const startParam = match[1] ? match[1].trim() : "";

    // Referral kodi bo'lsa, WebApp URL ga qo'shamiz
    let webAppUrl = WEB_APP_URL;
    if (startParam) {
      const separator = WEB_APP_URL.includes("?") ? "&" : "?";
      webAppUrl = `${WEB_APP_URL}${separator}startapp=${startParam}`;
    }

    await bot.sendMessage(chatId, "👋 Assalomu alaykum! O'yinni boshlash uchun quyidagi tugmani bosing:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 O'yinni ochish", web_app: { url: webAppUrl } }]
        ]
      }
    });
  });

  // 3. Pastki chap burchakdagi "Menu" tugmasini Web App ga aylantirish
  bot.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "O'yinni ochish",
      web_app: { url: WEB_APP_URL }
    }
  }).catch(err => console.error("Menu button error:", err));

} else {
  console.error("❌ TELEGRAM_BOT_TOKEN topilmadi!");
}

// ✅ Botni controllerlarga uzatish (Middleware)
app.use((req, res, next) => {
  req.bot = bot;
  next();
});

// ✅ Health endpoint
app.get("/health", (req, res) => res.json({ ok: true }));

// -------------------- ROUTES --------------------
const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paymentRoutes = require("./routes/payment.routes");
const authRoutes = require("./routes/auth.routes");
const paymeRoutes = require("./routes/payme.routes");
const statsRoutes = require("./routes/stats.routes");
const referralRoutes = require("./routes/referral.routes");
const notificationRoutes = require("./routes/notification.routes");
const setupSwagger = require("./swagger/swagger");

// ✅ Umumiy rate limiter
app.use("/api", generalLimiter);

app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-game", userGameRoutes);
app.use("/api/payment", paymentLimiter, paymentRoutes); // ✅ Qattiq rate limit
app.use("/api/auth", authRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api", notificationRoutes);

// Payme JSON-RPC callback (rate limit qo'ymaymiz — Payme serveridan keladi)
app.use("/api/payme", paymeRoutes);

// CLICK SHOP API callback (rate limit qo'ymaymiz — CLICK serveridan keladi)
const clickRoutes = require("./routes/click.routes");
app.use("/api/payments/click", clickRoutes);

setupSwagger(app);

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Faqat rasm fayllar qabul qilinadi!") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: err.message || "Server xatosi" });
});

// -------------------- START SERVER --------------------
const { sequelize } = require("./models");
const authController = require("./controllers/auth.controller");
const referralController = require("./controllers/referral.controller");

const PORT = process.env.PORT || 5577;

// ✅ Error handling for database connection
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("✅ DB connected & synced");

    if (authController.initDefaultAdmin) {
      await authController.initDefaultAdmin();
    }

    // Referral default sozlamalarni yaratish
    if (referralController.initDefaultSettings) {
      await referralController.initDefaultSettings();
    }

    // ========== YANGI: XP CONVERSION SECURITY SETTINGS ==========
    try {
      const initXpSecuritySettings = require("./config/xp-security-seeder");
      const { Setting } = require("./models");
      await initXpSecuritySettings(Setting);
    } catch (error) {
      console.error("⚠️ Warning: Could not initialize XP security settings:", error.message);
      // Continue server startup even if seeder fails
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running with Socket.IO: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
    console.error("❌ Server couldn't start due to database error");
    // Server DB error bilan ham ishlashda davom etishi kerak (Railway uchun)
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`⚠️ Server running on PORT ${PORT} (without DB)`);
    });
  });
