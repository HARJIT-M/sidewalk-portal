const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  startRepair,
  updateRepairProgress,
  completeRepair,
  verifyRepairWork,
  getRepairDetails,
  getAllRepairs,
} = require("../controllers/repairController");

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// ==========================================
// 1. WORKER REPAIR ACTIONS (WHAT HAPPENED?)
// ==========================================
router.post("/:complaintId/start", startRepair);
router.put("/:complaintId/progress", updateRepairProgress);
router.post("/:complaintId/complete", completeRepair);

// ==========================================
// 2. MANAGER REPAIR VERIFICATION
// ==========================================
router.post("/:complaintId/verify", authorize("MANAGER"), verifyRepairWork);

// ==========================================
// 3. REPAIR DETAILS & LIFECYCLE
// ==========================================
router.get("/:complaintId", getRepairDetails);

// ==========================================
// 4. ALL REPAIRS OVERVIEW (MANAGER)
// ==========================================
router.get("/", authorize("MANAGER"), getAllRepairs);

module.exports = router;
