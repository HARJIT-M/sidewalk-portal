const { Assignment, Complaint, Worker, User, StatusHistory, Notification } = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");

// ==========================================
// 1. ASSIGN COMPLAINT TO WORKER (WHO?)
// ==========================================
const assignComplaint = async (req, res) => {
  try {
    const { complaintId, workerId, remarks } = req.body;

    if (!complaintId || !workerId) {
      return res.status(400).json({
        success: false,
        message: "Both complaintId and workerId are required.",
      });
    }

    // 1. Find Complaint (by ObjectId or complaint_code)
    let complaint;
    if (complaintId.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(complaintId);
    } else {
      complaint = await Complaint.findOne({ complaint_code: complaintId });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    // 2. Find Worker (by ObjectId or employee_code)
    let worker;
    if (workerId.match(/^[0-9a-fA-F]{24}$/)) {
      worker = await Worker.findById(workerId).populate("user_id");
    } else {
      worker = await Worker.findOne({ employee_code: workerId }).populate("user_id");
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found.",
      });
    }

    // 3. Create or update Assignment
    const oldStatus = complaint.status;
    let assignment = await Assignment.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });

    if (assignment) {
      assignment.status = "ASSIGNED";
      assignment.assigned_at = new Date();
      assignment.assigned_by = req.user._id;
      assignment.remarks = remarks || assignment.remarks;
      await assignment.save();
    } else {
      assignment = await Assignment.create({
        complaint_id: complaint._id,
        worker_id: worker._id,
        assigned_by: req.user._id,
        assigned_at: new Date(),
        status: "ASSIGNED",
        remarks: remarks || `Assigned to ${worker.employee_code}`,
      });
    }

    // 4. Update Complaint Status
    complaint.status = "ASSIGNED";
    await complaint.save();

    // 5. Log Status History
    await StatusHistory.create({
      complaint_id: complaint._id,
      changed_by: req.user._id,
      old_status: oldStatus,
      new_status: "ASSIGNED",
      remarks: remarks || `Assigned to worker ${worker.employee_code} (${worker.user_id?.name || "Worker"})`,
      changed_at: new Date(),
    });

    // 6. Notify Worker
    if (worker.user_id) {
      await Notification.create({
        user_id: worker.user_id._id,
        complaint_id: complaint._id,
        type: "ASSIGNMENT",
        message: `You have been assigned to Complaint #${complaint.complaint_code}: ${complaint.title}`,
        is_read: false,
        created_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Complaint #${complaint.complaint_code} successfully assigned to ${worker.employee_code}.`,
      assignment: {
        id: assignment._id,
        complaintId: complaint.complaint_code,
        workerId: worker.employee_code,
        workerName: worker.user_id?.name,
        assignedAt: assignment.assigned_at,
        status: assignment.status,
      },
    });
  } catch (error) {
    console.error("Error assigning complaint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while assigning complaint.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET WORKER ASSIGNMENTS
// ==========================================
const getWorkerAssignments = async (req, res) => {
  try {
    let worker;
    const { workerId, status } = req.query;

    if (workerId) {
      if (workerId.match(/^[0-9a-fA-F]{24}$/)) {
        worker = await Worker.findById(workerId);
      } else {
        worker = await Worker.findOne({ employee_code: workerId });
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
        populate: { path: "reported_by", select: "name phone email" },
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
          location: c.location,
          landmark: c.landmark || "",
          area: c.area || "",
          assignedAt: a.assigned_at,
          startedAt: a.started_at,
          completedAt: a.completed_at,
          assignedBy: a.assigned_by?.name || "Manager",
          reportedBy: c.reported_by?.name || "Citizen",
          image: c.image_url || null,
        };
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
    await Assignment.findByIdAndDelete(id);

    // Check if any other assignments exist for this complaint
    const remainingAssignments = await Assignment.countDocuments({
      complaint_id: complaintId,
    });

    if (remainingAssignments === 0) {
      await Complaint.findByIdAndUpdate(complaintId, { status: "PENDING" });
    }

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
    const assignments = await Assignment.find()
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
