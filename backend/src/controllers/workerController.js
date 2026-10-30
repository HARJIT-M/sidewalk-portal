const bcrypt = require("bcryptjs");
const { User, Worker, Assignment } = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");
const {
  parseScheduleRange,
  getBusyAssignmentsFilter,
} = require("../utils/scheduleRange");

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
        status: worker.availability_status === "ACTIVE" ? "Available" : worker.availability_status === "ON_LEAVE" ? "On Leave" : "Inactive",
        availabilityStatus: worker.availability_status || "ACTIVE",
        shift: worker.shift || "Day Shift (08:00 AM - 05:00 PM)",
        joinedDate: formattedJoinedDate,
        team: worker.manager_id?.name || "Assigned Team",
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
    const { name, phone, email, emergencyContact, address, skills } = req.body;

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

    if (emergencyContact !== undefined) worker.emergency_contact = emergencyContact;
    if (address !== undefined) worker.address = address;
    if (skills && Array.isArray(skills)) worker.skills = skills;
    await worker.save();
    return res.status(200).json({ success: true, message: "Worker profile updated successfully." });
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
    const workers = await Worker.find({ manager_id: req.user._id })
      .populate("user_id", "name email phone status")
      .populate("manager_id", "name")
      .sort({ createdAt: -1 });

    const formattedWorkers = await Promise.all(
      workers.map(async (worker) => {
        const activeAssignments = await Assignment.find({
          worker_id: worker._id,
          status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
        })
          .populate("complaint_id", "complaint_code title")
          .select("status complaint_id")
          .lean();

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
          status: worker.availability_status === "ACTIVE" ? "Active" : worker.availability_status === "ON_LEAVE" ? "On Leave" : "Inactive",
          availabilityStatus: worker.availability_status,
          team: worker.manager_id?.name || "Assigned Team",
          shift: worker.shift || "Day Shift (08:00 AM - 05:00 PM)",
          skills: worker.skills || [],
          assignedEquipment: worker.assigned_equipment || "",
          joinedDate: joinedDateFormatted,
          assignedWorks: activeAssignments.length,
          activeAssignments: activeAssignments.map((assignment) => ({
            id: assignment._id,
            status: assignment.status,
            complaintCode: assignment.complaint_id?.complaint_code || "",
            complaintTitle: assignment.complaint_id?.title || "Complaint",
          })),
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
    const { startDate, endDate } = req.query;
    const schedule = parseScheduleRange(startDate, endDate);
    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: "Valid startDate and endDate are required in YYYY-MM-DD format.",
      });
    }

    const busyWorkerIds = await Assignment.distinct(
      "worker_id",
      getBusyAssignmentsFilter(schedule.start, schedule.end)
    );

    const activeWorkers = await Worker.find({
      availability_status: "ACTIVE",
      ...(req.user.role === "MANAGER" ? { manager_id: req.user._id } : {}),
      _id: { $nin: busyWorkerIds },
    })
      .populate("user_id", "name email phone")
      .populate("manager_id", "name")
      .select("employee_code worker_role skills user_id manager_id");

    const workerOptions = activeWorkers.map((w, index) => ({
      id: index + 1,
      workerId: w._id,
      employeeCode: w.employee_code,
      name: w.user_id ? w.user_id.name : `Worker ${w.employee_code}`,
      role: w.worker_role || "Maintenance Worker",
      team: w.manager_id?.name || "Assigned Team",
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
    const { name, phone, email, shift, address, skills } = req.body;

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

    let nextCodeNumber = 1;
    const lastWorker = await Worker.findOne().sort({ createdAt: -1 });
    if (lastWorker && lastWorker.employee_code && lastWorker.employee_code.startsWith("WRK")) {
      const lastCode = parseInt(lastWorker.employee_code.replace("WRK", ""), 10);
      if (!isNaN(lastCode)) {
        nextCodeNumber = lastCode + 1;
      } else {
        const totalWorkers = await Worker.countDocuments();
        nextCodeNumber = totalWorkers + 1;
      }
    }

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
      manager_id: req.user._id,
      employee_code: employeeCode,
      worker_role: "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: shift || "Day Shift (08:00 AM - 05:00 PM)",
      emergency_contact: phone.trim(),
      ...(address ? { address } : {}),
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
        team: req.user.name,
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
      worker = await Worker.findOne({ _id: id, manager_id: req.user._id });
    } else {
      worker = await Worker.findOne({ employee_code: id, manager_id: req.user._id });
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
    await Worker.updateOne(
      { _id: worker._id },
      { $set: { availability_status: targetStatus } }
    );

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
      worker = await Worker.findOne({ _id: id, manager_id: req.user._id });
    } else {
      worker = await Worker.findOne({ employee_code: id, manager_id: req.user._id });
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found.",
      });
    }

    const activeAssignments = await Assignment.find({
      worker_id: worker._id,
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    })
      .populate("complaint_id", "complaint_code title")
      .select("status complaint_id")
      .lean();

    if (activeAssignments.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This worker has active assignments. Reassign or complete them before removing the worker.",
        dependencies: activeAssignments.map((assignment) => ({
          status: assignment.status,
          complaintCode: assignment.complaint_id?.complaint_code || "",
          complaintTitle: assignment.complaint_id?.title || "Complaint",
        })),
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

// ==========================================
// 9. UPDATE WORKER AVAILABILITY (WORKER ROLE)
// ==========================================
const updateWorkerAvailability = async (req, res) => {
  try {
    const { availabilityStatus, status } = req.body;
    const worker = await getWorkerForUser(req.user._id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    const raw = (availabilityStatus || status || "").trim().toUpperCase();
    let newStatus = worker.availability_status;

    if (raw === "ON_LEAVE" || raw === "ON LEAVE" || raw === "LEAVE") {
      newStatus = "ON_LEAVE";
    } else if (raw === "ACTIVE" || raw === "AVAILABLE") {
      newStatus = "ACTIVE";
    } else if (raw === "INACTIVE") {
      newStatus = "INACTIVE";
    } else {
      newStatus = worker.availability_status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE";
    }

    worker.availability_status = newStatus;
    await Worker.updateOne(
      { _id: worker._id },
      { $set: { availability_status: newStatus } }
    );

    return res.status(200).json({
      success: true,
      message: `Worker availability updated to ${
        newStatus === "ACTIVE" ? "Available" : newStatus === "ON_LEAVE" ? "On Leave" : "Inactive"
      }.`,
      availabilityStatus: newStatus,
      isAvailable: newStatus === "ACTIVE",
    });
  } catch (error) {
    console.error("Error updating worker availability:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating worker availability.",
      error: error.message,
    });
  }
};

// ==========================================
// 10. GET WORKER PRODUCTIVITY DASHBOARD (MANAGER / ADMIN)
// ==========================================
const getWorkerProductivity = async (req, res) => {
  try {
    const isManager = req.user.role === "MANAGER";
    const filter = isManager ? { manager_id: req.user._id } : {};

    const workers = await Worker.find(filter)
      .populate("user_id", "name email phone status")
      .populate("manager_id", "name")
      .lean();

    const workerIds = workers.map((w) => w._id);

    const assignments = await Assignment.find({
      worker_id: { $in: workerIds },
    })
      .populate("complaint_id", "complaint_code title priority status issue_type")
      .lean();

    const assignmentsByWorker = new Map();
    workerIds.forEach((id) => assignmentsByWorker.set(String(id), []));
    assignments.forEach((a) => {
      const wid = String(a.worker_id);
      if (assignmentsByWorker.has(wid)) {
        assignmentsByWorker.get(wid).push(a);
      }
    });

    let totalCompletedTeam = 0;
    let totalAssignedTeam = 0;
    let totalInProgressTeam = 0;

    const workerStats = workers.map((worker) => {
      const wAssignments = assignmentsByWorker.get(String(worker._id)) || [];
      const totalAssigned = wAssignments.length;
      const completedList = wAssignments.filter((a) => a.status === "COMPLETED");
      const completedCount = completedList.length;
      const inProgressCount = wAssignments.filter((a) => a.status === "IN_PROGRESS").length;
      const assignedPendingCount = wAssignments.filter((a) => a.status === "ASSIGNED").length;

      totalCompletedTeam += completedCount;
      totalAssignedTeam += totalAssigned;
      totalInProgressTeam += inProgressCount;

      const completionRate =
        totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

      let totalResolutionHours = 0;
      let countWithHours = 0;
      let onTimeCount = 0;

      completedList.forEach((a) => {
        if (a.completed_at) {
          const start = a.started_at || a.assigned_at;
          if (start) {
            const diffHours = (new Date(a.completed_at) - new Date(start)) / (1000 * 60 * 60);
            if (diffHours > 0) {
              totalResolutionHours += diffHours;
              countWithHours += 1;
            }
          }
          if (a.scheduled_end_at) {
            if (new Date(a.completed_at) <= new Date(a.scheduled_end_at)) {
              onTimeCount += 1;
            }
          } else {
            onTimeCount += 1;
          }
        }
      });

      const avgHours = countWithHours > 0 ? Math.round(totalResolutionHours / countWithHours) : 4;
      const onTimeRate =
        completedCount > 0
          ? Math.round((onTimeCount / completedCount) * 100)
          : worker.on_time_rate || 95;

      const recentCompleted = completedList
        .slice(-3)
        .reverse()
        .map((a) => ({
          assignmentId: a._id,
          complaintCode: a.complaint_id?.complaint_code || "",
          title: a.complaint_id?.title || "Complaint",
          completedAt: a.completed_at
            ? new Date(a.completed_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
        }));

      return {
        workerId: worker._id,
        employeeCode: worker.employee_code,
        name: worker.user_id?.name || worker.employee_code,
        email: worker.user_id?.email || "",
        phone: worker.user_id?.phone || worker.emergency_contact || "",
        role: worker.worker_role || "Maintenance Worker",
        shift: worker.shift || "Day Shift (08:00 AM - 05:00 PM)",
        availabilityStatus: worker.availability_status || "ACTIVE",
        statusDisplay:
          worker.availability_status === "ACTIVE"
            ? "Available"
            : worker.availability_status === "ON_LEAVE"
            ? "On Leave"
            : "Inactive",
        rating: worker.rating || 4.8,
        skills: worker.skills || [],
        totalAssigned,
        completedCount,
        inProgressCount,
        pendingCount: assignedPendingCount,
        completionRate,
        avgCompletionHours: avgHours,
        onTimeRate,
        recentCompleted,
      };
    });

    const activeCount = workers.filter((w) => w.availability_status === "ACTIVE").length;
    const onLeaveCount = workers.filter((w) => w.availability_status === "ON_LEAVE").length;
    const inactiveCount = workers.filter((w) => w.availability_status === "INACTIVE").length;

    const overallCompletionRate =
      totalAssignedTeam > 0 ? Math.round((totalCompletedTeam / totalAssignedTeam) * 100) : 0;

    const leaderboard = [...workerStats]
      .sort((a, b) => b.completedCount - a.completedCount || b.completionRate - a.completionRate || b.rating - a.rating)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      summary: {
        totalWorkers: workers.length,
        activeWorkers: activeCount,
        onLeaveWorkers: onLeaveCount,
        inactiveWorkers: inactiveCount,
        totalAssignedTasks: totalAssignedTeam,
        totalCompletedTasks: totalCompletedTeam,
        totalInProgressTasks: totalInProgressTeam,
        teamCompletionRate: overallCompletionRate,
        averageTeamRating: (
          workers.reduce((acc, w) => acc + (w.rating || 4.8), 0) / (workers.length || 1)
        ).toFixed(1),
      },
      leaderboard,
      workers: workerStats,
    });
  } catch (error) {
    console.error("Error fetching worker productivity:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching worker productivity.",
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
  updateWorkerAvailability,
  getWorkerProductivity,
};
