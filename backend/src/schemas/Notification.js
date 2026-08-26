const mongoose = require("mongoose");
const express = require("express");

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient user reference is required"],
    },
    complaint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["STATUS_CHANGE", "ASSIGNMENT", "REPAIR_COMPLETED", "SYSTEM", "OTHER"],
      default: "SYSTEM",
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
