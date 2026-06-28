const User = require("../models/User");
const Project = require("../models/Project");

exports.getProfilePage = (req, res) => {
  res.sendFile("profile.html", { root: "public" });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: ["id", "name", "email", "role"],
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

    user.password_hash = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[PROFILE] changePassword error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
};
