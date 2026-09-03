const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authorize } = require("../middleware/authMiddleware");

router.post("/", authorize, complaintController.createComplaint);

router.get("/:id", complaintController.getComplaintById);

router.get("/", complaintController.listComplaints);

module.exports = router;
