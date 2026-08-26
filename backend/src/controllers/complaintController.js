const complaintService = require("../services/complaintService");

async function createComplaint(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, issueType, location, latitude, longitude, priority } = req.body;
    const complaint = await complaintService.createComplaint({ userId, title, description, issueType, location, latitude, longitude, priority });
    res.status(201).json({ complaint });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getComplaintById(req, res) {
  try {
    const id = req.params.id;
    const complaint = await complaintService.getComplaintById(id);
    if (!complaint) return res.status(404).json({ error: "Not found" });
    res.json({ complaint });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listComplaints(req, res) {
  try {
    const complaints = await complaintService.listComplaints();
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createComplaint, getComplaintById, listComplaints };
