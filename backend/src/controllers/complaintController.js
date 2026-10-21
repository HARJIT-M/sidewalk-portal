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
} = require("../schemas");
const { getWorkerForUser } = require("../utils/workerHelper");
const { findManagerForPoint } = require("../utils/findManagerForPoint");
const { isTamilNaduState } = require("../utils/isTamilNaduState");
const {
  parseScheduleRange,
  getBusyAssignmentsFilter,
} = require("../utils/scheduleRange");
const cloudinary = require("../config/cloudinary");

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
          estimatedHours: "4 Hours",
        };
      });

    if (status && status !== "All") {
      if (status === "Pending" || status === "ASSIGNED") {
        complaints = complaints.filter(
          (c) =>
            c.assignmentStatus === "ASSIGNED" ||
            c.status === "ASSIGNED" ||
            c.status === "PENDING"
        );
      } else if (status === "In Progress" || status === "IN_PROGRESS") {
        complaints = complaints.filter(
          (c) =>
            c.assignmentStatus === "IN_PROGRESS" ||
            c.status === "IN_PROGRESS"
        );
      } else if (status === "Completed" || status === "RESOLVED") {
        complaints = complaints.filter(
          (c) =>
            c.status === "RESOLVED" ||
            c.status === "COMPLETED" ||
            c.status === "CLOSED" ||
            c.assignmentStatus === "COMPLETED"
        );
      }
    }

    if (priority && priority !== "All") {
      complaints = complaints.filter(
        (c) => c.priority?.toLowerCase() === priority.toLowerCase()
      );
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      complaints = complaints.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.issue.toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q) ||
          (c.area || "").toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Error getting assigned complaints:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned complaints.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET SINGLE COMPLAINT DETAILS
// ==========================================
const getComplaintDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let complaint;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(id)
        .populate("reported_by", "name phone email")
        .populate("area_id", "name type");
    } else {
      complaint = await Complaint.findOne({ complaint_code: id })
        .populate("reported_by", "name phone email")
        .populate("area_id", "name type");
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint record not found.",
      });
    }

    if (
      req.user.role === "MANAGER" &&
      String(complaint.manager_id) !== String(req.user._id)
    ) {
      return res.status(404).json({
        success: false,
        message: "Complaint record not found.",
      });
    }

    if (req.user.role === "WORKER") {
      const worker = await getWorkerForUser(req.user._id);
      const isAssigned = worker
        ? await Assignment.exists({
            complaint_id: complaint._id,
            worker_id: worker._id,
          })
        : false;
      if (!isAssigned) {
        return res.status(404).json({
          success: false,
          message: "Complaint record not found.",
        });
      }
    }

    const assignments = await Assignment.find({ complaint_id: complaint._id })
      .populate({
        path: "worker_id",
        populate: { path: "user_id", select: "name phone email" },
      })
      .populate("assigned_by", "name email");

    const assignedWorkerNames = assignments
      .map((a) => (a.worker_id && a.worker_id.user_id ? a.worker_id.user_id.name : null))
      .filter(Boolean);

    const images = await ComplaintImage.find({
      complaint_id: complaint._id,
    }).sort({ uploaded_at: 1 });

    const beforeImageDoc = images.find((img) => img.image_type === "BEFORE");
    const afterImageDoc = images.find((img) => img.image_type === "AFTER");

    const statusHistories = await StatusHistory.find({
      complaint_id: complaint._id,
    })
      .populate("changed_by", "name role")
      .sort({ changed_at: 1 });

    const repairHistories = await RepairHistory.find({
      complaint_id: complaint._id,
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
        status: complaint.status,
        location: complaint.address,
        landmark: complaint.landmark || "",
        area: complaint.area_id?.name || complaint.locality || complaint.city || "",
        locality: complaint.locality || "",
        city: complaint.city || "",
        state: complaint.state || "",
        latitude: complaint.geo_location?.coordinates?.[1],
        longitude: complaint.geo_location?.coordinates?.[0],
        navigationUrl: complaint.geo_location?.coordinates
          ? `https://www.google.com/maps/dir/?api=1&destination=${complaint.geo_location.coordinates[1]},${complaint.geo_location.coordinates[0]}`
          : null,
        scheduledStartAt: assignments[0]?.scheduled_start_at || null,
        scheduledEndAt: assignments[0]?.scheduled_end_at || null,
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
            : "",
        assignedWorkers: assignedWorkerNames,
        workStartDate: assignments.length > 0 && assignments[0].scheduled_start_at ? assignments[0].scheduled_start_at : "",
        workEndDate: assignments.length > 0 && assignments[0].scheduled_end_at ? assignments[0].scheduled_end_at : "",
        reporterName: complaint.reported_by ? complaint.reported_by.name : "Citizen",
        reporterPhone: complaint.reported_by ? complaint.reported_by.phone : "",
        images: images.map((image) => ({
          id: image._id,
          url: image.image_url,
          type: image.image_type,
        })),
        reportedImage: beforeImageDoc ? beforeImageDoc.image_url : null,
        image: beforeImageDoc ? beforeImageDoc.image_url : null,
        completionImage: afterImageDoc ? afterImageDoc.image_url : null,
        workDescription: latestRepair ? latestRepair.repair_description : "",
        materialsUsed: latestRepair && latestRepair.materials_used ? latestRepair.materials_used.join(", ") : "",
        remarks: latestRepair ? latestRepair.remarks : "",
        statusHistory: formattedStatusHistory,
        repairHistory: formattedRepairHistory,
      },
    });
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint details.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET MANAGER COMPLAINTS LIST
// ==========================================
const getManagerComplaints = async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    const allComplaints = await Complaint.find({ manager_id: req.user._id })
      .populate("reported_by", "name phone email")
      .populate("area_id", "name type")
      .sort({ reported_at: -1 });

    const complaintIds = allComplaints.map((complaint) => complaint._id);
    const [allAssignments, allImages] = await Promise.all([
      Assignment.find({
        complaint_id: { $in: complaintIds },
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
      const complaintAssignments = allAssignments.filter(
        (a) => a.complaint_id && a.complaint_id.toString() === c._id.toString()
      );

      const assignedWorkerNames = complaintAssignments
        .map((a) => (a.worker_id && a.worker_id.user_id ? a.worker_id.user_id.name : null))
        .filter(Boolean);

      let displayStatus = "Not Assigned";
      if (c.status === "ASSIGNED") displayStatus = "Assigned";
      else if (c.status === "IN_PROGRESS") displayStatus = "In Progress";
      else if (c.status === "RESOLVED" || c.status === "CLOSED") displayStatus = "Completed";

      let displayPriority = "Not Set";
      if (c.priority === "HIGH") displayPriority = "High";
      else if (c.priority === "MEDIUM") displayPriority = "Medium";
      else if (c.priority === "LOW") displayPriority = "Low";
      else if (c.priority === "CRITICAL") displayPriority = "Critical";

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
        rawStatus: c.status,
        image: imageByComplaint.get(String(c._id)) || null,
        assignedWorkerIds: complaintAssignments.map((assignment) =>
          String(assignment.worker_id?._id || "")
        ).filter(Boolean),
        assignedWorkers: assignedWorkerNames,
        workStartDate: complaintAssignments.length > 0 && complaintAssignments[0].scheduled_start_at ? complaintAssignments[0].scheduled_start_at : "",
        workEndDate: complaintAssignments.length > 0 && complaintAssignments[0].scheduled_end_at ? complaintAssignments[0].scheduled_end_at : "",
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
          c.reportedBy.toLowerCase().includes(q)
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
// 5. ASSIGN WORKERS TO COMPLAINT (MANAGER)
// ==========================================
const assignComplaintWorkers = async (req, res) => {
  let session;
  try {
    const { id } = req.params;
    const {
      selectedWorkers = req.body.workerId ? [req.body.workerId] : [],
      startDate,
      endDate,
      remarks,
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

    const workerIds = selectedWorkers.map((selection) =>
      typeof selection === "string" ? selection : selection?.workerId
    );
    if (
      workerIds.some(
        (workerId) =>
          typeof workerId !== "string" ||
          !mongoose.Types.ObjectId.isValid(workerId)
      ) ||
      new Set(workerIds).size !== workerIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Select valid, distinct worker profiles.",
      });
    }

    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      const complaintQuery = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { complaint_code: id };
      const complaint = await Complaint.findOne(complaintQuery).session(session);
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

      const overlappingAssignments = await Assignment.find({
        worker_id: { $in: workerIds },
        ...getBusyAssignmentsFilter(schedule.start, schedule.end),
      }).session(session);
      if (overlappingAssignments.length > 0) {
        const error = new Error(
          "A selected worker is already assigned to work during those dates."
        );
        error.statusCode = 409;
        throw error;
      }

      const oldStatus = complaint.status;
      const now = new Date();
      await Assignment.create(
        workerDocs.map((worker) => ({
          complaint_id: complaint._id,
          worker_id: worker._id,
          assigned_by: req.user._id,
          assigned_at: now,
          scheduled_start_at: schedule.start,
          scheduled_end_at: schedule.end,
          status: "ASSIGNED",
          remarks: remarks || `Assigned by ${req.user.name}`,
        })),
        { session }
      );

      complaint.status = "ASSIGNED";
      await complaint.save({ session });

      await StatusHistory.create(
        [
          {
            complaint_id: complaint._id,
            old_status: oldStatus,
            new_status: "ASSIGNED",
            changed_by: req.user._id,
            remarks: `Assigned to worker(s) ${workerDocs
              .map((worker) => worker.employee_code)
              .join(", ")}.`,
            changed_at: now,
          },
        ],
        { session }
      );

      await Notification.create(
        workerDocs.map((worker) => ({
          user_id: worker.user_id._id,
          complaint_id: complaint._id,
          type: "ASSIGNMENT",
          message: `${req.user.name} assigned you task ${complaint.complaint_code}: ${complaint.title}.`,
          is_read: false,
          created_at: now,
        })),
        { session }
      );

      result = {
        complaintCode: complaint.complaint_code,
        workerCodes: workerDocs.map((worker) => worker.employee_code),
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${result.workerCodes.length} worker(s) to complaint ${result.complaintCode}.`,
      assignedWorkers: result.workerCodes,
      status: "Assigned",
    });
  } catch (error) {
    console.error("Error assigning workers to complaint:", error);
    const statusCode =
      error.statusCode || (error.code === 11000 ? 409 : 500);
    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Server error while assigning workers."
          : error.message,
    });
  } finally {
    if (session) await session.endSession();
  }
};

// ==========================================
// 6. SUBMIT NEW COMPLAINT (USER)
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
        message:
          "Title, description, issue type, address, and valid coordinates are required.",
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
      area_id: resolved?.area?._id || null,
      manager_id: resolved?.manager_id || null,
      requires_admin_routing: !resolved?.manager_id,
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

    await StatusHistory.create({
      complaint_id: newComplaint._id,
      old_status: null,
      new_status: "PENDING",
      changed_by: req.user._id,
      remarks: resolved?.manager_id
        ? "Complaint submitted by citizen."
        : "Complaint queued for administrator routing.",
      changed_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: resolved?.manager_id
        ? `Complaint submitted successfully. Your ID is ${complaintCode}.`
        : `Complaint submitted and queued for administrator routing. Your ID is ${complaintCode}.`,
      complaintId: complaintCode,
      complaint_code: complaintCode,
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
// 7. DELETE COMPLAINT (MANAGER)
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
// 7. GET USER COMPLAINTS (USER)
// ==========================================
const getUserComplaints = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = { reported_by: req.user._id };

    if (status && status !== "All") {
      filter.status = status.toUpperCase();
    }

    const complaints = await Complaint.find(filter)
      .populate("area_id", "name type")
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

    const formattedComplaints = complaints.map(c => ({
      id: c.complaint_code,
      mongoId: c._id,
      title: c.title,
      location: c.address,
      area: c.area_id?.name || c.locality || c.city || "",
      locality: c.locality || "",
      city: c.city || "",
      state: c.state || "",
      date: c.reported_at ? new Date(c.reported_at).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
      }) : "Recent",
      priority: c.priority,
      status: c.status,
      image: imageByComplaint.get(String(c._id)) || null,
    }));

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
};
