const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All admin routes are protected and restricted to ADMIN
// Note: Currently authorize middleware supports MANAGER as superuser.
// You might need to update the authorize middleware or User schema if ADMIN role is strictly used.
router.use(protect);
router.use(authorize("ADMIN"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
