const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/", authenticate, complaintController.createComplaint);

router.get("/:id", complaintController.getComplaintById);

router.get("/", complaintController.listComplaints);

module.exports = router;
