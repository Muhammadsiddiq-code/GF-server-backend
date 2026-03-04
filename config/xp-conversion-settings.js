/**
 * XP Conversion Security Settings Initialization
 * 
 * Bu fayl XP konvertatsiya tizimining havfsizlik sozlamalarini
 * initialize qilish uchun kerakli ma'lumotlarni o'z ichiga oladi.
 * 
 * Database'ga ushbu sozlamalarni qo'shish uchun:
 * 1. Admin panel'da Settings bo'limiga boring
 * 2. Quyidagi key-value juftliklarini qo'shing
 * 3. Yoki dasturlash orqali migration run qiling
 */

const XP_CONVERSION_SETTINGS = {
  // ========== KONVERTATSIYA FAOLLIGI ==========
  xpConversionEnabled: {
    key: "xpConversionEnabled",
    value: "true",
    description: "XP pulga konvertatsiya tizimini faollashtirish (true/false)",
  },

  // ========== KONVERTATSIYA KURSI ==========
  xpToMoneyRate: {
    key: "xpToMoneyRate",
    value: "100",
    description: "1 som uchun kerakli XP miqdori. Misol: 100 XP = 1000 so'm",
  },

  // ========== KONVERTATSIYA SONLI CHEGARALARI ==========
  minXpConversion: {
    key: "minXpConversion",
    value: "10",
    description: "Bitta tranzaksiyada konvertatsiya qilish uchun minimal XP miqdori (havfsizlik)",
  },

  maxXpConversion: {
    key: "maxXpConversion",
    value: "1000000",
    description: "Bitta tranzaksiyada konvertatsiya qilish uchun maksimal XP miqdori (havfsizlik)",
  },

  // ========== REFERRAL XP SOZLAMALARI ==========
  xpForReferrer: {
    key: "xpForReferrer",
    value: "1000",
    description: "Birov taklif qilgan uchun beriladi XP miqdori",
  },

  xpForReferred: {
    key: "xpForReferred",
    value: "500",
    description: "Taklif qilingan yangi user uchun beriladi XP miqdori",
  },
};

/**
 * HAVFSIZLIK XUSUSIYATLARI (Security Features)
 * 
 * 1. ✅ INPUT VALIDATION:
 *    - TelegramId va UserId formatni tekshirish
 *    - XP miqdorini musbat butun raqam sifatida tekshirish
 * 
 * 2. ✅ CONVERSION LIMITS:
 *    - Minimal konvertatsiya: kamida 10 XP (foydasiz tranzaksiyalarni oldini olish)
 *    - Maksimal konvertatsiya: 1,000,000 XP per tranzaksiya
 *    - Bu sozlamalarni admin panel'dan o'zgartirish mumkin
 * 
 * 3. ✅ SUFFICIENT BALANCE CHECK:
 *    - Foydalanuvchi yetarli XP mavjudligini tekshirish
 *    - Tranzaksiya ichida qayta-tekshirish (race condition oldini olish)
 *    - Detailed error messages bilan XP kamiga haqida ma'lumot berish
 * 
 * 4. ✅ ATOMIC TRANSACTIONS:
 *    - Database-level transaction lock'i Q'llash (UPDATE LOCK)
 *    - XP ayirish va balance qo'shish atomik operatsiya (birgalikda yoki hech)
 *    - Tranzaksiya tarixiga yozish (audit log)
 * 
 * 5. ✅ COMPREHENSIVE LOGGING:
 *    - [SECURITY] tegisi bilan barcha muhim hodisalarni log qilish
 *    - [SUCCESS] tegisi bilan muvaffaqiyatli tranzaksiyalarni log qilish
 *    - [ERROR] tegisi bilan xatolarni log qilish
 *    - User info, XP miqdori, conversion rate hammasini saqlash
 * 
 * 6. ✅ CONVERSION SETTINGS CHECK:
 *    - Konvertatsiya tizim o'chiq/o'chilganligini tekshirish
 *    - Har bir konvertatsiyada faollik statusini tekshirish
 * 
 * 7. ✅ ADMIN OPERATIONS:
 *    - Admin tomonidan konvertatsiya qilishda ham barcha security checks qo'llanish
 *    - User ID va Telegram ID bilan audit trail
 * 
 * 8. ✅ ERROR HANDLING:
 *    - Specific error codes (INSUFFICIENT_XP_TRANSACTION) bilan
 *    - Detailed error messages English va O'zbek tilida
 *    - User ma'lumotlarini aralashtirib ketmasllik
 * 
 * EXAMPLE FLOW:
 * ===============
 * 1. Client: POST /api/users/convert-xp/123456789
 *            { xpAmount: 500 }
 * 
 * 2. Server Security Checks:
 *    ✓ TelegramId formatni tekshir
 *    ✓ XP miqdori musbat integer bo'lsa tekshir
 *    ✓ XP miqdori minimal 10 dan ko'p bo'lsa tekshir
 *    ✓ XP miqdori maksimal 1,000,000 dan kam bo'lsa tekshir
 *    ✓ Konvertatsiya enabled bo'lsa tekshir
 * 
 * 3. User Validation:
 *    ✓ User database'da mavjudligini tekshir
 *    ✓ User XP balansinin yetarliligi tekshir (client-side preview)
 * 
 * 4. Atomic Transaction:
 *    ✓ Transaction start va lock orth
 *    ✓ User XP balansini qayta-tekshir (critical!)
 *    ✓ XP ayirish
 *    ✓ Balance qo'shish
 *    ✓ Transaction record yozish (audit)
 *    ✓ Transaction commit yoki rollback
 * 
 * 5. Response:
 *    ✓ Success: { newXp, newBalance, moneyReceived, xpConverted }
 *    ✓ Error: { message, available, requested, shortfall }
 * 
 * 6. Audit Logging:
 *    ✓ All operations logged with [SECURITY], [SUCCESS], [ERROR] tags
 *    ✓ User identification (telegramId, userId)
 *    ✓ Transaction details (xpAmount, moneyAmount, rate)
 */

module.exports = XP_CONVERSION_SETTINGS;
