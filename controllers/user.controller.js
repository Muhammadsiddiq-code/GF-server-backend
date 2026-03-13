// // controllers/user.controller.js
// const { User, Transaction, UserGame, Referral, Setting, sequelize } = require("../models");

// const DEFAULT_XP_RATE = 100;
// const DEFAULT_MIN_XP_CONVERSION = 10; // Minimum XP for one conversion
// const DEFAULT_MAX_XP_CONVERSION = 1000000; // Maximum XP per single transaction

// const getXpConversionMeta = async () => {
//   const settings = await Promise.all([
//     Setting.findByPk("xpConversionEnabled"),
//     Setting.findByPk("xpToMoneyRate"),
//     Setting.findByPk("minXpConversion"),
//     Setting.findByPk("maxXpConversion"),
//   ]);

//   const [enabledSetting, rateSetting, minSetting, maxSetting] = settings;

//   const xpRate = Math.max(
//     parseInt(rateSetting?.value || DEFAULT_XP_RATE, 10) || DEFAULT_XP_RATE,
//     1
//   );

//   const minXp = Math.max(
//     parseInt(minSetting?.value || DEFAULT_MIN_XP_CONVERSION, 10) || DEFAULT_MIN_XP_CONVERSION,
//     1
//   );

//   const maxXp = Math.max(
//     parseInt(maxSetting?.value || DEFAULT_MAX_XP_CONVERSION, 10) || DEFAULT_MAX_XP_CONVERSION,
//     minXp + 1
//   );

//   return {
//     enabled: enabledSetting?.value === "true",
//     xpRate,
//     moneyPerRate: 1000,
//     minXpConversion: minXp,
//     maxXpConversion: maxXp,
//   };
// };

// // Tasodifiy 16 xonalik karta raqami yasash (GF-XXXX-XXXX-XXXX)
// const generateCardNumber = () => {
//   const p1 = Math.floor(1000 + Math.random() * 9000); // 4 ta raqam
//   const p2 = Math.floor(1000 + Math.random() * 9000);
//   const p3 = Math.floor(1000 + Math.random() * 9000);
//   return `GF-8600-${p1}-${p2}-${p3}`; // Masalan: GF-8600-1234-5678-9012
// };

// // Login or Register (Va Profile Update)
// exports.loginOrRegister = async (req, res) => {
//   try {
//     const {
//       telegramId,
//       firstName,
//       lastName,
//       username,
//       photo_url,
//       start_param,
//       phone,
//       city,
//       position,
//     } = req.body;

//     console.log("------------------------------------------------");
//     console.log("REQUEST KELDI:", { telegramId, city, position, phone });

//     if (!telegramId) {
//       return res.status(400).json({ message: "Telegram ID yetishmayapti" });
//     }

//     const strId = String(telegramId);
//     let user = await User.findOne({ where: { telegramId: strId } });

//     // 1. UPDATE USER
//     if (user) {
//       console.log("User topildi, ma'lumotlar yangilanmoqda...");
//       const updatedFields = {};

//       if (firstName) updatedFields.firstName = firstName;
//       if (lastName) updatedFields.lastName = lastName;
//       if (username) updatedFields.username = username;
//       if (photo_url) updatedFields.photo = photo_url;
//       if (phone) updatedFields.phone = phone;
//       if (city) updatedFields.city = city;
//       if (position) updatedFields.position = position;

//       // Agar eski userlarda karta raqami bo'lmasa, yaratib beramiz
//       if (!user.walletCardNumber) {
//         updatedFields.walletCardNumber = generateCardNumber();
//       }

//       await user.update(updatedFields);
//       console.log("Yangilandi:", updatedFields);
//       return res.json({ message: "Muvaffaqiyatli yangilandi", user });
//     }

//     // 2. CREATE NEW USER
//     else {
//       console.log("Yangi user yaratilmoqda...");

//       user = await User.create({
//         telegramId: strId,
//         firstName,
//         lastName,
//         username,
//         photo: photo_url,
//         invitedBy: start_param ? String(start_param) : null,
//         xp: 500,
//         phone: phone || "",
//         city: city || "-",
//         position: position || "Mid",
//         // YANGI: Boshlang'ich balans va karta
//         balance: 0,
//         walletCardNumber: generateCardNumber(),
//       });

//       console.log("Yangi user bazaga yozildi. Karta:", user.walletCardNumber);

//       return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
//     }
//   } catch (error) {
//     console.error("XATOLIK:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // All Users
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.findAll({ order: [["xp", "DESC"]] });
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Balansni yangilash (Admin tomonidan)
// exports.updateUserBalance = async (req, res) => {
//   try {
//     const { userId, amount, type } = req.body; // Frontenddan keladigan ma'lumotlar

//     // 1. Userni topish
//     const user = await User.findByPk(userId);
//     if (!user) {
//       return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
//     }

//     const value = parseFloat(amount);
//     let newBalance = parseFloat(user.balance || 0);

//     // 2. Balansni hisoblash
//     if (type === "add") {
//       newBalance += value;
//     } else if (type === "subtract") {
//       newBalance -= value;
//     }

//     // 3. User balansini yangilash
//     await user.update({ balance: newBalance });

//     // 4. Tarix (Transaction) yaratish
//     await Transaction.create({
//       userId: user.id,
//       amount: value,
//       type: type === "add" ? "income" : "expense",
//       description: "Admin tomonidan balans o'zgartirildi",
//       paymentMethod: "cash",
//       status: "completed"
//     });

//     res.json({
//       message: "Balans muvaffaqiyatli yangilandi",
//       newBalance: newBalance,
//     });

//   } catch (error) {
//     console.error("Update Balance Error:", error);
//     res.status(500).json({ message: "Server xatosi: " + error.message });
//   }
// };

// // User ma'lumotlarini yangilash
// exports.updateUser = async (req, res) => {
//   try {
//     const { telegramId } = req.params;
//     const { phone, city, position } = req.body;

//     const user = await User.findOne({ where: { telegramId } });
//     if (!user) {
//       return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
//     }

//     await user.update({
//       phone: phone || user.phone,
//       city: city || user.city,
//       position: position || user.position,
//     });

//     res.json({ message: "Muvaffaqiyatli saqlandi", user });
//   } catch (error) {
//     console.error("Update User Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // --- REFERRAL STATS ---
// exports.getReferralStats = async (req, res) => {
//   try {
//     const { telegramId } = req.params;

//     if (!telegramId) {
//       return res.status(400).json({ message: "Telegram ID kerak" });
//     }

//     const user = await User.findOne({ where: { telegramId: String(telegramId) } });
//     if (!user) {
//       return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
//     }

//     const referrals = await Referral.findAll({
//       where: { referrerUserId: user.id, status: "completed" },
//       include: [{
//         model: User,
//         as: "referred",
//         attributes: ['id', 'firstName', 'lastName', 'username', 'photo', 'xp', 'createdAt'],
//       }],
//       order: [['createdAt', 'DESC']],
//     });

//     let invitedUsers = [];
//     let totalXpEarned = 0;

//     if (referrals.length > 0) {
//       invitedUsers = referrals.map(r => ({
//         id: r.referred?.id,
//         firstName: r.referred?.firstName,
//         lastName: r.referred?.lastName,
//         username: r.referred?.username,
//         photo: r.referred?.photo,
//         xp: r.referred?.xp,
//         joinedAt: r.createdAt,
//         xpAwarded: r.xpAwardedToReferrer,
//       }));
//       totalXpEarned = referrals.reduce((sum, r) => sum + (r.xpAwardedToReferrer || 0), 0);
//     } else {
//       const oldInvites = await User.findAll({
//         where: { invitedBy: String(telegramId) },
//         attributes: ['id', 'firstName', 'lastName', 'username', 'photo', 'xp', 'createdAt'],
//         order: [['createdAt', 'DESC']],
//       });
//       invitedUsers = oldInvites.map(u => ({
//         id: u.id,
//         firstName: u.firstName,
//         lastName: u.lastName,
//         username: u.username,
//         photo: u.photo,
//         xp: u.xp,
//         joinedAt: u.createdAt,
//       }));
//       totalXpEarned = invitedUsers.length * 1000;
//     }

//     const totalInvited = invitedUsers.length;

//     res.json({
//       totalInvited,
//       totalXpEarned,
//       invitedCount: user.invitedCount || 0,
//       invitedBy: user.invitedBy || null,
//       invitedUsers,
//     });
//   } catch (error) {
//     console.error("Referral Stats Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // --- YANGI: USER STATISTIKASI (XP va O'yinlar) ---
// exports.getUserStats = async (req, res) => {
//   try {
//     const { telegramId } = req.params;

//     const user = await User.findOne({ where: { telegramId: String(telegramId) } });
//     if (!user) {
//       return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
//     }

//     const [totalGamesPlayed, referralXp, referredBonusXp, conversion] =
//       await Promise.all([
//         UserGame.count({
//           where: { userId: user.id },
//         }),
//         Referral.sum("xpAwardedToReferrer", {
//           where: { referrerUserId: user.id, status: "completed" },
//         }),
//         Referral.sum("xpAwardedToReferred", {
//           where: { referredUserId: user.id, status: "completed" },
//         }),
//         getXpConversionMeta(),
//       ]);

//     res.json({
//       success: true,
//       stats: {
//         totalXp: user.xp || 0,
//         totalGamesPlayed,
//         referralXp: referralXp || 0,
//         referredBonusXp: referredBonusXp || 0,
//         invitedCount: user.invitedCount || 0,
//         balance: user.balance || 0,
//         conversion,
//       },
//     });
//   } catch (error) {
//     console.error("User Stats Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // --- YANGI: XP NI PULGA ALMASHTIRISH (USER) ---
// exports.convertXpToMoney = async (req, res) => {
//   try {
//     const { telegramId } = req.params;
//     const xpAmount = parseInt(req.body.xpAmount, 10);

//     // ========== SECURITY: INPUT VALIDATION ==========
//     // 1. TelegramId ni tekshirish
//     if (!telegramId || typeof telegramId !== 'string' || telegramId.trim().length === 0) {
//       console.warn(`[SECURITY] Invalid telegramId format: ${telegramId}`);
//       return res.status(400).json({ message: "Telegram ID noto'g'ri" });
//     }

//     // 2. XP miqdorini tekshirish (raqam bo'lishi kerak va musbat)
//     if (!Number.isInteger(xpAmount) || xpAmount <= 0) {
//       console.warn(`[SECURITY] Invalid XP amount: ${xpAmount} from ${telegramId}`);
//       return res.status(400).json({ message: "XP miqdori musbat butun raqam bo'lishi kerak" });
//     }

//     // ========== SECURITY: CONVERSION SETTINGS ==========
//     const conversionMeta = await getXpConversionMeta();
//     if (!conversionMeta.enabled) {
//       console.warn(`[SECURITY] XP conversion is disabled, attempt from ${telegramId}`);
//       return res.status(403).json({ message: "XP konvertatsiyasi hozircha o'chirilgan" });
//     }

//     // 3. Minimal konvertatsiya chegarasi
//     if (xpAmount < conversionMeta.minXpConversion) {
//       console.warn(
//         `[SECURITY] XP amount below minimum: ${xpAmount}, minimum=${conversionMeta.minXpConversion} from ${telegramId}`
//       );
//       return res.status(400).json({
//         message: `Kamida ${conversionMeta.minXpConversion} XP konvertatsiya qilish kerak`,
//         minimum: conversionMeta.minXpConversion,
//       });
//     }

//     // 4. Maksimal konvertatsiya chegarasi (havfsizlik uchun)
//     if (xpAmount > conversionMeta.maxXpConversion) {
//       console.warn(`[SECURITY] XP amount exceeds maximum limit: ${xpAmount} from ${telegramId}`);
//       return res.status(400).json({
//         message: `Bitta tranzaksiyada ${conversionMeta.maxXpConversion} dan ko'p XP konvertatsiya qila olmaysiz`,
//         maximum: conversionMeta.maxXpConversion,
//       });
//     }

//     // ========== SECURITY: USER VALIDATION ==========
//     const user = await User.findOne({ where: { telegramId: String(telegramId) } });
//     if (!user) {
//       console.warn(`[SECURITY] User not found: ${telegramId}`);
//       return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
//     }

//     // ========== SECURITY: XP BALANCE CHECK ==========
//     const userXp = user.xp || 0;
//     if (userXp < xpAmount) {
//       console.warn(
//         `[SECURITY] Insufficient XP: requested=${xpAmount}, available=${userXp}, user=${telegramId}`
//       );
//       return res.status(400).json({
//         message: "XP yetarli emas",
//         available: userXp,
//         requested: xpAmount,
//         shortfall: xpAmount - userXp,
//       });
//     }

//     // ========== SECURITY: ATOMIC TRANSACTION ==========
//     const result = await sequelize.transaction(async (t) => {
//       // Re-fetch user data inside transaction to prevent race conditions
//       const userInTransaction = await User.findByPk(user.id, { transaction: t, lock: t.LOCK.UPDATE });

//       if (!userInTransaction) {
//         throw new Error("User deleted during transaction");
//       }

//       // Double-check XP balance inside transaction (critical security check)
//       if (userInTransaction.xp < xpAmount) {
//         const error = new Error("Insufficient XP during transaction");
//         error.code = "INSUFFICIENT_XP_TRANSACTION";
//         throw error;
//       }

//       // Calculate money amount
//       const moneyAmount = (xpAmount / conversionMeta.xpRate) * conversionMeta.moneyPerRate;

//       // Perform XP deduction
//       await userInTransaction.decrement('xp', { by: xpAmount, transaction: t });

//       // Add to balance
//       await userInTransaction.increment('balance', { by: moneyAmount, transaction: t });

//       // Record transaction in audit log
//       await Transaction.create(
//         {
//           userId: userInTransaction.id,
//           amount: moneyAmount,
//           type: 'income',
//           description: `${xpAmount} XP dan konvertatsiya qilindi (Kursi: ${conversionMeta.xpRate} XP = ${conversionMeta.moneyPerRate})`,
//           paymentType: 'xp_conversion',
//           status: 'approved',
//         },
//         { transaction: t }
//       );

//       return {
//         xpDeducted: xpAmount,
//         moneyAdded: moneyAmount,
//         newXp: userInTransaction.xp - xpAmount,
//         newBalance: (userInTransaction.balance || 0) + moneyAmount,
//       };
//     });

//     console.log(`[SUCCESS] XP Conversion: user=${telegramId}, xp=${xpAmount}, money=${result.moneyAdded}`);

//     res.json({
//       success: true,
//       message: "XP muvaffaqiyatli konvertatsiya qilindi",
//       xpConverted: result.xpDeducted,
//       moneyReceived: result.moneyAdded,
//       newXp: result.newXp,
//       newBalance: result.newBalance,
//     });

//   } catch (error) {
//     console.error(`[ERROR] XP Conversion Failed: ${error.message}`, error);

//     // Handle specific transaction errors
//     if (error.code === "INSUFFICIENT_XP_TRANSACTION") {
//       return res.status(409).json({ message: "XP mavjudligi o'zgarib qoldi. Iltimos qaytadan urinib ko'ring" });
//     }

//     res.status(500).json({ message: "XP konvertatsiya xatosi:", error: error.message });
//   }
// };

// // --- YANGI: ADMIN XP NI PULGA ALMASHTIRISH ---
// exports.adminConvertXpToMoney = async (req, res) => {
//   try {
//     const userId = parseInt(req.body.userId, 10);
//     const xpAmount = parseInt(req.body.xpAmount, 10);

//     // ========== SECURITY: INPUT VALIDATION ==========
//     // 1. UserId ni tekshirish
//     if (!Number.isInteger(userId) || userId <= 0) {
//       console.warn(`[SECURITY] Invalid userId format: ${userId}`);
//       return res.status(400).json({ message: "Foydalanuvchi ID noto'g'ri" });
//     }

//     // 2. XP miqdorini tekshirish (raqam bo'lishi kerak va musbat)
//     if (!Number.isInteger(xpAmount) || xpAmount <= 0) {
//       console.warn(`[SECURITY] Invalid XP amount: ${xpAmount} for userId: ${userId}`);
//       return res.status(400).json({ message: "XP miqdori musbat butun raqam bo'lishi kerak" });
//     }

//     // ========== SECURITY: CONVERSION SETTINGS ==========
//     const conversionMeta = await getXpConversionMeta();
//     if (!conversionMeta.enabled) {
//       console.warn(`[SECURITY] XP conversion is disabled, admin attempt for userId: ${userId}`);
//       return res.status(403).json({ message: "XP konvertatsiyasi hozircha o'chirilgan" });
//     }

//     // 3. Minimal konvertatsiya chegarasi
//     if (xpAmount < conversionMeta.minXpConversion) {
//       console.warn(
//         `[SECURITY] XP amount below minimum: ${xpAmount}, minimum=${conversionMeta.minXpConversion} for userId: ${userId}`
//       );
//       return res.status(400).json({
//         message: `Kamida ${conversionMeta.minXpConversion} XP konvertatsiya qilish kerak`,
//         minimum: conversionMeta.minXpConversion,
//       });
//     }

//     // 4. Maksimal konvertatsiya chegarasi (havfsizlik uchun)
//     if (xpAmount > conversionMeta.maxXpConversion) {
//       console.warn(`[SECURITY] XP amount exceeds maximum limit: ${xpAmount} for userId: ${userId}`);
//       return res.status(400).json({
//         message: `Bitta tranzaksiyada ${conversionMeta.maxXpConversion} dan ko'p XP konvertatsiya qila olmaysiz`,
//         maximum: conversionMeta.maxXpConversion,
//       });
//     }

//     // ========== SECURITY: USER VALIDATION ==========
//     const user = await User.findByPk(userId);
//     if (!user) {
//       console.warn(`[SECURITY] User not found with ID: ${userId}`);
//       return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
//     }

//     // ========== SECURITY: XP BALANCE CHECK ==========
//     const userXp = user.xp || 0;
//     if (userXp < xpAmount) {
//       console.warn(
//         `[SECURITY] Insufficient XP: requested=${xpAmount}, available=${userXp}, userId=${userId}`
//       );
//       return res.status(400).json({
//         message: "Foydalanuvchida XP yetarli emas",
//         available: userXp,
//         requested: xpAmount,
//         shortfall: xpAmount - userXp,
//       });
//     }

//     // ========== SECURITY: ATOMIC TRANSACTION ==========
//     const result = await sequelize.transaction(async (t) => {
//       // Re-fetch user data inside transaction to prevent race conditions and apply lock
//       const userInTransaction = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });

//       if (!userInTransaction) {
//         throw new Error("User deleted during transaction");
//       }

//       // Double-check XP balance inside transaction (critical security check)
//       if (userInTransaction.xp < xpAmount) {
//         const error = new Error("Insufficient XP during transaction");
//         error.code = "INSUFFICIENT_XP_TRANSACTION";
//         throw error;
//       }

//       // Calculate money amount
//       const moneyAmount = (xpAmount / conversionMeta.xpRate) * conversionMeta.moneyPerRate;

//       // Perform XP deduction
//       await userInTransaction.decrement('xp', { by: xpAmount, transaction: t });

//       // Add to balance
//       await userInTransaction.increment('balance', { by: moneyAmount, transaction: t });

//       // Record transaction in audit log with admin details
//       await Transaction.create(
//         {
//           userId: userInTransaction.id,
//           amount: moneyAmount,
//           type: 'income',
//           description: `Admin tomonidan ${xpAmount} XP konvertatsiya qilindi (Kursi: ${conversionMeta.xpRate} XP = ${conversionMeta.moneyPerRate})`,
//           paymentType: 'admin_xp_conversion',
//           status: 'approved',
//         },
//         { transaction: t }
//       );

//       return {
//         xpDeducted: xpAmount,
//         moneyAdded: moneyAmount,
//         newXp: userInTransaction.xp - xpAmount,
//         newBalance: (userInTransaction.balance || 0) + moneyAmount,
//         userTelegramId: userInTransaction.telegramId,
//       };
//     });

//     console.log(
//       `[SUCCESS] Admin XP Conversion: userId=${userId}, telegramId=${result.userTelegramId}, xp=${xpAmount}, money=${result.moneyAdded}`
//     );

//     res.json({
//       success: true,
//       message: "XP muvaffaqiyatli konvertatsiya qilindi",
//       xpConverted: result.xpDeducted,
//       moneyReceived: result.moneyAdded,
//       newXp: result.newXp,
//       newBalance: result.newBalance,
//     });

//   } catch (error) {
//     console.error(`[ERROR] Admin XP Conversion Failed: ${error.message}`, error);

//     // Handle specific transaction errors
//     if (error.code === "INSUFFICIENT_XP_TRANSACTION") {
//       return res.status(409).json({ message: "XP mavjudligi o'zgarib qoldi. Iltimos qaytadan urinib ko'ring" });
//     }

//     res.status(500).json({ message: "Admin XP konvertatsiya xatosi:", error: error.message });
//   }
// };



































// controllers/user.controller.js
const { User, Transaction, UserGame, Referral, Setting, sequelize } = require("../models");

const DEFAULT_XP_RATE = 100;
const DEFAULT_MIN_XP_CONVERSION = 10; // Minimum XP for one conversion
const DEFAULT_MAX_XP_CONVERSION = 1000000; // Maximum XP per single transaction

const getXpConversionMeta = async () => {
  const settings = await Promise.all([
    Setting.findByPk("xpConversionEnabled"),
    Setting.findByPk("xpToMoneyRate"),
    Setting.findByPk("minXpConversion"),
    Setting.findByPk("maxXpConversion"),
  ]);

  const [enabledSetting, rateSetting, minSetting, maxSetting] = settings;

  const xpRate = Math.max(
    parseInt(rateSetting?.value || DEFAULT_XP_RATE, 10) || DEFAULT_XP_RATE,
    1
  );

  const minXp = Math.max(
    parseInt(minSetting?.value || DEFAULT_MIN_XP_CONVERSION, 10) || DEFAULT_MIN_XP_CONVERSION,
    1
  );

  const maxXp = Math.max(
    parseInt(maxSetting?.value || DEFAULT_MAX_XP_CONVERSION, 10) || DEFAULT_MAX_XP_CONVERSION,
    minXp + 1
  );

  return {
    enabled: enabledSetting?.value === "true",
    xpRate,
    moneyPerRate: 1000,
    minXpConversion: minXp,
    maxXpConversion: maxXp,
  };
};

// Tasodifiy 16 xonalik karta raqami yasash (GF-XXXX-XXXX-XXXX)
const generateCardNumber = () => {
  const p1 = Math.floor(1000 + Math.random() * 9000); // 4 ta raqam
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const p3 = Math.floor(1000 + Math.random() * 9000);
  return `GF-8600-${p1}-${p2}-${p3}`; // Masalan: GF-8600-1234-5678-9012
};

// Login or Register (Va Profile Update)
exports.loginOrRegister = async (req, res) => {
  try {
    const {
      telegramId,
      firstName,
      lastName,
      username,
      photo_url,
      start_param,
      phone,
      city,
      position,
    } = req.body;

    console.log("------------------------------------------------");
    console.log("REQUEST KELDI:", { telegramId, city, position, phone });

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID yetishmayapti" });
    }

    const strId = String(telegramId);
    let user = await User.findOne({ where: { telegramId: strId } });

    // 1. UPDATE USER
    if (user) {
      console.log("User topildi, ma'lumotlar yangilanmoqda...");
      const updatedFields = {};

      if (firstName) updatedFields.firstName = firstName;
      if (lastName) updatedFields.lastName = lastName;
      if (username) updatedFields.username = username;
      if (photo_url) updatedFields.photo = photo_url;
      if (phone) updatedFields.phone = phone;
      if (city) updatedFields.city = city;
      if (position) updatedFields.position = position;

      // Agar eski userlarda karta raqami bo'lmasa, yaratib beramiz
      if (!user.walletCardNumber) {
        updatedFields.walletCardNumber = generateCardNumber();
      }

      await user.update(updatedFields);
      console.log("Yangilandi:", updatedFields);
      return res.json({ message: "Muvaffaqiyatli yangilandi", user });
    }

    // 2. CREATE NEW USER
    else {
      console.log("Yangi user yaratilmoqda...");

      user = await User.create({
        telegramId: strId,
        firstName,
        lastName,
        username,
        photo: photo_url,
        invitedBy: start_param ? String(start_param) : null,
        xp: 500,
        phone: phone || "",
        city: city || "-",
        position: position || "Mid",
        // YANGI: Boshlang'ich balans va karta
        balance: 0,
        walletCardNumber: generateCardNumber(),
      });

      console.log("Yangi user bazaga yozildi. Karta:", user.walletCardNumber);

      return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
    }
  } catch (error) {
    console.error("XATOLIK:", error);
    res.status(500).json({ error: error.message });
  }
};

// All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [["xp", "DESC"]] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get User By ID (for Admin Panel)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({ message: "Server xatosi: " + error.message });
  }
};

// Balansni yangilash (Admin tomonidan)
exports.updateUserBalance = async (req, res) => {
  try {
    const { userId, amount, type } = req.body; // Frontenddan keladigan ma'lumotlar

    // 1. Userni topish
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    const value = parseFloat(amount);
    let newBalance = parseFloat(user.balance || 0);

    // 2. Balansni hisoblash
    if (type === "add") {
      newBalance += value;
    } else if (type === "subtract") {
      newBalance -= value;
    }

    // 3. User balansini yangilash
    await user.update({ balance: newBalance });

    // 4. Tarix (Transaction) yaratish
    await Transaction.create({
      userId: user.id,
      amount: value,
      type: type === "add" ? "income" : "expense",
      description: "Admin tomonidan balans o'zgartirildi",
      paymentMethod: "cash",
      status: "completed"
    });

    res.json({
      message: "Balans muvaffaqiyatli yangilandi",
      newBalance: newBalance,
    });

  } catch (error) {
    console.error("Update Balance Error:", error);
    res.status(500).json({ message: "Server xatosi: " + error.message });
  }
};

// User ma'lumotlarini yangilash
exports.updateUser = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { phone, city, position } = req.body;

    const user = await User.findOne({ where: { telegramId } });
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    await user.update({
      phone: phone || user.phone,
      city: city || user.city,
      position: position || user.position,
    });

    res.json({ message: "Muvaffaqiyatli saqlandi", user });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- REFERRAL STATS ---
exports.getReferralStats = async (req, res) => {
  try {
    const { telegramId } = req.params;

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram ID kerak" });
    }

    const user = await User.findOne({ where: { telegramId: String(telegramId) } });
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    const referrals = await Referral.findAll({
      where: { referrerUserId: user.id, status: "completed" },
      include: [{
        model: User,
        as: "referred",
        attributes: ['id', 'firstName', 'lastName', 'username', 'photo', 'xp', 'createdAt'],
      }],
      order: [['createdAt', 'DESC']],
    });

    let invitedUsers = [];
    let totalXpEarned = 0;

    if (referrals.length > 0) {
      invitedUsers = referrals.map(r => ({
        id: r.referred?.id,
        firstName: r.referred?.firstName,
        lastName: r.referred?.lastName,
        username: r.referred?.username,
        photo: r.referred?.photo,
        xp: r.referred?.xp,
        joinedAt: r.createdAt,
        xpAwarded: r.xpAwardedToReferrer,
      }));
      totalXpEarned = referrals.reduce((sum, r) => sum + (r.xpAwardedToReferrer || 0), 0);
    } else {
      const oldInvites = await User.findAll({
        where: { invitedBy: String(telegramId) },
        attributes: ['id', 'firstName', 'lastName', 'username', 'photo', 'xp', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });
      invitedUsers = oldInvites.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        photo: u.photo,
        xp: u.xp,
        joinedAt: u.createdAt,
      }));
      totalXpEarned = invitedUsers.length * 1000;
    }

    const totalInvited = invitedUsers.length;

    res.json({
      totalInvited,
      totalXpEarned,
      invitedCount: user.invitedCount || 0,
      invitedBy: user.invitedBy || null,
      invitedUsers,
    });
  } catch (error) {
    console.error("Referral Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- YANGI: USER STATISTIKASI (XP va O'yinlar) ---
exports.getUserStats = async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ where: { telegramId: String(telegramId) } });
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    const [totalGamesPlayed, referralXp, referredBonusXp, conversion] =
      await Promise.all([
        UserGame.count({
          where: { userId: user.id },
        }),
        Referral.sum("xpAwardedToReferrer", {
          where: { referrerUserId: user.id, status: "completed" },
        }),
        Referral.sum("xpAwardedToReferred", {
          where: { referredUserId: user.id, status: "completed" },
        }),
        getXpConversionMeta(),
      ]);

    res.json({
      success: true,
      stats: {
        totalXp: user.xp || 0,
        totalGamesPlayed,
        referralXp: referralXp || 0,
        referredBonusXp: referredBonusXp || 0,
        invitedCount: user.invitedCount || 0,
        balance: user.balance || 0,
        conversion,
      },
    });
  } catch (error) {
    console.error("User Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- YANGI: XP NI PULGA ALMASHTIRISH (USER) ---
exports.convertXpToMoney = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const xpAmount = parseInt(req.body.xpAmount, 10);

    // ========== SECURITY: INPUT VALIDATION ==========
    // 1. TelegramId ni tekshirish
    if (!telegramId || typeof telegramId !== 'string' || telegramId.trim().length === 0) {
      console.warn(`[SECURITY] Invalid telegramId format: ${telegramId}`);
      return res.status(400).json({ message: "Telegram ID noto'g'ri" });
    }

    // 2. XP miqdorini tekshirish (raqam bo'lishi kerak va musbat)
    if (!Number.isInteger(xpAmount) || xpAmount <= 0) {
      console.warn(`[SECURITY] Invalid XP amount: ${xpAmount} from ${telegramId}`);
      return res.status(400).json({ message: "XP miqdori musbat butun raqam bo'lishi kerak" });
    }

    // ========== SECURITY: CONVERSION SETTINGS ==========
    const conversionMeta = await getXpConversionMeta();
    if (!conversionMeta.enabled) {
      console.warn(`[SECURITY] XP conversion is disabled, attempt from ${telegramId}`);
      return res.status(403).json({ message: "XP konvertatsiyasi hozircha o'chirilgan" });
    }

    // 3. Minimal konvertatsiya chegarasi
    if (xpAmount < conversionMeta.minXpConversion) {
      console.warn(
        `[SECURITY] XP amount below minimum: ${xpAmount}, minimum=${conversionMeta.minXpConversion} from ${telegramId}`
      );
      return res.status(400).json({
        message: `Kamida ${conversionMeta.minXpConversion} XP konvertatsiya qilish kerak`,
        minimum: conversionMeta.minXpConversion,
      });
    }

    // 4. Maksimal konvertatsiya chegarasi (havfsizlik uchun)
    if (xpAmount > conversionMeta.maxXpConversion) {
      console.warn(`[SECURITY] XP amount exceeds maximum limit: ${xpAmount} from ${telegramId}`);
      return res.status(400).json({
        message: `Bitta tranzaksiyada ${conversionMeta.maxXpConversion} dan ko'p XP konvertatsiya qila olmaysiz`,
        maximum: conversionMeta.maxXpConversion,
      });
    }

    // ========== SECURITY: USER VALIDATION ==========
    const user = await User.findOne({ where: { telegramId: String(telegramId) } });
    if (!user) {
      console.warn(`[SECURITY] User not found: ${telegramId}`);
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    // ========== SECURITY: XP BALANCE CHECK ==========
    const userXp = user.xp || 0;
    if (userXp < xpAmount) {
      console.warn(
        `[SECURITY] Insufficient XP: requested=${xpAmount}, available=${userXp}, user=${telegramId}`
      );
      return res.status(400).json({
        message: "XP yetarli emas",
        available: userXp,
        requested: xpAmount,
        shortfall: xpAmount - userXp,
      });
    }

    // ========== SECURITY: ATOMIC TRANSACTION ==========
    const result = await sequelize.transaction(async (t) => {
      // Re-fetch user data inside transaction to prevent race conditions
      const userInTransaction = await User.findByPk(user.id, { transaction: t, lock: t.LOCK.UPDATE });

      if (!userInTransaction) {
        throw new Error("User deleted during transaction");
      }

      // Double-check XP balance inside transaction (critical security check)
      if (userInTransaction.xp < xpAmount) {
        const error = new Error("Insufficient XP during transaction");
        error.code = "INSUFFICIENT_XP_TRANSACTION";
        throw error;
      }

      // Calculate money amount
      const moneyAmount = (xpAmount / conversionMeta.xpRate) * conversionMeta.moneyPerRate;

      // Perform XP deduction
      await userInTransaction.decrement('xp', { by: xpAmount, transaction: t });

      // Add to balance
      await userInTransaction.increment('balance', { by: moneyAmount, transaction: t });

      // Record transaction in audit log
      await Transaction.create(
        {
          userId: userInTransaction.id,
          amount: moneyAmount,
          type: 'income',
          description: `${xpAmount} XP dan konvertatsiya qilindi (Kursi: ${conversionMeta.xpRate} XP = ${conversionMeta.moneyPerRate})`,
          paymentType: 'xp_conversion',
          status: 'approved',
        },
        { transaction: t }
      );

      return {
        xpDeducted: xpAmount,
        moneyAdded: moneyAmount,
        newXp: userInTransaction.xp - xpAmount,
        newBalance: (userInTransaction.balance || 0) + moneyAmount,
      };
    });

    console.log(`[SUCCESS] XP Conversion: user=${telegramId}, xp=${xpAmount}, money=${result.moneyAdded}`);

    res.json({
      success: true,
      message: "XP muvaffaqiyatli konvertatsiya qilindi",
      xpConverted: result.xpDeducted,
      moneyReceived: result.moneyAdded,
      newXp: result.newXp,
      newBalance: result.newBalance,
    });

  } catch (error) {
    console.error(`[ERROR] XP Conversion Failed: ${error.message}`, error);

    // Handle specific transaction errors
    if (error.code === "INSUFFICIENT_XP_TRANSACTION") {
      return res.status(409).json({ message: "XP mavjudligi o'zgarib qoldi. Iltimos qaytadan urinib ko'ring" });
    }

    res.status(500).json({ message: "XP konvertatsiya xatosi:", error: error.message });
  }
};

// --- YANGI: ADMIN XP NI PULGA ALMASHTIRISH ---
exports.adminConvertXpToMoney = async (req, res) => {
  try {
    const userId = parseInt(req.body.userId, 10);
    const xpAmount = parseInt(req.body.xpAmount, 10);

    // ========== SECURITY: INPUT VALIDATION ==========
    // 1. UserId ni tekshirish
    if (!Number.isInteger(userId) || userId <= 0) {
      console.warn(`[SECURITY] Invalid userId format: ${userId}`);
      return res.status(400).json({ message: "Foydalanuvchi ID noto'g'ri" });
    }

    // 2. XP miqdorini tekshirish (raqam bo'lishi kerak va musbat)
    if (!Number.isInteger(xpAmount) || xpAmount <= 0) {
      console.warn(`[SECURITY] Invalid XP amount: ${xpAmount} for userId: ${userId}`);
      return res.status(400).json({ message: "XP miqdori musbat butun raqam bo'lishi kerak" });
    }

    // ========== SECURITY: CONVERSION SETTINGS ==========
    const conversionMeta = await getXpConversionMeta();
    if (!conversionMeta.enabled) {
      console.warn(`[SECURITY] XP conversion is disabled, admin attempt for userId: ${userId}`);
      return res.status(403).json({ message: "XP konvertatsiyasi hozircha o'chirilgan" });
    }

    // 3. Minimal konvertatsiya chegarasi
    if (xpAmount < conversionMeta.minXpConversion) {
      console.warn(
        `[SECURITY] XP amount below minimum: ${xpAmount}, minimum=${conversionMeta.minXpConversion} for userId: ${userId}`
      );
      return res.status(400).json({
        message: `Kamida ${conversionMeta.minXpConversion} XP konvertatsiya qilish kerak`,
        minimum: conversionMeta.minXpConversion,
      });
    }

    // 4. Maksimal konvertatsiya chegarasi (havfsizlik uchun)
    if (xpAmount > conversionMeta.maxXpConversion) {
      console.warn(`[SECURITY] XP amount exceeds maximum limit: ${xpAmount} for userId: ${userId}`);
      return res.status(400).json({
        message: `Bitta tranzaksiyada ${conversionMeta.maxXpConversion} dan ko'p XP konvertatsiya qila olmaysiz`,
        maximum: conversionMeta.maxXpConversion,
      });
    }

    // ========== SECURITY: USER VALIDATION ==========
    const user = await User.findByPk(userId);
    if (!user) {
      console.warn(`[SECURITY] User not found with ID: ${userId}`);
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    // ========== SECURITY: XP BALANCE CHECK ==========
    const userXp = user.xp || 0;
    if (userXp < xpAmount) {
      console.warn(
        `[SECURITY] Insufficient XP: requested=${xpAmount}, available=${userXp}, userId=${userId}`
      );
      return res.status(400).json({
        message: "Foydalanuvchida XP yetarli emas",
        available: userXp,
        requested: xpAmount,
        shortfall: xpAmount - userXp,
      });
    }

    // ========== SECURITY: ATOMIC TRANSACTION ==========
    const result = await sequelize.transaction(async (t) => {
      // Re-fetch user data inside transaction to prevent race conditions and apply lock
      const userInTransaction = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });

      if (!userInTransaction) {
        throw new Error("User deleted during transaction");
      }

      // Double-check XP balance inside transaction (critical security check)
      if (userInTransaction.xp < xpAmount) {
        const error = new Error("Insufficient XP during transaction");
        error.code = "INSUFFICIENT_XP_TRANSACTION";
        throw error;
      }

      // Calculate money amount
      const moneyAmount = (xpAmount / conversionMeta.xpRate) * conversionMeta.moneyPerRate;

      // Perform XP deduction
      await userInTransaction.decrement('xp', { by: xpAmount, transaction: t });

      // Add to balance
      await userInTransaction.increment('balance', { by: moneyAmount, transaction: t });

      // Record transaction in audit log with admin details
      await Transaction.create(
        {
          userId: userInTransaction.id,
          amount: moneyAmount,
          type: 'income',
          description: `Admin tomonidan ${xpAmount} XP konvertatsiya qilindi (Kursi: ${conversionMeta.xpRate} XP = ${conversionMeta.moneyPerRate})`,
          paymentType: 'admin_xp_conversion',
          status: 'approved',
        },
        { transaction: t }
      );

      return {
        xpDeducted: xpAmount,
        moneyAdded: moneyAmount,
        newXp: userInTransaction.xp - xpAmount,
        newBalance: (userInTransaction.balance || 0) + moneyAmount,
        userTelegramId: userInTransaction.telegramId,
      };
    });

    console.log(
      `[SUCCESS] Admin XP Conversion: userId=${userId}, telegramId=${result.userTelegramId}, xp=${xpAmount}, money=${result.moneyAdded}`
    );

    res.json({
      success: true,
      message: "XP muvaffaqiyatli konvertatsiya qilindi",
      xpConverted: result.xpDeducted,
      moneyReceived: result.moneyAdded,
      newXp: result.newXp,
      newBalance: result.newBalance,
    });

  } catch (error) {
    console.error(`[ERROR] Admin XP Conversion Failed: ${error.message}`, error);

    // Handle specific transaction errors
    if (error.code === "INSUFFICIENT_XP_TRANSACTION") {
      return res.status(409).json({ message: "XP mavjudligi o'zgarib qoldi. Iltimos qaytadan urinib ko'ring" });
    }

    res.status(500).json({ message: "Admin XP konvertatsiya xatosi:", error: error.message });
  }
};
