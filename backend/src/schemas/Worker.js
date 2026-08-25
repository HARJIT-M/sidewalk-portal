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
