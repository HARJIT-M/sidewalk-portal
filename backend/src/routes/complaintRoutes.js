const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAssignedComplaints,
  getComplaintDetails,
  getManagerComplaints,
  updateComplaintPriority,
  assignComplaintWorkers,
} = require("../controllers/complaintController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. WORKER ASSIGNED COMPLAINTS
// ==========================================
router.get("/assigned", authorize("WORKER"), getAssignedComplaints);
router.get("/worker", authorize("WORKER"), getAssignedComplaints);

// ==========================================
// 2. MANAGER COMPLAINTS MANAGEMENT
// ==========================================
router.get("/manager", authorize("MANAGER"), getManagerComplaints);
router.get("/all", authorize("MANAGER"), getManagerComplaints);
router.put("/:id/priority", authorize("MANAGER"), updateComplaintPriority);
router.post("/:id/assign", authorize("MANAGER"), assignComplaintWorkers);

// ==========================================
// 3. COMMON COMPLAINT DETAILS (WORKER & MANAGER)
// ==========================================
router.get("/:id", getComplaintDetails);

module.exports = router;
