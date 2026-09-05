const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getWorkerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// ==========================================
// 1. GET NOTIFICATIONS LIST
// ==========================================
router.get("/", getWorkerNotifications);

// ==========================================
// 2. MARK NOTIFICATIONS AS READ
// ==========================================
router.put("/mark-all-read", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);

// ==========================================
// 3. DELETE NOTIFICATION
// ==========================================
router.delete("/:id", deleteNotification);

module.exports = router;
