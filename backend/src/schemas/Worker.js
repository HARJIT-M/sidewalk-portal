const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    employee_code: {
      type: String,
      required: [true, "Employee code is required"],
      unique: true,
      trim: true,
    },
    worker_role: {
      type: String,
      default: "Maintenance Worker",
      trim: true,
    },
    availability_status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_LEAVE"],
      default: "ACTIVE",
    },
    shift: {
      type: String,
      default: "Day Shift (08:00 AM - 05:00 PM)",
    },
    zone: {
      type: String,
      default: "Zone 2 - Gandhipuram Central",
    },
    emergency_contact: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    assigned_equipment: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    on_time_rate: {
      type: Number,
      default: 95,
    },
    joined_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Worker", workerSchema);
