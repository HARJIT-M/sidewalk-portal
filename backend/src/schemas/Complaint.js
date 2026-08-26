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
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
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

module.exports = mongoose.model("Complaint", complaintSchema);
