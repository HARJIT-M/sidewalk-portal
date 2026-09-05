const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  startComplaintWork,
  submitWorkUpdate,
  getManagerWorkTracking,
  verifyRepairWork,
} = require("../controllers/workTrackingController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. WORKER WORK EXECUTION
// ==========================================
router.post("/:id/start", authorize("WORKER"), startComplaintWork);
router.post("/:id/update-work", authorize("WORKER"), submitWorkUpdate);
router.post("/:id/update", authorize("WORKER"), submitWorkUpdate);

// ==========================================
// 2. MANAGER WORK TRACKING & VERIFICATION
// ==========================================
router.get("/", authorize("MANAGER"), getManagerWorkTracking);
router.get("/manager", authorize("MANAGER"), getManagerWorkTracking);
router.post("/:id/verify", authorize("MANAGER"), verifyRepairWork);

module.exports = router;
