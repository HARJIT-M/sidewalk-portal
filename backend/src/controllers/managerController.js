const { User, Worker, Complaint, Area } = require("../schemas");

// ==========================================
// 1. GET MANAGER PROFILE
// ==========================================
const getManagerProfile = async (req, res) => {
  try {
    const managerUser = await User.findById(req.user._id).select("-password");

    if (!managerUser) {
      return res.status(404).json({
        success: false,
        message: "Manager user record not found.",
      });
    }

    const [totalWorkers, totalComplaints, activeRepairs, managerArea, latestComplaint] = await Promise.all([
      Worker.countDocuments({
        manager_id: req.user._id,
        availability_status: "ACTIVE",
      }),
      Complaint.countDocuments({ manager_id: req.user._id }),
      Complaint.countDocuments({
        manager_id: req.user._id,
        status: "IN_PROGRESS",
      }),
      Area.findOne({ manager_id: req.user._id, active: true })
        .sort({ type: 1 })
        .select("name type"),
      Complaint.findOne({
        manager_id: req.user._id,
        city: { $exists: true, $ne: "" },
      })
        .sort({ reported_at: -1 })
        .select("city"),
    ]);

    return res.status(200).json({
      success: true,
      profile: {
        id: managerUser._id,
        name: managerUser.name,
        email: managerUser.email,
        phone: managerUser.phone || "+91 98765 43200",
        role: managerUser.role,
        status: managerUser.status,
        city:
          managerArea?.type === "CITY"
            ? managerArea.name
            : latestComplaint?.city || managerArea?.name || "",
        zone: managerArea?.type === "CITY" ? "" : managerArea?.name || "",
        stats: {
          activeWorkers: totalWorkers,
          totalComplaints,
          activeRepairs,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching manager profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching manager profile.",
      error: error.message,
    });
  }
};

module.exports = {
  getManagerProfile,
};
