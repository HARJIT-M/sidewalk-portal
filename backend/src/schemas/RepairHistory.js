const mongoose = require("mongoose");

const repairHistorySchema = new mongoose.Schema(
  {
    complaint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
    },
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker reference is required"],
    },
    started_at: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
    repair_description: {
      type: String,
      required: [true, "Repair description is required"],
      trim: true,
    },
    materials_used: {
      type: [String],
      default: [],
    },
    before_image: {
      type: String, // URL to image
      trim: true,
    },
    after_image: {
      type: String, // URL to image
      trim: true,
    },
    repair_cost: {
      type: Number,
      min: [0, "Repair cost cannot be negative"],
    },
    remarks: {
      type: String,
      trim: true,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verified_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RepairHistory", repairHistorySchema);
