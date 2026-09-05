const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadRepairProof,
  getComplaintImages,
  deleteImage,
} = require("../controllers/uploadController");

const router = express.Router();

// Apply authentication middleware
router.use(protect);

// ==========================================
// 1. UPLOAD REPAIR PROOF (BEFORE / AFTER)
// ==========================================
router.post("/proof", uploadRepairProof);

// ==========================================
// 2. GET COMPLAINT IMAGES
// ==========================================
router.get("/:complaintId", getComplaintImages);

// ==========================================
// 3. DELETE IMAGE
// ==========================================
router.delete("/:id", deleteImage);

module.exports = router;
