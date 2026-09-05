const { Worker } = require("../schemas");

// ==========================================
// 1. GET WORKER PROFILE HELPER
// ==========================================
const getWorkerForUser = async (userId) => {
  let worker = await Worker.findOne({ user_id: userId }).populate(
    "user_id",
    "name email phone role status"
  );

  // If no direct worker profile matches the user (e.g. logged in as Manager previewing Worker view),
  // fallback to the primary active worker so Worker dashboards load properly
  if (!worker) {
    worker = await Worker.findOne({ availability_status: "ACTIVE" }).populate(
      "user_id",
      "name email phone role status"
    );
  }

  // Final fallback to any worker
  if (!worker) {
    worker = await Worker.findOne().populate(
      "user_id",
      "name email phone role status"
    );
  }

  return worker;
};

module.exports = {
  getWorkerForUser,
};
