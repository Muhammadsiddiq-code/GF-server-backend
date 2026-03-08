const { Op } = require("sequelize");

/**
 * GET /api/stats/dashboard
 * Admin Dashboard statistics — barcha ma'lumotlar bilan
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const db = require("../models");
        const { User, Game, UserGame, Transaction, Referral } = db;


        // ===== 30% / TO'LIQ TO'LOV STATISTIKALARI =====
        const gamesData = await Game.findAll({ raw: true });
        const gameMap = {};
        gamesData.forEach((g) => { gameMap[g.id] = g; });

        let advancePayersCount = 0;
        let fullPayersCount = 0;
        let advanceCollectedAmount = 0;
        let fullCollectedAmount = 0;
        let remainingAmount = 0;

        const ugList = await UserGame.findAll({ raw: true });
        for (const ug of ugList) {
            const game = gameMap[ug.gameId];
            if (!game) continue;
            const totalPlayers = Number(game.totalPlayers) || 14;
            const pricePerPerson = (Number(game.price) || 0) / totalPlayers;
            const advancePerPerson = (Number(game.advance) || 0) / totalPlayers;
            const paid = Number(ug.paymentAmount) || 0;

            if (paid >= pricePerPerson) {
                fullPayersCount++;
                fullCollectedAmount += paid;
            } else if (paid >= advancePerPerson && advancePerPerson > 0) {
                advancePayersCount++;
                advanceCollectedAmount += paid;
            } else if (paid > 0) {
                advanceCollectedAmount += paid; // qisman to'lov
            }
        }

        // Qolgan summa: har bir o'yinda kutilgan - to'langan
        for (const g of gamesData) {
            const totalPlayers = Number(g.totalPlayers) || 14;
            const pricePerPerson = (Number(g.price) || 0) / totalPlayers;
            const gameUgs = ugList.filter((ug) => ug.gameId === g.id);
            const totalPaid = gameUgs.reduce((s, ug) => s + (Number(ug.paymentAmount) || 0), 0);
            const expected = (Number(g.playersJoined) || 0) * pricePerPerson;
            remainingAmount += Math.max(0, expected - totalPaid);
        }

        // ===== SANALAR =====
        const now = new Date();

        // Bugun (00:00 — hozir)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Kecha (00:00 — 23:59)
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart);

        // Bu oy (1-chi kuni — hozir)
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // O'tgan oy (1-chi — oxirgi kun)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // ===== UMUMIY RAQAMLAR =====
        const totalUsers = await User.count();
        const totalGames = await Game.count();
        const totalTransactions = await Transaction.count();

        // Jami tushum (approved Transaction yig'indisi)
        const approvedTransactions = await Transaction.findAll({
            where: { type: "income", status: "approved" },
            raw: true,
        });
        const totalRevenue = approvedTransactions.reduce(
            (sum, t) => sum + (Number(t.amount) || 0),
            0
        );
        const allGames = await Game.findAll({ raw: true });

        const activeGames = allGames.filter((g) => !g.isFinished).length;
        const avgGamePrice =
            allGames.length > 0
                ? Math.round(
                    allGames.reduce((sum, g) => sum + (Number(g.price) || 0), 0) /
                    allGames.length
                )
                : 0;

        // ===== BUGUN vs KECHA =====
        const todayUsers = await User.count({
            where: { createdAt: { [Op.gte]: todayStart } },
        });
        const yesterdayUsers = await User.count({
            where: {
                createdAt: { [Op.gte]: yesterdayStart, [Op.lt]: yesterdayEnd },
            },
        });

        const todayGames = await Game.count({
            where: { createdAt: { [Op.gte]: todayStart } },
        });
        const yesterdayGames = await Game.count({
            where: {
                createdAt: { [Op.gte]: yesterdayStart, [Op.lt]: yesterdayEnd },
            },
        });

        const todayTransactions = await Transaction.count({
            where: { createdAt: { [Op.gte]: todayStart } },
        });
        const yesterdayTransactions = await Transaction.count({
            where: {
                createdAt: { [Op.gte]: yesterdayStart, [Op.lt]: yesterdayEnd },
            },
        });

        // Bugungi tushum (approved tranzaksiyalar)
        const todayRevenueData = await Transaction.findAll({
            where: {
                createdAt: { [Op.gte]: todayStart },
                type: "income",
                status: "approved",
            },
            raw: true,
        });
        const todayRevenue = todayRevenueData.reduce(
            (sum, t) => sum + (Number(t.amount) || 0),
            0
        );

        const yesterdayRevenueData = await Transaction.findAll({
            where: {
                createdAt: { [Op.gte]: yesterdayStart, [Op.lt]: yesterdayEnd },
                type: "income",
                status: "approved",
            },
            raw: true,
        });
        const yesterdayRevenue = yesterdayRevenueData.reduce(
            (sum, t) => sum + (Number(t.amount) || 0),
            0
        );

        // ===== BU OY vs O'TGAN OY =====
        const thisMonthUsers = await User.count({
            where: { createdAt: { [Op.gte]: thisMonthStart } },
        });
        const lastMonthUsers = await User.count({
            where: {
                createdAt: { [Op.gte]: lastMonthStart, [Op.lte]: lastMonthEnd },
            },
        });

        const thisMonthGames = await Game.count({
            where: { createdAt: { [Op.gte]: thisMonthStart } },
        });
        const lastMonthGames = await Game.count({
            where: {
                createdAt: { [Op.gte]: lastMonthStart, [Op.lte]: lastMonthEnd },
            },
        });

        const thisMonthTransactions = await Transaction.count({
            where: { createdAt: { [Op.gte]: thisMonthStart } },
        });
        const lastMonthTransactions = await Transaction.count({
            where: {
                createdAt: { [Op.gte]: lastMonthStart, [Op.lte]: lastMonthEnd },
            },
        });

        const thisMonthRevenueData = await Transaction.findAll({
            where: {
                createdAt: { [Op.gte]: thisMonthStart },
                type: "income",
                status: "approved",
            },
            raw: true,
        });
        const thisMonthRevenue = thisMonthRevenueData.reduce(
            (sum, t) => sum + (Number(t.amount) || 0),
            0
        );

        const lastMonthRevenueData = await Transaction.findAll({
            where: {
                createdAt: { [Op.gte]: lastMonthStart, [Op.lte]: lastMonthEnd },
                type: "income",
                status: "approved",
            },
            raw: true,
        });
        const lastMonthRevenue = lastMonthRevenueData.reduce(
            (sum, t) => sum + (Number(t.amount) || 0),
            0
        );

        // ===== HAFTALIK GRAFIK (Oxirgi 7 kun) =====
        const weeklyChart = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

            const dayRevData = await Transaction.findAll({
                where: {
                    createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd },
                    type: "income",
                    status: "approved",
                },
                raw: true,
            });
            const dayRevenue = dayRevData.reduce(
                (sum, t) => sum + (Number(t.amount) || 0),
                0
            );

            const dayUsers = await User.count({
                where: { createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } },
            });

            weeklyChart.push({
                name: dayStart.toLocaleDateString("uz-UZ", {
                    weekday: "short",
                    day: "numeric",
                }),
                tushum: dayRevenue,
                userlar: dayUsers,
            });
        }

        // ===== O'YIN TURLARI =====
        const outdoorCount = allGames.filter((g) => g.isOutdoor).length;
        const indoorCount = allGames.filter((g) => !g.isOutdoor).length;

        // O'yin format turlari (5v5, 7v7, etc)
        const gameFormats = {};
        allGames.forEach((g) => {
            const type = g.type || "Noma'lum";
            gameFormats[type] = (gameFormats[type] || 0) + 1;
        });

        // ===== TO'LOV TURLARI =====
        const allTransactions = await Transaction.findAll({ raw: true });
        const paymentTypes = {};
        allTransactions.forEach((t) => {
            const pt = t.paymentType || "other";
            paymentTypes[pt] = (paymentTypes[pt] || 0) + 1;
        });

        // ===== OXIRGI 5 TALIK RO'YXATLAR =====
        const recentUsers = await User.findAll({
            order: [["createdAt", "DESC"]],
            limit: 5,
            raw: true,
        });

        const recentGames = await Game.findAll({
            order: [["createdAt", "DESC"]],
            limit: 5,
            raw: true,
        });

        const recentTransactions = await Transaction.findAll({
            order: [["createdAt", "DESC"]],
            limit: 5,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["firstName", "lastName", "username", "telegramId"],
                },
            ],
        });

        // ===== TOP O'YINCHILAR (eng ko'p o'yinga qatnashganlar) =====
        const userGameCounts = await UserGame.findAll({
            attributes: [
                "userId",
                [db.sequelize.fn("COUNT", db.sequelize.col("userId")), "gamesCount"],
            ],
            group: ["userId"],
            order: [[db.sequelize.fn("COUNT", db.sequelize.col("userId")), "DESC"]],
            limit: 5,
            raw: true,
        });

        const topPlayers = [];
        for (const ug of userGameCounts) {
            const user = await User.findByPk(ug.userId, { raw: true });
            if (user) {
                topPlayers.push({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    gamesCount: Number(ug.gamesCount),
                });
            }
        }

        // ===== FOIZ HISOBLASH FUNKSIYASI =====
        const calcPercent = (current, previous) => {
            if (previous === 0 && current === 0) return 0;
            if (previous === 0) return 100;
            return Math.round(((current - previous) / previous) * 100);
        };

        // ===== REFERRAL STATISTIKALARI =====
        let referralStats = { totalReferrals: 0, todayReferrals: 0, totalXpGiven: 0 };
        try {
            if (Referral) {
                referralStats.totalReferrals = await Referral.count();
                referralStats.todayReferrals = await Referral.count({
                    where: { createdAt: { [Op.gte]: todayStart } },
                });
                const xpSum = await Referral.findAll({
                    attributes: [
                        [db.sequelize.fn("SUM", db.sequelize.col("xpAwardedToReferrer")), "totalReferrerXp"],
                        [db.sequelize.fn("SUM", db.sequelize.col("xpAwardedToReferred")), "totalReferredXp"],
                    ],
                    raw: true,
                });
                if (xpSum && xpSum[0]) {
                    referralStats.totalXpGiven =
                        (Number(xpSum[0].totalReferrerXp) || 0) + (Number(xpSum[0].totalReferredXp) || 0);
                }
            }
        } catch (refErr) {
            console.warn("Referral stats olishda xato (model mavjud emas bo'lishi mumkin):", refErr.message);
        }

        // ===== JAVOBNI JO'NATISH =====
        res.json({
            // Umumiy
            total: {
                users: totalUsers,
                games: totalGames,
                revenue: totalRevenue,
                transactions: totalTransactions,
                activeGames,
                avgGamePrice,
                advancePayersCount,
                fullPayersCount,
                advanceCollectedAmount,
                fullCollectedAmount,
                remainingAmount,
            },

            // Bugun vs Kecha
            today: {
                users: todayUsers,
                games: todayGames,
                revenue: todayRevenue,
                transactions: todayTransactions,
            },
            yesterday: {
                users: yesterdayUsers,
                games: yesterdayGames,
                revenue: yesterdayRevenue,
                transactions: yesterdayTransactions,
            },
            dailyChange: {
                users: calcPercent(todayUsers, yesterdayUsers),
                games: calcPercent(todayGames, yesterdayGames),
                revenue: calcPercent(todayRevenue, yesterdayRevenue),
                transactions: calcPercent(todayTransactions, yesterdayTransactions),
            },

            // Bu oy vs O'tgan oy
            thisMonth: {
                users: thisMonthUsers,
                games: thisMonthGames,
                revenue: thisMonthRevenue,
                transactions: thisMonthTransactions,
            },
            lastMonth: {
                users: lastMonthUsers,
                games: lastMonthGames,
                revenue: lastMonthRevenue,
                transactions: lastMonthTransactions,
            },
            monthlyChange: {
                users: calcPercent(thisMonthUsers, lastMonthUsers),
                games: calcPercent(thisMonthGames, lastMonthGames),
                revenue: calcPercent(thisMonthRevenue, lastMonthRevenue),
                transactions: calcPercent(thisMonthTransactions, lastMonthTransactions),
            },

            // Grafiklar uchun
            charts: {
                weeklyChart,
                locationTypes: [
                    { name: "Ochiq maydon", value: outdoorCount },
                    { name: "Yopiq zal", value: indoorCount },
                ],
                gameFormats: Object.entries(gameFormats).map(([name, value]) => ({
                    name,
                    value,
                })),
                paymentTypes: Object.entries(paymentTypes).map(([name, value]) => ({
                    name,
                    value,
                })),
            },

            // Ro'yxatlar
            recent: {
                users: recentUsers,
                games: recentGames,
                transactions: recentTransactions,
            },

            // Top o'yinchilar
            topPlayers,

            // Referral statistikalari
            referralStats,
        });
    } catch (error) {
        console.error("❌ Dashboard stats error:", error);
        res.status(500).json({ error: "Stats olishda xato", details: error.message });
    }
};
