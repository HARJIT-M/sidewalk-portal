const { Worker } = require("../schemas");

// ==========================================
// 1. GET WORKER PROFILE HELPER
// ==========================================
const getWorkerForUser = async (userId) => {
  return Worker.findOne({ user_id: userId }).populate(
    "user_id",
    "name email phone role status"
  ).populate("manager_id", "name");
};

module.exports = {
  getWorkerForUser,
};
