const TelegramBot = require("node-telegram-bot-api");
const { User, Game, Transaction, UserGame } = require("../models");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const providerToken = process.env.PROVIDER_TOKEN;

// 1. INVOICE YARATISH (Click/Payme)
const createInvoice = async (req, res) => {
  try {
    const { telegramId, amount, gameId, type, team } = req.body;

    if (!telegramId) return res.status(400).json({ msg: "Telegram ID kerak" });

    const tgIdString = String(telegramId);
    let title, description, payload, prices;

    if (type === "GAME") {
      const game = await Game.findByPk(gameId);
      if (!game) return res.status(404).json({ msg: "O'yin topilmadi" });

      title = `To'lov: ${game.title}`;
      description = `${game.title} o'yini uchun to'lov`;
      const safeTeamName = team ? team.replace(/\s/g, "_") : "NA";
      payload = `GAME_${gameId}_${tgIdString}_${safeTeamName}`;
      prices = [{ label: game.title, amount: parseInt(amount) * 100 }];
    } else {
      title = "Hamyonni to'ldirish";
      description = "Hisobingizga mablag' qo'shish";
      payload = `TOPUP_${tgIdString}`;
      prices = [{ label: "Balans", amount: parseInt(amount) * 100 }];
    }

    await bot.sendInvoice(
      tgIdString,
      title,
      description,
      payload,
      providerToken,
      "UZS",
      prices
    );

    res.json({ success: true, message: "Invoice yuborildi" });
  } catch (error) {
    console.error("Invoice Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

// 2. HAMYONDAN TO'LASH (ASOSIY MANTIQ)
const payWithWallet = async (req, res) => {
  try {
    const { telegramId, gameId, amount, team } = req.body;

    if (!telegramId)
      return res.status(400).json({ msg: "Telegram ID topilmadi" });
    const tgIdString = String(telegramId);

    const user = await User.findOne({ where: { telegramId: tgIdString } });
    const game = await Game.findByPk(gameId);

    if (!user || !game)
      return res.status(404).json({ msg: "User yoki O'yin topilmadi" });

    // --- HISOBLASH MANTIQI ---
    const totalPlayers = game.totalPlayers || 14;

    // Kishi boshiga to'liq narx
    const pricePerPerson = Math.ceil(game.price / totalPlayers);

    // Kishi boshiga zaklad (minimal)
    const totalAdvance = game.advance || 0;
    const advancePerPerson =
      totalAdvance > 0 ? Math.ceil(totalAdvance / totalPlayers) : 0;

    // To'lanayotgan summa
    const payAmount = amount ? parseFloat(amount) : pricePerPerson;

    // --- TEKSHIRISH ---
    let userGameEntry = await UserGame.findOne({
      where: { userId: user.id, gameId: game.id },
    });

    if (!userGameEntry) {
      // Yangi qo'shilayotganlar uchun minimal summa tekshiruvi
      const minRequired =
        advancePerPerson > 0 ? advancePerPerson : pricePerPerson;

      // 1 so'm xatolik chegarasi
      if (payAmount < minRequired - 1) {
        return res.status(400).json({
          msg: `Minimal to'lov: ${minRequired.toLocaleString()} UZS (Kishi boshiga)`,
        });
      }
    }

    // Balans tekshiruvi
    if (user.balance < payAmount) {
      return res
        .status(400)
        .json({ msg: "Hisobingizda mablag' yetarli emas." });
    }

    // --- TRANZAKSIYA ---
    await user.update({ balance: user.balance - payAmount });

    if (userGameEntry) {
      // Update (Qarzni uzish)
      const newTotal = parseFloat(userGameEntry.paymentAmount || 0) + payAmount;
      await userGameEntry.update({ paymentAmount: newTotal, status: "paid" });
    } else {
      // Create (Yangi)
      await UserGame.create({
        userId: user.id,
        gameId: game.id,
        status: "paid",
        paymentAmount: payAmount,
        team: team || "Noma'lum",
      });
      await game.increment("playersJoined");
    }

    await Transaction.create({
      userId: user.id,
      amount: payAmount,
      type: "expense",
      description: `${game.title} (Kishi boshiga to'lov)`,
      paymentMethod: "wallet",
    });

    res.json({ success: true, message: "To'lov muvaffaqiyatli!" });
  } catch (error) {
    console.error("Wallet Pay Error:", error);
    res.status(500).json({ msg: "Server xatosi: " + error.message });
  }
};

// 3. USER PROFILINI OLISH
const getUserWallet = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const tgIdString = String(telegramId);

    let user = await User.findOne({
      where: { telegramId: tgIdString },
      include: [{ model: Transaction, as: "transactions" }],
    });

    if (user && !user.walletCardNumber) {
      const uniqueNum =
        "GF-" +
        uuidv4().split("-")[0].toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);
      await user.update({ walletCardNumber: uniqueNum });
    }
    res.json(user);
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createInvoice,
  payWithWallet,
  getUserWallet,
};
