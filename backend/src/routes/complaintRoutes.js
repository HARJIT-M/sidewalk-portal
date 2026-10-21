const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAssignedComplaints,
  getComplaintDetails,
  getManagerComplaints,
  updateComplaintPriority,
  assignComplaintWorkers,
  submitComplaint,
  getAdminRoutingComplaints,
  routeComplaintToManager,
  getUserComplaints,
  deleteComplaint,
} = require("../controllers/complaintController");
const uploadComplaintImages = require("../middleware/complaintUploadMiddleware");

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
router.get("/mine", authorize("MANAGER"), getManagerComplaints);
router.put("/:id/priority", authorize("MANAGER"), updateComplaintPriority);
router.post("/:id/assign", authorize("MANAGER", "ADMIN"), assignComplaintWorkers);
router.delete("/:id", authorize("MANAGER"), deleteComplaint);

// ==========================================
// 3. USER COMPLAINTS (USER)
// ==========================================
router.post(
  "/",
  authorize("CITIZEN"),
  uploadComplaintImages,
  submitComplaint
);
router.get("/user", authorize("CITIZEN"), getUserComplaints);
router.get("/admin-routing", authorize("ADMIN"), getAdminRoutingComplaints);
router.patch("/:id/route", authorize("ADMIN"), routeComplaintToManager);

// ==========================================
// 4. COMMON COMPLAINT DETAILS (WORKER & MANAGER & USER)
// ==========================================
router.get("/:id", getComplaintDetails);

module.exports = router;
