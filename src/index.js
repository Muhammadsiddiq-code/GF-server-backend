require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const createError = require("http-errors");
const { Server } = require("socket.io");

const { initDb } = require("./db");
const createAdminNotificationsRouter = require("./routes/adminNotifications");
const adminUsersRouter = require("./routes/adminUsers");
const notificationsRouter = require("./routes/notifications");

const PORT = process.env.PORT || 5577;
const ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();

app.use(
  cors({
    origin: ORIGIN === "*" ? "*" : ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ORIGIN === "*" ? "*" : ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const telegramId = socket.handshake.auth?.telegramId;
  if (telegramId) {
    socket.join(String(telegramId));
  }

  socket.on("disconnect", () => {
    // Nothing special for now; rooms are cleaned up automatically.
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin/notifications", createAdminNotificationsRouter({ io }));
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/notifications", notificationsRouter);

app.use((req, res, next) => {
  next(createError(404, "Not found"));
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Basic production-ready error envelope
  const status = err.status || 500;
  const payload = {
    message: err.message || "Internal Server Error",
  };
  if (process.env.NODE_ENV !== "production") {
    payload.details = err.details || undefined;
  }
  res.status(status).json(payload);
});

initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Notification server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });

