const {
  Assignment,
  Complaint,
  ComplaintImage,
  Worker,
  User,
  StatusHistory,
  Notification,
} = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");
const { getBusyAssignmentsFilter } = require("../utils/scheduleRange");
const {
  assignComplaintWorkers: assignComplaintThroughManagerScope,
} = require("./complaintController");

// ==========================================
// 1. ASSIGN COMPLAINT TO WORKER (WHO?)
// ==========================================
const assignComplaint = async (req, res) => {
  if (!req.body.complaintId) {
    return res.status(400).json({
      success: false,
      message: "Complaint ID is required.",
    });
  }

  req.params.id = req.body.complaintId;
  req.body.selectedWorkers =
    req.body.selectedWorkers || (req.body.workerId ? [req.body.workerId] : []);
  return assignComplaintThroughManagerScope(req, res);
};

// ==========================================
// 2. GET WORKER ASSIGNMENTS
// ==========================================
const getWorkerAssignments = async (req, res) => {
  try {
    let worker;
    const { workerId, status } = req.query;

    if (workerId && req.user.role === "ADMIN") {
      if (workerId.match(/^[0-9a-fA-F]{24}$/)) {
        worker = await Worker.findById(workerId);
      } else {
        worker = await Worker.findOne({ employee_code: workerId });
      }
    } else if (req.user.role === "MANAGER" && workerId) {
      if (workerId.match(/^[0-9a-fA-F]{24}$/)) {
        worker = await Worker.findOne({
          _id: workerId,
          manager_id: req.user._id,
        });
      } else {
        worker = await Worker.findOne({
          employee_code: workerId,
          manager_id: req.user._id,
        });
      }
    } else {
      worker = await getWorkerForUser(req.user._id);
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker record not found.",
      });
    }

    const query = { worker_id: worker._id };
    if (status) {
      query.status = status.toUpperCase();
    }

    const assignments = await Assignment.find(query)
      .populate({
        path: "complaint_id",
        populate: [
          { path: "reported_by", select: "name phone email" },
          { path: "area_id", select: "name type" },
        ],
      })
      .populate("assigned_by", "name email role")
      .sort({ assigned_at: -1 });

    const formattedAssignments = assignments
      .filter((a) => a.complaint_id)
      .map((a) => {
        const c = a.complaint_id;
        return {
          id: a._id,
          assignmentId: a._id,
          complaintId: c.complaint_code,
          mongoComplaintId: c._id,
          title: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.priority,
          complaintStatus: c.status,
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
          assignedAt: a.assigned_at,
          startedAt: a.started_at,
          completedAt: a.completed_at,
          assignedBy: a.assigned_by?.name || "Manager",
          reportedBy: c.reported_by?.name || "Citizen",
          image: null,
        };
      });
    const complaintIds = formattedAssignments.map((assignment) => assignment.mongoComplaintId);
    const complaintImages = await ComplaintImage.find({
      complaint_id: { $in: complaintIds },
      image_type: "BEFORE",
    }).sort({ uploaded_at: 1 });
    const imageByComplaint = new Map();
    complaintImages.forEach((image) => {
      if (!imageByComplaint.has(String(image.complaint_id))) {
        imageByComplaint.set(String(image.complaint_id), image.image_url);
      }
    });
    formattedAssignments.forEach((assignment) => {
      assignment.image = imageByComplaint.get(String(assignment.mongoComplaintId)) || null;
    });

    return res.status(200).json({
      success: true,
      count: formattedAssignments.length,
      assignments: formattedAssignments,
    });
  } catch (error) {
    console.error("Error fetching worker assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching assignments.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET SINGLE ASSIGNMENT BY ID
// ==========================================
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    let assignment;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      assignment = await Assignment.findById(id)
        .populate({
          path: "complaint_id",
          populate: { path: "reported_by", select: "name phone email" },
        })
        .populate({
          path: "worker_id",
          populate: { path: "user_id", select: "name email phone" },
        })
        .populate("assigned_by", "name email");
    }

    if (!assignment) {
      // Try searching by complaint code
      const complaint = await Complaint.findOne({ complaint_code: id });
      if (complaint) {
        assignment = await Assignment.findOne({ complaint_id: complaint._id })
          .populate({
            path: "complaint_id",
            populate: { path: "reported_by", select: "name phone email" },
          })
          .populate({
            path: "worker_id",
            populate: { path: "user_id", select: "name email phone" },
          })
          .populate("assigned_by", "name email");
      }
    }

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }
    return res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching assignment details.",
      error: error.message,
    });
  }
};

// ==========================================
// 4. REASSIGN WORKER
// ==========================================
const reassignWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { newWorkerId, remarks } = req.body;

    if (!newWorkerId) {
      return res.status(400).json({
        success: false,
        message: "New worker ID is required for reassignment.",
      });
    }

    let assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }
    if (!assignment.scheduled_start_at || !assignment.scheduled_end_at) {
      return res.status(409).json({
        success: false,
        message: "This assignment has no valid scheduled date range and cannot be reassigned.",
      });
    }

    const complaint = await Complaint.findById(assignment.complaint_id);
    if (
      !complaint ||
      (req.user.role !== "ADMIN" &&
        String(complaint.manager_id) !== String(req.user._id))
    ) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    let newWorker;
    if (newWorkerId.match(/^[0-9a-fA-F]{24}$/)) {
      newWorker = await Worker.findById(newWorkerId).populate("user_id");
    } else {
      newWorker = await Worker.findOne({ employee_code: newWorkerId }).populate("user_id");
    }

    if (!newWorker) {
      return res.status(404).json({
        success: false,
        message: "New worker not found.",
      });
    }

    if (
      newWorker.availability_status !== "ACTIVE" ||
      (req.user.role !== "ADMIN" &&
        String(newWorker.manager_id) !== String(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: "Select an ACTIVE worker assigned to your manager account.",
      });
    }

    const conflictingAssignment = await Assignment.exists({
      worker_id: newWorker._id,
      ...getBusyAssignmentsFilter(
        assignment.scheduled_start_at,
        assignment.scheduled_end_at,
        assignment._id
      ),
    });
    if (conflictingAssignment) {
      return res.status(409).json({
        success: false,
        message: "This worker already has an assignment during those dates.",
      });
    }

    assignment.worker_id = newWorker._id;
    assignment.assigned_at = new Date();
    assignment.assigned_by = req.user._id;
    assignment.remarks = remarks || `Reassigned to ${newWorker.employee_code}`;
    await assignment.save();

    // Log status change
    await StatusHistory.create({
      complaint_id: assignment.complaint_id,
      changed_by: req.user._id,
      old_status: "ASSIGNED",
      new_status: "ASSIGNED",
      remarks: `Reassigned to ${newWorker.employee_code} (${newWorker.user_id?.name || "Worker"})`,
      changed_at: new Date(),
    });

    // Notify new worker
    if (newWorker.user_id) {
      const complaint = await Complaint.findById(assignment.complaint_id);
      await Notification.create({
        user_id: newWorker.user_id._id,
        complaint_id: assignment.complaint_id,
        type: "ASSIGNMENT",
        message: `Task reassigned: You are now assigned to #${complaint?.complaint_code || "Complaint"}: ${complaint?.title || ""}`,
        is_read: false,
        created_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Assignment successfully transferred to ${newWorker.employee_code}.`,
      assignment,
    });
  } catch (error) {
    console.error("Error reassigning worker:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while reassigning worker.",
      error: error.message,
    });
  }
};

// ==========================================
// 5. REMOVE ASSIGNMENT
// ==========================================
const removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    const complaintId = assignment.complaint_id;
    const complaint = await Complaint.findById(complaintId);
    if (
      !complaint ||
      (req.user.role !== "ADMIN" &&
        String(complaint.manager_id) !== String(req.user._id))
    ) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }
    const oldStatus = complaint.status;
    assignment.status = "CANCELLED";
    assignment.completed_at = new Date();
    await assignment.save();

    // Preserve the assignment record so cancelled workers can be reassigned later.
    const remainingAssignments = await Assignment.countDocuments({
      complaint_id: complaintId,
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    });

    if (remainingAssignments === 0) {
      complaint.status = "PENDING";
      await complaint.save();
    }
    await StatusHistory.create({
      complaint_id: complaintId,
      changed_by: req.user._id,
      old_status: oldStatus,
      new_status: complaint.status,
      remarks: "Worker assignment cancelled.",
    });

    return res.status(200).json({
      success: true,
      message: "Assignment successfully removed.",
    });
  } catch (error) {
    console.error("Error removing assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing assignment.",
      error: error.message,
    });
  }
};

// ==========================================
// 6. GET ALL ASSIGNMENTS (MANAGER VIEW)
// ==========================================
const getAllAssignments = async (req, res) => {
  try {
    const complaintIds =
      req.user.role === "ADMIN"
        ? undefined
        : await Complaint.find({ manager_id: req.user._id }).distinct("_id");
    const assignmentFilter = complaintIds
      ? { complaint_id: { $in: complaintIds } }
      : {};
    const assignments = await Assignment.find(assignmentFilter)
      .populate({
        path: "complaint_id",
        populate: { path: "reported_by", select: "name phone email" },
      })
      .populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name email phone" },
      })
      .populate("assigned_by", "name email role")
      .sort({ assigned_at: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching all assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching all assignments.",
      error: error.message,
    });
  }
};

module.exports = {
  assignComplaint,
  getWorkerAssignments,
  getAssignmentById,
  reassignWorker,
  removeAssignment,
  getAllAssignments,
};
