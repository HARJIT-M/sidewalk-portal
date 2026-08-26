const mongoose = require("mongoose");

const complaintImageSchema = new mongoose.Schema(
  {
    complaint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
    },
    image_url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    image_type: {
      type: String,
      enum: ["BEFORE", "AFTER"],
      default: "BEFORE",
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploading user reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ComplaintImage", complaintImageSchema);
