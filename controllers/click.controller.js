// controllers/click.controller.js
// CLICK SHOP API: Prepare (action=0) va Complete (action=1) callback handlerlar
const crypto = require("crypto");
const {
    User,
    Transaction,
    ClickTransaction,
    Game,
    UserGame,
    sequelize,
} = require("../models");
require("dotenv").config();
const { notifyPayment } = require("../utils/paymentNotifier");

// --- ENV dan CLICK sozlamalari ---
const CLICK_SERVICE_ID = () => process.env.CLICK_SERVICE_ID;
const CLICK_SECRET_KEY = () => process.env.CLICK_SECRET_KEY;

// --- CLICK xatolik kodlari ---
const ClickError = {
    Success: { code: 0, note: "Success" },
    SignFailed: { code: -1, note: "SIGN CHECK FAILED!" },
    InvalidAmount: { code: -2, note: "Incorrect parameter amount" },
    ActionNotFound: { code: -3, note: "Action not found" },
    AlreadyPaid: { code: -4, note: "Already paid" },
    OrderNotFound: { code: -5, note: "User does not exist" },
    TransactionNotFound: { code: -6, note: "Transaction does not exist" },
    BadRequest: { code: -8, note: "Error in request from click" },
    TransactionCancelled: { code: -9, note: "Transaction cancelled" },
};

// --- MD5 HASH helper ---
const md5 = (str) => crypto.createHash("md5").update(str).digest("hex");

// --- Xavfsiz log (secret_key ni yashiradi) ---
const safeLog = (prefix, data) => {
    const safe = { ...data };
    delete safe.sign_string;
    console.log(`[CLICK ${prefix}]`, JSON.stringify(safe));
};

// --- merchant_trans_id dan account ma'lumotlarini parse qilish ---
// Format: telegramId (wallet topup) yoki GAME_{gameId}_{telegramId}_{team}
const parseMerchantTransId = (merchantTransId) => {
    if (!merchantTransId) return null;
    const str = String(merchantTransId);

    if (str.startsWith("GAME_")) {
        // GAME_5_123456789_JamoaA
        const parts = str.split("_");
        if (parts.length < 3) return null;
        return {
            type: "game",
            gameId: Number(parts[1]),
            telegramId: parts[2],
            team: parts.slice(3).join("_") || "NA",
        };
    }

    // Oddiy telegramId (wallet topup)
    return {
        type: "topup",
        telegramId: str,
        gameId: null,
        team: null,
    };
};

// ============================================================
// 1) PREPARE (Action = 0)
// CLICK shu endpointga so'rov yuboradi — buyurtmani tekshiradi
// ============================================================
const handlePrepare = async (req, res) => {
    try {
        const {
            click_trans_id,
            service_id,
            click_paydoc_id,
            merchant_trans_id,
            amount,
            action,
            error,
            error_note,
            sign_time,
            sign_string,
        } = req.body;

        safeLog("PREPARE <<<", req.body);

        const secretKey = CLICK_SECRET_KEY();
        if (!secretKey) {
            console.error("[CLICK] CLICK_SECRET_KEY .env da topilmadi!");
            return res.json({
                error: ClickError.BadRequest.code,
                error_note: "Server configuration error",
            });
        }

        // 1. Sign tekshirish
        const expectedSign = md5(
            `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`
        );

        if (sign_string !== expectedSign) {
            console.error("[CLICK] Sign verification failed");
            return res.json({
                error: ClickError.SignFailed.code,
                error_note: ClickError.SignFailed.note,
            });
        }

        // 2. merchant_trans_id ni parse qilish
        const parsed = parseMerchantTransId(merchant_trans_id);
        if (!parsed) {
            return res.json({
                error: ClickError.OrderNotFound.code,
                error_note: "Invalid merchant_trans_id format",
            });
        }

        // 3. User tekshirish
        const user = await User.findOne({
            where: { telegramId: String(parsed.telegramId) },
        });

        if (!user) {
            return res.json({
                error: ClickError.OrderNotFound.code,
                error_note: ClickError.OrderNotFound.note,
            });
        }

        // 4. Amount validatsiya
        const amountNum = Number(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            return res.json({
                error: ClickError.InvalidAmount.code,
                error_note: ClickError.InvalidAmount.note,
            });
        }

        // 5. Game mavjudligini tekshirish (agar game payment bo'lsa)
        if (parsed.type === "game" && parsed.gameId) {
            const game = await Game.findByPk(parsed.gameId);
            if (!game) {
                return res.json({
                    error: ClickError.OrderNotFound.code,
                    error_note: "Game not found",
                });
            }
        }

        // 6. Idempotency: shu click_trans_id bilan allaqachon Prepare qilinganmi?
        const existing = await ClickTransaction.findOne({
            where: { clickTransId: click_trans_id },
        });

        if (existing) {
            // Allaqachon completed bo'lsa
            if (existing.state === 2) {
                return res.json({
                    error: ClickError.AlreadyPaid.code,
                    error_note: ClickError.AlreadyPaid.note,
                });
            }

            // Allaqachon cancelled bo'lsa
            if (existing.state === -1) {
                return res.json({
                    error: ClickError.TransactionCancelled.code,
                    error_note: ClickError.TransactionCancelled.note,
                });
            }

            // Allaqachon prepared — shu recordni qaytaramiz
            if (existing.state === 1) {
                safeLog("PREPARE (idempotent) >>>", {
                    merchant_prepare_id: existing.id,
                });
                return res.json({
                    click_trans_id: Number(click_trans_id),
                    merchant_trans_id: String(merchant_trans_id),
                    merchant_prepare_id: existing.id,
                    error: ClickError.Success.code,
                    error_note: ClickError.Success.note,
                });
            }
        }

        // 7. Yangi ClickTransaction yaratish (state=1, Prepared)
        const clickTx = await ClickTransaction.create({
            userId: user.id,
            clickTransId: click_trans_id,
            serviceId: service_id,
            merchantTransId: String(merchant_trans_id),
            amount: amountNum,
            signTime: sign_time,
            state: 1, // Prepared
            error: 0,
            account: {
                telegram_id: parsed.telegramId,
                game_id: parsed.gameId,
                team: parsed.team,
                type: parsed.type,
            },
        });

        // merchantPrepareId = shu recordning o'zi
        await clickTx.update({ merchantPrepareId: clickTx.id });

        const response = {
            click_trans_id: Number(click_trans_id),
            merchant_trans_id: String(merchant_trans_id),
            merchant_prepare_id: clickTx.id,
            error: ClickError.Success.code,
            error_note: ClickError.Success.note,
        };

        safeLog("PREPARE >>>", response);
        return res.json(response);
    } catch (err) {
        console.error("[CLICK] Prepare error:", err);
        return res.json({
            error: ClickError.BadRequest.code,
            error_note: "Internal server error",
        });
    }
};

// ============================================================
// 2) COMPLETE (Action = 1)
// CLICK shu endpointga so'rov yuboradi — to'lovni yakunlaydi
// ============================================================
const handleComplete = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            click_trans_id,
            service_id,
            click_paydoc_id,
            merchant_trans_id,
            merchant_prepare_id,
            amount,
            action,
            error: clickError,
            error_note: clickErrorNote,
            sign_time,
            sign_string,
        } = req.body;

        safeLog("COMPLETE <<<", req.body);

        const secretKey = CLICK_SECRET_KEY();
        if (!secretKey) {
            await t.rollback();
            return res.json({
                error: ClickError.BadRequest.code,
                error_note: "Server configuration error",
            });
        }

        // 1. Sign tekshirish (Complete uchun merchant_prepare_id ham qo'shiladi)
        const expectedSign = md5(
            `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`
        );

        if (sign_string !== expectedSign) {
            await t.rollback();
            console.error("[CLICK] Sign verification failed (Complete)");
            return res.json({
                error: ClickError.SignFailed.code,
                error_note: ClickError.SignFailed.note,
            });
        }

        // 2. ClickTransaction topish
        const clickTx = await ClickTransaction.findOne({
            where: { id: Number(merchant_prepare_id), clickTransId: click_trans_id },
            transaction: t,
        });

        if (!clickTx) {
            await t.rollback();
            return res.json({
                error: ClickError.TransactionNotFound.code,
                error_note: ClickError.TransactionNotFound.note,
            });
        }

        // 3. Allaqachon completed bo'lsa
        if (clickTx.state === 2) {
            await t.commit();
            return res.json({
                click_trans_id: Number(click_trans_id),
                merchant_trans_id: String(merchant_trans_id),
                merchant_confirm_id: clickTx.id,
                error: ClickError.AlreadyPaid.code,
                error_note: ClickError.AlreadyPaid.note,
            });
        }

        // 4. Allaqachon cancelled bo'lsa
        if (clickTx.state === -1) {
            await t.commit();
            return res.json({
                click_trans_id: Number(click_trans_id),
                merchant_trans_id: String(merchant_trans_id),
                merchant_confirm_id: clickTx.id,
                error: ClickError.TransactionCancelled.code,
                error_note: ClickError.TransactionCancelled.note,
            });
        }

        // 5. CLICK dan error kelsa (error <= -1) => bekor qilish
        const errorCode = Number(clickError);
        if (errorCode <= -1) {
            await clickTx.update(
                {
                    state: -1,
                    error: errorCode,
                    errorNote: clickErrorNote || "Cancelled by CLICK",
                },
                { transaction: t }
            );

            await t.commit();

            safeLog("COMPLETE (cancelled) >>>", { error: -9 });
            return res.json({
                click_trans_id: Number(click_trans_id),
                merchant_trans_id: String(merchant_trans_id),
                merchant_confirm_id: clickTx.id,
                error: ClickError.TransactionCancelled.code,
                error_note: ClickError.TransactionCancelled.note,
            });
        }

        // 6. Muvaffaqiyatli to'lov — pul yechilgan
        const amountSom = Number(amount);
        const account = clickTx.account || {};

        // User ni olish
        const user = await User.findByPk(clickTx.userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.json({
                error: ClickError.OrderNotFound.code,
                error_note: "User not found",
            });
        }

        // --- GAME PAYMENT ---
        if (account.type === "game" && account.game_id) {
            const game = await Game.findByPk(account.game_id, { transaction: t });

            if (!game) {
                // Game topilmasa, balansga qo'shamiz (fallback)
                console.warn(`[CLICK] Game ${account.game_id} not found, falling back to wallet topup`);
                await user.update(
                    { balance: Number(user.balance || 0) + amountSom },
                    { transaction: t }
                );
            } else {
                // UserGame yaratish yoki yangilash
                let userGameEntry = await UserGame.findOne({
                    where: { userId: user.id, gameId: game.id },
                    transaction: t,
                });

                if (userGameEntry) {
                    const newTotal = Number(userGameEntry.paymentAmount || 0) + amountSom;
                    await userGameEntry.update(
                        { paymentAmount: newTotal, status: "paid" },
                        { transaction: t }
                    );
                } else {
                    await UserGame.create(
                        {
                            userId: user.id,
                            gameId: game.id,
                            status: "paid",
                            paymentAmount: amountSom,
                            team: account.team || "Noma'lum",
                        },
                        { transaction: t }
                    );
                    await game.increment("playersJoined", { transaction: t });
                }

                // Transaction yaratish (expense)
                const txRecord = await Transaction.create(
                    {
                        userId: user.id,
                        amount: amountSom,
                        type: "expense",
                        description: `${game.title} (Click)`,
                        status: "approved",
                        paymentType: "click",
                        clickTransId: String(click_trans_id),
                        merchantTransId: String(merchant_trans_id),
                        merchantPrepareId: String(merchant_prepare_id),
                    },
                    { transaction: t }
                );

                await clickTx.update(
                    { transactionId: txRecord.id },
                    { transaction: t }
                );
            }
        } else {
            // --- WALLET TOPUP ---
            await user.update(
                { balance: Number(user.balance || 0) + amountSom },
                { transaction: t }
            );

            // Transaction yaratish (income)
            const txRecord = await Transaction.create(
                {
                    userId: user.id,
                    amount: amountSom,
                    type: "income",
                    description: "CLICK orqali balans to'ldirish",
                    status: "approved",
                    paymentType: "click",
                    clickTransId: String(click_trans_id),
                    merchantTransId: String(merchant_trans_id),
                    merchantPrepareId: String(merchant_prepare_id),
                },
                { transaction: t }
            );

            await clickTx.update(
                { transactionId: txRecord.id },
                { transaction: t }
            );
        }

        // ClickTransaction ni completed ga o'zgartirish
        await clickTx.update(
            {
                state: 2,
                error: 0,
                errorNote: "Success",
                signTime: sign_time,
            },
            { transaction: t }
        );

        await t.commit();

        // --- To'lov xabarnomasi Telegram botga ---
        try {
          const isGamePayment = account.type === "game" && account.game_id;
          let gameData = null;
          if (isGamePayment) {
            const g = await Game.findByPk(account.game_id);
            if (g) {
              gameData = {
                title: g.title,
                location: g.location,
                playDate: g.playDate,
                startTime: g.startTime,
                endTime: g.endTime,
              };
            }
          }
          notifyPayment({
            user: {
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              telegramId: account.telegram_id || "",
            },
            game: gameData,
            amount: amountSom,
            method: "click",
            team: account.team || "Noma'lum",
            type: isGamePayment ? "game" : "topup",
          }).catch(() => {});
        } catch (_) {}

        const response = {
            click_trans_id: Number(click_trans_id),
            merchant_trans_id: String(merchant_trans_id),
            merchant_confirm_id: clickTx.id,
            error: ClickError.Success.code,
            error_note: ClickError.Success.note,
        };

        safeLog("COMPLETE >>>", response);
        return res.json(response);
    } catch (err) {
        await t.rollback();
        console.error("[CLICK] Complete error:", err);
        return res.json({
            error: ClickError.BadRequest.code,
            error_note: "Internal server error",
        });
    }
};

module.exports = { handlePrepare, handleComplete };
