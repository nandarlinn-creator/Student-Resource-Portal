const path = require("path");
const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const User = require("../models/User");

// ─── GET /projects ─────────────────────────────────────────────
exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { status: "approved" },
      include: [{ model: User, as: "uploader", attributes: ["name", "email"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ projects });
  } catch (err) {
    console.error("[PROJECTS] List error:", err);
    res.status(500).json({ error: "Could not fetch projects." });
  }
};

// ─── GET /projects/upload ──────────────────────────────────────
exports.getUpload = (req, res) => {
  res.sendFile("upload.html", { root: "public" });
};

// ─── POST /projects/upload ─────────────────────────────────────
exports.postUpload = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({ error: "A project file is required." });
  }

  const { title, description } = req.body;

  try {
    const project = await Project.create({
      title,
      description: description || null,
      file_path: req.file.path,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      user_id: req.session.userId,
    });

    res.status(201).json({
      message: "Project submitted successfully. Pending review.",
      projectId: project.id,
    });
  } catch (err) {
    console.error("[PROJECTS] Upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
};

// ─── GET /projects/:id ─────────────────────────────────────────
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: User, as: "uploader", attributes: ["name"] }],
    });

    if (!project) return res.status(404).json({ error: "Project not found." });

    res.json({ project });
  } catch (err) {
    console.error("[PROJECTS] Get error:", err);
    res.status(500).json({ error: "Could not retrieve project." });
  }
};
