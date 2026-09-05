const { User, Worker, Complaint } = require("../schemas");

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

    const [totalWorkers, totalComplaints, activeRepairs] = await Promise.all([
      Worker.countDocuments({ availability_status: "ACTIVE" }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "IN_PROGRESS" }),
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
        city: "Coimbatore",
        zone: "Central Municipal Zone",
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
