const { User, Referral, Setting, sequelize } = require("../models");
const { Op } = require("sequelize");
const {
    addSettingsSubscriber,
    broadcastSettingsUpdate,
    writeEvent,
} = require("../utils/settings-events");

const DEFAULT_XP_RATE = 100;
const DEFAULT_MIN_XP_CONVERSION = 10;
const DEFAULT_MAX_XP_CONVERSION = 1000000;

const getRealtimeConversionPayload = async () => {
    const [enabledSetting, rateSetting, minSetting, maxSetting] = await Promise.all([
        Setting.findByPk("xpConversionEnabled"),
        Setting.findByPk("xpToMoneyRate"),
        Setting.findByPk("minXpConversion"),
        Setting.findByPk("maxXpConversion"),
    ]);

    const xpRate = Math.max(
        parseInt(rateSetting?.value || DEFAULT_XP_RATE, 10) || DEFAULT_XP_RATE,
        1
    );

    const minXpConversion = Math.max(
        parseInt(minSetting?.value || DEFAULT_MIN_XP_CONVERSION, 10) || DEFAULT_MIN_XP_CONVERSION,
        1
    );

    const maxXpConversion = Math.max(
        parseInt(maxSetting?.value || DEFAULT_MAX_XP_CONVERSION, 10) || DEFAULT_MAX_XP_CONVERSION,
        minXpConversion + 1
    );

    return {
        conversion: {
            enabled: enabledSetting?.value === "true",
            xpRate,
            moneyPerRate: 1000,
            minXpConversion,
            maxXpConversion,
        },
    };
};

// ============================================================
// REFERRAL PROCESSING (login paytida chaqiriladi)
// ============================================================

/**
 * Yangi user registratsiya bo'lganda referral bonusni berish.
 * Transaction ichida ishlaydi — race condition bo'lmaydi.
 */
exports.processReferral = async (newUser, referrerTelegramId) => {
    // 1. Self-referral tekshiruv
    if (String(referrerTelegramId) === String(newUser.telegramId)) {
        console.log("⚠️ Referral: O'zini o'zi taklif qilish mumkin emas");
        return null;
    }

    // 2. Referrer mavjudligini tekshirish
    const referrer = await User.findOne({
        where: { telegramId: String(referrerTelegramId) },
    });
    if (!referrer) {
        console.log("⚠️ Referral: Referrer topilmadi:", referrerTelegramId);
        return null;
    }

    // 3. Allaqachon referred bo'lganini tekshirish
    const existingReferral = await Referral.findOne({
        where: { referredUserId: newUser.id },
    });
    if (existingReferral) {
        console.log("⚠️ Referral: User allaqachon referred:", newUser.telegramId);
        return null;
    }

    // 4. XP sozlamalarini olish
    const xpForReferrerSetting = await Setting.findByPk("xpForReferrer");
    const xpForReferredSetting = await Setting.findByPk("xpForReferred");
    const xpForReferrer = xpForReferrerSetting
        ? parseInt(xpForReferrerSetting.value, 10)
        : 1000;
    const xpForReferred = xpForReferredSetting
        ? parseInt(xpForReferredSetting.value, 10)
        : 500;

    // 5. Transaction ichida atomik operatsiya
    const result = await sequelize.transaction(async (t) => {
        // Referrer ga XP berish
        await User.increment("xp", {
            by: xpForReferrer,
            where: { id: referrer.id },
            transaction: t,
        });

        // Referrer ning invitedCount ni oshirish
        await User.increment("invitedCount", {
            by: 1,
            where: { id: referrer.id },
            transaction: t,
        });

        // Yangi user ga XP berish
        await User.increment("xp", {
            by: xpForReferred,
            where: { id: newUser.id },
            transaction: t,
        });

        // Referral yozuvini yaratish
        const referral = await Referral.create(
            {
                referrerUserId: referrer.id,
                referredUserId: newUser.id,
                referralCode: String(referrerTelegramId),
                xpAwardedToReferrer: xpForReferrer,
                xpAwardedToReferred: xpForReferred,
                status: "completed",
            },
            { transaction: t }
        );

        return referral;
    });

    console.log(
        `✅ Referral: ${referrer.firstName} +${xpForReferrer} XP, ${newUser.firstName} +${xpForReferred} XP`
    );
    return result;
};

// ============================================================
// DEFAULT SETTINGS (server ishga tushganda chaqiriladi)
// ============================================================

exports.initDefaultSettings = async () => {
    try {
        const defaults = [
            {
                key: "xpForReferrer",
                value: "1000",
                description: "Taklif qilgan odamga beriladigan XP",
            },
            {
                key: "xpForReferred",
                value: "500",
                description: "Taklif qilingan odamga beriladigan XP",
            },
            {
                key: "xpConversionEnabled",
                value: "true",
                description: "Userlar XP ni pulga almashtira oladimi",
            },
            {
                key: "xpToMoneyRate",
                value: "100",
                description: "Nechta XP = 1000 so'm (default: 100 XP = 1000 so'm)",
            },
        ];

        for (const setting of defaults) {
            await Setting.findOrCreate({
                where: { key: setting.key },
                defaults: setting,
            });
        }
        console.log("✅ Referral va XP konvertatsiya sozlamalari tayyor");
    } catch (error) {
        console.error("❌ Sozlamalarni yaratishda xato:", error);
    }
};

// ============================================================
// USER API - O'z referral ma'lumotlari
// ============================================================

exports.getMyReferralInfo = async (req, res) => {
    try {
        const { telegramId } = req.params;

        const user = await User.findOne({
            where: { telegramId: String(telegramId) },
        });
        if (!user) {
            return res.status(404).json({ msg: "Foydalanuvchi topilmadi" });
        }

        // Taklif qilganlar ro'yxati
        const referralsMade = await Referral.findAll({
            where: { referrerUserId: user.id },
            include: [
                {
                    model: User,
                    as: "referred",
                    attributes: ["id", "telegramId", "firstName", "username", "photo"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        // Agar o'zi boshqa odam orqali kelgan bo'lsa
        const referredBy = await Referral.findOne({
            where: { referredUserId: user.id },
            include: [
                {
                    model: User,
                    as: "referrer",
                    attributes: ["id", "telegramId", "firstName", "username", "photo"],
                },
            ],
        });

        res.json({
            success: true,
            referralCode: user.telegramId, // Referral code = telegramId
            invitedCount: user.invitedCount || 0,
            referralsMade: referralsMade,
            referredBy: referredBy || null,
        });
    } catch (error) {
        console.error("Referral info xatosi:", error);
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

exports.streamPublicSettings = async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const unsubscribe = addSettingsSubscriber(res);

    req.on("close", () => {
        unsubscribe();
    });

    try {
        const payload = await getRealtimeConversionPayload();
        writeEvent(res, "settings:init", payload);
    } catch (error) {
        writeEvent(res, "settings:error", {
            message: "Sozlamalarni realtime yuklashda xatolik",
        });
    }
};

// ============================================================
// ADMIN API - Sozlamalar
// ============================================================

exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        const result = {};
        settings.forEach((s) => {
            result[s.key] = { value: s.value, description: s.description };
        });
        res.json({ success: true, settings: result });
    } catch (error) {
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        // settings = { xpForReferrer: "1500", xpForReferred: "700", xpConversionEnabled: "true" }

        if (!settings || typeof settings !== "object") {
            return res.status(400).json({ msg: "settings obyekti kerak" });
        }

        for (const [key, value] of Object.entries(settings)) {
            // xpConversionEnabled uchun boolean tekshiruv
            if (key === 'xpConversionEnabled') {
                if (value !== 'true' && value !== 'false') {
                    return res.status(400).json({ msg: `"${key}" uchun faqat true yoki false qiymati kerak` });
                }
                await Setting.upsert({ key, value: String(value) });
            } 
            // Boshqa sozlamalar uchun raqam tekshiruv
            else {
                if (isNaN(parseInt(value, 10)) || parseInt(value, 10) < 0) {
                    return res
                        .status(400)
                        .json({ msg: `"${key}" uchun noto'g'ri qiymat: ${value}` });
                }
                await Setting.upsert({ key, value: String(value) });
            }
        }

        const realtimePayload = await getRealtimeConversionPayload();
        broadcastSettingsUpdate(realtimePayload);

        res.json({
            success: true,
            msg: "Sozlamalar yangilandi",
            realtime: realtimePayload,
        });
    } catch (error) {
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

// ============================================================
// ADMIN API - Statistika
// ============================================================

exports.getReferralStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalReferrals, todayReferrals, weekReferrals, monthReferrals] =
            await Promise.all([
                Referral.count({ where: { status: "completed" } }),
                Referral.count({
                    where: {
                        status: "completed",
                        createdAt: { [Op.gte]: startOfDay },
                    },
                }),
                Referral.count({
                    where: {
                        status: "completed",
                        createdAt: { [Op.gte]: startOfWeek },
                    },
                }),
                Referral.count({
                    where: {
                        status: "completed",
                        createdAt: { [Op.gte]: startOfMonth },
                    },
                }),
            ]);

        // Jami berilgan XP
        const totalXpResult = await Referral.findAll({
            where: { status: "completed" },
            attributes: [
                [
                    sequelize.fn("SUM", sequelize.col("xpAwardedToReferrer")),
                    "totalXpReferrer",
                ],
                [
                    sequelize.fn("SUM", sequelize.col("xpAwardedToReferred")),
                    "totalXpReferred",
                ],
            ],
            raw: true,
        });

        const totalXpGiven =
            (parseInt(totalXpResult[0]?.totalXpReferrer) || 0) +
            (parseInt(totalXpResult[0]?.totalXpReferred) || 0);

        res.json({
            success: true,
            stats: {
                totalReferrals,
                todayReferrals,
                weekReferrals,
                monthReferrals,
                totalXpGiven,
                totalXpToReferrers: parseInt(totalXpResult[0]?.totalXpReferrer) || 0,
                totalXpToReferred: parseInt(totalXpResult[0]?.totalXpReferred) || 0,
            },
        });
    } catch (error) {
        console.error("Stats xatosi:", error);
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

// ============================================================
// ADMIN API - Top Referrerlar (Leaderboard)
// ============================================================

exports.getTopReferrers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Aggregation — rawda GROUP BY ishlatamiz
        const topData = await Referral.findAll({
            where: { status: "completed" },
            attributes: [
                "referrerUserId",
                [sequelize.fn("COUNT", sequelize.col("Referral.id")), "referralCount"],
                [
                    sequelize.fn("SUM", sequelize.col("xpAwardedToReferrer")),
                    "totalXpEarned",
                ],
            ],
            group: ["referrerUserId"],
            order: [[sequelize.fn("COUNT", sequelize.col("Referral.id")), "DESC"]],
            limit,
            raw: true,
        });

        // User ma'lumotlarini alohida olamiz
        const userIds = topData.map((r) => r.referrerUserId);
        const users = await User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: [
                "id",
                "telegramId",
                "firstName",
                "username",
                "photo",
                "xp",
            ],
        });

        const userMap = {};
        users.forEach((u) => {
            userMap[u.id] = u;
        });

        const topReferrers = topData.map((row) => ({
            referrerUserId: row.referrerUserId,
            referralCount: parseInt(row.referralCount) || 0,
            totalXpEarned: parseInt(row.totalXpEarned) || 0,
            referrer: userMap[row.referrerUserId] || null,
        }));

        res.json({ success: true, topReferrers });
    } catch (error) {
        console.error("Top referrers xatosi:", error);
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

// ============================================================
// ADMIN API - Referral tarixi (filtrlash bilan)
// ============================================================

exports.getReferralHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            dateFrom,
            dateTo,
            status,
            referralCode,
        } = req.query;

        const where = {};
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Status filtri
        if (status && ["completed", "revoked"].includes(status)) {
            where.status = status;
        }

        // Referral code filtri
        if (referralCode) {
            where.referralCode = { [Op.like]: `%${referralCode}%` };
        }

        // Sana oralig'i filtri
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.createdAt[Op.lte] = endDate;
            }
        }

        // Include (referrer va referred userlar)
        const includeOptions = [
            {
                model: User,
                as: "referrer",
                attributes: ["id", "telegramId", "firstName", "username", "photo"],
            },
            {
                model: User,
                as: "referred",
                attributes: ["id", "telegramId", "firstName", "username", "photo"],
            },
        ];

        // Qidirish (telegramId yoki username bo'yicha)
        let whereClause = where;
        if (search) {
            const userIds = await User.findAll({
                where: {
                    [Op.or]: [
                        { telegramId: { [Op.like]: `%${search}%` } },
                        { username: { [Op.like]: `%${search}%` } },
                        { firstName: { [Op.like]: `%${search}%` } },
                    ],
                },
                attributes: ["id"],
                raw: true,
            });

            const ids = userIds.map((u) => u.id);
            if (ids.length > 0) {
                whereClause = {
                    ...where,
                    [Op.or]: [
                        { referrerUserId: { [Op.in]: ids } },
                        { referredUserId: { [Op.in]: ids } },
                    ],
                };
            } else {
                // Hech narsa topilmadi
                return res.json({
                    success: true,
                    referrals: [],
                    pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
                });
            }
        }

        const { count, rows } = await Referral.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            referrals: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Referral history xatosi:", error);
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

// ============================================================
// ADMIN API - Referred users ro'yxati
// ============================================================

exports.getReferredUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (search) {
            const userIds = await User.findAll({
                where: {
                    [Op.or]: [
                        { telegramId: { [Op.like]: `%${search}%` } },
                        { username: { [Op.like]: `%${search}%` } },
                        { firstName: { [Op.like]: `%${search}%` } },
                    ],
                },
                attributes: ["id"],
                raw: true,
            });
            const ids = userIds.map((u) => u.id);
            if (ids.length > 0) {
                where.referredUserId = { [Op.in]: ids };
            } else {
                return res.json({
                    success: true,
                    users: [],
                    pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
                });
            }
        }

        const { count, rows } = await Referral.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "referred",
                    attributes: [
                        "id",
                        "telegramId",
                        "firstName",
                        "username",
                        "photo",
                        "xp",
                        "createdAt",
                    ],
                },
                {
                    model: User,
                    as: "referrer",
                    attributes: ["id", "telegramId", "firstName", "username"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            users: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Referred users xatosi:", error);
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};

// ============================================================
// ADMIN API - Referrerlar ro'yxati (taklif qilganlar)
// ============================================================

exports.getReferrers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;

        // Taklif qilgan userlarni topish
        let userWhere = {
            invitedCount: { [Op.gt]: 0 },
        };

        if (search) {
            userWhere = {
                ...userWhere,
                [Op.or]: [
                    { telegramId: { [Op.like]: `%${search}%` } },
                    { username: { [Op.like]: `%${search}%` } },
                    { firstName: { [Op.like]: `%${search}%` } },
                ],
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await User.findAndCountAll({
            where: userWhere,
            attributes: [
                "id",
                "telegramId",
                "firstName",
                "username",
                "photo",
                "xp",
                "invitedCount",
                "createdAt",
            ],
            order: [["invitedCount", "DESC"]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            users: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Referrers xatosi:", error);
        res.status(500).json({ msg: "Server xatosi: " + error.message });
    }
};
