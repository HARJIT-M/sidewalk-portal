const mongoose = require("mongoose");
const crypto = require("crypto");
const {
  Complaint,
  ComplaintImage,
  Assignment,
  StatusHistory,
  RepairHistory,
  Worker,
  Notification,
  User,
  WorkGroup,
} = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");
const { findManagerForPoint } = require("../utils/findManagerForPoint");
const { isTamilNaduState } = require("../utils/isTamilNaduState");
const {
  parseScheduleRange,
  getBusyAssignmentsFilter,
} = require("../utils/scheduleRange");
const cloudinary = require("../config/cloudinary");
const {
  haversineDistanceMeters,
  findActiveWorkGroupWithinRadius,
  linkComplaintToWorkGroup,
  createWorkGroupForComplaint,
  ensureWorkGroupForComplaint,
  syncWorkGroupStatus,
} = require("../utils/workGroupHelper");

// Helper to run operations in transaction if supported, or fallback to direct execution
const runSafeTransaction = async (work) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (
      err.message?.includes("Transaction numbers are only allowed") ||
      err.message?.includes("replica set member") ||
      err.message?.includes("standalone")
    ) {
      return await work(null);
    }
    throw err;
  } finally {
    if (session) await session.endSession();
  }
};

// ==========================================
// 1. GET ASSIGNED COMPLAINTS (WORKER)
// ==========================================
const getAssignedComplaints = async (req, res) => {
  try {
    const worker = await getWorkerForUser(req.user._id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker profile not found.",
      });
    }

    const { status, priority, search } = req.query;

    const assignments = await Assignment.find({
      worker_id: worker._id,
      status: { $ne: "CANCELLED" },
    })
      .populate({
        path: "complaint_id",
        populate: [
          { path: "reported_by", select: "name phone" },
          { path: "area_id", select: "name type" },
          { path: "workGroupId" },
        ],
      })
      .sort({ assigned_at: -1 });

    const complaintIds = assignments
      .filter((assignment) => assignment.complaint_id)
      .map((assignment) => assignment.complaint_id._id);
    const images = await ComplaintImage.find({
      complaint_id: { $in: complaintIds },
      image_type: "BEFORE",
    }).sort({ uploaded_at: 1 });
    const imageByComplaint = new Map();
    images.forEach((image) => {
      if (!imageByComplaint.has(String(image.complaint_id))) {
        imageByComplaint.set(String(image.complaint_id), image.image_url);
      }
    });

    let complaints = assignments
      .filter((a) => a.complaint_id)
      .map((a) => {
        const c = a.complaint_id;
        const wg = c.workGroupId;
        const linkedCount = wg?.linkedComplaints?.length || 1;
        const sharedStatus = wg?.status || c.status;

        return {
          id: c.complaint_code,
          mongoId: c._id,
          assignmentId: a._id,
          issue: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.priority,
          status: sharedStatus,
          rawStatus: sharedStatus,
          assignmentStatus: a.status,
          location: c.address || c.location || "",
          landmark: c.landmark || "",
          area: c.area_id?.name || c.area || c.locality || c.city || "",
          locality: c.locality || "",
          city: c.city || "",
          state: c.state || "",
          latitude: c.geo_location?.coordinates?.[1] ?? c.latitude ?? null,
          longitude: c.geo_location?.coordinates?.[0] ?? c.longitude ?? null,
          navigationUrl: (c.geo_location?.coordinates?.[1] && c.geo_location?.coordinates?.[0])
            ? `https://www.google.com/maps/dir/?api=1&destination=${c.geo_location.coordinates[1]},${c.geo_location.coordinates[0]}`
            : (c.latitude && c.longitude)
              ? `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`
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
          reportedImage: imageByComplaint.get(String(c._id)) || c.image_url || null,
          reporterName: c.reported_by ? c.reported_by.name : "Citizen",
          isDuplicate: c.isDuplicate || false,
          workGroupId: wg?.workGroupId || null,
          linkedReportsCount: linkedCount,
        };
      });

    if (status && status !== "All") {
      complaints = complaints.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (priority && priority !== "All") {
      complaints = complaints.filter(
        (c) => c.priority.toLowerCase() === priority.toLowerCase()
      );
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      complaints = complaints.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.issue.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          (c.workGroupId && c.workGroupId.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Error fetching worker assigned complaints:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching assigned complaints.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET COMPLAINT DETAILS (UNIFIED / WORKGROUP AWARE)
// ==========================================
const getComplaintDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let complaint;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(id)
        .populate("reported_by", "name phone email")
        .populate("area_id", "name type")
        .populate("masterComplaintId", "complaint_code title status reported_at")
        .populate("workGroupId");
    } else {
      complaint = await Complaint.findOne({ complaint_code: id })
        .populate("reported_by", "name phone email")
        .populate("area_id", "name type")
        .populate("masterComplaintId", "complaint_code title status reported_at")
        .populate("workGroupId");
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint record not found.",
      });
    }

    // Role-based authorization
    if (
      req.user.role === "MANAGER" &&
      String(complaint.manager_id) !== String(req.user._id)
    ) {
      return res.status(404).json({
        success: false,
        message: "Complaint record not found.",
      });
    }

    // Ensure WorkGroup exists
    let workGroup = complaint.workGroupId;
    if (!workGroup) {
      workGroup = await ensureWorkGroupForComplaint(complaint);
    } else if (typeof workGroup.populate === "function") {
      await workGroup.populate([
        {
          path: "assignedWorkers",
          populate: { path: "user_id", select: "name phone email" },
        },
        {
          path: "linkedComplaints",
          select: "complaint_code title description status reported_at address image_url reported_by isDuplicate",
          populate: { path: "reported_by", select: "name phone" },
        },
      ]);
    }

    // Master Complaint lookup ID for assignments
    const masterId = complaint.masterComplaintId?._id || complaint.masterComplaintId || complaint._id;
    const lookupIds = [complaint._id, masterId].filter(Boolean);

    if (req.user.role === "WORKER") {
      const worker = await getWorkerForUser(req.user._id);
      const isAssigned = worker
        ? await Assignment.exists({
            complaint_id: { $in: lookupIds },
            worker_id: worker._id,
          })
        : false;
      const isInWorkGroup =
        worker &&
        workGroup &&
        workGroup.assignedWorkers?.some(
          (w) => String(w._id || w) === String(worker._id)
        );

      if (!isAssigned && !isInWorkGroup) {
        return res.status(404).json({
          success: false,
          message: "Complaint record not found.",
        });
      }
    }

    // Shared assignments from master or complaint
    const assignments = await Assignment.find({ complaint_id: { $in: lookupIds } })
      .populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name phone email" },
      })
      .populate("assigned_by", "name email");

    const assignedWorkerNames = [
      ...new Set([
        ...assignments
          .map((a) => (a.worker_id && a.worker_id.user_id ? a.worker_id.user_id.name : null))
          .filter(Boolean),
        ...(workGroup?.assignedWorkers || [])
          .map((w) => (w.user_id ? w.user_id.name : null))
          .filter(Boolean),
      ]),
    ];

    const images = await ComplaintImage.find({
      complaint_id: complaint._id,
    }).sort({ uploaded_at: 1 });

    const statusHistories = await StatusHistory.find({
      complaint_id: complaint._id,
    })
      .populate("changed_by", "name role")
      .sort({ changed_at: 1 });

    const repairHistories = await RepairHistory.find({
      complaint_id: { $in: lookupIds },
    })
      .populate("worker_id", "employee_code")
      .populate("verified_by", "name")
      .sort({ started_at: 1 });

    const latestRepair = repairHistories[repairHistories.length - 1] || null;

    const formattedStatusHistory = statusHistories.map((sh) => ({
      status: sh.new_status,
      date: sh.changed_at
        ? new Date(sh.changed_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "",
      note: sh.remarks || `Status updated to ${sh.new_status}`,
      changedBy:
        req.user.role === "CITIZEN"
          ? "Service team"
          : sh.changed_by
            ? sh.changed_by.name
            : "System",
    }));

    const formattedRepairHistory = repairHistories.map((rh) => ({
      time: rh.started_at
        ? new Date(rh.started_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "",
      action: rh.repair_description,
      materials: rh.materials_used ? rh.materials_used.join(", ") : "",
      remarks: rh.remarks || "",
      repairCost: rh.repair_cost || null,
      verifiedBy: rh.verified_by ? rh.verified_by.name : null,
      verifiedAt: rh.verified_at || null,
    }));

    // Shared dates from WorkGroup or assignments
    const effectiveStatus = workGroup?.status || complaint.status;
    const scheduledStartAt = workGroup?.workStartDate || assignments[0]?.scheduled_start_at || null;
    const scheduledEndAt = workGroup?.workEndDate || assignments[0]?.scheduled_end_at || null;

    // Filter linked complaints for managers (never leak private info to citizens)
    let safeLinkedComplaints = [];
    if (["MANAGER", "ADMIN"].includes(req.user.role) && workGroup?.linkedComplaints) {
      safeLinkedComplaints = workGroup.linkedComplaints.map((lc) => ({
        id: lc.complaint_code,
        mongoId: lc._id,
        title: lc.title,
        description: lc.description,
        status: lc.status,
        reportedBy: lc.reported_by?.name || "Citizen",
        reportedPhone: lc.reported_by?.phone || "",
        reportedAt: lc.reported_at,
        address: lc.address,
        isMaster: String(lc._id) === String(workGroup.masterComplaintId?._id || workGroup.masterComplaintId),
      }));
    }

    const isDup = Boolean(complaint.isDuplicate);

    return res.status(200).json({
      success: true,
      complaint: {
        id: complaint.complaint_code,
        mongoId: complaint._id,
        title: complaint.title,
        issue: complaint.title,
        description: complaint.description,
        issueType: complaint.issue_type,
        priority: complaint.priority,
        status: effectiveStatus,
        rawStatus: effectiveStatus,
        location: complaint.address || complaint.location || "",
        landmark: complaint.landmark || "",
        area: complaint.area_id?.name || complaint.area || complaint.locality || complaint.city || "",
        locality: complaint.locality || "",
        city: complaint.city || "",
        state: complaint.state || "",
        latitude: complaint.geo_location?.coordinates?.[1] ?? complaint.latitude ?? null,
        longitude: complaint.geo_location?.coordinates?.[0] ?? complaint.longitude ?? null,
        navigationUrl: (complaint.geo_location?.coordinates?.[1] && complaint.geo_location?.coordinates?.[0])
          ? `https://www.google.com/maps/dir/?api=1&destination=${complaint.geo_location.coordinates[1]},${complaint.geo_location.coordinates[0]}`
          : (complaint.latitude && complaint.longitude)
            ? `https://www.google.com/maps/dir/?api=1&destination=${complaint.latitude},${complaint.longitude}`
            : null,
        scheduledStartAt,
        scheduledEndAt,
        reportedDate: complaint.reported_at
          ? new Date(complaint.reported_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "",
        assignedDate:
          assignments.length > 0 && assignments[0].assigned_at
            ? new Date(assignments[0].assigned_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : scheduledStartAt
            ? new Date(scheduledStartAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : "",
        assignedWorkers: assignedWorkerNames,
        workStartDate: scheduledStartAt || "",
        workEndDate: scheduledEndAt || "",
        reporterName: complaint.reported_by ? complaint.reported_by.name : "Citizen",
        reporterPhone: ["MANAGER", "ADMIN"].includes(req.user.role)
          ? complaint.reported_by?.phone || ""
          : "",
        // Duplicate & WorkGroup attributes
        isDuplicate: isDup,
        masterComplaintId: complaint.masterComplaintId?.complaint_code || complaint.masterComplaintId || null,
        workGroupId: workGroup?.workGroupId || null,
        sharedWorkStatus: effectiveStatus,
        linkedMessage: isDup
          ? "Your complaint has been linked to an existing maintenance activity at this location. Our maintenance team is already working on this issue."
          : null,
        workGroup: workGroup
          ? {
              workGroupId: workGroup.workGroupId,
              masterComplaintId: workGroup.masterComplaintId?.complaint_code || workGroup.masterComplaintId,
              status: workGroup.status,
              assignedWorkers: assignedWorkerNames,
              linkedComplaintsCount: workGroup.linkedComplaints?.length || 1,
              linkedComplaints: safeLinkedComplaints,
              workStartDate: workGroup.workStartDate,
              workEndDate: workGroup.workEndDate,
            }
          : null,
        images: images.map((image) => ({
          url: image.image_url,
          type: image.image_type,
          uploadedAt: image.uploaded_at
            ? new Date(image.uploaded_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : "",
        })),
        statusHistory: formattedStatusHistory,
        repairHistory: formattedRepairHistory,
      },
    });
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching complaint details.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET MANAGER COMPLAINTS LIST (WORKGROUP AWARE)
// ==========================================
const getManagerComplaints = async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    const allComplaints = await Complaint.find({ manager_id: req.user._id })
      .populate("reported_by", "name phone email")
      .populate("area_id", "name type")
      .populate({
        path: "workGroupId",
        populate: {
          path: "assignedWorkers",
          populate: { path: "user_id", select: "name" },
        },
      })
      .populate("masterComplaintId", "complaint_code")
      .sort({ reported_at: -1 });

    const complaintIds = allComplaints.map((complaint) => complaint._id);
    const [allAssignments, allImages] = await Promise.all([
      Assignment.find({
        status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
      }).populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name" },
      }),
      ComplaintImage.find({
        complaint_id: { $in: complaintIds },
        image_type: "BEFORE",
      }).sort({ uploaded_at: 1 }),
    ]);

    const imageByComplaint = new Map();
    allImages.forEach((image) => {
      if (!imageByComplaint.has(String(image.complaint_id))) {
        imageByComplaint.set(String(image.complaint_id), image.image_url);
      }
    });

    let formattedComplaints = allComplaints.map((c) => {
      const wg = c.workGroupId;
      const effectiveStatus = wg?.status || c.status;

      // Find assignments directly or through master complaint
      const masterId = c.masterComplaintId?._id || c.masterComplaintId || c._id;
      const complaintAssignments = allAssignments.filter(
        (a) =>
          a.complaint_id &&
          (a.complaint_id.toString() === c._id.toString() ||
            a.complaint_id.toString() === masterId.toString())
      );

      const assignedWorkerNames = [
        ...new Set([
          ...complaintAssignments
            .map((a) => (a.worker_id && a.worker_id.user_id ? a.worker_id.user_id.name : null))
            .filter(Boolean),
          ...(wg?.assignedWorkers || [])
            .map((w) => (w.user_id ? w.user_id.name : null))
            .filter(Boolean),
        ]),
      ];

      let displayStatus = "Not Assigned";
      if (effectiveStatus === "ASSIGNED") displayStatus = "Assigned";
      else if (effectiveStatus === "IN_PROGRESS") displayStatus = "In Progress";
      else if (["RESOLVED", "CLOSED", "COMPLETED"].includes(effectiveStatus)) displayStatus = "Completed";

      let displayPriority = "Medium";
      if (c.priority === "HIGH") displayPriority = "High";
      else if (c.priority === "LOW") displayPriority = "Low";
      else if (c.priority === "CRITICAL") displayPriority = "Critical";

      const formattedDate = c.reported_at
        ? new Date(c.reported_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "Recent";

      const startDate = wg?.workStartDate || complaintAssignments[0]?.scheduled_start_at || "";
      const endDate = wg?.workEndDate || complaintAssignments[0]?.scheduled_end_at || "";

      return {
        id: c.complaint_code,
        mongoId: c._id,
        title: c.title,
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
        description: c.description,
        reportedBy: c.reported_by ? c.reported_by.name : "Citizen",
        date: formattedDate,
        priority: displayPriority,
        rawPriority: c.priority,
        status: displayStatus,
        rawStatus: effectiveStatus,
        image: imageByComplaint.get(String(c._id)) || null,
        assignedWorkerIds: complaintAssignments.map((a) => String(a.worker_id?._id || "")).filter(Boolean),
        assignedWorkers: assignedWorkerNames,
        workStartDate: startDate,
        workEndDate: endDate,
        // WorkGroup fields
        isDuplicate: Boolean(c.isDuplicate),
        masterComplaintId: c.masterComplaintId?.complaint_code || c.masterComplaintId || null,
        workGroupId: wg?.workGroupId || null,
        workGroupMongoId: wg?._id || null,
        linkedCount: wg?.linkedComplaints?.length || 1,
        isWorkGroupAssigned: assignedWorkerNames.length > 0 || effectiveStatus !== "PENDING",
      };
    });

    if (status && status !== "All") {
      formattedComplaints = formattedComplaints.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (priority && priority !== "All") {
      formattedComplaints = formattedComplaints.filter(
        (c) => c.priority.toLowerCase() === priority.toLowerCase()
      );
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      formattedComplaints = formattedComplaints.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q) ||
          c.reportedBy.toLowerCase().includes(q) ||
          (c.workGroupId && c.workGroupId.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      complaints: formattedComplaints,
    });
  } catch (error) {
    console.error("Error fetching complaints for manager:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching manager complaints.",
      error: error.message,
    });
  }
};

// ==========================================
// 4. UPDATE COMPLAINT PRIORITY (MANAGER)
// ==========================================
const updateComplaintPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      return res.status(400).json({
        success: false,
        message: "Priority level is required.",
      });
    }

    let normalizedPriority = priority.toUpperCase();
    if (normalizedPriority === "NOT SET") normalizedPriority = "MEDIUM";

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

    if (
      req.user.role === "MANAGER" &&
      String(complaint.manager_id) !== String(req.user._id)
    ) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    complaint.priority = normalizedPriority;
    await complaint.save();

    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: complaint.status,
      new_status: complaint.status,
      changed_by: req.user._id,
      remarks: `Priority updated to ${normalizedPriority} by Manager ${req.user.name}.`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Priority for complaint ${complaint.complaint_code} updated to ${normalizedPriority}.`,
      priority: normalizedPriority,
    });
  } catch (error) {
    console.error("Error updating complaint priority:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating complaint priority.",
      error: error.message,
    });
  }
};

// ==========================================
// 5. ASSIGN WORKERS TO WORKGROUP (UNIFIED SINGLE SOURCE OF TRUTH)
// ==========================================
const assignComplaintWorkers = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      selectedWorkers = req.body.workerId ? [req.body.workerId] : [],
      startDate,
      endDate,
      remarks,
      linkedDuplicateIds = [],
    } = req.body;
    const schedule = parseScheduleRange(startDate, endDate);

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: "Valid startDate and endDate are required in YYYY-MM-DD format.",
      });
    }

    if (!selectedWorkers || !Array.isArray(selectedWorkers) || selectedWorkers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one worker must be selected for assignment.",
      });
    }

    const rawWorkerIds = selectedWorkers.map((selection) => {
      if (typeof selection === "string") return selection.trim();
      if (selection && typeof selection === "object") {
        return (selection.workerId || selection.id || selection._id || "").toString().trim();
      }
      return String(selection).trim();
    });

    const resolvedWorkerIds = [];
    for (const wid of rawWorkerIds) {
      if (mongoose.Types.ObjectId.isValid(wid)) {
        resolvedWorkerIds.push(wid);
      } else {
        const found = await Worker.findOne({ employee_code: wid });
        if (found) {
          resolvedWorkerIds.push(String(found._id));
        }
      }
    }

    const workerIds = [...new Set(resolvedWorkerIds)];

    if (
      workerIds.length === 0 ||
      workerIds.length !== rawWorkerIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Select valid, distinct worker profiles.",
      });
    }

    const result = await runSafeTransaction(async (session) => {
      const complaintQuery = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { complaint_code: id };
      const complaintQueryExec = Complaint.findOne(complaintQuery);
      if (session) complaintQueryExec.session(session);
      const complaint = await complaintQueryExec;

      if (!complaint) {
        const error = new Error("Complaint not found.");
        error.statusCode = 404;
        throw error;
      }

      const isAdmin = req.user.role === "ADMIN";
      if (!isAdmin && String(complaint.manager_id) !== String(req.user._id)) {
        const error = new Error("You may only assign complaints routed to you.");
        error.statusCode = 403;
        throw error;
      }

      const workerDocs = await Worker.find({
        _id: { $in: workerIds },
      }).populate("user_id", "name");
      if (workerDocs.length !== workerIds.length) {
        const error = new Error("One or more selected workers were not found.");
        error.statusCode = 404;
        throw error;
      }

      const inactiveWorker = workerDocs.some(
        (worker) => worker.availability_status !== "ACTIVE"
      );
      if (inactiveWorker) {
        const error = new Error("Only ACTIVE workers can be assigned.");
        error.statusCode = 400;
        throw error;
      }

      if (
        !isAdmin &&
        workerDocs.some(
          (worker) => String(worker.manager_id) !== String(req.user._id)
        )
      ) {
        const error = new Error("You may only assign your own workers.");
        error.statusCode = 403;
        throw error;
      }

      const busyFilterQuery = Assignment.find({
        worker_id: { $in: workerIds },
        ...getBusyAssignmentsFilter(schedule.start, schedule.end),
      });
      if (session) busyFilterQuery.session(session);
      const overlappingAssignments = await busyFilterQuery;

      if (overlappingAssignments.length > 0) {
        const error = new Error(
          "A selected worker is already assigned to work during those dates."
        );
        error.statusCode = 409;
        throw error;
      }

      // Ensure this complaint has an active WorkGroup
      let workGroup = await ensureWorkGroupForComplaint(complaint);

      // Handle any manually checked duplicate complaints to link into this WorkGroup
      let newlyLinkedCount = 0;
      if (Array.isArray(linkedDuplicateIds) && linkedDuplicateIds.length > 0) {
        const validIds = linkedDuplicateIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
        const dupCodes = linkedDuplicateIds.filter((id) => typeof id === "string" && !mongoose.Types.ObjectId.isValid(id));
        const orClauses = [];
        if (validIds.length > 0) orClauses.push({ _id: { $in: validIds } });
        if (dupCodes.length > 0) orClauses.push({ complaint_code: { $in: dupCodes } });

        if (orClauses.length > 0) {
          const dupFind = Complaint.find({
            _id: { $ne: complaint._id },
            $or: orClauses,
          });
          if (session) dupFind.session(session);
          const duplicateComplaints = await dupFind;

          for (const dup of duplicateComplaints) {
            dup.isDuplicate = true;
            dup.masterComplaintId = workGroup.masterComplaintId;
            dup.workGroupId = workGroup._id;
            dup.status = "ASSIGNED";
            if (session) await dup.save({ session });
            else await dup.save();

            if (!workGroup.linkedComplaints.some((cid) => String(cid) === String(dup._id))) {
              workGroup.linkedComplaints.push(dup._id);
            }
            newlyLinkedCount++;
          }
        }
      }

      const now = new Date();
      const oldStatus = workGroup.status;

      // Update the WorkGroup (single source of truth)
      workGroup.assignedWorkers = workerIds;
      workGroup.workStartDate = schedule.start;
      workGroup.workEndDate = schedule.end;
      workGroup.status = "ASSIGNED";
      if (session) await workGroup.save({ session });
      else await workGroup.save();

      // Update all complaints in this WorkGroup to ASSIGNED
      const allLinkedIds = workGroup.linkedComplaints || [complaint._id];
      const updateComplaintsQuery = Complaint.updateMany(
        { _id: { $in: allLinkedIds } },
        { $set: { status: "ASSIGNED" } }
      );
      if (session) updateComplaintsQuery.session(session);
      await updateComplaintsQuery;

      // Single Assignment records: create ONLY ONCE for the master complaint (NOT for each duplicate)
      const masterComplaintId = workGroup.masterComplaintId || complaint._id;
      const deleteOldAssignments = Assignment.deleteMany({
        complaint_id: masterComplaintId,
        status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
      });
      if (session) deleteOldAssignments.session(session);
      await deleteOldAssignments;

      const assignmentPayload = workerDocs.map((worker) => ({
        complaint_id: masterComplaintId,
        worker_id: worker._id,
        assigned_by: req.user._id,
        assigned_at: now,
        scheduled_start_at: schedule.start,
        scheduled_end_at: schedule.end,
        status: "ASSIGNED",
        remarks: remarks || `Assigned to WorkGroup ${workGroup.workGroupId} by ${req.user.name}`,
      }));

      if (session) {
        await Assignment.create(assignmentPayload, { session });
      } else {
        await Assignment.create(assignmentPayload);
      }

      // Record StatusHistory for all linked complaints
      const statusHistoryEntries = allLinkedIds.map((cid) => ({
        complaint_id: cid,
        old_status: oldStatus,
        new_status: "ASSIGNED",
        changed_by: req.user._id,
        remarks: `Assigned to worker(s) ${workerDocs.map((w) => w.employee_code).join(", ")} via WorkGroup ${workGroup.workGroupId}.`,
        changed_at: now,
      }));

      if (session) {
        await StatusHistory.create(statusHistoryEntries, { session });
      } else {
        await StatusHistory.create(statusHistoryEntries);
      }

      // Notify workers
      const workerNotifications = workerDocs.map((worker) => ({
        user_id: worker.user_id._id,
        complaint_id: masterComplaintId,
        type: "ASSIGNMENT",
        message: `${req.user.name} assigned you maintenance task in WorkGroup ${workGroup.workGroupId} (${allLinkedIds.length} citizen report(s)).`,
        is_read: false,
        created_at: now,
      }));

      if (session) {
        await Notification.create(workerNotifications, { session });
      } else {
        await Notification.create(workerNotifications);
      }

      return {
        complaintCode: complaint.complaint_code,
        workGroupId: workGroup.workGroupId,
        workerCodes: workerDocs.map((w) => w.employee_code),
        totalLinkedReports: allLinkedIds.length,
        newlyLinkedCount,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${result.workerCodes.length} worker(s) to WorkGroup ${result.workGroupId} (${result.totalLinkedReports} linked citizen report(s)).`,
      workGroupId: result.workGroupId,
      assignedWorkers: result.workerCodes,
      totalLinkedReports: result.totalLinkedReports,
      status: "Assigned",
    });
  } catch (error) {
    console.error("Error assigning workers to complaint:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to assign workers.",
    });
  }
};

// ==========================================
// 6. SUBMIT NEW COMPLAINT (CITIZEN - SMART AUTO-LINKING)
// ==========================================
const submitComplaint = async (req, res) => {
  const uploadedImages = [];
  try {
    const {
      title,
      description,
      issue_type: issueType,
      address,
      landmark,
      latitude: rawLatitude,
      longitude: rawLongitude,
      locality: rawLocality,
      city: rawCity,
      state: rawState,
    } = req.body;

    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);
    const locality = typeof rawLocality === "string" ? rawLocality.trim() : "";
    const city = typeof rawCity === "string" ? rawCity.trim() : "";
    const state = typeof rawState === "string" ? rawState.trim() : "";

    if (
      !title?.trim() ||
      !description?.trim() ||
      !issueType ||
      !address?.trim() ||
      rawLatitude === undefined ||
      rawLongitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, description, issue type, address, and valid coordinates are required.",
      });
    }

    if (isTamilNaduState(state) === false) {
      return res.status(422).json({
        success: false,
        message: "Complaints can currently be submitted only in Tamil Nadu.",
      });
    }
    const stateConfirmed = isTamilNaduState(state) === true;
    const resolved = stateConfirmed
      ? await findManagerForPoint(longitude, latitude, { locality, city })
      : null;

    for (const file of req.files || []) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "smart-footpath/complaints", resource_type: "image" },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );
        stream.end(file.buffer);
      });
      uploadedImages.push(result);
    }

    const complaintCode = `CMP-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    // Step 1: Create the new individual citizen complaint record
    const newComplaint = await Complaint.create({
      complaint_code: complaintCode,
      reported_by: req.user._id,
      title: title.trim(),
      description: description.trim(),
      issue_type: issueType,
      priority: "MEDIUM",
      status: "PENDING",
      address: address.trim(),
      locality: locality || undefined,
      city: city || undefined,
      state: stateConfirmed ? "Tamil Nadu" : undefined,
      landmark: landmark?.trim(),
      geo_location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      latitude,
      longitude,
      area_id: resolved?.area?._id || null,
      manager_id: resolved?.manager_id || null,
      requires_admin_routing: !resolved?.manager_id,
      isDuplicate: false,
      masterComplaintId: null,
      workGroupId: null,
    });

    if (uploadedImages.length > 0) {
      await ComplaintImage.create(
        uploadedImages.map((image) => ({
          complaint_id: newComplaint._id,
          image_url: image.secure_url,
          image_public_id: image.public_id,
          image_type: "BEFORE",
          uploaded_by: req.user._id,
        }))
      );
    }

    // Step 2: Smart Duplicate Detection & Active WorkGroup Linking (100m radius)
    const existingActiveMatch = await findActiveWorkGroupWithinRadius({
      latitude,
      longitude,
      issueType,
      radiusMeters: 100,
      managerId: resolved?.manager_id,
    });

    let workGroup;
    let isDuplicate = false;
    let masterComplaint = null;

    if (existingActiveMatch && existingActiveMatch.workGroup) {
      // MATCH FOUND: Auto-link to existing active maintenance WorkGroup
      const activeWorkGroup = existingActiveMatch.workGroup;
      isDuplicate = true;
      masterComplaint = activeWorkGroup.masterComplaintId;

      await linkComplaintToWorkGroup(newComplaint, activeWorkGroup);
      workGroup = activeWorkGroup;

      await StatusHistory.create({
        complaint_id: newComplaint._id,
        old_status: null,
        new_status: activeWorkGroup.status,
        changed_by: req.user._id,
        remarks: `Automatically linked to active WorkGroup ${activeWorkGroup.workGroupId} (Master: ${masterComplaint?.complaint_code || "Lead"}). Distance: ${existingActiveMatch.distanceMeters}m. Shared status: ${activeWorkGroup.status}.`,
        changed_at: new Date(),
      });
    } else {
      // NO ACTIVE MATCH: Create new WorkGroup for this complaint
      workGroup = await createWorkGroupForComplaint(newComplaint);

      await StatusHistory.create({
        complaint_id: newComplaint._id,
        old_status: null,
        new_status: "PENDING",
        changed_by: req.user._id,
        remarks: resolved?.manager_id
          ? `Complaint registered as lead issue in WorkGroup ${workGroup.workGroupId}.`
          : `Complaint queued for administrator routing (WorkGroup ${workGroup.workGroupId}).`,
        changed_at: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: isDuplicate
        ? `Your complaint has been submitted and linked to an existing active maintenance activity (${workGroup.workGroupId}) at this location. Our maintenance team is already working on this issue.`
        : resolved?.manager_id
        ? `Complaint submitted successfully. Your ID is ${complaintCode}.`
        : `Complaint submitted and queued for administrator routing. Your ID is ${complaintCode}.`,
      complaintId: complaintCode,
      complaint_code: complaintCode,
      isDuplicate,
      masterComplaintId: masterComplaint?.complaint_code || null,
      workGroupId: workGroup.workGroupId,
      status: workGroup.status,
      sharedStatus: workGroup.status,
      linkedMessage: isDuplicate
        ? "Your complaint has been linked to an existing maintenance activity at this location. Our maintenance team is already working on this issue."
        : null,
      area: resolved?.area ? { name: resolved.area.name } : null,
      locality: locality || null,
      city: city || null,
      state: stateConfirmed ? "Tamil Nadu" : null,
      requiresAdminRouting: !resolved?.manager_id,
    });
  } catch (error) {
    await Promise.all(
      uploadedImages.map((image) =>
        cloudinary.uploader.destroy(image.public_id).catch((cleanupError) => {
          console.error("Failed to clean up complaint image:", cleanupError);
        })
      )
    );
    console.error("Error creating complaint:", error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create complaint.",
    });
  }
};

// ==========================================
// 7. GET ADMIN ROUTING COMPLAINTS (ADMIN)
// ==========================================
const getAdminRoutingComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ requires_admin_routing: true })
      .populate("reported_by", "name email")
      .populate("area_id", "name type")
      .sort({ reported_at: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      complaints: complaints.map((complaint) => ({
        id: complaint._id,
        code: complaint.complaint_code,
        title: complaint.title,
        address: complaint.address,
        locality: complaint.locality || null,
        city: complaint.city || null,
        state: complaint.state || null,
        area: complaint.area_id?.name || complaint.locality || complaint.city || null,
        latitude: complaint.geo_location?.coordinates?.[1] ?? null,
        longitude: complaint.geo_location?.coordinates?.[0] ?? null,
        navigationUrl: complaint.geo_location?.coordinates
          ? `https://www.google.com/maps/dir/?api=1&destination=${complaint.geo_location.coordinates[1]},${complaint.geo_location.coordinates[0]}`
          : null,
        reportedBy: complaint.reported_by?.name || "Citizen",
        reportedAt: complaint.reported_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching complaints requiring admin routing:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch complaints requiring administrator routing.",
    });
  }
};

const routeComplaintToManager = async (req, res) => {
  const { manager_id: managerId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(managerId)) {
    return res.status(400).json({
      success: false,
      message: "A valid manager account is required.",
    });
  }

  try {
    const [complaint, manager] = await Promise.all([
      Complaint.findOne({
        _id: req.params.id,
        requires_admin_routing: true,
      }),
      User.findOne({
        _id: managerId,
        role: "MANAGER",
        status: "ACTIVE",
      }).select("_id"),
    ]);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint requiring routing was not found.",
      });
    }
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: "Select an active manager account.",
      });
    }

    complaint.manager_id = manager._id;
    complaint.requires_admin_routing = false;
    await complaint.save();

    // If complaint has a WorkGroup, update manager_id there too
    if (complaint.workGroupId) {
      await WorkGroup.findByIdAndUpdate(complaint.workGroupId, { manager_id: manager._id });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint routed to the selected manager.",
    });
  } catch (error) {
    console.error("Error routing complaint to manager:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to route this complaint.",
    });
  }
};

// ==========================================
// 8. DELETE COMPLAINT (EDGE-CASE SAFE)
// ==========================================
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (
      String(complaint.manager_id) !== String(req.user._id) &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // WorkGroup dissociation: ensure we do not break remaining linked complaints
    if (complaint.workGroupId) {
      const wg = await WorkGroup.findById(complaint.workGroupId);
      if (wg) {
        wg.linkedComplaints = wg.linkedComplaints.filter(
          (cid) => String(cid) !== String(complaint._id)
        );

        // If this was the master complaint, re-elect the first remaining complaint as master
        if (String(wg.masterComplaintId) === String(complaint._id)) {
          if (wg.linkedComplaints.length > 0) {
            const newMasterId = wg.linkedComplaints[0];
            wg.masterComplaintId = newMasterId;
            await Complaint.findByIdAndUpdate(newMasterId, {
              isDuplicate: false,
              masterComplaintId: null,
            });
            // Update remaining linked complaints to point to new master
            await Complaint.updateMany(
              { _id: { $in: wg.linkedComplaints.slice(1) } },
              { masterComplaintId: newMasterId }
            );
          } else {
            // No complaints left in this WorkGroup: remove it
            await WorkGroup.findByIdAndDelete(wg._id);
          }
        }
        if (wg.linkedComplaints.length > 0) {
          await wg.save();
        }
      }
    }

    const complaintImages = await ComplaintImage.find({
      complaint_id: complaint._id,
    });
    await Promise.all(
      complaintImages
        .filter((image) => image.image_public_id)
        .map((image) => cloudinary.uploader.destroy(image.image_public_id))
    );
    await ComplaintImage.deleteMany({ complaint_id: complaint._id });
    await Complaint.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting complaint",
      error: error.message,
    });
  }
};

// ==========================================
// 9. GET USER COMPLAINTS (CITIZEN - SYNCHRONIZED SHARED STATUS)
// ==========================================
const getUserComplaints = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = { reported_by: req.user._id };

    if (status && status !== "All") {
      const s = status.toUpperCase().replace(/\s+/g, "_");
      if (s === "COMPLETED" || s === "RESOLVED") {
        filter.status = { $in: ["RESOLVED", "CLOSED", "COMPLETED"] };
      } else if (s === "PENDING" || s === "NOT_ASSIGNED") {
        filter.status = { $in: ["PENDING", "ASSIGNED"] };
      } else {
        filter.status = s;
      }
    }

    const complaints = await Complaint.find(filter)
      .populate("area_id", "name type")
      .populate("workGroupId")
      .sort({ reported_at: -1 });

    const complaintIds = complaints.map((complaint) => complaint._id);
    const images = await ComplaintImage.find({
      complaint_id: { $in: complaintIds },
      image_type: "BEFORE",
    }).sort({ uploaded_at: 1 });
    const imageByComplaint = new Map();
    images.forEach((image) => {
      if (!imageByComplaint.has(String(image.complaint_id))) {
        imageByComplaint.set(String(image.complaint_id), image.image_url);
      }
    });

    const formattedComplaints = complaints.map((c) => {
      const wg = c.workGroupId;
      // Single source of truth: status is synchronized from WorkGroup
      const effectiveStatus = wg?.status || c.status;
      const isDup = Boolean(c.isDuplicate);

      return {
        id: c.complaint_code,
        mongoId: c._id,
        title: c.title,
        description: c.description,
        location: c.address,
        area: c.area_id?.name || c.locality || c.city || "",
        locality: c.locality || "",
        city: c.city || "",
        state: c.state || "",
        date: c.reported_at
          ? new Date(c.reported_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Recent",
        priority: c.priority,
        status: effectiveStatus,
        rawStatus: effectiveStatus,
        image: imageByComplaint.get(String(c._id)) || c.image_url || null,
        // Shared WorkGroup attributes
        isDuplicate: isDup,
        workGroupId: wg?.workGroupId || null,
        masterComplaintId: c.masterComplaintId || null,
        workStartDate: wg?.workStartDate || null,
        workEndDate: wg?.workEndDate || null,
        linkedMessage: isDup
          ? "Your complaint has been linked to an existing maintenance activity at this location. Our maintenance team is already working on this issue."
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      complaints: formattedComplaints,
    });
  } catch (error) {
    console.error("Error fetching user complaints:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching your complaints.",
      error: error.message,
    });
  }
};

// ==========================================
// 10. GET POTENTIAL DUPLICATES (GPS PROXIMITY)
// ==========================================
const getPotentialDuplicates = async (req, res) => {
  try {
    const { id } = req.params;
    const radius = Number(req.query.radius) || 100; // default 100 meters

    let complaint;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id).populate("workGroupId");
    } else {
      complaint = await Complaint.findOne({ complaint_code: id }).populate("workGroupId");
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const targetLat = complaint.geo_location?.coordinates?.[1] ?? complaint.latitude;
    const targetLng = complaint.geo_location?.coordinates?.[0] ?? complaint.longitude;

    if (targetLat == null || targetLng == null || isNaN(targetLat) || isNaN(targetLng)) {
      return res.status(200).json({
        success: true,
        count: 0,
        radiusMeters: radius,
        duplicates: [],
        message: "This complaint does not have GPS coordinates attached.",
      });
    }

    const query = {
      _id: { $ne: complaint._id },
      status: { $ne: "REJECTED" },
    };

    if (req.user.role === "MANAGER") {
      query.$or = [{ manager_id: req.user._id }, { manager_id: null }];
    }

    const otherComplaints = await Complaint.find(query)
      .populate("reported_by", "name phone email")
      .populate("workGroupId")
      .lean();

    const otherIds = otherComplaints.map((c) => c._id);
    const beforeImages = await ComplaintImage.find({
      complaint_id: { $in: otherIds },
      image_type: "BEFORE",
    }).sort({ uploaded_at: 1 }).lean();

    const imageMap = new Map();
    beforeImages.forEach((img) => {
      const cid = String(img.complaint_id);
      if (!imageMap.has(cid)) {
        imageMap.set(cid, img.image_url);
      }
    });

    const duplicates = [];

    for (const other of otherComplaints) {
      const otherLat = other.geo_location?.coordinates?.[1] ?? other.latitude;
      const otherLng = other.geo_location?.coordinates?.[0] ?? other.longitude;

      if (otherLat == null || otherLng == null || isNaN(otherLat) || isNaN(otherLng)) {
        continue;
      }

      const distance = haversineDistanceMeters(targetLat, targetLng, otherLat, otherLng);

      if (distance <= radius) {
        const isSameType = other.issue_type === complaint.issue_type;
        let matchConfidence = "High";
        if (distance <= 25 && isSameType) {
          matchConfidence = "Very High";
        } else if (distance <= 50) {
          matchConfidence = isSameType ? "High" : "Moderate";
        } else {
          matchConfidence = isSameType ? "Moderate" : "Low";
        }

        const otherWg = other.workGroupId;
        const isAlreadyInSameGroup = Boolean(
          complaint.workGroupId &&
          otherWg &&
          String(complaint.workGroupId?._id || complaint.workGroupId) === String(otherWg._id || otherWg)
        );

        duplicates.push({
          id: other.complaint_code,
          mongoId: other._id,
          title: other.title,
          description: other.description,
          issueType: other.issue_type,
          priority: other.priority,
          status: otherWg?.status || other.status,
          rawStatus: otherWg?.status || other.status,
          location: other.address || other.location || "",
          landmark: other.landmark || "",
          latitude: otherLat,
          longitude: otherLng,
          distanceMeters: distance,
          distanceFormatted: distance < 1000 ? `${distance}m away` : `${(distance / 1000).toFixed(2)}km away`,
          matchConfidence,
          sameIssueType: isSameType,
          reportedBy: other.reported_by?.name || "Citizen",
          reportedPhone: other.reported_by?.phone || "",
          reportedDate: other.reported_at
            ? new Date(other.reported_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
          image: imageMap.get(String(other._id)) || other.image_url || null,
          // WorkGroup duplicate attributes
          isDuplicate: Boolean(other.isDuplicate),
          workGroupId: otherWg?.workGroupId || null,
          masterComplaintId: other.masterComplaintId || null,
          isAlreadyInSameGroup,
        });
      }
    }

    duplicates.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return res.status(200).json({
      success: true,
      count: duplicates.length,
      radiusMeters: radius,
      leadComplaint: {
        id: complaint.complaint_code,
        title: complaint.title,
        issueType: complaint.issue_type,
        latitude: targetLat,
        longitude: targetLng,
        workGroupId: complaint.workGroupId?.workGroupId || null,
      },
      duplicates,
    });
  } catch (error) {
    console.error("Error finding duplicate complaints:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while finding duplicate complaints.",
      error: error.message,
    });
  }
};

// ==========================================
// 11. UPDATE WORKGROUP STATUS (MANAGER DIRECT UPDATE)
// ==========================================
const updateWorkGroupStatus = async (req, res) => {
  try {
    const { id } = req.params; // Can be workGroupId (e.g. WG001) or Complaint ID
    const { status: newStatus, remarks } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "New status is required.",
      });
    }

    let wg = null;
    if (id.startsWith("WG")) {
      wg = await WorkGroup.findOne({ workGroupId: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      wg = await WorkGroup.findById(id);
      if (!wg) {
        const c = await Complaint.findById(id);
        if (c?.workGroupId) wg = await WorkGroup.findById(c.workGroupId);
      }
    } else {
      const c = await Complaint.findOne({ complaint_code: id });
      if (c?.workGroupId) wg = await WorkGroup.findById(c.workGroupId);
    }

    if (!wg) {
      return res.status(404).json({
        success: false,
        message: "WorkGroup not found.",
      });
    }

    const updatedWg = await syncWorkGroupStatus({
      workGroupId: wg._id,
      newStatus,
      changedByUserId: req.user._id,
      remarks: remarks || `Manager updated status to ${newStatus}.`,
    });

    return res.status(200).json({
      success: true,
      message: `WorkGroup ${wg.workGroupId} and all linked complaints updated to ${newStatus}.`,
      workGroup: {
        workGroupId: updatedWg.workGroupId,
        status: updatedWg.status,
        linkedComplaintsCount: updatedWg.linkedComplaints?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error updating WorkGroup status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating WorkGroup status.",
      error: error.message,
    });
  }
};

// ==========================================
// 12. GET WORKGROUP DETAILS (MANAGER)
// ==========================================
const getWorkGroupDetails = async (req, res) => {
  try {
    const { id } = req.params; // WorkGroup code or ID

    let wg = null;
    if (id.startsWith("WG")) {
      wg = await WorkGroup.findOne({ workGroupId: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      wg = await WorkGroup.findById(id);
    }

    if (!wg) {
      return res.status(404).json({
        success: false,
        message: "WorkGroup not found.",
      });
    }

    await wg.populate([
      {
        path: "masterComplaintId",
        populate: [
          { path: "reported_by", select: "name phone email" },
          { path: "area_id", select: "name type" },
        ],
      },
      {
        path: "linkedComplaints",
        populate: [
          { path: "reported_by", select: "name phone email" },
          { path: "area_id", select: "name type" },
        ],
      },
      {
        path: "assignedWorkers",
        populate: { path: "user_id", select: "name phone email" },
      },
    ]);

    const linkedIds = (wg.linkedComplaints || []).map((c) => c._id);
    const images = await ComplaintImage.find({
      complaint_id: { $in: linkedIds },
      image_type: "BEFORE",
    });
    const imageMap = new Map();
    images.forEach((img) => imageMap.set(String(img.complaint_id), img.image_url));

    const formattedLinked = (wg.linkedComplaints || []).map((c) => ({
      id: c.complaint_code,
      mongoId: c._id,
      title: c.title,
      description: c.description,
      status: c.status,
      reportedBy: c.reported_by?.name || "Citizen",
      reportedPhone: c.reported_by?.phone || "",
      reportedEmail: c.reported_by?.email || "",
      reportedDate: c.reported_at
        ? new Date(c.reported_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      address: c.address,
      image: imageMap.get(String(c._id)) || c.image_url || null,
      isMaster: String(c._id) === String(wg.masterComplaintId?._id),
    }));

    return res.status(200).json({
      success: true,
      workGroup: {
        workGroupId: wg.workGroupId,
        mongoId: wg._id,
        status: wg.status,
        damageType: wg.damageType,
        workStartDate: wg.workStartDate,
        workEndDate: wg.workEndDate,
        assignedWorkers: (wg.assignedWorkers || []).map((w) => ({
          id: w._id,
          employeeCode: w.employee_code,
          name: w.user_id?.name || "Worker",
          phone: w.user_id?.phone || "",
        })),
        masterComplaint: {
          id: wg.masterComplaintId?.complaint_code,
          title: wg.masterComplaintId?.title,
          description: wg.masterComplaintId?.description,
          location: wg.masterComplaintId?.address,
        },
        linkedComplaintsCount: formattedLinked.length,
        linkedComplaints: formattedLinked,
      },
    });
  } catch (error) {
    console.error("Error fetching WorkGroup details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching WorkGroup details.",
      error: error.message,
    });
  }
};

// ==========================================
// 13. LINK COMPLAINT TO EXISTING WORKGROUP (MANAGER)
// ==========================================
const linkComplaintToWorkGroupHandler = async (req, res) => {
  try {
    const { id } = req.params; // Complaint to link
    const { targetWorkGroupId } = req.body; // WorkGroupID or MongoId

    if (!targetWorkGroupId) {
      return res.status(400).json({
        success: false,
        message: "targetWorkGroupId is required.",
      });
    }

    const complaint = mongoose.Types.ObjectId.isValid(id)
      ? await Complaint.findById(id)
      : await Complaint.findOne({ complaint_code: id });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    let wg = null;
    if (targetWorkGroupId.startsWith("WG")) {
      wg = await WorkGroup.findOne({ workGroupId: targetWorkGroupId });
    } else {
      wg = await WorkGroup.findById(targetWorkGroupId);
    }

    if (!wg) {
      return res.status(404).json({ success: false, message: "Target WorkGroup not found." });
    }

    await linkComplaintToWorkGroup(complaint, wg);

    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: complaint.status,
      new_status: wg.status,
      changed_by: req.user._id,
      remarks: `Manager manually linked complaint to WorkGroup ${wg.workGroupId}.`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaint_code} successfully linked to WorkGroup ${wg.workGroupId}.`,
      workGroupId: wg.workGroupId,
      status: wg.status,
    });
  } catch (error) {
    console.error("Error linking complaint to WorkGroup:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while linking complaint to WorkGroup.",
      error: error.message,
    });
  }
};

// ==========================================
// 14. UNLINK COMPLAINT FROM WORKGROUP (MANAGER)
// ==========================================
const unlinkComplaintFromWorkGroupHandler = async (req, res) => {
  try {
    const { id } = req.params; // Complaint to unlink

    const complaint = mongoose.Types.ObjectId.isValid(id)
      ? await Complaint.findById(id)
      : await Complaint.findOne({ complaint_code: id });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (!complaint.workGroupId) {
      return res.status(400).json({ success: false, message: "Complaint is not linked to any WorkGroup." });
    }

    const oldWg = await WorkGroup.findById(complaint.workGroupId);
    if (oldWg) {
      oldWg.linkedComplaints = oldWg.linkedComplaints.filter(
        (cid) => String(cid) !== String(complaint._id)
      );
      await oldWg.save();
    }

    // Create a new separate WorkGroup for this unlinked complaint
    const newWg = await createWorkGroupForComplaint(complaint);

    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: complaint.status,
      new_status: complaint.status,
      changed_by: req.user._id,
      remarks: `Manager unlinked complaint from WorkGroup ${oldWg?.workGroupId || ""}. Registered under new WorkGroup ${newWg.workGroupId}.`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaint_code} unlinked and assigned new WorkGroup ${newWg.workGroupId}.`,
      newWorkGroupId: newWg.workGroupId,
    });
  } catch (error) {
    console.error("Error unlinking complaint from WorkGroup:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while unlinking complaint from WorkGroup.",
      error: error.message,
    });
  }
};

module.exports = {
  getAssignedComplaints,
  getComplaintDetails,
  getManagerComplaints,
  updateComplaintPriority,
  assignComplaintWorkers,
  submitComplaint,
  getAdminRoutingComplaints,
  routeComplaintToManager,
  getUserComplaints,
  deleteComplaint,
  getPotentialDuplicates,
  updateWorkGroupStatus,
  getWorkGroupDetails,
  linkComplaintToWorkGroupHandler,
  unlinkComplaintFromWorkGroupHandler,
};
