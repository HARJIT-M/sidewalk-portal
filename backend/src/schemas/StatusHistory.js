const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    complaint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
    },
    old_status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED", null],
      default: null,
    },
    new_status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"],
      required: [true, "New status is required"],
    },
    changed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Changed by user reference is required"],
    },
    remarks: {
      type: String,
      trim: true,
    },
    changed_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StatusHistory", statusHistorySchema);
