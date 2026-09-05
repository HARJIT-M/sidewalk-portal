const { Complaint, Assignment, RepairHistory, StatusHistory, Notification } = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");

// ==========================================
// 1. START REPAIR WORK (WORKER)
// ==========================================
const startRepair = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { description } = req.body;

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

    const worker = await getWorkerForUser(req.user._id);

    let assignment;
    if (worker) {
      assignment = await Assignment.findOne({
        complaint_id: complaint._id,
        worker_id: worker._id,
      });
    }

    if (!assignment) {
      assignment = await Assignment.findOne({ complaint_id: complaint._id });
    }

    if (assignment) {
      assignment.status = "IN_PROGRESS";
      assignment.started_at = new Date();
      await assignment.save();
    }

    const oldStatus = complaint.status;
    complaint.status = "IN_PROGRESS";
    await complaint.save();

    let repairHistory = await RepairHistory.findOne({
      complaint_id: complaint._id,
    });

    if (!repairHistory) {
      repairHistory = await RepairHistory.create({
        complaint_id: complaint._id,
        worker_id: worker ? worker._id : assignment?.worker_id || req.user._id,
        started_at: new Date(),
        repair_description: description || "Repair started on-site.",
        materials_used: [],
      });
    } else {
      repairHistory.started_at = repairHistory.started_at || new Date();
      if (description) repairHistory.repair_description = description;
      await repairHistory.save();
    }

    await StatusHistory.create({
      complaint_id: complaint._id,
      changed_by: req.user._id,
      old_status: oldStatus,
      new_status: "IN_PROGRESS",
      remarks: "Worker started on-site repair work.",
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Repair on Complaint #${complaint.complaint_code} started successfully.`,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      repairHistoryId: repairHistory._id,
    });
  } catch (error) {
    console.error("Error starting repair:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while starting repair.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. UPDATE REPAIR PROGRESS (WORKER)
// ==========================================
const updateRepairProgress = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { progress, notes, materialsUsed, repairCost, beforeImage, afterImage } = req.body;

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

    const worker = await getWorkerForUser(req.user._id);

    let repairHistory = await RepairHistory.findOne({
      complaint_id: complaint._id,
    });

    if (!repairHistory) {
      repairHistory = new RepairHistory({
        complaint_id: complaint._id,
        worker_id: worker ? worker._id : req.user._id,
        started_at: new Date(),
        repair_description: notes || "Repair in progress",
      });
    }

    if (notes) repairHistory.repair_description = notes;
    if (materialsUsed && Array.isArray(materialsUsed)) repairHistory.materials_used = materialsUsed;
    if (repairCost !== undefined) repairHistory.repair_cost = Number(repairCost);
    if (beforeImage) repairHistory.before_image = beforeImage;
    if (afterImage) repairHistory.after_image = afterImage;

    await repairHistory.save();

    await Assignment.updateMany(
      { complaint_id: complaint._id },
      { remarks: notes || `Progress updated to ${progress || 50}%` }
    );

    return res.status(200).json({
      success: true,
      message: `Repair progress updated for Complaint #${complaint.complaint_code}.`,
      progress: progress || 50,
      repairHistory,
    });
  } catch (error) {
    console.error("Error updating repair progress:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating repair progress.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. COMPLETE REPAIR WORK (WORKER)
// ==========================================
const completeRepair = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const {
      repairDescription,
      workDescription,
      materialsUsed,
      repairCost,
      remarks,
      afterImage,
      completionImage,
    } = req.body;

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

    const worker = await getWorkerForUser(req.user._id);
    const oldStatus = complaint.status;

    complaint.status = "RESOLVED";
    complaint.resolved_at = new Date();
    await complaint.save();

    await Assignment.updateMany(
      { complaint_id: complaint._id },
      {
        status: "COMPLETED",
        completed_at: new Date(),
        remarks: remarks || "Repair successfully completed on site.",
      }
    );

    let repairHistory = await RepairHistory.findOne({
      complaint_id: complaint._id,
    });

    if (!repairHistory) {
      repairHistory = new RepairHistory({
        complaint_id: complaint._id,
        worker_id: worker ? worker._id : req.user._id,
        started_at: new Date(),
      });
    }

    const desc = repairDescription || workDescription || "Repair completed and verified on-site.";
    const img = afterImage || completionImage || null;

    repairHistory.completed_at = new Date();
    repairHistory.repair_description = desc;
    if (materialsUsed) {
      repairHistory.materials_used = Array.isArray(materialsUsed)
        ? materialsUsed
        : materialsUsed.split(",").map((s) => s.trim());
    }
    if (repairCost !== undefined) repairHistory.repair_cost = Number(repairCost);
    if (remarks) repairHistory.remarks = remarks;
    if (img) repairHistory.after_image = img;

    await repairHistory.save();

    await StatusHistory.create({
      complaint_id: complaint._id,
      changed_by: req.user._id,
      old_status: oldStatus,
      new_status: "RESOLVED",
      remarks: remarks || `Repair completed by worker ${worker?.employee_code || ""}.`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Repair on Complaint #${complaint.complaint_code} marked as RESOLVED (100% complete).`,
      status: "RESOLVED",
      progress: 100,
      completedAt: new Date(),
      repairHistory,
    });
  } catch (error) {
    console.error("Error completing repair:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while completing repair.",
      error: error.message,
    });
  }
};

// ==========================================
// 4. VERIFY REPAIR WORK (MANAGER)
// ==========================================
const verifyRepairWork = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { verificationNotes } = req.body;

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

// ==========================================
// 5. GET REPAIR DETAILS & TIMELINE
// ==========================================
const getRepairDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;

    let complaint;
    if (complaintId.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(complaintId).populate("reported_by", "name phone email");
    } else {
      complaint = await Complaint.findOne({ complaint_code: complaintId }).populate("reported_by", "name phone email");
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const [assignments, repairHistory, statusHistories] = await Promise.all([
      Assignment.find({ complaint_id: complaint._id })
        .populate({
          path: "worker_id",
          populate: { path: "user_id", select: "name email phone" },
        })
        .populate("assigned_by", "name email"),
      RepairHistory.findOne({ complaint_id: complaint._id })
        .populate({
          path: "worker_id",
          populate: { path: "user_id", select: "name email phone" },
        })
        .populate("verified_by", "name email"),
      StatusHistory.find({ complaint_id: complaint._id })
        .populate("changed_by", "name role")
        .sort({ changed_at: -1 }),
    ]);

    const progress =
      complaint.status === "RESOLVED" || complaint.status === "CLOSED"
        ? 100
        : complaint.status === "IN_PROGRESS"
        ? 80
        : complaint.status === "ASSIGNED"
        ? 20
        : 0;

    return res.status(200).json({
      success: true,
      repairDetails: {
        complaint: {
          id: complaint.complaint_code,
          mongoId: complaint._id,
          title: complaint.title,
          description: complaint.description,
          issueType: complaint.issue_type,
          priority: complaint.priority,
          status: complaint.status,
          location: complaint.location,
          landmark: complaint.landmark,
          area: complaint.area,
          reportedAt: complaint.reported_at,
          reportedBy: complaint.reported_by?.name,
        },
        progress,
        assignments,
        repairHistory,
        timeline: statusHistories,
      },
    });
  } catch (error) {
    console.error("Error fetching repair details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching repair details.",
      error: error.message,
    });
  }
};

// ==========================================
// 6. GET ALL REPAIRS & WORK TRACKING (MANAGER)
// ==========================================
const getAllRepairs = async (req, res) => {
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
      repairs: trackWorks,
      works: trackWorks,
    });
  } catch (error) {
    console.error("Error fetching all repairs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching repairs list.",
      error: error.message,
    });
  }
};

module.exports = {
  startRepair,
  updateRepairProgress,
  completeRepair,
  verifyRepairWork,
  getRepairDetails,
  getAllRepairs,
};
