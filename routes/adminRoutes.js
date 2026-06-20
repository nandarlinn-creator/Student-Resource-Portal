const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/", adminController.getDashboard);
router.get("/api/stats", adminController.getStats);
router.get("/api/projects", adminController.getProjects);
router.patch("/api/projects/:id/status", adminController.updateStatus);

module.exports = router;
