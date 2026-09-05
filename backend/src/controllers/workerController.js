const bcrypt = require("bcryptjs");
const { User, Assignment } = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");

// ==========================================
// 1. GET WORKER PROFILE
// ==========================================
const getWorkerProfile = async (req, res) => {
  try {
    const worker = await getWorkerForUser(req.user._id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found for this account.",
      });
    }

    // Compute task statistics for this worker
    const totalAssigned = await Assignment.countDocuments({ worker_id: worker._id });
    const inProgress = await Assignment.countDocuments({
      worker_id: worker._id,
      status: "IN_PROGRESS",
    });
    const pending = await Assignment.countDocuments({
      worker_id: worker._id,
      status: "ASSIGNED",
    });
    const completed = await Assignment.countDocuments({
      worker_id: worker._id,
      status: "COMPLETED",
    });

    const formattedJoinedDate = worker.joined_date
      ? new Date(worker.joined_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "12 Jan 2025";

    return res.status(200).json({
      success: true,
      profile: {
        id: worker.employee_code,
        mongoId: worker._id,
        userId: worker.user_id._id,
        name: worker.user_id.name,
        email: worker.user_id.email,
        phone: worker.user_id.phone || "",
        role: worker.worker_role || "Maintenance Worker",
        status: worker.availability_status === "ACTIVE" ? "Active" : worker.availability_status,
        shift: worker.shift || "Day Shift (08:00 AM - 05:00 PM)",
        joinedDate: formattedJoinedDate,
        zone: worker.zone || "Zone 2 - Gandhipuram Central",
        emergencyContact: worker.emergency_contact || "",
        address: worker.address || "",
        skills: worker.skills || [],
        assignedEquipment: worker.assigned_equipment || "Toolkit #T-104",
        stats: {
          totalAssigned,
          inProgress,
          pending,
          completed,
          rating: worker.rating || 4.9,
          onTimeRate: worker.on_time_rate || 96,
        },
      },
    });
  } catch (error) {
    console.error("Error getting worker profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch worker profile.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. UPDATE WORKER PROFILE
// ==========================================
const updateWorkerProfile = async (req, res) => {
  try {
    const { name, phone, email, zone, emergencyContact, address, skills } = req.body;

    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    // Update User schema fields
    const userUpdate = {};
    if (name) userUpdate.name = name.trim();
    if (phone) userUpdate.phone = phone.trim();
    if (email) userUpdate.email = email.trim().toLowerCase();

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdate);
    }

    // Update Worker schema fields
    if (zone !== undefined) worker.zone = zone;
    if (emergencyContact !== undefined) worker.emergency_contact = emergencyContact;
    if (address !== undefined) worker.address = address;
    if (skills && Array.isArray(skills)) worker.skills = skills;

    await worker.save();

    return res.status(200).json({
      success: true,
      message: "Worker profile updated successfully.",
    });
  } catch (error) {
    console.error("Error updating worker profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. CHANGE WORKER PASSWORD
// ==========================================
const changeWorkerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
      error: error.message,
    });
  }
};

module.exports = {
  getWorkerProfile,
  updateWorkerProfile,
  changeWorkerPassword,
};
