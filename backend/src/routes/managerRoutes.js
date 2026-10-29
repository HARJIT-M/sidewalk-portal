const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getManagerProfile,
  getManagerLocationOptions,
  updateManagerLocation,
} = require("../controllers/managerController");
const { getWorkerProductivity } = require("../controllers/workerController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. MANAGER PROFILE & STATUS MANAGEMENT
// ==========================================
router.get("/profile", authorize("MANAGER"), getManagerProfile);
router.get(
  "/profile/location-options",
  authorize("MANAGER"),
  getManagerLocationOptions
);
router.put(
  "/profile/location",
  authorize("MANAGER"),
  updateManagerLocation
);
router.get("/status", authorize("MANAGER"), (req, res) => {
  res.json({ success: true, message: "Manager service online and active." });
});

router.get("/productivity", authorize("MANAGER", "ADMIN"), getWorkerProductivity);

module.exports = router;
