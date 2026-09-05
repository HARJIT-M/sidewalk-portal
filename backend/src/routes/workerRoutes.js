const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

// Worker profile controllers
const {
  getWorkerProfile,
  updateWorkerProfile,
  changeWorkerPassword,
} = require("../controllers/workerController");

// Manager worker management controllers
const {
  getAllWorkers,
  getAvailableWorkers,
  addWorker,
  updateWorkerStatus,
  deleteWorker,
} = require("../controllers/managerController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. WORKER PROFILE MANAGEMENT (WORKER ROLE)
// ==========================================
router.get("/profile", authorize("WORKER"), getWorkerProfile);
router.put("/profile", authorize("WORKER"), updateWorkerProfile);
router.put("/change-password", authorize("WORKER"), changeWorkerPassword);

// ==========================================
// 2. WORKERS ROSTER & MANAGEMENT (MANAGER ROLE)
// ==========================================
router.get("/", authorize("MANAGER"), getAllWorkers);
router.get("/available", authorize("MANAGER"), getAvailableWorkers);
router.post("/", authorize("MANAGER"), addWorker);
router.put("/:id/status", authorize("MANAGER"), updateWorkerStatus);
router.delete("/:id", authorize("MANAGER"), deleteWorker);

module.exports = router;
