const bcrypt = require("bcryptjs");
const { User, Worker, Assignment } = require("../schemas");
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
        userId: worker.user_id ? worker.user_id._id : null,
        name: worker.user_id ? worker.user_id.name : "Worker",
        email: worker.user_id ? worker.user_id.email : "",
        phone: worker.user_id?.phone || worker.emergency_contact || "",
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

    const userUpdate = {};
    if (name) userUpdate.name = name.trim();
    if (phone) userUpdate.phone = phone.trim();
    if (email) userUpdate.email = email.trim().toLowerCase();

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdate);
    }

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

// ==========================================
// 4. GET ALL WORKERS (ROSTER)
// ==========================================
const getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate("user_id", "name email phone status")
      .sort({ createdAt: -1 });

    const formattedWorkers = await Promise.all(
      workers.map(async (worker) => {
        const activeAssignedCount = await Assignment.countDocuments({
          worker_id: worker._id,
          status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
        });

        const joinedDateFormatted = worker.joined_date
          ? new Date(worker.joined_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "12 Jan 2025";

        return {
          id: worker.employee_code,
          mongoId: worker._id,
          userId: worker.user_id ? worker.user_id._id : null,
          name: worker.user_id ? worker.user_id.name : "Maintenance Worker",
          phone: worker.user_id?.phone || worker.emergency_contact || "",
          email: worker.user_id ? worker.user_id.email : "",
          role: worker.worker_role || "Maintenance Worker",
          status: worker.availability_status === "ACTIVE" ? "Active" : "Inactive",
          availabilityStatus: worker.availability_status,
          zone: worker.zone || "Zone 2 - Gandhipuram Central",
          shift: worker.shift || "Day Shift (08:00 AM - 05:00 PM)",
          skills: worker.skills || [],
          assignedEquipment: worker.assigned_equipment || "",
          joinedDate: joinedDateFormatted,
          assignedWorks: activeAssignedCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formattedWorkers.length,
      workers: formattedWorkers,
    });
  } catch (error) {
    console.error("Error fetching workers roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching workers.",
      error: error.message,
    });
  }
};

// ==========================================
// 5. GET AVAILABLE WORKERS
// ==========================================
const getAvailableWorkers = async (req, res) => {
  try {
    const activeWorkers = await Worker.find({ availability_status: "ACTIVE" })
      .populate("user_id", "name email phone")
      .select("employee_code worker_role zone skills user_id");

    const workerOptions = activeWorkers.map((w, index) => ({
      id: index + 1,
      workerId: w._id,
      employeeCode: w.employee_code,
      name: w.user_id ? w.user_id.name : `Worker ${w.employee_code}`,
      role: w.worker_role || "Maintenance Worker",
      zone: w.zone || "Zone 2 - Gandhipuram Central",
      skills: w.skills || [],
    }));

    return res.status(200).json({
      success: true,
      count: workerOptions.length,
      workers: workerOptions,
    });
  } catch (error) {
    console.error("Error fetching available workers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching available workers.",
      error: error.message,
    });
  }
};

// ==========================================
// 6. ADD NEW WORKER
// ==========================================
const addWorker = async (req, res) => {
  try {
    const { name, phone, email, role, zone, shift, address, skills } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Worker name, email, and phone number are required.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const totalWorkers = await Worker.countDocuments();
    const nextCodeNumber = totalWorkers + 1;
    const employeeCode = `WRK${String(nextCodeNumber).padStart(3, "0")}`;

    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: defaultPasswordHash,
      role: "WORKER",
      status: "ACTIVE",
    });

    const newWorkerProfile = await Worker.create({
      user_id: newUser._id,
      employee_code: employeeCode,
      worker_role: role || "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: shift || "Day Shift (08:00 AM - 05:00 PM)",
      zone: zone || "Zone 2 - Gandhipuram Central",
      emergency_contact: phone.trim(),
      address: address || "Gandhipuram, Coimbatore",
      skills: Array.isArray(skills) && skills.length > 0 ? skills : ["Footpath Tile Paving", "Concrete Crack Sealing"],
      assigned_equipment: "Toolkit #T-110",
      rating: 5.0,
      on_time_rate: 100,
      joined_date: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Worker ${name} (${employeeCode}) added successfully.`,
      worker: {
        id: newWorkerProfile.employee_code,
        mongoId: newWorkerProfile._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newWorkerProfile.worker_role,
        status: "Active",
        joinedDate: "Today",
        assignedWorks: 0,
      },
    });
  } catch (error) {
    console.error("Error adding new worker:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering new worker.",
      error: error.message,
    });
  }
};

// ==========================================
// 7. UPDATE WORKER STATUS
// ==========================================
const updateWorkerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let worker;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      worker = await Worker.findById(id);
    } else {
      worker = await Worker.findOne({ employee_code: id });
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker record not found.",
      });
    }

    let targetStatus = "ACTIVE";
    if (status) {
      targetStatus = status.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    } else {
      targetStatus = worker.availability_status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    }

    worker.availability_status = targetStatus;
    await worker.save();

    await User.findByIdAndUpdate(worker.user_id, {
      status: targetStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    });

    return res.status(200).json({
      success: true,
      message: `Worker ${worker.employee_code} status updated to ${targetStatus}.`,
      availabilityStatus: targetStatus,
    });
  } catch (error) {
    console.error("Error updating worker status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating worker status.",
      error: error.message,
    });
  }
};

// ==========================================
// 8. DELETE WORKER
// ==========================================
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    let worker;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      worker = await Worker.findById(id);
    } else {
      worker = await Worker.findOne({ employee_code: id });
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found.",
      });
    }

    await Assignment.deleteMany({ worker_id: worker._id });
    await Worker.findByIdAndDelete(worker._id);
    await User.findByIdAndDelete(worker.user_id);

    return res.status(200).json({
      success: true,
      message: `Worker ${worker.employee_code} has been successfully removed from roster.`,
    });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting worker.",
      error: error.message,
    });
  }
};

module.exports = {
  getWorkerProfile,
  updateWorkerProfile,
  changeWorkerPassword,
  getAllWorkers,
  getAvailableWorkers,
  addWorker,
  updateWorkerStatus,
  deleteWorker,
};
