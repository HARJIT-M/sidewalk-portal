const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getWorkerDashboard,
  getManagerDashboard,
} = require("../controllers/dashboardController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. WORKER DASHBOARD
// ==========================================
router.get("/worker", authorize("WORKER"), getWorkerDashboard);

// ==========================================
// 2. MANAGER DASHBOARD
// ==========================================
router.get("/manager", authorize("MANAGER"), getManagerDashboard);

module.exports = router;
