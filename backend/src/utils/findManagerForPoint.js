const { Area } = require("../schemas");

const AREA_TYPES_BY_PRIORITY = [
  "WARD",
  "ZONE",
  "CITY",
  "CONSTITUENCY",
  "DISTRICT",
  "STATE",
];
const TAMIL_NADU_AREA_FILTER = {
  $or: [{ state: "Tamil Nadu" }, { state: { $exists: false } }],
};

const normalizeLocationName = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveManager = async (area) => {
  let managerId = area.manager_id || null;
  let parentId = area.parent_id;
  let hops = 0;

  while (!managerId && parentId && hops < 6) {
    const parent = await Area.findOne({
      _id: parentId,
      $or: [{ state: "Tamil Nadu" }, { state: { $exists: false } }],
    })
      .select("-boundary")
      .lean();
    if (!parent) break;
    managerId = parent.manager_id || null;
    parentId = parent.parent_id;
    hops += 1;
  }

  return managerId;
};

const findAreaByName = async (name, types) => {
  const normalizedName = normalizeLocationName(name);
  if (!normalizedName) return [];

  return Area.find({
    ...TAMIL_NADU_AREA_FILTER,
    type: { $in: types },
    active: true,
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
  })
    .select("-boundary")
    .sort({ name: 1 })
    .lean();
};

const belongsToArea = async (area, ancestorId) => {
  let parentId = area.parent_id;
  let hops = 0;

  while (parentId && hops < 6) {
    if (String(parentId) === String(ancestorId)) return true;
    const parent = await Area.findOne({
      _id: parentId,
      ...TAMIL_NADU_AREA_FILTER,
    })
      .select("parent_id")
      .lean();
    if (!parent) return false;
    parentId = parent.parent_id;
    hops += 1;
  }

  return false;
};

async function findManagerForPoint(lng, lat, { locality, city } = {}) {
  if (
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90
  ) {
    return null;
  }

  const point = {
    type: "Point",
    coordinates: [lng, lat],
  };

  let geographicArea = null;
  for (const type of AREA_TYPES_BY_PRIORITY) {
    geographicArea = await Area.findOne({
      ...TAMIL_NADU_AREA_FILTER,
      type,
      active: true,
      boundary: { $geoIntersects: { $geometry: point } },
    })
      .select("-boundary")
      .lean();

    if (geographicArea) break;
  }

  const cityAreas = await findAreaByName(city, ["CITY", "DISTRICT"]);
  const localityAreas = await findAreaByName(locality, ["WARD", "ZONE"]);
  let localityArea = null;
  if (cityAreas.length > 0) {
    for (const candidate of localityAreas) {
      if (await belongsToArea(candidate, cityAreas[0]._id)) {
        localityArea = candidate;
        break;
      }
    }
  }
  if (
    !localityArea &&
    localityAreas.length === 1 &&
    (!cityAreas.length || !localityAreas[0].parent_id)
  ) {
    localityArea = localityAreas[0];
  }

  const cityArea = cityAreas[0] || null;
  const matchedAreas = [localityArea, geographicArea, cityArea].filter(Boolean);

  let firstMatchedArea = null;
  const visited = new Set();
  for (const area of matchedAreas) {
    const areaId = String(area._id);
    if (visited.has(areaId)) continue;
    visited.add(areaId);
    firstMatchedArea ||= area;
    const managerId = await resolveManager(area);
    if (managerId) {
      return { area, manager_id: managerId };
    }
  }

  return firstMatchedArea
    ? { area: firstMatchedArea, manager_id: null }
    : null;
}

module.exports = { findManagerForPoint };
