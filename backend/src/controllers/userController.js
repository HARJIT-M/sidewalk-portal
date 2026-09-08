const { User, Complaint } = require("../schemas");
const bcrypt = require("bcryptjs");

// ==========================================
// 1. GET USER PROFILE
// ==========================================
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const totalReported = await Complaint.countDocuments({ reported_by: user._id });
    const resolvedComplaints = await Complaint.countDocuments({
      reported_by: user._id,
      status: { $in: ["RESOLVED", "CLOSED"] }
    });

    const joinedDateFormatted = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "10 Feb 2025";

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        joinedDate: joinedDateFormatted,
        stats: {
          totalReported,
          resolvedComplaints,
          civicScore: 85, // Gamification / participation score
        }
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user profile.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. UPDATE USER PROFILE
// ==========================================
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, email, address, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect current password.",
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Update fields
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (address !== undefined) user.address = address;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      }
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating profile.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
