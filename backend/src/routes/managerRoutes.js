const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getManagerProfile } = require("../controllers/managerController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. MANAGER PROFILE & STATUS MANAGEMENT
// ==========================================
router.get("/profile", authorize("MANAGER"), getManagerProfile);
router.get("/status", authorize("MANAGER"), (req, res) => {
  res.json({ success: true, message: "Manager service online and active." });
});

module.exports = router;

