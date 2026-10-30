const {
  User,
  Complaint,
  Worker,
  Assignment,
  Area,
} = require("../schemas");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const getUserDeletionDependencies = async (userId) => {
  const user = await User.findById(userId).select("role");
  if (!user) return null;

  const dependencies = {
    activeAssignments: [],
    managedWorkers: 0,
    mappedAreas: [],
  };

  if (user.role === "WORKER") {
    const worker = await Worker.findOne({ user_id: userId }).select("_id");
    if (worker) {
      dependencies.activeAssignments = await Assignment.find({
        worker_id: worker._id,
        status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
      })
        .populate("complaint_id", "complaint_code title locality city")
        .select("status scheduled_start_at scheduled_end_at complaint_id")
        .lean();
    }
  }

  if (user.role === "MANAGER") {
    const workerIds = await Worker.find({ manager_id: userId }).distinct("_id");
    dependencies.managedWorkers = workerIds.length;
    dependencies.activeAssignments = await Assignment.find({
      worker_id: { $in: workerIds },
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    })
      .populate("worker_id", "employee_code")
      .populate("complaint_id", "complaint_code title locality city")
      .select("status worker_id complaint_id")
      .lean();
    dependencies.mappedAreas = await Area.find({ manager_id: userId, active: true })
      .select("name")
      .lean();
  }

  return dependencies;
};
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
          _id: { $ifNull: ["$locality", { $ifNull: ["$city", "$address"] }] },
          complaints: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: null } } },
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

    // Fetch latest complaints and user signups for real recent activity
    const [latestComplaints, latestUsers] = await Promise.all([
      Complaint.find()
        .sort({ reported_at: -1, createdAt: -1 })
        .limit(5)
        .select("complaint_code title status reported_at createdAt")
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name role status createdAt")
        .lean(),
    ]);

    const recentActivity = [
      ...latestComplaints.map((c) => ({
        title: `Complaint ${c.complaint_code}: ${c.title}`,
        meta: `Status: ${c.status}`,
        time: c.reported_at || c.createdAt
          ? new Date(c.reported_at || c.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
        timestamp: c.reported_at || c.createdAt,
        tone:
          c.status === "RESOLVED" || c.status === "CLOSED"
            ? "green"
            : c.status === "IN_PROGRESS"
            ? "blue"
            : "amber",
      })),
      ...latestUsers.map((u) => ({
        title: `New user: ${u.name}`,
        meta: `Role: ${u.role}`,
        time: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
        timestamp: u.createdAt,
        tone: "indigo",
      })),
    ]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 8);

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

    const dependencies = await getUserDeletionDependencies(id);
    if (
      dependencies.activeAssignments.length > 0 ||
      dependencies.managedWorkers > 0 ||
      dependencies.mappedAreas.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message: "This account has active work or management dependencies and cannot be deleted.",
        dependencies,
      });
    }

    await User.findByIdAndDelete(id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getUserDeletionDependencySummary = async (req, res) => {
  try {
    const dependencies = await getUserDeletionDependencies(req.params.id);
    if (!dependencies) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, dependencies });
  } catch (error) {
    console.error("Error checking user deletion dependencies:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to check this account's dependencies.",
    });
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["CITIZEN", "WORKER", "MANAGER", "ADMIN"];
// const STATUSES = ["ACTIVE", "INACTIVE"];
 
const createUser = async (req, res) => {
  let createdUser;
  let createdWorker;
  try {
    const { name, email, phone, password, role, status, manager_id: managerId } = req.body;
 
    // ---- validation ----
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (role === "WORKER" && !mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({
        message: "Select an active manager to add this worker to their team.",
      });
    }
    // if (status && !STATUSES.includes(status)) {
    //   return res.status(400).json({ message: "Invalid status" });
    // }
 
    // ---- duplicate email check ----
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    if (role === "WORKER") {
      const manager = await User.findOne({
        _id: managerId,
        role: "MANAGER",
        status: "ACTIVE",
      }).select("_id");
      if (!manager) {
        return res.status(400).json({ message: "Select a valid active manager." });
      }
    }
 
    // ---- create ----
    const hashedPassword = await bcrypt.hash(password, 10);
 
    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : undefined,
      password: hashedPassword,
      role: role || "CITIZEN",
      status: status || "ACTIVE",
    });

    if (createdUser.role === "WORKER") {
      let nextCodeNumber = (await Worker.countDocuments()) + 1;
      let employeeCode;
      do {
        employeeCode = `WRK${String(nextCodeNumber).padStart(3, "0")}`;
        nextCodeNumber += 1;
      } while (await Worker.exists({ employee_code: employeeCode }));

      createdWorker = await Worker.create({
        user_id: createdUser._id,
        manager_id: managerId,
        employee_code: employeeCode,
        worker_role: "Maintenance Worker",
        availability_status: createdUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        emergency_contact: phone ? phone.trim() : undefined,
        joined_date: new Date(),
      });
    }
 
    // never send the password hash back
    const safeUser = createdUser.toObject();
    delete safeUser.password;
    if (createdWorker) safeUser.employee_code = createdWorker.employee_code;
 
    return res.status(201).json({ success: true, data: safeUser });
  } catch (err) {
    if (createdWorker) {
      await Worker.deleteOne({ _id: createdWorker._id }).catch((cleanupError) => {
        console.error("Failed to clean up worker profile after account creation error:", cleanupError);
      });
    }
    if (createdUser) {
      await User.deleteOne({ _id: createdUser._id }).catch((cleanupError) => {
        console.error("Failed to clean up user after account creation error:", cleanupError);
      });
    }
    // unique index race condition
    if (err.code === 11000) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("createUser error:", err);
    return res.status(500).json({ message: "Server error while creating user" });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getUserDeletionDependencySummary,
  deleteUser,
  createUser
};
