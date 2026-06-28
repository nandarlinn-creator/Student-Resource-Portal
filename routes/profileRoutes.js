const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/",              profileController.getProfilePage);
router.get("/api/me",        profileController.getMe);
router.put("/api/me",        profileController.updateProfile);
router.post("/api/password", profileController.changePassword);

module.exports = router;
