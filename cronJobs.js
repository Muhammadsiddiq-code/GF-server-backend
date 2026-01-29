const cron = require("node-cron");
const { Op } = require("sequelize");
const { Game, User, Notification, UserGame } = require("./models");

const initCronJobs = () => {
  console.log("⏳ Cron Jobs ishga tushdi...");

  // Har daqiqada tekshiradi
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Hozirdan aniq 1 soat keyingi vaqt oralig'ini olamiz (1 soatdan 1 soat-u 2 daqiqagacha)
      // Bu serverdagi kechikishlarni hisobga olish uchun kichik oraliq (window).
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourWindow = new Date(now.getTime() + 62 * 60 * 1000);

      // 1. 1 soat qolgan o'yinlarni topish
      const upcomingGames = await Game.findAll({
        where: {
          startTime: {
            [Op.between]: [oneHourFromNow, oneHourWindow],
          },
        },
        include: [
          {
            model: User, // O'yinga yozilgan userlar
            through: { model: UserGame }, // UserGame orqali
          },
        ],
      });

      // 2. Har bir o'yin va o'yinchi uchun bildirishnoma yaratish
      for (const game of upcomingGames) {
        if (!game.Users || game.Users.length === 0) continue;

        for (const user of game.Users) {
          // Motivatsion gaplar
          const motivations = [
            "Bugungi g'alaba sizniki bo'lsin! 🚀",
            "Maydonni yondirishga tayyormisiz? 🔥",
            "Chempionlik ruhi sizni tark etmasin! 🏆",
            "Jamoangiz sizni kutmoqda!",
          ];
          const randomText =
            motivations[Math.floor(Math.random() * motivations.length)];

          // Oldin xabar borganmi tekshiramiz (Duplicate bo'lmasligi uchun)
          const exists = await Notification.findOne({
            where: {
              userId: user.id,
              gameId: game.id,
              type: "reminder",
            },
          });

          if (!exists) {
            await Notification.create({
              userId: user.id,
              gameId: game.id,
              title: "⏳ 1 soat qoldi!",
              message: `"${game.title}" o'yini boshlanishiga 1 soat qoldi. ${randomText} Tayyorlaning!`,
              type: "reminder",
            });
            console.log(
              `🔔 Eslatma yuborildi: User ${user.id} -> Game ${game.id}`
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Cron Job Xatolik:", error);
    }
  });
};

module.exports = initCronJobs;
