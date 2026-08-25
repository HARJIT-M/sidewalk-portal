const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      required: true,
    },

    area: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed"],
      default: "Pending",
    },

    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
    },

    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);