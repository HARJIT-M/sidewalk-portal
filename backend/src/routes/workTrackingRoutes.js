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


router.use(protect);

router.post("/:complaintId/start", authorize("WORKER"), startRepair);
router.post("/:complaintId/update-work", authorize("WORKER"), completeRepair);
router.post("/:complaintId/update", authorize("WORKER"), updateRepairProgress);
router.post("/:complaintId/complete", authorize("WORKER"), completeRepair);
router.put("/:complaintId/progress", authorize("WORKER"), updateRepairProgress);


router.get("/", authorize("MANAGER"), getAllRepairs);
router.get("/manager", authorize("MANAGER"), getAllRepairs);
router.post("/:complaintId/verify", authorize("MANAGER"), verifyRepairWork);

router.get("/:complaintId", getRepairDetails);

module.exports = router;
