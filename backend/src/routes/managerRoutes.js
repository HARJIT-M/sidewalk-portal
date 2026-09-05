const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getManagerProfile } = require("../controllers/managerController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. MANAGER PROFILE MANAGEMENT
// ==========================================
router.get("/profile", authorize("MANAGER"), getManagerProfile);

module.exports = router;
