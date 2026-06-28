require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const path = require("path");

const { sequelize } = require("./config/database");
const authRoutes    = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const adminRoutes   = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── Body parsers ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ────────────────────────────────────────────────────
const sessionStore = new SequelizeStore({ db: sequelize });

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure:   process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge:   1000 * 60 * 60 * 8,
  },
}));

sessionStore.sync();

// ── Routes ─────────────────────────────────────────────────────
app.use("/auth",     authRoutes);
app.use("/projects", requireAuth, projectRoutes);
app.use("/admin",    adminRoutes);
app.use("/profile",  requireAuth, profileRoutes);

// Root redirect
app.get("/", (req, res) => {
  if (req.session.userId) return res.redirect("/projects");
  res.redirect("/auth/login");
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ── Start (with retry on transient DB connection failures) ──────
async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log("Database connection established.");
      return true;
    } catch (err) {
      console.error(`DB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) return false;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

(async () => {
  const connected = await connectWithRetry();
  if (!connected) {
    console.error("Unable to connect to database after retries. Exiting.");
    process.exit(1);
  }
  try {
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
  } catch (err) {
    console.error("Startup error after DB connect:", err.message);
    process.exit(1);
  }
})();
