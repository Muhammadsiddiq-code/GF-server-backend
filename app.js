// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require('cors'); // Kichik harflar bilan ekanligini tekshir

// const { sequelize } = require("./models");
// const setupSwagger = require("./swagger/swagger");

// const swiperRoutes = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paynetRoutes = require("./routes/paynet.routes");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;

// // NGROK uchun
// app.set("trust proxy", true);

// // Middlewares
// app.use(express.json());
// app.use(
//   cors({
//     origin: "*", // Hozircha hamma joydan ruxsat berib turish eng oson yo'li
//   })
// );

// // Bu qator Swagger so'rovlari uchun juda muhim
// app.options("*", cors());

// // Routes
// app.use("/api/swiper", swiperRoutes);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-game", userGameRoutes);
// app.use("/api/paynet", paynetRoutes);






// // Auth Route (Buni alohida routes fayliga olib chiqish ham mumkin)
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
// // app.js ning oxirgi qismini shunday o'zgartiring:
// sequelize
//   .sync({ alter: true })
//   .then(() => {
//     console.log("✅ Database ulandi");
//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 API running on port: ${PORT}`);
//       // Railway bergan domen bormi yoki yo'qligini tekshirib chiqaradi
//       const domain = process.env.RAILWAY_PUBLIC_DOMAIN || "localhost:8080";
//       console.log(`🔗 Swagger UI: https://${domain}/swagger`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB error:", err);
//   });



















const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// 1. User modelini ham import qilish kerak (Admin yaratish uchun)
const { sequelize, User } = require("./models");
const setupSwagger = require("./swagger/swagger");

const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paynetRoutes = require("./routes/paynet.routes");

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
app.use("/api/paynet", paynetRoutes);

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

// DB + Server
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("✅ Database ulandi");

    // --- ADMIN YARATISH LOGIKASI ---
    try {
      // 1. "kolizey" foydalanuvchisini qidiramiz
      const adminExists = await User.findOne({
        where: { username: "kolizey" },
      });

      if (!adminExists) {
        // Agar yo'q bo'lsa, yaratamiz
        await User.create({
          firstName: "Muhammad Siddiq",
          lastName: "Xamidullayev",
          username: "kolizey", // LOGIN
          password: "5577", // PAROL
          role: "admin",
          phone: "+998 97 827-55-77",
          xp: 99999,
          telegramId: "000000",
          photo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        });
        console.log(
          "🔥 DIQQAT: Admin yaratildi! Login: 'kolizey', Parol: '5577'"
        );
      } else {
        console.log("👍 'kolizey' admini allaqachon mavjud.");
      }
    } catch (e) {
      console.log("⚠️ Admin yaratishda xatolik:", e.message);
    }
    // -------------------------------

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API running on port: ${PORT}`);
      // Railway domenini to'g'ri olish
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${PORT}`;
      console.log(`🔗 Swagger UI: https://${domain}/swagger`);
    });
  })
  .catch((err) => {
    console.error("❌ DB error:", err);
  });