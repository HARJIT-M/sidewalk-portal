const { Complaint, Assignment, RepairHistory, StatusHistory, Notification, ComplaintImage } = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");
const cloudinary = require("../config/cloudinary");

// ==========================================
// HELPER: ROBUST COMPLAINT FINDER
// ==========================================
const findComplaint = async (complaintId) => {
  if (!complaintId) return null;
  const cleanId = String(complaintId).trim();
  let complaint = null;
  if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
    complaint = await Complaint.findById(cleanId);
  }
  if (!complaint) {
    complaint = await Complaint.findOne({ complaint_code: cleanId });
  }
  return complaint;
};

// ==========================================
// HELPER: CLOUDINARY IMAGE UPLOADER
// ==========================================
const uploadImageToCloudinary = async (imageInput, folder = "smart-footpath/repairs") => {
  if (!imageInput || typeof imageInput !== "string") return null;
  // If already an HTTP/HTTPS URL and not a data URI, keep it as is
  if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
    return imageInput;
  }
  // If it's a data URI or base64, upload to Cloudinary
  if (imageInput.startsWith("data:image/")) {
    try {
      const uploadResult = await cloudinary.uploader.upload(imageInput, {
        folder,
        resource_type: "image",
      });
      return uploadResult.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed for repair image:", err.message);
      // Fallback: return imageInput so data is not lost
      return imageInput;
    }
  }
  return imageInput;
};

// ==========================================
// 1. START REPAIR WORK (WORKER)
// ==========================================
const startRepair = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { description } = req.body || {};

    const complaint = await findComplaint(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    const assignment = await Assignment.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    });
    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this active repair.",
      });
    }

    if (assignment.status !== "IN_PROGRESS") {
      assignment.status = "IN_PROGRESS";
      assignment.started_at = assignment.started_at || new Date();
      await assignment.save();
    }

    const oldStatus = complaint.status;
    if (complaint.status !== "IN_PROGRESS") {
      complaint.status = "IN_PROGRESS";
      await complaint.save();
    }

    let repairHistory = await RepairHistory.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });

    if (!repairHistory) {
      repairHistory = await RepairHistory.create({
        complaint_id: complaint._id,
        worker_id: worker._id,
        assignment_id: assignment._id,
        started_at: assignment.started_at || new Date(),
        repair_description: description || "Repair started on-site.",
        materials_used: [],
      });
    } else {
      repairHistory.started_at = repairHistory.started_at || new Date();
      if (description) repairHistory.repair_description = description;
      repairHistory.worker_id = worker._id;
      repairHistory.assignment_id = assignment._id;
      await repairHistory.save();
    }

    if (oldStatus !== "IN_PROGRESS") {
      await StatusHistory.create({
        complaint_id: complaint._id,
        changed_by: req.user._id,
        old_status: oldStatus,
        new_status: "IN_PROGRESS",
        remarks: "Worker started on-site repair work.",
        changed_at: new Date(),
      });
    }

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
    const {
      progress,
      notes,
      workDescription,
      repairDescription,
      materialsUsed,
      repairCost,
      remarks,
      beforeImage,
      afterImage,
      completionImage,
    } = req.body;

    const complaint = await findComplaint(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    // Verify worker is assigned to this complaint
    const assignment = await Assignment.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });
    if (!assignment && req.user.role === "WORKER") {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this complaint.",
      });
    }

    // Update assignment to IN_PROGRESS if not already completed
    if (assignment && assignment.status !== "COMPLETED") {
      assignment.status = "IN_PROGRESS";
      assignment.started_at = assignment.started_at || new Date();
      assignment.remarks = notes || workDescription || `Progress updated to ${progress || 65}%`;
      await assignment.save();
    }

    // Update complaint status to IN_PROGRESS if currently ASSIGNED or PENDING
    const oldStatus = complaint.status;
    if (complaint.status === "ASSIGNED" || complaint.status === "PENDING") {
      complaint.status = "IN_PROGRESS";
      await complaint.save();

      await StatusHistory.create({
        complaint_id: complaint._id,
        changed_by: req.user._id,
        old_status: oldStatus,
        new_status: "IN_PROGRESS",
        remarks: notes || workDescription || "Worker updated repair progress on-site.",
        changed_at: new Date(),
      });
    }

    // Process completion/progress photo upload if provided
    const rawImage = afterImage || completionImage || null;
    let finalImageUrl = null;
    if (rawImage) {
      finalImageUrl = await uploadImageToCloudinary(rawImage);
    }

    // Sync with ComplaintImage document
    if (finalImageUrl) {
      await ComplaintImage.findOneAndUpdate(
        { complaint_id: complaint._id, image_type: "AFTER" },
        {
          image_url: finalImageUrl,
          image_type: "AFTER",
          uploaded_at: new Date(),
          uploaded_by: req.user._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Update RepairHistory
    let repairHistory = await RepairHistory.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });

    if (!repairHistory) {
      repairHistory = new RepairHistory({
        complaint_id: complaint._id,
        worker_id: worker._id,
        assignment_id: assignment ? assignment._id : null,
        started_at: new Date(),
        repair_description: notes || workDescription || repairDescription || "Repair in progress",
      });
    }

    const desc = notes || workDescription || repairDescription;
    if (desc) repairHistory.repair_description = desc;

    if (materialsUsed) {
      repairHistory.materials_used = Array.isArray(materialsUsed)
        ? materialsUsed
        : String(materialsUsed)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (repairCost !== undefined && !isNaN(Number(repairCost))) {
      repairHistory.repair_cost = Number(repairCost);
    }
    if (remarks) repairHistory.remarks = remarks;
    if (beforeImage) repairHistory.before_image = beforeImage;
    if (finalImageUrl) repairHistory.after_image = finalImageUrl;

    await repairHistory.save();

    return res.status(200).json({
      success: true,
      message: `Repair progress updated for Complaint #${complaint.complaint_code}.`,
      status: complaint.status,
      progress: progress || 65,
      completionImage: finalImageUrl || repairHistory.after_image || null,
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
      status: incomingRawStatus,
    } = req.body;

    const complaint = await findComplaint(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const incomingStatus = (incomingRawStatus || "").toUpperCase().trim();

    // If worker submits "In Progress", route to progress update
    if (incomingStatus === "IN PROGRESS" || incomingStatus === "IN_PROGRESS") {
      req.body.notes = workDescription || repairDescription || remarks;
      req.body.progress = 65;
      req.body.afterImage = afterImage || completionImage;
      return updateRepairProgress(req, res);
    }

    // If worker explicitly selects "Pending" or "Assigned", keep status and save progress notes
    if (incomingStatus === "PENDING" || incomingStatus === "ASSIGNED") {
      req.body.notes = workDescription || repairDescription || remarks || "Work pending/not yet started.";
      req.body.progress = 10;
      req.body.afterImage = afterImage || completionImage;
      return updateRepairProgress(req, res);
    }

    // Otherwise, this is a COMPLETION request (status: "Completed", "RESOLVED", or default)
    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    const assignment = await Assignment.findOne({
      complaint_id: complaint._id,
      worker_id: worker._id,
    });
    if (!assignment && req.user.role === "WORKER") {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this complaint.",
      });
    }

    // Process completion photo upload
    const rawImage = afterImage || completionImage || null;
    let finalImageUrl = null;
    if (rawImage) {
      finalImageUrl = await uploadImageToCloudinary(rawImage);
    }

    // Sync with ComplaintImage document
    if (finalImageUrl) {
      await ComplaintImage.findOneAndUpdate(
        { complaint_id: complaint._id, image_type: "AFTER" },
        {
          image_url: finalImageUrl,
          image_type: "AFTER",
          uploaded_at: new Date(),
          uploaded_by: req.user._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

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
      worker_id: worker._id,
    });

    if (!repairHistory) {
      repairHistory = new RepairHistory({
        complaint_id: complaint._id,
        worker_id: worker._id,
        assignment_id: assignment ? assignment._id : null,
        started_at: assignment?.started_at || new Date(),
      });
    }

    const desc = repairDescription || workDescription || "Repair completed and verified on-site.";
    repairHistory.completed_at = new Date();
    repairHistory.repair_description = desc;
    if (materialsUsed) {
      repairHistory.materials_used = Array.isArray(materialsUsed)
        ? materialsUsed
        : String(materialsUsed)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (repairCost !== undefined && !isNaN(Number(repairCost))) {
      repairHistory.repair_cost = Number(repairCost);
    }
    if (remarks) repairHistory.remarks = remarks;
    if (finalImageUrl) repairHistory.after_image = finalImageUrl;

    await repairHistory.save();

    if (oldStatus !== "RESOLVED") {
      await StatusHistory.create({
        complaint_id: complaint._id,
        changed_by: req.user._id,
        old_status: oldStatus,
        new_status: "RESOLVED",
        remarks: remarks || `Repair completed by worker ${worker?.employee_code || ""}.`,
        changed_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Repair on Complaint #${complaint.complaint_code} marked as RESOLVED (100% complete).`,
      status: "RESOLVED",
      progress: 100,
      completionImage: finalImageUrl || repairHistory.after_image || null,
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

    const complaint = await findComplaint(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    if (req.user.role === "MANAGER" && String(complaint.manager_id) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to verify complaints outside your jurisdiction.",
      });
    }

    complaint.status = "CLOSED";
    complaint.resolved_at = complaint.resolved_at || new Date();
    await complaint.save();

    await Assignment.updateMany(
      { complaint_id: complaint._id },
      { status: "COMPLETED" }
    );

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

    const complaint = await findComplaint(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    await complaint.populate([
      { path: "reported_by", select: "name phone email" },
      { path: "area_id", select: "name type" },
    ]);

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
          location: complaint.address || complaint.location || "",
          landmark: complaint.landmark || "",
          area: complaint.area_id?.name || complaint.locality || complaint.city || "",
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

    const complaintFilter = {};
    if (req.user.role === "MANAGER") {
      complaintFilter.manager_id = req.user._id;
    }

    const complaints = await Complaint.find(complaintFilter)
      .populate("reported_by", "name phone")
      .populate("area_id", "name type")
      .sort({ reported_at: -1 });

    const complaintIds = complaints.map((c) => c._id);

    const [allAssignments, allRepairs, allImages] = await Promise.all([
      Assignment.find({ complaint_id: { $in: complaintIds } }).populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name" },
      }),
      RepairHistory.find({ complaint_id: { $in: complaintIds } }).populate([
        {
          path: "worker_id",
          populate: { path: "user_id", select: "name" },
        },
        {
          path: "verified_by",
          select: "name",
        },
      ]),
      ComplaintImage.find({ complaint_id: { $in: complaintIds } }).sort({ uploaded_at: 1 }),
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

      const complaintImages = allImages.filter(
        (img) => img.complaint_id && img.complaint_id.toString() === c._id.toString()
      );
      const beforeImgDoc = complaintImages.find((img) => img.image_type === "BEFORE");
      const afterImgDoc = complaintImages.find((img) => img.image_type === "AFTER");

      const beforeImage = beforeImgDoc?.image_url || latestRepair?.before_image || c.image_url || null;
      const afterImage = afterImgDoc?.image_url || latestRepair?.after_image || null;

      let displayStatus = "Not Assigned";
      let progress = 0;
      if (c.status === "ASSIGNED") {
        displayStatus = "Assigned";
        progress = 25;
      } else if (c.status === "IN_PROGRESS") {
        displayStatus = "In Progress";
        progress = 65;
      } else if (c.status === "RESOLVED") {
        displayStatus = "Completed";
        progress = 100;
      } else if (c.status === "CLOSED") {
        displayStatus = "Closed";
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

      const expectedDateFormatted =
        complaintAssignments.length > 0 && complaintAssignments[0].scheduled_end_at
          ? new Date(complaintAssignments[0].scheduled_end_at).toLocaleDateString("en-GB", {
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
        location: c.address || c.location || "",
        landmark: c.landmark || "",
        area: c.area_id?.name || c.locality || c.city || "",
        priority: displayPriority,
        status: displayStatus,
        rawStatus: c.status,
        isClosed: c.status === "CLOSED",
        progress,
        assignedWorkers: assignedWorkerNames,
        assignedDate: assignedDateFormatted,
        startedDate: startedDateFormatted,
        expectedDate: expectedDateFormatted,
        beforeImage,
        afterImage,
        workDescription: latestRepair?.repair_description || "",
        materialsUsed: latestRepair?.materials_used || [],
        remarks: latestRepair?.remarks || "",
        verifiedBy: latestRepair?.verified_by ? latestRepair.verified_by.name : null,
        verifiedAt: latestRepair?.verified_at
          ? new Date(latestRepair.verified_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
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
      const target = status.toLowerCase();
      trackWorks = trackWorks.filter((w) => {
        if (target === "completed") {
          return (
            w.status.toLowerCase() === "completed" ||
            w.status.toLowerCase() === "closed" ||
            w.rawStatus === "RESOLVED" ||
            w.rawStatus === "CLOSED"
          );
        }
        return w.status.toLowerCase() === target;
      });
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      trackWorks = trackWorks.filter(
        (w) =>
          (w.id && w.id.toLowerCase().includes(q)) ||
          (w.title && w.title.toLowerCase().includes(q)) ||
          (w.location && w.location.toLowerCase().includes(q)) ||
          (w.assignedWorkers && w.assignedWorkers.some((worker) => worker && worker.toLowerCase().includes(q)))
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
