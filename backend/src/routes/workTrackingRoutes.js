const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  startRepair,
  updateRepairProgress,
  completeRepair,
  verifyRepairWork,
  getAllRepairs,
} = require("../controllers/repairController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. WORK EXECUTION ROUTES
// ==========================================
router.post("/:complaintId/start", startRepair);
router.post("/:complaintId/update-work", completeRepair);
router.post("/:complaintId/update", updateRepairProgress);

// ==========================================
// 2. MANAGER WORK TRACKING & VERIFICATION
// ==========================================
router.get("/", authorize("MANAGER"), getAllRepairs);
router.get("/manager", authorize("MANAGER"), getAllRepairs);
router.post("/:complaintId/verify", authorize("MANAGER"), verifyRepairWork);

module.exports = router;
