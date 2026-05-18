const { validationResult } = require("express-validator");
const User = require("../models/User");

// ─── GET /auth/login ───────────────────────────────────────────
exports.getLogin = (req, res) => {
  res.sendFile("login.html", { root: "public" });
};

// ─── POST /auth/login ──────────────────────────────────────────
exports.postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Regenerate session to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.redirect("/projects");
    });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// ─── GET /auth/register ────────────────────────────────────────
exports.getRegister = (req, res) => {
  res.sendFile("register.html", { root: "public" });
};

// ─── POST /auth/register ───────────────────────────────────────
exports.postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({ name, email, password_hash: password });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.status(201).redirect("/projects");
    });
  } catch (err) {
    console.error("[AUTH] Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// ─── POST /auth/logout ─────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("[AUTH] Logout error:", err);
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
};
