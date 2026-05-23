const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const projectController = require("../controllers/projectController");
const upload = require("../middleware/uploadMiddleware");

const projectValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Title must be 3-200 characters"),
  body("description").optional().trim().isLength({ max: 2000 }),
];

router.get("/",        projectController.listProjects);
router.get("/upload",  projectController.getUpload);
router.post("/upload", upload, projectValidation, projectController.postUpload);
router.get("/:id/download", projectController.downloadProject);  // <-- download
router.get("/:id",     projectController.getProject);

module.exports = router;

