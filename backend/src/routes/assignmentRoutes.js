const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  assignComplaint,
  getWorkerAssignments,
  getAssignmentById,
  reassignWorker,
  removeAssignment,
  getAllAssignments,
} = require("../controllers/assignmentController");

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// ==========================================
// 1. ASSIGNMENT CREATION & DISPATCH (MANAGER)
// ==========================================
router.post("/assign", authorize("MANAGER"), assignComplaint);
router.get("/all", authorize("MANAGER"), getAllAssignments);

// ==========================================
// 2. WORKER ASSIGNMENT RETRIEVAL
// ==========================================
router.get("/my-assignments", getWorkerAssignments);
router.get("/worker", getWorkerAssignments);

// ==========================================
// 3. SINGLE ASSIGNMENT OPERATIONS
// ==========================================
router.get("/:id", getAssignmentById);
router.put("/:id/reassign", authorize("MANAGER"), reassignWorker);
router.delete("/:id", authorize("MANAGER"), removeAssignment);

module.exports = router;
