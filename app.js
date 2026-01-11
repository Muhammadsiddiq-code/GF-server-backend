// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const { sequelize, Game, UserGame } = require("./models"); // Modellarni chaqiramiz
// const setupSwagger = require("./swagger/swagger");
// const swiper = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes"); // User route qo'shildi
// const userGameRoutes = require("./routes/userGame.routes");
// const bodyParser = require("body-parser");
// const paynetRoutes = require("./routes/paynet.routes");


// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5577;

// app.use(express.json());
// app.use(cors({ origin: "*" }));
// app.use(bodyParser.json());

// // API yo'nalishlari
// app.use("/api", swiper);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-games", userGameRoutes);
// app.use("/api/paynet", paynetRoutes);


// // Payme sozlamalari
// const PAYME_AUTH = process.env.PAYME_KEY || "Paycom:YOUR_KEY_HERE";

// app.post("/api/payme", async (req, res) => {
//   const { method, params, id } = req.body;
//   const authHeader = req.headers.authorization;

//   // 1. Avtorizatsiyani tekshirish
//   if (
//     !authHeader ||
//     authHeader !== `Basic ${Buffer.from(PAYME_AUTH).toString("base64")}`
//   ) {
//     return res.json({
//       error: { code: -32504, message: "Avtorizatsiya xatosi" },
//       id,
//     });
//   }

//   try {
//     switch (method) {
//       case "CheckPerformTransaction": {
//         const gameId = params.account.game_id;
//         const amount = params.amount / 100;

//         const game = await Game.findByPk(gameId);
//         if (!game) {
//           return res.json({
//             error: { code: -31050, message: "O'yin topilmadi" },
//             id,
//           });
//         }

//         if (game.price !== amount) {
//           return res.json({
//             error: { code: -31001, message: "Noto'g'ri summa" },
//             id,
//           });
//         }

//         if (game.playersJoined >= game.totalPlayers) {
//           return res.json({
//             error: { code: -31099, message: "Joy qolmagan" },
//             id,
//           });
//         }

//         return res.json({ result: { allow: true }, id });
//       }

//       case "CreateTransaction": {
//         // Bu yerda tranzaksiyani bazada saqlash kerak (ixtiyoriy lekin tavsiya etiladi)
//         return res.json({
//           result: {
//             create_time: Date.now(),
//             transaction: params.id,
//             state: 1,
//           },
//           id,
//         });
//       }

//       case "PerformTransaction": {
//         const gameId = params.account.game_id;
//         const userId = params.account.user_id; // Frontenddan yuborilgan user_id

//         // FOYDALANUVCHINI O'YINGA QO'SHISH
//         const game = await Game.findByPk(gameId);

//         // Takroran qo'shilmaganini tekshirish
//         const alreadyJoined = await UserGame.findOne({
//           where: { gameId, userId },
//         });

//         if (!alreadyJoined) {
//           await UserGame.create({
//             gameId,
//             userId,
//             team: "A", // Default jamoa
//           });
//           await game.increment("playersJoined");
//         }

//         return res.json({
//           result: {
//             transaction: params.id,
//             perform_time: Date.now(),
//             state: 2,
//           },
//           id,
//         });
//       }

//       case "CheckTransaction": {
//         return res.json({
//           result: {
//             create_time: Date.now(),
//             perform_time: Date.now(),
//             cancel_time: 0,
//             transaction: params.id,
//             state: 2,
//             reason: null,
//           },
//           id,
//         });
//       }

//       default:
//         return res.json({
//           error: { code: -32601, message: "Metod topilmadi" },
//           id,
//         });
//     }
//   } catch (err) {
//     return res.json({
//       error: { code: -32400, message: "Tizim xatosi: " + err.message },
//       id,
//     });
//   }
// });

// // Swagger
// setupSwagger(app);

// // Bazaga ulanish
// sequelize
//   .sync({ alter: true }) // Modeldagi o'zgarishlarni bazada yangilaydi
//   .then(() => {
//     console.log("✅ Database ulandi va sinxronizatsiya qilindi");
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running at http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => console.error("❌ DB xatosi:", err));



















// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const bodyParser = require("body-parser");

// const { sequelize } = require("./models");
// const setupSwagger = require("./swagger/swagger");

// const swiper = require("./routes/swiper.routes");
// const gameRoutes = require("./routes/games.routes");
// const userRoutes = require("./routes/user.routes");
// const userGameRoutes = require("./routes/userGame.routes");
// const paynetRoutes = require("./routes/paynet.routes");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5577;

// // Middlewares
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(cors({ origin: "*" }));

// // Routes
// app.use("/api/swiper", swiper);
// app.use("/api/games", gameRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/user-games", userGameRoutes);
// app.use("/api/paynet", paynetRoutes);

// // Swagger
// setupSwagger(app);

// // Database + Server
// sequelize
//   .sync({ alter: true })
//   .then(() => {
//     console.log("✅ Database ulandi va sinxronizatsiya qilindi");

//     app.listen(PORT, "0.0.0.0", () => {
//       // console.log(`🚀 Server running on http://localhost:${PORT}/swagger`);
//     console.log(
//       `service is running https://scenic-noncomprehendible-garrison.ngrok-free.dev/swagger`
//     );
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB xatosi:", err);
//   });
















const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors'); // Kichik harflar bilan ekanligini tekshir

const { sequelize } = require("./models");
const setupSwagger = require("./swagger/swagger");

const swiperRoutes = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const userRoutes = require("./routes/user.routes");
const userGameRoutes = require("./routes/userGame.routes");
const paynetRoutes = require("./routes/paynet.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5577;

// NGROK uchun
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     // 'ngrok-skip-browser-warning' headerini ruxsat etilganlar ro'yxatiga qo'shing
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "ngrok-skip-browser-warning",
//     ],
//   })
// );



app.use(
  cors({
    origin: "*", // Yoki [ "https://gf-server-backend-1.onrender.com", "http://localhost:3000" ]
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "ngrok-skip-browser-warning",
    ],
    credentials: true,
  })
);

// Routes
app.use("/api/swiper", swiperRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-games", userGameRoutes);
app.use("/api/paynet", paynetRoutes);

// Swagger
setupSwagger(app);

// DB + Server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Database ulandi");

  //   app.listen(PORT, "0.0.0.0", () => {
  //     console.log(
  //       `🚀 API running: https://scenic-noncomprehendible-garrison.ngrok-free.dev`
  //     );
  //   });
    // })
    
    app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port: ${PORT}`);
  console.log(`🔗 Swagger UI: https://gf-server-backend-1.onrender.com/swagger`);
});
  .catch((err) => {
    console.error("❌ DB error:", err);
  });
