const {
  Complaint,
  ComplaintImage,
  Assignment,
  StatusHistory,
  RepairHistory,
  Notification,
} = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");

// ==========================================
// 1. START COMPLAINT WORK (WORKER)
// ==========================================
const startComplaintWork = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    let complaint;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(id);
    } else {
      complaint = await Complaint.findOne({ complaint_code: id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const assignment = await Assignment.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });

    if (assignment) {
      assignment.status = "IN_PROGRESS";
      assignment.started_at = new Date();
      await assignment.save();
    }

    const oldStatus = complaint.status;
    complaint.status = "IN_PROGRESS";
    await complaint.save();

    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: oldStatus,
      new_status: "IN_PROGRESS",
      changed_by: req.user._id,
      remarks: `Work started on-site by ${req.user.name} (${worker.employee_code}).`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Work has been started on this complaint.",
      status: "IN_PROGRESS",
    });
  } catch (error) {
    console.error("Error starting complaint work:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start work.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. SUBMIT WORK UPDATE / LOG REPAIR (WORKER)
// ==========================================
const submitWorkUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, // 'In Progress' | 'Completed' | 'IN_PROGRESS' | 'RESOLVED'
      workDescription,
      materialsUsed,
      remarks,
      completionImage,
    } = req.body;

    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    let complaint;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(id);
    } else {
      complaint = await Complaint.findOne({ complaint_code: id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const isCompleted =
      status === "Completed" || status === "RESOLVED" || status === "COMPLETED";
    const targetStatus = isCompleted ? "RESOLVED" : "IN_PROGRESS";
    const oldStatus = complaint.status;

    const assignment = await Assignment.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });

    if (assignment) {
      assignment.status = isCompleted ? "COMPLETED" : "IN_PROGRESS";
      if (isCompleted) {
        assignment.completed_at = new Date();
      }
      if (remarks) {
        assignment.remarks = remarks;
      }
      await assignment.save();
    }

    complaint.status = targetStatus;
    if (isCompleted) {
      complaint.resolved_at = new Date();
    }
    await complaint.save();

    let materialsArray = [];
    if (Array.isArray(materialsUsed)) {
      materialsArray = materialsUsed;
    } else if (typeof materialsUsed === "string" && materialsUsed.trim()) {
      materialsArray = materialsUsed.split(",").map((s) => s.trim());
    }

    await RepairHistory.create({
      complaint_id: complaint._id,
      worker_id: worker._id,
      started_at:
        assignment && assignment.started_at ? assignment.started_at : new Date(),
      completed_at: isCompleted ? new Date() : null,
      repair_description: workDescription || "On-site repair work executed.",
      materials_used: materialsArray,
      before_image: complaint.image_url || null,
      after_image: completionImage || null,
      remarks: remarks || "",
    });

    if (completionImage) {
      await ComplaintImage.create({
        complaint_id: complaint._id,
        image_url: completionImage,
        image_type: "AFTER",
        uploaded_by: req.user._id,
        uploaded_at: new Date(),
      });
    }

    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: oldStatus,
      new_status: targetStatus,
      changed_by: req.user._id,
      remarks: isCompleted
        ? `Repair marked Completed by ${req.user.name}. Submitted for manager verification.`
        : `Work progress update: ${(
            workDescription || "Repair progress logged."
          ).slice(0, 60)}`,
      changed_at: new Date(),
    });

    if (isCompleted) {
      await Notification.create({
        user_id: req.user._id,
        complaint_id: complaint._id,
        type: "REPAIR_COMPLETED",
        message: `You completed repair on ${complaint.complaint_code} (${complaint.title}). Manager verification is queued.`,
        is_read: false,
        created_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: isCompleted
        ? "Work successfully completed and submitted for manager verification."
        : "Work progress updated successfully.",
      status: targetStatus,
    });
  } catch (error) {
    console.error("Error submitting work update:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit work update.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET MANAGER WORK TRACKING LIST
// ==========================================
const getManagerWorkTracking = async (req, res) => {
  try {
    const { status, search } = req.query;

    const complaints = await Complaint.find()
      .populate("reported_by", "name phone")
      .sort({ reported_at: -1 });

    const [allAssignments, allRepairs] = await Promise.all([
      Assignment.find().populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name" },
      }),
      RepairHistory.find().populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name" },
      }),
    ]);

    let trackWorks = complaints.map((c) => {
      const complaintAssignments = allAssignments.filter(
        (a) => a.complaint_id && a.complaint_id.toString() === c._id.toString()
      );

      const assignedWorkerNames = complaintAssignments
        .map((a) => (a.worker_id && a.worker_id.user_id ? a.worker_id.user_id.name : null))
        .filter(Boolean);

      const complaintRepairs = allRepairs.filter(
        (r) => r.complaint_id && r.complaint_id.toString() === c._id.toString()
      );

      const latestRepair = complaintRepairs[complaintRepairs.length - 1] || null;

      let displayStatus = "Not Assigned";
      let progress = 0;
      if (c.status === "ASSIGNED") {
        displayStatus = "Assigned";
        progress = 25;
      } else if (c.status === "IN_PROGRESS") {
        displayStatus = "In Progress";
        progress = 65;
      } else if (c.status === "RESOLVED" || c.status === "CLOSED") {
        displayStatus = "Completed";
        progress = 100;
      }

      let displayPriority = "Medium";
      if (c.priority === "HIGH" || c.priority === "CRITICAL") displayPriority = "High";
      else if (c.priority === "LOW") displayPriority = "Low";

      const assignedDateFormatted =
        complaintAssignments.length > 0 && complaintAssignments[0].assigned_at
          ? new Date(complaintAssignments[0].assigned_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "";

      const startedDateFormatted =
        complaintAssignments.length > 0 && complaintAssignments[0].started_at
          ? new Date(complaintAssignments[0].started_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "";

      const historyTimeline = complaintRepairs.map((rh) => ({
        date: rh.started_at
          ? new Date(rh.started_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
        worker:
          rh.worker_id && rh.worker_id.user_id ? rh.worker_id.user_id.name : "Worker",
        message: rh.repair_description,
        progress: rh.completed_at ? 100 : 65,
      }));

      return {
        id: c.complaint_code,
        mongoId: c._id,
        title: c.title,
        location: c.location,
        landmark: c.landmark || "",
        area: c.area || "",
        priority: displayPriority,
        status: displayStatus,
        progress,
        assignedWorkers: assignedWorkerNames,
        assignedDate: assignedDateFormatted,
        startedDate: startedDateFormatted,
        expectedDate: "24 Aug 2026",
        lastUpdate: latestRepair
          ? latestRepair.repair_description
          : complaintAssignments.length > 0
          ? "Assigned to maintenance crew."
          : "Pending worker assignment.",
        updatedBy:
          latestRepair && latestRepair.worker_id && latestRepair.worker_id.user_id
            ? latestRepair.worker_id.user_id.name
            : assignedWorkerNames[0] || "System",
        updatedAt: latestRepair && latestRepair.started_at
          ? new Date(latestRepair.started_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
        history: historyTimeline,
      };
    });

    if (status && status !== "All") {
      trackWorks = trackWorks.filter(
        (w) => w.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      trackWorks = trackWorks.filter(
        (w) =>
          w.id.toLowerCase().includes(q) ||
          w.title.toLowerCase().includes(q) ||
          w.location.toLowerCase().includes(q) ||
          w.assignedWorkers.some((worker) => worker.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: trackWorks.length,
      works: trackWorks,
    });
  } catch (error) {
    console.error("Error fetching work tracking data for manager:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching work tracking data.",
      error: error.message,
    });
  }
};

// ==========================================
// 4. VERIFY REPAIR WORK (MANAGER)
// ==========================================
const verifyRepairWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;

    let complaint;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(id);
    } else {
      complaint = await Complaint.findOne({ complaint_code: id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    complaint.status = "CLOSED";
    await complaint.save();

    await RepairHistory.updateMany(
      { complaint_id: complaint._id },
      {
        verified_by: req.user._id,
        verified_at: new Date(),
        remarks: verificationNotes || "Verified and signed off by Field Manager.",
      }
    );

    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: "RESOLVED",
      new_status: "CLOSED",
      changed_by: req.user._id,
      remarks: `Repair verified and signed off by Manager ${req.user.name}.`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaint_code} verified and closed successfully.`,
      status: "CLOSED",
    });
  } catch (error) {
    console.error("Error verifying repair work:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying repair work.",
      error: error.message,
    });
  }
};

module.exports = {
  startComplaintWork,
  submitWorkUpdate,
  getManagerWorkTracking,
  verifyRepairWork,
};
