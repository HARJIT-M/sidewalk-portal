const { Area, User } = require("../schemas");
const mongoose = require("mongoose");
const { URL } = require("url");
const { findManagerForPoint } = require("../utils/findManagerForPoint");
const { isTamilNaduState } = require("../utils/isTamilNaduState");

const placeSearchCache = new Map();
let lastPlaceSearchAt = 0;
let placeSearchQueue = Promise.resolve();

const requestNominatim = (url) => {
  const request = placeSearchQueue.then(async () => {
    const delay = Math.max(0, lastPlaceSearchAt + 1000 - Date.now());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

    lastPlaceSearchAt = Date.now();
    return fetch(url, {
      headers: {
        "User-Agent": "SidewalkPortal/1.0 (Tamil Nadu service-area mapping)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
  });

  placeSearchQueue = request.then(
    () => undefined,
    () => undefined
  );
  return request;
};

const searchTamilNaduPlaces = async (req, res) => {
  const { query, parent, type } = req.query;
  const searchText = typeof query === "string" ? query.trim() : "";
  const parentName = typeof parent === "string" ? parent.trim() : "";
  const areaType = typeof type === "string" ? type.trim().toUpperCase() : "";

  if (
    searchText.length < 2 ||
    searchText.length > 100 ||
    !["DISTRICT", "CITY", "WARD", "ZONE"].includes(areaType)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter at least two characters and select a valid area level.",
    });
  }

  try {
    const searchQuery = [searchText, parentName, "Tamil Nadu", "India"]
      .filter(Boolean)
      .join(", ");
    const cacheKey = `${areaType}:${searchQuery.toLowerCase()}`;
    const cached = placeSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({ success: true, places: cached.places });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "in");
    url.searchParams.set("limit", "8");
    url.searchParams.set("q", searchQuery);
    const response = await requestNominatim(url);
    if (!response.ok) {
      throw new Error(`Place search service returned HTTP ${response.status}.`);
    }

    const results = await response.json();
    const places = results
      .map((result) => {
        const address = result.address || {};
        const name =
          areaType === "DISTRICT"
            ? address.state_district || address.county || address.district
            : areaType === "CITY"
              ? address.city || address.town || address.municipality
              : address.neighbourhood ||
                address.suburb ||
                address.village ||
                address.quarter;

        if (!name || isTamilNaduState(address.state) !== true) return null;
        const normalizeAdminName = (value) =>
          value.trim().replace(/\s+(district|city|municipality)$/i, "").toLowerCase();
        if (
          parentName &&
          [address.county, address.state_district]
            .filter(Boolean)
            .every((adminName) => normalizeAdminName(adminName) !== normalizeAdminName(parentName))
        ) {
          return null;
        }

        return {
          name,
          type: areaType,
          displayName: result.display_name,
          osmType: result.osm_type,
          osmId: result.osm_id,
        };
      })
      .filter(Boolean)
      .filter(
        (place, index, all) =>
          all.findIndex(
            (candidate) => candidate.name.toLowerCase() === place.name.toLowerCase()
          ) === index
      );

    placeSearchCache.set(cacheKey, {
      places,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    return res.status(200).json({ success: true, places });
  } catch (error) {
    console.error("Error searching Tamil Nadu places:", error);
    return res.status(503).json({
      success: false,
      message: "Place search is temporarily unavailable. Please try again shortly.",
    });
  }
};

const getCityManagerMappings = async (req, res) => {
  try {
    const areas = await Area.find({
      type: { $in: ["DISTRICT", "CITY", "ZONE", "WARD"] },
      active: true,
      $or: [{ state: "Tamil Nadu" }, { state: { $exists: false } }],
    })
      .select("_id name type state parent_id manager_id boundary.type")
      .populate("parent_id", "name type")
      .populate("manager_id", "name email")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      areas: areas.map((area) => ({
        id: area._id,
        name: area.name,
        type: area.type,
        state: area.state || "Tamil Nadu",
        hasBoundary: Boolean(area.boundary?.type),
        parent: area.parent_id?.name || null,
        manager: area.manager_id
          ? {
              id: area.manager_id._id,
              name: area.manager_id.name,
              email: area.manager_id.email,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching city manager mappings:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load city manager mappings.",
    });
  }
};

const createCityManagerArea = async (req, res) => {
  const { name, type, parent_id: parentId } = req.body;
  const normalizedName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const allowedTypes = ["DISTRICT", "CITY", "ZONE", "WARD"];

  if (!normalizedName || normalizedName.length > 100 || !allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "A name up to 100 characters and a valid area type are required.",
    });
  }
  if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
    return res.status(400).json({
      success: false,
      message: "Select a valid parent area.",
    });
  }

  try {
    if (parentId) {
      const parent = await Area.findOne({
        _id: parentId,
        active: true,
        type: { $in: ["DISTRICT", "CITY", "ZONE"] },
        $or: [{ state: "Tamil Nadu" }, { state: { $exists: false } }],
      }).select("_id");
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "The selected parent area is not active or valid.",
        });
      }
    }

    const existingAreas = await Area.find({
      type,
      active: true,
      parent_id: parentId || null,
    }).select("name");
    const alreadyExists = existingAreas.some(
      (area) => area.name.localeCompare(normalizedName, undefined, { sensitivity: "accent" }) === 0
    );
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "An active area with this name and parent already exists.",
      });
    }

    const area = await Area.create({
      name: normalizedName,
      type,
      parent_id: parentId || null,
      state: "Tamil Nadu",
      active: true,
    });

    return res.status(201).json({
      success: true,
      area: {
        id: area._id,
        name: area.name,
        type: area.type,
        state: area.state,
        parent: null,
        manager: null,
        hasBoundary: false,
      },
      message: "Tamil Nadu area created. Assign its manager to enable automatic complaint routing.",
    });
  } catch (error) {
    console.error("Error creating city manager area:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create this area.",
    });
  }
};

const updateCityManager = async (req, res) => {
  const { id } = req.params;
  const { manager_id: managerId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid area ID is required.",
    });
  }

  if (managerId !== null && !mongoose.Types.ObjectId.isValid(managerId)) {
    return res.status(400).json({
      success: false,
      message: "Select a valid manager or clear the city manager.",
    });
  }

  try {
    const area = await Area.findOne({
      _id: id,
      type: { $in: ["DISTRICT", "CITY", "ZONE", "WARD"] },
      active: true,
    });
    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Active service area not found.",
      });
    }

    if (managerId !== null) {
      const manager = await User.findOne({
        _id: managerId,
        role: "MANAGER",
        status: "ACTIVE",
      }).select("_id");
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: "The selected account is not an active manager.",
        });
      }
    }

    area.manager_id = managerId;
    await area.save();

    return res.status(200).json({
      success: true,
      message: managerId
        ? "Area manager assigned successfully."
        : "Area manager mapping cleared. Complaint routing will use its parent area's manager.",
    });
  } catch (error) {
    console.error("Error updating city manager:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update the city manager mapping.",
    });
  }
};

const resolveArea = async (req, res) => {
  const { lat, lng, locality, city, state } = req.query;
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    lat === undefined ||
    lng === undefined ||
    String(lat).trim() === "" ||
    String(lng).trim() === "" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid latitude and longitude are required.",
    });
  }

  if (isTamilNaduState(state) === false) {
    return res.status(422).json({
      success: false,
      message: "Complaints can currently be submitted only in Tamil Nadu.",
    });
  }

  if (isTamilNaduState(state) === null) {
    return res.status(200).json({
      success: true,
      requiresAdminRouting: true,
      stateUnconfirmed: true,
      message:
        "The state could not be confirmed from this location. Your complaint can still be submitted and will be queued for administrator routing.",
    });
  }

  try {
    const result = await findManagerForPoint(longitude, latitude, {
      locality,
      city,
    });
    if (!result) {
      return res.status(200).json({
        success: true,
        requiresAdminRouting: true,
        message: "No area manager is mapped to this location yet.",
      });
    }

    return res.status(200).json({
      success: true,
      requiresAdminRouting: !result.manager_id,
      state: "Tamil Nadu",
      locality: locality || null,
      city: city || null,
      area: {
        id: result.area._id,
        name: result.area.name,
        type: result.area.type,
      },
    });
  } catch (error) {
    console.error("Error resolving complaint area:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to resolve this location right now.",
    });
  }
};

module.exports = {
  resolveArea,
  searchTamilNaduPlaces,
  getCityManagerMappings,
  updateCityManager,
  createCityManagerArea,
};
