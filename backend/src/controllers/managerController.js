const { User, Worker, Complaint, Area } = require("../schemas");

const MANAGED_AREA_TYPES = ["DISTRICT", "CITY", "ZONE", "WARD"];

const hasForeignManagedOverlap = (candidate, areas, managerId) => {
  const areasById = new Map(areas.map((area) => [String(area._id), area]));
  let ancestor = candidate;

  while (ancestor) {
    if (
      ancestor.manager_id &&
      String(ancestor.manager_id) !== String(managerId)
    ) {
      return true;
    }
    ancestor = ancestor.parent_id
      ? areasById.get(String(ancestor.parent_id))
      : null;
  }

  return areas.some((area) => {
    if (
      !area.manager_id ||
      String(area.manager_id) === String(managerId)
    ) {
      return false;
    }

    let parent = area.parent_id
      ? areasById.get(String(area.parent_id))
      : null;
    while (parent) {
      if (String(parent._id) === String(candidate._id)) return true;
      parent = parent.parent_id
        ? areasById.get(String(parent.parent_id))
        : null;
    }
    return false;
  });
};

const getEligibleManagerAreas = async (managerId) => {
  const areas = await Area.find({ active: true })
    .select("_id name type state parent_id manager_id")
    .lean();
  const areasById = new Map(areas.map((area) => [String(area._id), area]));

  return areas
    .filter(
      (area) =>
        MANAGED_AREA_TYPES.includes(area.type) &&
        (!area.manager_id || String(area.manager_id) === String(managerId)) &&
        !hasForeignManagedOverlap(area, areas, managerId)
    )
    .map((area) => ({
      id: String(area._id),
      name: area.name,
      type: area.type,
      state: area.state || "Tamil Nadu",
      parent: area.parent_id
        ? areasById.get(String(area.parent_id))?.name || ""
        : "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// ==========================================
// 1. GET MANAGER PROFILE
// ==========================================
const getManagerProfile = async (req, res) => {
  try {
    const managerUser = await User.findById(req.user._id).select("-password");

    if (!managerUser) {
      return res.status(404).json({
        success: false,
        message: "Manager user record not found.",
      });
    }

    const [totalWorkers, totalComplaints, activeRepairs, managerArea, latestComplaint] = await Promise.all([
      Worker.countDocuments({
        manager_id: req.user._id,
        availability_status: "ACTIVE",
      }),
      Complaint.countDocuments({ manager_id: req.user._id }),
      Complaint.countDocuments({
        manager_id: req.user._id,
        status: "IN_PROGRESS",
      }),
      Area.findOne({ manager_id: req.user._id, active: true })
        .sort({ type: 1 })
        .select("_id name type"),
      Complaint.findOne({
        manager_id: req.user._id,
        city: { $exists: true, $ne: "" },
      })
        .sort({ reported_at: -1 })
        .select("city"),
    ]);

    return res.status(200).json({
      success: true,
      profile: {
        id: managerUser._id,
        name: managerUser.name,
        email: managerUser.email,
        phone: managerUser.phone || "",
        role: managerUser.role,
        status: managerUser.status,
        location: managerArea
          ? {
              id: String(managerArea._id),
              name: managerArea.name,
              type: managerArea.type,
            }
          : null,
        city:
          managerArea?.type === "CITY"
            ? managerArea.name
            : latestComplaint?.city || managerArea?.name || "",
        zone: managerArea?.type === "CITY" ? "" : managerArea?.name || "",
        stats: {
          activeWorkers: totalWorkers,
          totalComplaints,
          activeRepairs,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching manager profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching manager profile.",
      error: error.message,
    });
  }
};

const getManagerLocationOptions = async (req, res) => {
  try {
    const areas = await getEligibleManagerAreas(req.user._id);
    return res.status(200).json({ success: true, areas });
  } catch (error) {
    console.error("Error fetching manager location options:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load available service areas.",
    });
  }
};

const updateManagerLocation = async (req, res) => {
  const locationId = typeof req.body?.locationId === "string"
    ? req.body.locationId
    : "";
  if (!/^[0-9a-fA-F]{24}$/.test(locationId)) {
    return res.status(400).json({
      success: false,
      message: "Select a valid service area.",
    });
  }

  try {
    const eligibleAreas = await getEligibleManagerAreas(req.user._id);
    const selectedArea = eligibleAreas.find(
      (area) => area.id === locationId
    );
    if (!selectedArea) {
      return res.status(409).json({
        success: false,
        message:
          "That service area is unavailable or overlaps another manager's area. Refresh the list and try again.",
      });
    }

    const area = await Area.findOneAndUpdate(
      {
        _id: locationId,
        active: true,
        type: { $in: MANAGED_AREA_TYPES },
        $or: [
          { manager_id: null },
          { manager_id: { $exists: false } },
          { manager_id: req.user._id },
        ],
      },
      { $set: { manager_id: req.user._id } },
      { new: true, runValidators: true }
    ).select("_id name type");

    if (!area) {
      return res.status(409).json({
        success: false,
        message:
          "That service area was just assigned to another manager. Refresh and choose another area.",
      });
    }

    await Area.updateMany(
      {
        manager_id: req.user._id,
        _id: { $ne: area._id },
      },
      { $set: { manager_id: null } }
    );

    return res.status(200).json({
      success: true,
      message:
        "Service area updated. Existing complaints remain assigned to you; future complaints will use the new area.",
      location: {
        id: String(area._id),
        name: area.name,
        type: area.type,
      },
    });
  } catch (error) {
    console.error("Error updating manager service area:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update the service area.",
    });
  }
};

module.exports = {
  getManagerProfile,
  getManagerLocationOptions,
  updateManagerLocation,
};
