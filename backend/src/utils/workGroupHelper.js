const mongoose = require("mongoose");
const { WorkGroup, Complaint, StatusHistory, Notification } = require("../schemas");

// Haversine distance calculation in meters
const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const toRad = (val) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Generate next sequential WorkGroupID (e.g., WG001, WG002...)
const generateWorkGroupId = async (session = null) => {
  const query = WorkGroup.find({}, { workGroupId: 1 }).sort({ createdAt: -1 }).limit(100);
  if (session) query.session(session);
  const recentGroups = await query.lean();

  let maxNum = 0;
  for (const wg of recentGroups) {
    if (wg.workGroupId && wg.workGroupId.startsWith("WG")) {
      const numPart = parseInt(wg.workGroupId.replace("WG", ""), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  // Also check total document count as baseline
  const totalCount = await WorkGroup.countDocuments();
  let candidateNum = Math.max(maxNum + 1, totalCount + 1);

  let candidateId = `WG${String(candidateNum).padStart(3, "0")}`;
  while (await WorkGroup.exists({ workGroupId: candidateId })) {
    candidateNum += 1;
    candidateId = `WG${String(candidateNum).padStart(3, "0")}`;
  }

  return candidateId;
};

// Find existing active maintenance WorkGroup within radius (default 100 meters)
const findActiveWorkGroupWithinRadius = async ({
  latitude,
  longitude,
  issueType,
  radiusMeters = 100,
  excludeComplaintId = null,
  managerId = null,
}) => {
  if (latitude == null || longitude == null) return null;

  // Active status filter: do NOT link to COMPLETED, RESOLVED, CLOSED, REJECTED
  const query = {
    status: { $in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
  };

  if (managerId) {
    query.$or = [{ manager_id: managerId }, { manager_id: null }];
  }

  const activeWorkGroups = await WorkGroup.find(query)
    .populate({
      path: "masterComplaintId",
      select: "complaint_code title description issue_type address latitude longitude geo_location status reported_by",
      populate: { path: "reported_by", select: "name phone" },
    })
    .populate({
      path: "assignedWorkers",
      populate: { path: "user_id", select: "name phone" },
    });

  let closestMatch = null;
  let minDistance = Infinity;

  for (const wg of activeWorkGroups) {
    // If excluding a specific complaint (e.g. self)
    if (excludeComplaintId && String(wg.masterComplaintId?._id) === String(excludeComplaintId)) {
      continue;
    }

    const wgLat = wg.latitude ?? wg.geo_location?.coordinates?.[1] ?? wg.masterComplaintId?.latitude;
    const wgLng = wg.longitude ?? wg.geo_location?.coordinates?.[0] ?? wg.masterComplaintId?.longitude;

    if (wgLat == null || wgLng == null) continue;

    const distance = haversineDistanceMeters(latitude, longitude, wgLat, wgLng);

    if (distance <= radiusMeters) {
      // Check damage similarity (issue_type match or compatible)
      const wgIssueType = wg.damageType || wg.masterComplaintId?.issue_type;
      const isSameDamageType = !wgIssueType || !issueType || wgIssueType === issueType;

      if (isSameDamageType && distance < minDistance) {
        minDistance = distance;
        closestMatch = {
          workGroup: wg,
          distanceMeters: distance,
        };
      }
    }
  }

  return closestMatch;
};

// Link a complaint to an existing WorkGroup
const linkComplaintToWorkGroup = async (complaint, workGroup, session = null) => {
  const masterId = workGroup.masterComplaintId?._id || workGroup.masterComplaintId;

  complaint.isDuplicate = true;
  complaint.masterComplaintId = masterId;
  complaint.workGroupId = workGroup._id;
  // Shared status: inherit current status of the WorkGroup
  complaint.status = workGroup.status;

  if (session) {
    await complaint.save({ session });
  } else {
    await complaint.save();
  }

  // Add complaint to linkedComplaints array in WorkGroup (prevent duplicates with $addToSet)
  const updateQuery = WorkGroup.findByIdAndUpdate(
    workGroup._id,
    { $addToSet: { linkedComplaints: complaint._id } },
    { new: true }
  );
  if (session) updateQuery.session(session);
  const updatedWorkGroup = await updateQuery;

  return { complaint, workGroup: updatedWorkGroup };
};

// Create a new WorkGroup for a master complaint
const createWorkGroupForComplaint = async (complaint, session = null) => {
  const workGroupId = await generateWorkGroupId(session);

  const workGroupData = {
    workGroupId,
    masterComplaintId: complaint._id,
    linkedComplaints: [complaint._id],
    assignedWorkers: [],
    status: complaint.status || "PENDING",
    damageType: complaint.issue_type,
    latitude: complaint.latitude ?? complaint.geo_location?.coordinates?.[1],
    longitude: complaint.longitude ?? complaint.geo_location?.coordinates?.[0],
    geo_location: complaint.geo_location || {
      type: "Point",
      coordinates: [
        complaint.longitude ?? complaint.geo_location?.coordinates?.[0] ?? 0,
        complaint.latitude ?? complaint.geo_location?.coordinates?.[1] ?? 0,
      ],
    },
    manager_id: complaint.manager_id || null,
  };

  let newWorkGroup;
  if (session) {
    const created = await WorkGroup.create([workGroupData], { session });
    newWorkGroup = created[0];
  } else {
    newWorkGroup = await WorkGroup.create(workGroupData);
  }

  complaint.isDuplicate = false;
  complaint.masterComplaintId = null;
  complaint.workGroupId = newWorkGroup._id;

  if (session) {
    await complaint.save({ session });
  } else {
    await complaint.save();
  }

  return newWorkGroup;
};

// Ensure a complaint has an associated WorkGroup (backfill on the fly for legacy complaints)
const ensureWorkGroupForComplaint = async (complaint) => {
  if (!complaint) return null;
  if (complaint.workGroupId) {
    const wg = await WorkGroup.findById(complaint.workGroupId)
      .populate("assignedWorkers")
      .populate("linkedComplaints");
    if (wg) return wg;
  }

  // If this complaint was already marked as a duplicate, find the master's workgroup
  if (complaint.masterComplaintId) {
    const masterWg = await WorkGroup.findOne({
      $or: [
        { masterComplaintId: complaint.masterComplaintId },
        { linkedComplaints: complaint.masterComplaintId },
      ],
    });
    if (masterWg) {
      complaint.workGroupId = masterWg._id;
      complaint.isDuplicate = true;
      await complaint.save();
      await WorkGroup.findByIdAndUpdate(masterWg._id, {
        $addToSet: { linkedComplaints: complaint._id },
      });
      return masterWg;
    }
  }

  // Otherwise, create a new WorkGroup for this complaint as master
  return await createWorkGroupForComplaint(complaint);
};

// Synchronize WorkGroup status across all linked complaints
const syncWorkGroupStatus = async ({
  workGroupId,
  newStatus,
  changedByUserId,
  remarks = "",
  workStartDate = null,
  workEndDate = null,
  session = null,
}) => {
  if (!workGroupId) return null;

  // Robust ID resolution (handles ObjectId, populated doc, or WG string code)
  const targetId = workGroupId?._id || workGroupId;
  let wg = null;
  if (mongoose.Types.ObjectId.isValid(targetId)) {
    wg = await WorkGroup.findById(targetId);
  }
  if (!wg && typeof targetId === "string") {
    wg = await WorkGroup.findOne({ workGroupId: targetId });
  }
  if (!wg) return null;

  const oldStatus = wg.status || "PENDING";
  wg.status = newStatus;

  if (workStartDate) wg.workStartDate = workStartDate;
  if (workEndDate) wg.workEndDate = workEndDate;

  if (newStatus === "IN_PROGRESS" && !wg.workStartDate) {
    wg.workStartDate = new Date();
  }
  if (["COMPLETED", "RESOLVED", "CLOSED"].includes(newStatus) && !wg.workEndDate) {
    wg.workEndDate = new Date();
  }

  if (session) {
    await wg.save({ session });
  } else {
    await wg.save();
  }

  // Determine standard Complaint status enum matching
  let complaintStatus = newStatus;
  if (newStatus === "COMPLETED") {
    complaintStatus = "RESOLVED";
  }

  // Synchronize all linked complaints
  const linkedIds = Array.isArray(wg.linkedComplaints) ? wg.linkedComplaints : [];
  if (linkedIds.length > 0) {
    const updatePayload = { status: complaintStatus };
    if (["RESOLVED", "CLOSED", "COMPLETED"].includes(newStatus)) {
      updatePayload.resolved_at = new Date();
    }

    if (session) {
      await Complaint.updateMany(
        { _id: { $in: linkedIds } },
        { $set: updatePayload }
      ).session(session);
    } else {
      await Complaint.updateMany(
        { _id: { $in: linkedIds } },
        { $set: updatePayload }
      );
    }

    // Record StatusHistory for each linked complaint
    const now = new Date();
    const historyEntries = linkedIds.map((cid) => ({
      complaint_id: cid,
      old_status: oldStatus,
      new_status: complaintStatus,
      changed_by: changedByUserId,
      remarks: remarks || `WorkGroup ${wg.workGroupId} status synchronized to ${newStatus}.`,
      changed_at: now,
    }));

    try {
      if (session) {
        await StatusHistory.create(historyEntries, { session });
      } else {
        await StatusHistory.create(historyEntries);
      }
    } catch (shErr) {
      console.warn("Could not record StatusHistory during syncWorkGroupStatus:", shErr.message);
    }

    // Notify citizens of the linked complaints
    try {
      const complaintsToNotify = await Complaint.find({ _id: { $in: linkedIds } }).select("reported_by complaint_code");
      const notifications = complaintsToNotify
        .filter((c) => c && c.reported_by)
        .map((c) => ({
          user_id: c.reported_by,
          complaint_id: c._id,
          type: "STATUS_CHANGE",
          message: `Your complaint ${c.complaint_code} (WorkGroup ${wg.workGroupId}) status updated to: ${complaintStatus}.`,
          is_read: false,
          created_at: now,
        }));

      if (notifications.length > 0) {
        if (session) {
          await Notification.create(notifications, { session });
        } else {
          await Notification.create(notifications);
        }
      }
    } catch (notifErr) {
      console.warn("Could not dispatch citizen notifications during syncWorkGroupStatus:", notifErr.message);
    }
  }

  return wg;
};

module.exports = {
  haversineDistanceMeters,
  generateWorkGroupId,
  findActiveWorkGroupWithinRadius,
  linkComplaintToWorkGroup,
  createWorkGroupForComplaint,
  ensureWorkGroupForComplaint,
  syncWorkGroupStatus,
};
