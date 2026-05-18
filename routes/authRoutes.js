const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { redirectIfAuth } = require("../middleware/authMiddleware");

// ─── Validation Rules ──────────────────────────────────────────
const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const registerValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name min 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Must contain an uppercase letter")
    .matches(/[0-9]/).withMessage("Must contain a number"),
];

// ─── Routes ────────────────────────────────────────────────────
// GET  /auth/login
router.get("/login", redirectIfAuth, authController.getLogin);

// POST /auth/login
router.post("/login", redirectIfAuth, loginValidation, authController.postLogin);

// GET  /auth/register
router.get("/register", redirectIfAuth, authController.getRegister);

// POST /auth/register
router.post("/register", redirectIfAuth, registerValidation, authController.postRegister);

// POST /auth/logout
router.post("/logout", authController.logout);

module.exports = router;
