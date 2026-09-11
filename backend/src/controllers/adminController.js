const User = require("../schemas/User");
const Complaint = require("../schemas/Complaint");

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalCitizens = await User.countDocuments({ role: "CITIZEN" });
    const totalWorkers = await User.countDocuments({ role: "WORKER" });
    const totalManagers = await User.countDocuments({ role: "MANAGER" });
    const activeAccounts = await User.countDocuments({ status: "ACTIVE" });

    const totalComplaints = await Complaint.countDocuments({});
    const pendingComplaints = await Complaint.countDocuments({ status: "PENDING" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "IN_PROGRESS" });
    const resolvedComplaints = await Complaint.countDocuments({ status: "RESOLVED" });

    // Aggregate complaints by area to find hotspots
    const hotspotAreas = await Complaint.aggregate([
      {
        $group: {
          _id: "$location",
          complaints: { $sum: 1 },
        },
      },
      {
        $project: {
          area: "$_id",
          complaints: 1,
          severity: {
            $switch: {
              branches: [
                { case: { $gte: ["$complaints", 15] }, then: "High" },
                { case: { $gte: ["$complaints", 5] }, then: "Medium" },
              ],
              default: "Low",
            },
          },
        },
      },
      { $sort: { complaints: -1 } },
      { $limit: 5 },
    ]);

    // For recent activity, you might want to fetch latest users and complaints
    // This is a simplified representation
    const recentActivity = []; // populate with actual latest data if needed

    res.json({
      success: true,
      data: {
        users: { totalCitizens, totalWorkers, totalManagers, activeAccounts },
        complaints: { totalComplaints, pendingComplaints, inProgressComplaints, resolvedComplaints },
        hotspotAreas,
        recentActivity
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
};
