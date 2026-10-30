const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  resolveArea,
  searchTamilNaduPlaces,
  getCityManagerMappings,
  updateCityManager,
  createCityManagerArea,
} = require("../controllers/areaController");

const router = express.Router();

router.use(protect);
router.get("/manager-mappings", authorize("ADMIN"), getCityManagerMappings);
router.get("/places", authorize("ADMIN"), searchTamilNaduPlaces);
router.post("/manager-mappings", authorize("ADMIN"), createCityManagerArea);
router.patch("/:id/manager", authorize("ADMIN"), updateCityManager);
router.get("/resolve", resolveArea);

module.exports = router;
