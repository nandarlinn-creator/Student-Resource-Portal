const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");

// ── GET /profile  →  serve HTML page ────────────────────────────
exports.getProfilePage = (req, res) => {
  res.sendFile("profile.html", { root: "public" });
};

// ── GET /profile/api/me  →  current user + their projects ───────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: ["id", "name", "email", "role", "phone", "address"],
    });
    if (!user) return res.status(404).json({ error: "User not found." });

    const projects = await Project.findAll({
      where: { user_id: req.session.userId },
      order: [["created_at", "DESC"]],
    });

    res.json({ user, projects });
  } catch (err) {
    console.error("[PROFILE] getMe error:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
};

// ── PUT /profile/api/me  →  update name, phone, address ─────────
exports.updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }
  if (phone && phone.length > 30) {
    return res.status(400).json({ error: "Phone number is too long." });
  }
  if (address && address.length > 500) {
    return res.status(400).json({ error: "Address is too long." });
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.name    = name.trim();
    user.phone   = phone ? phone.trim() : null;
    user.address = address ? address.trim() : null;
    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("[PROFILE] updateProfile error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

// ── POST /profile/api/password  →  change password ──────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both current and new password are required." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const valid = await user.validatePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

    user.password_hash = newPassword; // beforeUpdate hook re-hashes it
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[PROFILE] changePassword error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
};
