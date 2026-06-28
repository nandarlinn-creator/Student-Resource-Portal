const { validationResult } = require("express-validator");
const User = require("../models/User");
const Project = require("../models/Project");

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

// ─── GET /auth/public-stats ─────────────────────────────────────
// Public, unauthenticated — used on the login page. Real numbers only.
exports.getPublicStats = async (req, res) => {
  try {
    const approvedProjects = await Project.count({ where: { status: "approved" } });

    // Count distinct contributors among approved projects
    const contributorRows = await Project.findAll({
      where: { status: "approved" },
      attributes: ["user_id"],
      group: ["user_id"],
    });

    res.json({
      approvedProjects,
      contributors: contributorRows.length,
    });
  } catch (err) {
    console.error("[AUTH] getPublicStats error:", err);
    res.status(500).json({ error: "Failed to load stats." });
  }
};

// ─── GET /auth/public-preview ────────────────────────────────────
// Public, unauthenticated — supplies real project images for a
// decorative background collage on the login page. Only images,
// no sensitive data is exposed.
exports.getPublicPreview = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { status: "approved" },
      attributes: ["id", "images"],
      order: [["created_at", "DESC"]],
      limit: 20, // pull a good variety for the tiled collage
    });

    const withImages = projects.filter(
      (p) => Array.isArray(p.images) && p.images.length > 0
    );

    res.json({ projects: withImages });
  } catch (err) {
    console.error("[AUTH] getPublicPreview error:", err);
    res.status(500).json({ error: "Failed to load preview." });
  }
};
