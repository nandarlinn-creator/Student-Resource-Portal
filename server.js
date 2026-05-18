require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const path = require("path");

const { sequelize } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── View Engine ───────────────────────────────────────────────
// Using plain HTML + express-static for simplicity.
// Swap for EJS/Pug/Handlebars as needed.
app.set("view engine", "html");
app.use(express.static(path.join(__dirname, "public")));

// ─── Body Parsers ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Session (stored in RDS via Sequelize) ─────────────────────
const sessionStore = new SequelizeStore({ db: sequelize });

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

sessionStore.sync(); // Create sessions table if not exists

// ─── Routes ────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/projects", requireAuth, projectRoutes);

// Root redirect
app.get("/", (req, res) => {
  if (req.session.userId) return res.redirect("/projects");
  res.redirect("/auth/login");
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

// ─── Start ─────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Database connection established.");
    await sequelize.sync({ alter: true }); // Use migrations in production
    app.listen(PORT, () =>
      console.log(`🚀  Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Unable to connect to database:", err.message);
    process.exit(1);
  }
})();
