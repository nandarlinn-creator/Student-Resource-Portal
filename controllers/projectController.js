const path = require("path");
const fs   = require("fs");
const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const User    = require("../models/User");

// ── Helper: detect JSON request ───────────────────────────────
const wantsJson = (req) =>
  req.xhr ||
  (req.headers.accept && req.headers.accept.includes("application/json"));

// ── GET /projects ─────────────────────────────────────────────
exports.listProjects = async (req, res) => {
  if (!wantsJson(req)) {
    return res.sendFile("projects.html", { root: "public" });
  }
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

// ── GET /projects/upload ──────────────────────────────────────
exports.getUpload = (req, res) => {
  res.sendFile("upload.html", { root: "public" });
};

// ── POST /projects/upload ─────────────────────────────────────
exports.postUpload = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectFile = req.files && req.files.project_file && req.files.project_file[0];
  if (!projectFile) {
    return res.status(400).json({ error: "A project file is required." });
  }

  // Collect uploaded image paths
  const images = [];
  for (let i = 0; i < 15; i++) {
    const imgFile = req.files && req.files["image_" + i] && req.files["image_" + i][0];
    if (imgFile) images.push("/uploads/images/" + imgFile.filename);
  }

  const { title, description, readme, requirements } = req.body;

  try {
    const project = await Project.create({
      title,
      description: description || null,
      readme:      readme      || null,
      requirements: requirements ? JSON.parse(requirements) : null,
      images,
      file_path: projectFile.path,
      file_name: projectFile.originalname,
      file_size: projectFile.size,
      mime_type: projectFile.mimetype,
      user_id:   req.session.userId,
    });

    res.status(201).json({
      message:   "Project submitted successfully. Pending review.",
      projectId: project.id,
    });
  } catch (err) {
    console.error("[PROJECTS] Upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
};

// ── GET /projects/:id/download ────────────────────────────────
exports.downloadProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });

    const filePath = path.resolve(project.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server." });
    }

    res.download(filePath, project.file_name, (err) => {
      if (err) console.error("[DOWNLOAD] Error:", err);
    });
  } catch (err) {
    console.error("[PROJECTS] Download error:", err);
    res.status(500).json({ error: "Download failed." });
  }
};

// ── GET /projects/:id ─────────────────────────────────────────
exports.getProject = async (req, res) => {
  if (!wantsJson(req)) {
    return res.sendFile("project.html", { root: "public" });
  }
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

