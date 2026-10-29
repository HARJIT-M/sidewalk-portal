const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

// All Worker Profile & Worker Management controllers
const {
  getWorkerProfile,
  updateWorkerProfile,
  changeWorkerPassword,
  getAllWorkers,
  getAvailableWorkers,
  addWorker,
  updateWorkerStatus,
  deleteWorker,
  updateWorkerAvailability,
  getWorkerProductivity,
} = require("../controllers/workerController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. WORKER PROFILE MANAGEMENT (WORKER ROLE)
// ==========================================
router.get("/profile", authorize("WORKER"), getWorkerProfile);
router.put("/profile", authorize("WORKER"), updateWorkerProfile);
router.put("/availability", authorize("WORKER"), updateWorkerAvailability);
router.put("/change-password", authorize("WORKER"), changeWorkerPassword);

// ==========================================
// 2. WORKERS ROSTER & MANAGEMENT (MANAGER ROLE)
// ==========================================
router.get("/", authorize("MANAGER"), getAllWorkers);
router.get("/productivity", authorize("MANAGER", "ADMIN"), getWorkerProductivity);
router.get("/available", authorize("MANAGER", "ADMIN"), getAvailableWorkers);
router.post("/", authorize("MANAGER"), addWorker);
router.put("/:id/status", authorize("MANAGER"), updateWorkerStatus);
router.delete("/:id", authorize("MANAGER"), deleteWorker);

module.exports = router;
