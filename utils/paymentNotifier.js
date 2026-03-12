// utils/paymentNotifier.js
// To'lov muvaffaqiyatli bo'lganda Telegram botga xabar yuborish
require("dotenv").config();

const PAYMENT_NOTIFY_BOT_TOKEN = process.env.PAYMENT_NOTIFY_BOT_TOKEN;
const PAYMENT_NOTIFY_CHAT_ID = process.env.PAYMENT_NOTIFY_CHAT_ID;

/**
 * Telegram Bot API orqali xabar yuborish
 * @param {string} text HTML formatdagi xabar
 */
const sendTelegramMessage = async (text) => {
  if (!PAYMENT_NOTIFY_BOT_TOKEN || !PAYMENT_NOTIFY_CHAT_ID) {
    console.warn("[PaymentNotifier] PAYMENT_NOTIFY_BOT_TOKEN yoki PAYMENT_NOTIFY_CHAT_ID .env da topilmadi, xabar yuborilmadi.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${PAYMENT_NOTIFY_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: PAYMENT_NOTIFY_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[PaymentNotifier] Telegram API xatolik:", errorData);
    }
  } catch (error) {
    console.error("[PaymentNotifier] Xabar yuborishda xatolik:", error.message);
  }
};

/**
 * To'lov xabarnomasi yuborish
 * @param {Object} params
 * @param {Object} params.user - User ma'lumotlari (firstName, lastName, username, telegramId)
 * @param {Object|null} params.game - O'yin ma'lumotlari (title, location, playDate, startTime, endTime)
 * @param {number} params.amount - To'lov summasi (UZS)
 * @param {string} params.method - To'lov usuli: "wallet", "payme", "click"
 * @param {string} [params.team] - Jamoa nomi
 * @param {string} [params.type] - "game" yoki "topup"
 */
const notifyPayment = async ({ user, game, amount, method, team, type }) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleString("uz-UZ", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const methodLabels = {
      wallet: "💳 Hamyon (Wallet)",
      payme: "💳 Payme",
      click: "💳 Click",
    };

    const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Noma'lum";
    const userHandle = user?.username ? `@${user.username}` : "—";
    const telegramId = user?.telegramId || "—";

    let message = `💰 <b>YANGI TO'LOV!</b>\n\n`;
    message += `👤 <b>User:</b> ${userName} (${userHandle})\n`;
    message += `🆔 <b>Telegram ID:</b> <code>${telegramId}</code>\n`;

    if (type === "game" && game) {
      message += `\n⚽ <b>O'yin:</b> ${game.title || "—"}\n`;
      message += `📍 <b>Manzil:</b> ${game.location || "—"}\n`;
      message += `📅 <b>Sana:</b> ${game.playDate || "—"}\n`;
      const timeRange = game.startTime
        ? game.endTime
          ? `${game.startTime} - ${game.endTime}`
          : game.startTime
        : "—";
      message += `⏰ <b>Vaqt:</b> ${timeRange}\n`;
      message += `👕 <b>Jamoa:</b> ${team || "Noma'lum"}\n`;
    } else {
      message += `\n📥 <b>Tur:</b> Hamyonni to'ldirish (Top-up)\n`;
    }

    message += `\n💵 <b>Summa:</b> ${Number(amount).toLocaleString()} UZS\n`;
    message += `💳 <b>Usul:</b> ${methodLabels[method] || method}\n`;
    message += `🕐 <b>Vaqt:</b> ${timeStr}`;

    await sendTelegramMessage(message);
  } catch (error) {
    // Xabar yuborilmasa ham to'lovga ta'sir qilmasin
    console.error("[PaymentNotifier] notifyPayment xatolik:", error.message);
  }
};

module.exports = { notifyPayment };
