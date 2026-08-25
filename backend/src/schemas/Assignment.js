const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
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
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned by user reference is required"],
    },
    assigned_at: {
      type: Date,
      default: Date.now,
    },
    started_at: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "ASSIGNED",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate assignment of the same worker to the same complaint
assignmentSchema.index({ complaint_id: 1, worker_id: 1 }, { unique: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
