const mongoose = require("mongoose");

const boundarySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Polygon", "MultiPolygon"],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Area name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["STATE", "DISTRICT", "CITY", "CONSTITUENCY", "ZONE", "WARD"],
      required: [true, "Area type is required"],
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      default: null,
    },
    boundary: { type: boundarySchema, default: undefined },
    state: {
      type: String,
      trim: true,
      default: "Tamil Nadu",
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    backup_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

areaSchema.index({ boundary: "2dsphere" });
areaSchema.index({ type: 1, parent_id: 1 });

module.exports = mongoose.model("Area", areaSchema);
