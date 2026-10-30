const express = require("express");
const { signup, login } = require("../controllers/authController");

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION ROUTES (SIGNUP & LOGIN)
// ==========================================
router.post("/signup", signup);
router.post("/login", login);

module.exports = router;