const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const projectController = require("../controllers/projectController");
const upload = require("../middleware/uploadMiddleware");

// ─── Validation ────────────────────────────────────────────────
const projectValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be 3–200 characters"),
  body("description").optional().trim().isLength({ max: 2000 }),
];

// ─── Routes ────────────────────────────────────────────────────
// GET  /projects           – list all approved projects
router.get("/", projectController.listProjects);

// GET  /projects/upload    – upload form
router.get("/upload", projectController.getUpload);

// POST /projects/upload    – handle file + metadata submission
router.post(
  "/upload",
  upload.single("project_file"),  // 'project_file' = form field name
  projectValidation,
  projectController.postUpload
);

// GET  /projects/:id       – view single project
router.get("/:id", projectController.getProject);

module.exports = router;
