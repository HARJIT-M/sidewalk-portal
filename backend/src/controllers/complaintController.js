const Complaint = require("../schemas/Complaint");

// ==============================
// CREATE COMPLAINT
// ==============================

const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      issue_type,
      location,
      latitude,
      longitude,
    } = req.body;

    // Validate required fields
    if (!title || !description || !issue_type || !location) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // Generate complaint code
    const count = await Complaint.countDocuments();

    const complaint_code = `CMP${String(count + 1).padStart(3, "0")}`;

    // Create complaint
    const complaint = await Complaint.create({
      complaint_code,
      reported_by: req.user._id,
      title,
      description,
      issue_type,
      location,
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit complaint.",
      error: error.message,
    });
  }
};

// ==============================
// GET MY COMPLAINTS
// ==============================

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      reported_by: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error("Get my complaints error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints.",
      error: error.message,
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
};