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
const TelegramBot = require("node-telegram-bot-api"); // <-- YANGI

// Modellarni import qilish
const { sequelize, User, Game, UserGame } = require("./models"); // Game va UserGame ham kerak
const setupSwagger = require("./swagger/swagger");

const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
// const paynetRoutes = require("./routes/paynet.routes"); // Agar kerak bo'lmasa o'chirib turing
const paymentRoutes = require("./routes/payment.routes"); // <-- YANGI: Payment Routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// NGROK va Railway uchun
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.options("*", cors());

// Routes
app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-game", userGameRoutes);
// app.use("/api/paynet", paynetRoutes);
app.use("/api/payment", paymentRoutes); // <-- YANGI: Payment API ulandi

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
// --- TELEGRAM BOT & PAYMENT LOGIKASI (YANGI QO'SHILGAN QISM) ---
// ------------------------------------------------------------------

// Bot Tokenini tekshirish
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ XATOLIK: TELEGRAM_BOT_TOKEN .env faylida yo'q!");
} else {
  // Botni ishga tushiramiz (Polling rejimida)
  const bot = new TelegramBot(token, { polling: true });
  console.log("🤖 Telegram Bot ishga tushdi (Payment uchun)");

  // 1. PRE-CHECKOUT QUERY (To'lovdan oldingi tekshiruv)
  // Foydalanuvchi "To'lash" tugmasini bosganda Telegram shu yerni chaqiradi.
  // Biz 10 soniya ichida "ok" deb javob berishimiz shart, bo'lmasa to'lov bekor bo'ladi.
  bot.on("pre_checkout_query", async (query) => {
    console.log("💰 To'lov so'rovi keldi:", query.id, query.from.first_name);

    // Bu yerda qo'shimcha tekshiruvlar qilish mumkin (masalan, joy qolganmi yo'qmi)
    // Hozircha har doim ruxsat beramiz (ok: true)
    try {
      await bot.answerPreCheckoutQuery(query.id, true);
    } catch (error) {
      console.error("⚠️ Pre-checkout xatosi:", error.message);
    }
  });

  // 2. SUCCESSFUL PAYMENT (To'lov muvaffaqiyatli o'tganda)
  // Payme yoki Click pulni yechib olgandan keyin shu ishlaydi.
  bot.on("successful_payment", async (msg) => {
    console.log("✅ TO'LOV MUVAFFAQIYATLI BO'LDI!");

    const payment = msg.successful_payment;
    // Payloadni o'qish (Biz createInvoiceLink da payload: "gameId_userId" qilib yuborgan edik)
    const payload = payment.invoice_payload; // Masalan: "5_12345678"

    console.log("Payload:", payload);
    console.log("Summa:", payment.total_amount / 100, payment.currency);

    try {
      // Payloadni ajratib olish
      const [gameId, userIdStr] = payload.split("_");
      const telegramId = userIdStr; // Bu Telegram ID

      if (gameId && telegramId) {
        // 1. Userni bazadan topamiz (Telegram ID orqali)
        const user = await User.findOne({ where: { telegramId: telegramId } });

        if (user) {
          // 2. Userni O'yinga qo'shamiz (UserGame jadvali)
          // Avval bor yoki yo'qligini tekshiramiz
          const existingEntry = await UserGame.findOne({
            where: {
              userId: user.id, // Userning ichki ID si (Integer)
              gameId: gameId,
            },
          });

          if (!existingEntry) {
            await UserGame.create({
              userId: user.id,
              gameId: gameId,
              status: "paid", // To'langan
              paymentAmount: payment.total_amount / 100, // Tiyindan so'mga
              team: "A", // Default team (keyin o'zgartirish mumkin)
            });
            console.log(
              `✅ User (ID: ${user.id}) o'yinga (ID: ${gameId}) qo'shildi.`
            );
          } else {
            console.log("⚠️ User allaqachon bu o'yinga yozilgan.");
          }

          // 3. O'yin statistikasini yangilash (playersJoined + 1)
          const game = await Game.findByPk(gameId);
          if (game) {
            await game.increment("playersJoined");
          }

          // 4. Foydalanuvchiga Telegramdan xabar yuborish
          await bot.sendMessage(
            msg.chat.id,
            `✅ <b>To'lov qabul qilindi!</b>\n\nSiz o'yinga muvaffaqiyatli yozildingiz.\nO'yin vaqti: ${
              game?.startTime || ""
            }\nManzil: ${game?.location || ""}`,
            { parse_mode: "HTML" }
          );
        } else {
          console.error("❌ User bazadan topilmadi. TelegramID:", telegramId);
        }
      }
    } catch (err) {
      console.error("❌ To'lovni bazaga yozishda xatolik:", err);
    }
  });

  // Oddiy xabarlarni log qilish (Debug uchun)
  // bot.on('message', (msg) => {
  //   console.log("Xabar keldi:", msg.text);
  // });
}
// ------------------------------------------------------------------

// DB + Server
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("✅ Database ulandi");

    // --- ADMIN YARATISH LOGIKASI ---
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
        });
        console.log("🔥 Admin yaratildi: 'kolizey'");
      } else {
        console.log("👍 Admin mavjud.");
      }
    } catch (e) {
      console.log("⚠️ Admin yaratishda xatolik:", e.message);
    }
    // -------------------------------

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API running on port: ${PORT}`);
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${PORT}`;
      console.log(`🔗 Swagger UI: https://${domain}/swagger`);
    });
  })
  .catch((err) => {
    console.error("❌ DB error:", err);
  });