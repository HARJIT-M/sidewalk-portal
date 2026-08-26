const userService = require("../services/userService");

const getComplaints = async (req, res) => {
  try {
    const userId = req.user?.id;
    const complaints = await userService.getComplaintsForUser(userId);
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getComplaints };
