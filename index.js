// index.js - Main entry point for the Node.js backend
const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
const bodyParser = require("body-parser");

// Configure Sequelize - Using SQLite for simplicity (can change to PostgreSQL)
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // Or use 'postgres' with connection string
});

// Define Models

// User Model
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    telegram_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // For Telegram integration
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Game Model
const Game = sequelize.define(
  "Game",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    day: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    month: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    playersLeft: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isOutdoor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasLockers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasShowers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    advance: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rules: {
      type: DataTypes.JSON, // Store rules as JSON array
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// News Model (for the news section in the first App)
const News = sequelize.define(
  "News",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Leaderboard Model (simple for now)
const Leaderboard = sequelize.define(
  "Leaderboard",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rank: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: true,
  }
);

// Associations
User.hasOne(Leaderboard, { foreignKey: "userId" });
Leaderboard.belongsTo(User, { foreignKey: "userId" });
Game.belongsToMany(User, { through: "UserGames" }); // Users joining games
User.belongsToMany(Game, { through: "UserGames" });

// Sync database
sequelize.sync({ force: false }).then(() => {
  console.log("Database synced");
});

// Express App
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Middleware for Authentication (Simple token-based for admin, placeholder)
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === "admin-token") {
    // Replace with real auth (e.g., JWT)
    next();
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
};

// API Endpoints

// Users
app.get("/users", authenticateAdmin, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post("/users", async (req, res) => {
  const { first_name, last_name, username, telegram_id, role } = req.body;
  try {
    const user = await User.create({
      first_name,
      last_name,
      username,
      telegram_id,
      role,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/users/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update(updates);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/users/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.destroy();
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Games
app.get("/games", async (req, res) => {
  const games = await Game.findAll();
  res.json(games);
});

app.post("/games", authenticateAdmin, async (req, res) => {
  const gameData = req.body;
  try {
    const game = await Game.create(gameData);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/games/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const game = await Game.findByPk(id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    await game.update(updates);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/games/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const game = await Game.findByPk(id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    await game.destroy();
    res.json({ message: "Game deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join Game (User joins a game)
app.post("/games/:id/join", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const game = await Game.findByPk(id);
    const user = await User.findByPk(userId);
    if (!game || !user) return res.status(404).json({ error: "Not found" });
    await game.addUser(user);
    // Update playersLeft
    if (game.playersLeft > 0) {
      await game.update({ playersLeft: game.playersLeft - 1 });
    }
    res.json({ message: "Joined successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// News
app.get("/news", async (req, res) => {
  const news = await News.findAll();
  res.json(news);
});

app.post("/news", authenticateAdmin, async (req, res) => {
  const { title, image } = req.body;
  try {
    const newsItem = await News.create({ title, image });
    res.json(newsItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leaderboards
app.get("/leaderboards", async (req, res) => {
  const leaderboards = await Leaderboard.findAll({
    include: [User],
    order: [["score", "DESC"]],
  });
  res.json(leaderboards);
});

app.post("/leaderboards", authenticateAdmin, async (req, res) => {
  const { userId, score, rank } = req.body;
  try {
    const leaderboard = await Leaderboard.create({ userId, score, rank });
    res.json(leaderboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initial Data Seeding (Optional, run once)
async function seedData() {
  await sequelize.sync({ force: true }); // Caution: Drops tables

  // Seed Users
  await User.bulkCreate([
    {
      first_name: "John",
      last_name: "Doe",
      username: "johndoe",
      role: "admin",
    },
    { first_name: "Jane", last_name: "Doe", username: "janedoe", role: "user" },
  ]);

  // Seed Games (from mock data)
  await Game.bulkCreate([
    {
      day: "TUE",
      date: "09",
      month: "Dec",
      image:
        "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80",
      title: "7v7v7 LJ",
      subtitle: "Original",
      location: "Park Šiška",
      time: "23:00 - 00:30",
      price: 5,
      playersLeft: 0,
      totalPlayers: 21,
      isOutdoor: true,
      hasLockers: true,
      hasShowers: true,
      type: "7v7v7",
      advance: 4,
      rules: [
        "Each match will be until 2 goals to one side or 6 mins",
        "Tishli butsi mumkin emas",
        "etc.",
      ],
    },
    // Add other games similarly...
  ]);

  // Backend Update: Add endpoint to check/upsert user by telegram_id
  // index.js - Add this before other endpoints

  // Add to imports if needed: none

  // New endpoint: GET /users/telegram/:telegram_id to check if exists
  app.get("/users/telegram/:telegram_id", async (req, res) => {
    const { telegram_id } = req.params;
    try {
      const user = await User.findOne({ where: { telegram_id } });
      res.json(user || null);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update POST /users to handle upsert (create if not exists)
  app.post("/users", async (req, res) => {
    const {
      first_name,
      last_name,
      username,
      telegram_id,
      role = "user",
    } = req.body;
    try {
      const [user, created] = await User.upsert(
        { first_name, last_name, username, telegram_id, role },
        { returning: true }
      );
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Seed News (from the first App)
  await News.bulkCreate([
    {
      title: "Messi GOAT bo‘ldi! Pley-offda 1 gol va 3 assist",
      image: "https://i.ytimg.com/vi/L02z_0bFwp0/maxresdefault.jpg",
    },
    // Add others...
  ]);

  console.log("Data seeded");
}

// Uncomment to seed: seedData();