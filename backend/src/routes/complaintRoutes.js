// complaintRoutes.js
const express = require("express");

const {
  createComplaint,
  getMyComplaints,
} = require("../controllers/complaintController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET MY COMPLAINTS
router.get(
  "/my",
  protect,
  authorize("CITIZEN"),
  getMyComplaints
);


// ==============================
// CREATE COMPLAINT
// ==============================

router.post(
  "/",
  protect,
  authorize("CITIZEN"),
  createComplaint
);

module.exports = router;