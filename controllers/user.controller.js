// const db = require("../models");
// const User = db.User;

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
//       // --- YANGI: Frontenddan keladigan qo'shimcha ma'lumotlar ---
//       phone,
//       city,
//       position,
//     } = req.body;

//     // Loglarni ko'rish (Debugging)
//     console.log("------------------------------------------------");
//     console.log("REQUEST KELDI:", { telegramId, city, position, phone });

//     if (!telegramId) {
//       return res.status(400).json({ message: "Telegram ID yetishmayapti" });
//     }

//     const strId = String(telegramId);
//     let user = await User.findOne({ where: { telegramId: strId } });

//     // 1. AGAR USER MAVJUD BO'LSA (LOGIN YOKI UPDATE)
//     if (user) {
//       console.log("User topildi, ma'lumotlar yangilanmoqda...");

//       const updatedFields = {};

//       // Asosiy ma'lumotlar
//       if (firstName) updatedFields.firstName = firstName;
//       if (lastName) updatedFields.lastName = lastName;
//       if (username) updatedFields.username = username;
//       if (photo_url) updatedFields.photo = photo_url;

//       // --- MUHIM O'ZGARISH: Profil ma'lumotlarini yangilash ---
//       // Agar frontenddan phone, city yoki position kelsa, bazaga yozamiz
//       if (phone) updatedFields.phone = phone;
//       if (city) updatedFields.city = city;
//       if (position) updatedFields.position = position;
//       // -------------------------------------------------------

//       await user.update(updatedFields);

//       console.log("Yangilandi:", updatedFields);
//       return res.json({ message: "Muvaffaqiyatli yangilandi", user });
//     }

//     // 2. AGAR USER YANGI BO'LSA (REGISTER)
//     else {
//       console.log("Yangi user yaratilmoqda...");

//       // Userni yaratamiz
//       user = await User.create({
//         telegramId: strId,
//         firstName,
//         lastName,
//         username,
//         photo: photo_url,
//         invitedBy: start_param ? String(start_param) : null,
//         xp: 500,
//         // Default qiymatlar modelda bor, lekin kelgan bo'lsa yozamiz
//         phone: phone || "",
//         city: city || "-",
//         position: position || "Mid",
//       });

//       console.log("Yangi user bazaga yozildi.");

//       // --- REFERRAL LOGIKASI ---
//       if (start_param && String(start_param) !== strId) {
//         const inviter = await User.findOne({
//           where: { telegramId: String(start_param) },
//         });

//         if (inviter) {
//           const newXp = inviter.xp + 1000;
//           await inviter.update({ xp: newXp });
//           console.log(`Referral ishladi: ${inviter.firstName} +1000 XP`);
//         }
//       }
//       // -------------------------

//       return res.status(201).json({ message: "Ro'yxatdan o'tildi", user });
//     }
//   } catch (error) {
//     console.error("XATOLIK:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // 1. All Users
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.findAll({
//       order: [["xp", "DESC"]],
//     });
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };















// controllers/user.controller.js
const { User, Transaction } = require("../models"); // Transaction ni import qilishni unutmang!


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

      // REFERRAL BONUS
      if (start_param && String(start_param) !== strId) {
        const inviter = await User.findOne({
          where: { telegramId: String(start_param) },
        });
        if (inviter) {
          const newXp = inviter.xp + 1000;
          await inviter.update({ xp: newXp });
          console.log(`Referral: ${inviter.firstName} +1000 XP`);
        }
      }

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






// ... boshqa funksiyalar (login, getAllUsers va h.k) ...

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
    // Bu juda muhim, aks holda telefonda "History" bo'limida ko'rinmaydi
    await Transaction.create({
      userId: user.id,
      amount: value,
      type: type === "add" ? "income" : "expense", // Kirim yoki Chiqim
      description: "Admin tomonidan balans o'zgartirildi",
      paymentMethod: "cash", // Yoki 'admin'
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









// ... boshqa funksiyalar ...

// YANGI: User ma'lumotlarini yangilash
exports.updateUser = async (req, res) => {
  try {
    const { telegramId } = req.params; // URL dan olamiz
    const { phone, city, position } = req.body; // Body dan olamiz

    const user = await User.findOne({ where: { telegramId } });
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    // Faqat kelgan ma'lumotlarni yangilaymiz
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