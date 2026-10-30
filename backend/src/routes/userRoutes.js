const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// USER ROUTES (For Public Citizen)
// ==========================================
router.get("/profile", authorize("CITIZEN"), getUserProfile);
router.put("/profile", authorize("CITIZEN"), updateUserProfile);

module.exports = router;
