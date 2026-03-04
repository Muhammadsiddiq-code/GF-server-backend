/**
 * XP Conversion Security Settings Database Seeder
 *
 * Bu fayl XP konvertatsiya havfsizlik sozlamalarini database'ga
 * qo'shish uchun ishlatiladigan script'dir.
 *
 * USAGE:
 * ------
 * const { Setting } = require("../models");
 * const initXpSecuritySettings = require("./xp-security-seeder");
 *
 * // Startup'da yoki seeders orqali:
 * await initXpSecuritySettings(Setting);
 */

const XP_CONVERSION_SETTINGS = {
  xpConversionEnabled: "true",
  xpToMoneyRate: "100",
  minXpConversion: "10",
  maxXpConversion: "1000000",
  xpForReferrer: "1000",
  xpForReferred: "500",
};

const DESCRIPTIONS = {
  xpConversionEnabled: "XP pulga konvertatsiya tizimini faollashtirish (true/false)",
  xpToMoneyRate: "1 som uchun kerakli XP miqdori. Misol: 100 XP = 1000 so'm",
  minXpConversion: "Bitta tranzaksiyada konvertatsiya qilish uchun minimal XP miqdori (havfsizlik)",
  maxXpConversion: "Bitta tranzaksiyada konvertatsiya qilish uchun maksimal XP miqdori (havfsizlik)",
  xpForReferrer: "Birov taklif qilgan uchun beriladi XP miqdori",
  xpForReferred: "Taklif qilingan yangi user uchun beriladi XP miqdori",
};

/**
 * Ushbu funk Setting'larni database'ga initialize qiladi.
 * Mavjud qiymatlarni o'zgartirmaydi, faqat yetishmayotganlarini yaratadi
 * va description kerak bo'lsa yangilaydi.
 */
const initXpSecuritySettings = async (Setting) => {
  try {
    console.log("[XP Settings] Initializing XP conversion security settings...");

    for (const [key, value] of Object.entries(XP_CONVERSION_SETTINGS)) {
      const description = DESCRIPTIONS[key] || "";
      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: String(value),
          description,
        },
      });

      if (!created && setting.description !== description) {
        await setting.update({ description });
      }

      console.log(
        created
          ? `[XP Settings] Created: ${key} = ${value}`
          : `[XP Settings] Preserved: ${key} = ${setting.value}`
      );
    }

    console.log("[XP Settings] All XP conversion security settings initialized successfully");
    return true;
  } catch (error) {
    console.error("[XP Settings] Error initializing settings:", error.message);
    throw error;
  }
};

/**
 * App startup'da xarxalnatirish (app.js yoki index.js'da):
 *
 * const { Setting } = require("./models");
 * const initXpSecuritySettings = require("./config/xp-security-seeder");
 *
 * // Database'ga ulanishdan so'ng
 * await initXpSecuritySettings(Setting);
 */

module.exports = initXpSecuritySettings;
