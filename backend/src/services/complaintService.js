const Complaint = require("../schemas/Complaint");

function generateCode() {
  return `CMP${Date.now().toString().slice(-6)}`;
}

async function createComplaint({ userId, title, description, issueType, location, latitude, longitude, priority }) {
  const complaint_code = generateCode();

  const complaint = new Complaint({
    complaint_code,
    reported_by: userId,
    title,
    description,
    issue_type: issueType || "OTHER",
    location,
    latitude,
    longitude,
    priority: priority || "MEDIUM",
  });

  await complaint.save();
  return complaint;
}

async function getComplaintById(id) {
  return Complaint.findById(id).populate("reported_by", "name email");
}

async function listComplaints(filter = {}) {
  return Complaint.find(filter).sort({ reported_at: -1 }).limit(100);
}

module.exports = { createComplaint, getComplaintById, listComplaints };
