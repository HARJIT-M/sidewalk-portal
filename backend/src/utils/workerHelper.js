const { Worker } = require("../schemas");

// Helper: Get worker profile for the authenticated user ID
const getWorkerForUser = async (userId) => {
  return await Worker.findOne({ user_id: userId }).populate(
    "user_id",
    "name email phone role status"
  );
};

module.exports = {
  getWorkerForUser,
};
