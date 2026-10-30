const mongoose = require("mongoose");

const workGroupSchema = new mongoose.Schema(
  {
    workGroupId: {
      type: String,
      required: [true, "WorkGroup ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    masterComplaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Master complaint reference is required"],
      index: true,
    },
    linkedComplaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
      },
    ],
    assignedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "RESOLVED", "CLOSED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    workStartDate: {
      type: Date,
      default: null,
    },
    workEndDate: {
      type: Date,
      default: null,
    },
    damageType: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    geo_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
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

workGroupSchema.index({ geo_location: "2dsphere" });
workGroupSchema.index({ status: 1, manager_id: 1 });

module.exports = mongoose.model("WorkGroup", workGroupSchema);
