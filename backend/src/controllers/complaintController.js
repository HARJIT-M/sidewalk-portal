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

    const assignments = await Assignment.find({ worker_id: worker._id })
      .populate({
        path: "complaint_id",
        populate: { path: "reported_by", select: "name phone" },
      })
      .sort({ assigned_at: -1 });

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
          location: c.location,
          landmark: c.landmark || "",
          area: c.area || "",
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
          reportedImage: c.image_url || null,
          reporterName: c.reported_by ? c.reported_by.name : "Citizen",
          estimatedHours: "4 Hours",
        };
      });

    if (status && status !== "All") {
      if (status === "Pending" || status === "ASSIGNED") {
        complaints = complaints.filter(
          (c) => c.status === "ASSIGNED" || c.status === "PENDING"
        );
      } else if (status === "In Progress" || status === "IN_PROGRESS") {
        complaints = complaints.filter((c) => c.status === "IN_PROGRESS");
      } else if (status === "Completed" || status === "RESOLVED") {
        complaints = complaints.filter(
          (c) =>
            c.status === "RESOLVED" ||
            c.status === "COMPLETED" ||
            c.status === "CLOSED"
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
          c.location.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q)
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
      complaint = await Complaint.findById(id).populate(
        "reported_by",
        "name phone email"
      );
    } else {
      complaint = await Complaint.findOne({ complaint_code: id }).populate(
        "reported_by",
        "name phone email"
      );
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint record not found.",
      });
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
      changedBy: sh.changed_by ? sh.changed_by.name : "System",
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
      afterImage: rh.after_image || null,
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
        location: complaint.location,
        landmark: complaint.landmark || "",
        area: complaint.area || "",
        latitude: complaint.latitude,
        longitude: complaint.longitude,
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
        workStartDate: assignments.length > 0 && assignments[0].started_at ? assignments[0].started_at : "",
        workEndDate: assignments.length > 0 && assignments[0].completed_at ? assignments[0].completed_at : "",
        reporterName: complaint.reported_by ? complaint.reported_by.name : "Citizen",
        reporterPhone: complaint.reported_by ? complaint.reported_by.phone : "",
        reportedImage: beforeImageDoc ? beforeImageDoc.image_url : complaint.image_url || null,
        image: beforeImageDoc ? beforeImageDoc.image_url : complaint.image_url || null,
        completionImage: afterImageDoc ? afterImageDoc.image_url : latestRepair ? latestRepair.after_image : null,
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

    const allComplaints = await Complaint.find()
      .populate("reported_by", "name phone email")
      .sort({ reported_at: -1 });

    const allAssignments = await Assignment.find().populate({
      path: "worker_id",
      populate: { path: "user_id", select: "name" },
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
        location: c.location,
        landmark: c.landmark || "",
        area: c.area || "",
        description: c.description,
        reportedBy: c.reported_by ? c.reported_by.name : "Citizen",
        date: formattedDate,
        priority: displayPriority,
        rawPriority: c.priority,
        status: displayStatus,
        rawStatus: c.status,
        image: c.image_url || null,
        assignedWorkers: assignedWorkerNames,
        workStartDate: complaintAssignments.length > 0 && complaintAssignments[0].started_at ? complaintAssignments[0].started_at : "",
        workEndDate: complaintAssignments.length > 0 && complaintAssignments[0].completed_at ? complaintAssignments[0].completed_at : "",
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
          c.location.toLowerCase().includes(q) ||
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
  try {
    const { id } = req.params;
    const { selectedWorkers, startDate, endDate, remarks } = req.body;

    if (!selectedWorkers || !Array.isArray(selectedWorkers) || selectedWorkers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one worker must be selected for assignment.",
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

    const workerDocs = [];
    for (const item of selectedWorkers) {
      let worker;
      if (typeof item === "string") {
        if (item.match(/^[0-9a-fA-F]{24}$/)) {
          worker = await Worker.findById(item);
        } else if (item.startsWith("WRK")) {
          worker = await Worker.findOne({ employee_code: item });
        } else {
          const userDoc = await User.findOne({ name: new RegExp(`^${item}$`, "i"), role: "WORKER" });
          if (userDoc) {
            worker = await Worker.findOne({ user_id: userDoc._id });
          }
        }
      } else if (typeof item === "object" && item !== null) {
        if (item.workerId) worker = await Worker.findById(item.workerId);
        else if (item.employeeCode) worker = await Worker.findOne({ employee_code: item.employeeCode });
      }

      if (worker) {
        workerDocs.push(worker);
      }
    }

    if (workerDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not resolve selected worker profiles.",
      });
    }

    for (const worker of workerDocs) {
      const existingAssignment = await Assignment.findOne({
        complaint_id: complaint._id,
        worker_id: worker._id,
      });

      if (!existingAssignment) {
        await Assignment.create({
          complaint_id: complaint._id,
          worker_id: worker._id,
          assigned_by: req.user._id,
          assigned_at: new Date(),
          started_at: startDate ? new Date(startDate) : new Date(),
          completed_at: endDate ? new Date(endDate) : null,
          status: "ASSIGNED",
          remarks: remarks || `Assigned by Field Manager ${req.user.name}`,
        });
      }

      await Notification.create({
        user_id: worker.user_id,
        complaint_id: complaint._id,
        type: "ASSIGNMENT",
        message: `Field Manager ${req.user.name} assigned you task ${complaint.complaint_code}: ${complaint.title}.`,
        is_read: false,
        created_at: new Date(),
      });
    }

    const oldStatus = complaint.status;
    if (complaint.status === "PENDING") {
      complaint.status = "ASSIGNED";
      await complaint.save();
    }

    const workerNamesStr = workerDocs.map((w) => w.employee_code).join(", ");
    await StatusHistory.create({
      complaint_id: complaint._id,
      old_status: oldStatus,
      new_status: "ASSIGNED",
      changed_by: req.user._id,
      remarks: `Assigned to worker(s) [${workerNamesStr}] by Manager ${req.user.name}.`,
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${workerDocs.length} worker(s) to complaint ${complaint.complaint_code}.`,
      assignedWorkers: workerDocs.map((w) => w.employee_code),
      status: "Assigned",
    });
  } catch (error) {
    console.error("Error assigning workers to complaint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while assigning workers.",
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
};
