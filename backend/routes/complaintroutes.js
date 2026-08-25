const express = require("express");

const router = express.Router();

const {
    createComplaint,
    getComplaints,
    getComplaintById
} = require("../controllers/complaintcontroller");


router.post("/", createComplaint);

router.get("/", getComplaints);

router.get("/:id", getComplaintById);

module.exports = router;