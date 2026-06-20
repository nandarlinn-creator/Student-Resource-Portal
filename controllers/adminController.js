const Project = require("../models/Project");
const User = require("../models/User");

exports.getDashboard = (req, res) => {
  res.sendFile("admin.html", { root: "public" });
};

exports.getProjects = async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : {};
  try {
    const projects = await Project.findAll({
      where,
      include: [{ model: User, as: "uploader", attributes: ["name", "email"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ projects });
  } catch (err) {
    console.error("[ADMIN] getProjects error:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });
    await project.update({ status });
    res.json({ message: "Project " + status + " successfully.", project });
  } catch (err) {
    console.error("[ADMIN] updateStatus error:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, users] = await Promise.all([
      Project.count(),
      Project.count({ where: { status: "pending" } }),
      Project.count({ where: { status: "approved" } }),
      Project.count({ where: { status: "rejected" } }),
      User.count(),
    ]);
    res.json({ total, pending, approved, rejected, users });
  } catch (err) {
    console.error("[ADMIN] getStats error:", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
};
