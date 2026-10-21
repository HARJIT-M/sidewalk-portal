const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaint_code: {
      type: String,
      required: [true, "Complaint code is required"],
      unique: true,
      trim: true,
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporting user is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    issue_type: {
      type: String,
      enum: [
        "BROKEN_FOOTPATH",
        "BROKEN_SIDEWALK",
        "POTHOLE",
        "CRACK",
        "MISSING_TILES",
        "DAMAGED_PAVEMENT",
        "OBSTRUCTION",
        "DRAINAGE_DAMAGE",
        "OTHER",
      ],
      required: [true, "Issue type is required"],
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"],
      default: "PENDING",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    geo_location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            Number.isFinite(coordinates[0]) &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            Number.isFinite(coordinates[1]) &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90,
          message: "Coordinates must be [longitude, latitude] within valid ranges.",
        },
      },
    },
    area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      default: null,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalated_at: {
      type: Date,
    },
    requires_admin_routing: {
      type: Boolean,
      default: false,
    },
    reported_at: {
      type: Date,
      default: Date.now,
    },
    resolved_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ geo_location: "2dsphere" });
complaintSchema.index({ manager_id: 1, status: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
