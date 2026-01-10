const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { sequelize } = require("./models");
const setupSwagger = require("./swagger/swagger");
const swiper = require("./routes/swiper.routes");
const gameRoutes = require("./routes/games.routes");
const bodyParser = require("body-parser");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5577;

app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/api", swiper);
app.use("/api/games", gameRoutes);




app.use(bodyParser.json());

// Payme dan keladigan so'rovlarni autentifikatsiya qilish (Base64 login/parol)
const PAYME_AUTH = "Paycom:YOUR_PAYME_KEY"; // Payme cabinet'dan olasiz

app.post("/api/payme", (req, res) => {
  const { method, params, id } = req.body;
  const authHeader = req.headers.authorization;

  // 1. Avtorizatsiyani tekshirish
  if (
    !authHeader ||
    authHeader !== `Basic ${Buffer.from(PAYME_AUTH).toString("base64")}`
  ) {
    return res.json({
      error: { code: -32504, message: "Avtorizatsiya xatosi" },
      id,
    });
  }

  // 2. Metodlarni boshqarish
  switch (method) {
    case "CheckPerformTransaction":
      // O'yin borligini va narxi to'g'riligini tekshirish
      const amount = params.amount / 100; // Tiyindan so'mga
      const gameId = params.account.game_id;

      // Bu yerda bazadan o'yinni tekshirasiz
      if (gameId) {
        return res.json({ result: { allow: true }, id });
      } else {
        return res.json({
          error: { code: -31050, message: "O'yin topilmadi" },
          id,
        });
      }

    case "CreateTransaction":
      // To'lovni yaratish va bazaga "pending" holatda saqlash
      return res.json({
        result: {
          create_time: Date.now(),
          transaction: params.id,
          state: 1,
        },
        id,
      });

    case "PerformTransaction":
      // To'lov muvaffaqiyatli bo'ldi!
      // Shu yerda foydalanuvchini o'yinga qo'shish kodini yozasiz
      console.log("To'lov muvaffaqiyatli! Game ID:", params.id);
      return res.json({
        result: {
          transaction: params.id,
          perform_time: Date.now(),
          state: 2,
        },
        id,
      });

    case "CheckTransaction":
      return res.json({
        result: {
          create_time: Date.now(),
          perform_time: Date.now(),
          cancel_time: 0,
          transaction: params.id,
          state: 2,
          reason: null,
        },
        id,
      });

    default:
      return res.json({
        error: { code: -32601, message: "Metod topilmadi" },
        id,
      });
  }
});



setupSwagger(app);

sequelize
  .sync()
  .then(() => {
    console.log(" Database ulandi");
    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}/swagger`);
    });
  })
  .catch((err) => console.error(" DB xatosi:", err));

















// const express = require("express");
// const bodyParser = require("body-parser");
// const app = express();

// app.use(bodyParser.json());

// // Payme dan keladigan so'rovlarni autentifikatsiya qilish (Base64 login/parol)
// const PAYME_AUTH = "Paycom:YOUR_PAYME_KEY"; // Payme cabinet'dan olasiz

// app.post("/api/payme", (req, res) => {
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

//   // 2. Metodlarni boshqarish
//   switch (method) {
//     case "CheckPerformTransaction":
//       // O'yin borligini va narxi to'g'riligini tekshirish
//       const amount = params.amount / 100; // Tiyindan so'mga
//       const gameId = params.account.game_id;

//       // Bu yerda bazadan o'yinni tekshirasiz
//       if (gameId) {
//         return res.json({ result: { allow: true }, id });
//       } else {
//         return res.json({
//           error: { code: -31050, message: "O'yin topilmadi" },
//           id,
//         });
//       }

//     case "CreateTransaction":
//       // To'lovni yaratish va bazaga "pending" holatda saqlash
//       return res.json({
//         result: {
//           create_time: Date.now(),
//           transaction: params.id,
//           state: 1,
//         },
//         id,
//       });

//     case "PerformTransaction":
//       // To'lov muvaffaqiyatli bo'ldi!
//       // Shu yerda foydalanuvchini o'yinga qo'shish kodini yozasiz
//       console.log("To'lov muvaffaqiyatli! Game ID:", params.id);
//       return res.json({
//         result: {
//           transaction: params.id,
//           perform_time: Date.now(),
//           state: 2,
//         },
//         id,
//       });

//     case "CheckTransaction":
//       return res.json({
//         result: {
//           create_time: Date.now(),
//           perform_time: Date.now(),
//           cancel_time: 0,
//           transaction: params.id,
//           state: 2,
//           reason: null,
//         },
//         id,
//       });

//     default:
//       return res.json({
//         error: { code: -32601, message: "Metod topilmadi" },
//         id,
//       });
//   }
// });

// app.listen(5577, () => console.log("Backend 5577-portda ishlamoqda..."));