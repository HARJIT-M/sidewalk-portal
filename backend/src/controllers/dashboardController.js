const { Assignment, Notification, Complaint, ComplaintImage, Area } = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");

// ==========================================
// 1. GET WORKER DASHBOARD
// ==========================================
const getWorkerDashboard = async (req, res) => {
  try {
    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    // Get all assignments for this worker
    const assignments = await Assignment.find({
      worker_id: worker._id,
      status: { $ne: "CANCELLED" },
    })
      .populate({
        path: "complaint_id",
        populate: [
          { path: "reported_by", select: "name phone" },
          { path: "area_id", select: "name type" },
        ],
      })
      .sort({ assigned_at: -1 });

    const assignedComplaintIds = assignments
      .filter((a) => a.complaint_id)
      .map((a) => a.complaint_id._id);
    const beforeImages = await ComplaintImage.find({
      complaint_id: { $in: assignedComplaintIds },
      image_type: "BEFORE",
    }).sort({ uploaded_at: 1 });
    const imageByComplaint = new Map();
    beforeImages.forEach((img) => {
      if (!imageByComplaint.has(String(img.complaint_id))) {
        imageByComplaint.set(String(img.complaint_id), img.image_url);
      }
    });

    const complaintsList = assignments
      .filter((a) => a.complaint_id)
      .map((a) => {
        const c = a.complaint_id;
        return {
          id: c.complaint_code,
          mongoId: c._id,
          assignmentId: a._id,
          issue: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.priority,
          status: c.status,
          assignmentStatus: a.status,
          location: c.address,
          landmark: c.landmark || "",
          area: c.area_id?.name || c.locality || c.city || "",
          locality: c.locality || "",
          city: c.city || "",
          state: c.state || "",
          latitude: c.geo_location?.coordinates?.[1] ?? null,
          longitude: c.geo_location?.coordinates?.[0] ?? null,
          navigationUrl: c.geo_location?.coordinates
            ? `https://www.google.com/maps/dir/?api=1&destination=${c.geo_location.coordinates[1]},${c.geo_location.coordinates[0]}`
            : null,
          scheduledStartAt: a.scheduled_start_at,
          scheduledEndAt: a.scheduled_end_at,
          reportedDate: c.reported_at
            ? new Date(c.reported_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
          assignedDate: a.assigned_at
            ? new Date(a.assigned_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
          reportedImage: imageByComplaint.get(String(c._id)) || null,
          reporterName: c.reported_by ? c.reported_by.name : "Citizen",
          progress:
            c.status === "RESOLVED" ||
            c.status === "CLOSED" ||
            a.status === "COMPLETED"
              ? 100
              : c.status === "IN_PROGRESS" || a.status === "IN_PROGRESS"
              ? 80
              : 10,
        };
      });

    // Counts
    const totalAssigned = complaintsList.length;
    const inProgressCount = complaintsList.filter(
      (c) =>
        c.assignmentStatus === "IN_PROGRESS" || c.status === "IN_PROGRESS"
    ).length;
    const completedCount = complaintsList.filter(
      (c) =>
        c.status === "RESOLVED" ||
        c.status === "CLOSED" ||
        c.assignmentStatus === "COMPLETED"
    ).length;
    const activeComplaints = complaintsList.filter(
      (c) =>
        c.assignmentStatus !== "COMPLETED" &&
        c.status !== "RESOLVED" &&
        c.status !== "CLOSED"
    );
    const highPriorityTasks = activeComplaints.filter(
      (c) => c.priority === "HIGH" || c.priority === "CRITICAL"
    );
    const highPriorityCount = highPriorityTasks.length;

    // Active spotlight task
    const activeTask =
      activeComplaints.find(
        (c) =>
          c.assignmentStatus === "IN_PROGRESS" || c.status === "IN_PROGRESS"
      ) ||
      activeComplaints.find(
        (c) => c.assignmentStatus === "ASSIGNED" || c.status === "ASSIGNED"
      ) ||
      null;

    // Unread notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      user_id: req.user._id,
      is_read: false,
    });

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weeklyCounts = Array(7).fill(0);
    assignments.forEach((assignment) => {
      if (assignment.status !== "COMPLETED") return;
      const completedAt = assignment.completed_at;
      if (!completedAt) return;
      const dayOffset = Math.floor(
        (new Date(completedAt).setHours(0, 0, 0, 0) - weekStart.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      if (dayOffset >= 0 && dayOffset < weeklyCounts.length) {
        weeklyCounts[dayOffset] += 1;
      }
    });
    const weeklyData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day, index) => ({
        day,
        count: weeklyCounts[index],
        label: `${weeklyCounts[index]} completed`,
      })
    );

    // Status breakdown for donut
    const resolvedCount = completedCount;
    const assignedPendingCount = complaintsList.filter(
      (c) =>
        c.assignmentStatus === "ASSIGNED" &&
        c.status !== "IN_PROGRESS" &&
        c.status !== "RESOLVED" &&
        c.status !== "CLOSED"
    ).length;
    const totalForDonut = Math.max(1, totalAssigned);

    const statusData = [
      {
        label: "Resolved",
        count: resolvedCount,
        color: "#16a34a",
        percent: Math.round((resolvedCount / totalForDonut) * 100),
      },
      {
        label: "In Progress",
        count: inProgressCount,
        color: "#4f46e5",
        percent: Math.round((inProgressCount / totalForDonut) * 100),
      },
      {
        label: "Assigned",
        count: assignedPendingCount,
        color: "#d97706",
        percent: Math.round((assignedPendingCount / totalForDonut) * 100),
      },
    ];

    const recentActivity = assignments
      .filter((assignment) => assignment.complaint_id)
      .map((assignment) => {
        const completed =
          assignment.status === "COMPLETED" ||
          ["RESOLVED", "CLOSED"].includes(assignment.complaint_id.status);
        const inProgress =
          assignment.status === "IN_PROGRESS" ||
          assignment.complaint_id.status === "IN_PROGRESS";
        const timestamp = completed
          ? assignment.completed_at || assignment.updatedAt
          : inProgress
          ? assignment.started_at || assignment.updatedAt
          : assignment.assigned_at;
        return {
          id: assignment._id,
          complaintCode: assignment.complaint_id.complaint_code,
          status: completed ? "COMPLETED" : inProgress ? "IN_PROGRESS" : "ASSIGNED",
          iconType: completed ? "resolved" : inProgress ? "progress" : "assigned",
          text: completed
            ? "Repair completed"
            : inProgress
            ? "Repair in progress"
            : "Task assigned",
          timestamp,
          time: timestamp
            ? new Date(timestamp).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recently",
        };
      })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 5);

    const upcomingSchedule = assignments
      .filter(
        (assignment) =>
          assignment.status === "ASSIGNED" &&
          assignment.complaint_id &&
          assignment.scheduled_start_at &&
          new Date(assignment.scheduled_start_at) >= today
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_start_at) - new Date(b.scheduled_start_at)
      )
      .slice(0, 5)
      .map((assignment) => ({
        day: new Date(assignment.scheduled_start_at).toLocaleDateString(
          "en-GB",
          { weekday: "short", day: "2-digit", month: "short" }
        ),
        title: assignment.complaint_id.title,
        info: `Priority: ${assignment.complaint_id.priority || "Not set"}${
          assignment.scheduled_end_at
            ? ` · Due ${new Date(assignment.scheduled_end_at).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "short" }
              )}`
            : ""
        }`,
      }));

    return res.status(200).json({
      success: true,
      dashboard: {
        worker: {
          id: worker.employee_code,
          name: worker.user_id.name,
          email: worker.user_id.email,
          team: worker.manager_id?.name || "Assigned Team",
          rating: worker.rating || 4.9,
          onTimeRate: worker.on_time_rate || 96,
        },
        stats: {
          totalAssigned,
          inProgress: inProgressCount,
          completed: completedCount,
          highPriority: highPriorityCount,
          unreadNotifications: unreadNotificationsCount,
        },
        activeTask,
        highPriorityTasks,
        weeklyData,
        statusData,
        recentActivity,
        upcomingSchedule,
      },
    });
  } catch (error) {
    console.error("Error getting worker dashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch worker dashboard data.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET MANAGER DASHBOARD
// ==========================================
const getManagerDashboard = async (req, res) => {
  try {
    const managerFilter = { manager_id: req.user._id };
    const [totalComplaints, pendingCount, inProgressCount, resolvedCount] =
      await Promise.all([
        Complaint.countDocuments(managerFilter),
        Complaint.countDocuments({
          ...managerFilter,
          status: { $in: ["PENDING", "ASSIGNED"] },
        }),
        Complaint.countDocuments({ ...managerFilter, status: "IN_PROGRESS" }),
        Complaint.countDocuments({
          ...managerFilter,
          status: { $in: ["RESOLVED", "CLOSED"] },
        }),
      ]);

    const [recentComplaints, managerArea] = await Promise.all([
      Complaint.find(managerFilter)
        .populate("reported_by", "name phone email")
        .populate("area_id", "name type")
        .sort({ reported_at: -1 })
        .limit(10),
      Area.findOne({ manager_id: req.user._id, active: true })
        .sort({ type: 1 })
        .select("name type"),
    ]);

    const latestComplaintCity = recentComplaints.find((complaint) => complaint.city)?.city;
    const recentComplaintIds = recentComplaints.map((c) => c._id);
    const recentImages = await ComplaintImage.find({
      complaint_id: { $in: recentComplaintIds },
      image_type: "BEFORE",
    }).sort({ uploaded_at: 1 });
    const managerImageMap = new Map();
    recentImages.forEach((img) => {
      if (!managerImageMap.has(String(img.complaint_id))) {
        managerImageMap.set(String(img.complaint_id), img.image_url);
      }
    });

    // Format complaint rows matching Manager frontend table
    const formattedComplaints = recentComplaints.map((c) => {
      let displayStatus = "Pending";
      if (c.status === "IN_PROGRESS") displayStatus = "In Progress";
      else if (c.status === "RESOLVED" || c.status === "CLOSED") displayStatus = "Resolved";
      else if (c.status === "ASSIGNED") displayStatus = "Assigned";

      let displayPriority = "Medium";
      if (c.priority === "HIGH" || c.priority === "CRITICAL") displayPriority = "High";
      else if (c.priority === "LOW") displayPriority = "Low";

      const formattedDate = c.reported_at
        ? new Date(c.reported_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      return {
        id: c.complaint_code,
        mongoId: c._id,
        title: c.title,
        location: c.address,
        landmark: c.landmark || "",
        area: c.area_id?.name || c.locality || c.city || "",
        city: c.city || "",
        date: formattedDate,
        priority: displayPriority,
        rawPriority: c.priority,
        status: displayStatus,
        rawStatus: c.status,
        reportedBy: c.reported_by ? c.reported_by.name : "Citizen",
        image: managerImageMap.get(String(c._id)) || null,
      };
    });

    return res.status(200).json({
      success: true,
      manager: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: "MANAGER",
        city: managerArea?.type === "CITY"
          ? managerArea.name
          : latestComplaintCity || managerArea?.name || "",
        zone: managerArea?.type === "CITY" ? "" : managerArea?.name || "",
      },
      stats: {
        totalComplaints,
        pendingComplaints: pendingCount,
        inProgressComplaints: inProgressCount,
        resolvedComplaints: resolvedCount,
      },
      complaints: formattedComplaints,
    });
  } catch (error) {
    console.error("Error generating manager dashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating manager dashboard.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET USER DASHBOARD
// ==========================================
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch complaints for the user
    const userComplaints = await Complaint.find({ reported_by: userId })
      .sort({ reported_at: -1 });

    const totalReported = userComplaints.length;
    const inProgressCount = userComplaints.filter(c => c.status === "IN_PROGRESS").length;
    const resolvedCount = userComplaints.filter(c => c.status === "RESOLVED" || c.status === "CLOSED").length;
    const pendingCount = userComplaints.filter(c => c.status === "PENDING" || c.status === "ASSIGNED").length;

    // Recent activity map (e.g. up to 3)
    const recentActivity = userComplaints.slice(0, 3).map(c => {
      let iconType = "reported";
      let actionText = "Reported new issue";
      if (c.status === "RESOLVED" || c.status === "CLOSED") {
        iconType = "resolved";
        actionText = "Issue resolved by team";
      } else if (c.status === "IN_PROGRESS") {
        iconType = "progress";
        actionText = "Repair work started";
      }

      return {
        id: c.complaint_code,
        mongoId: c._id,
        action: actionText,
        issue: c.title,
        location: c.address || c.location || "",
        priority: c.priority,
        status: c.status,
        date: c.reported_at ? new Date(c.reported_at).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric"
        }) : "Recently",
        time: c.reported_at ? new Date(c.reported_at).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short"
        }) : "Recently",
        iconType
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalReported,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        pending: pendingCount
      },
      recentActivity
    });
  } catch (error) {
    console.error("Error generating user dashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating user dashboard.",
      error: error.message,
    });
  }
};

module.exports = {
  getWorkerDashboard,
  getManagerDashboard,
  getUserDashboard,
};
