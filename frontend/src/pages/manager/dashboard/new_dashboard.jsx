// Dashboard.jsx
import React from "react";
import "./new_dashboard.css";
import UserDashboard from "../../user/dashboard/userdashboard";

const WorkerDashboard = () => {
  // Temporary data
  const complaints = [
    {
      id: "CMP001",
      title: "Broken Footpath",
      location: "Gandhipuram, Coimbatore",
      date: "21 Aug 2026",
      priority: "High",
      status: "Pending",
    },
    {
      id: "CMP002",
      title: "Large Pothole",
      location: "RS Puram, Coimbatore",
      date: "20 Aug 2026",
      priority: "High",
      status: "In Progress",
    },
    {
      id: "CMP003",
      title: "Cracked Sidewalk",
      location: "Saibaba Colony, Coimbatore",
      date: "19 Aug 2026",
      priority: "Medium",
      status: "Resolved",
    },
    {
      id: "CMP004",
      title: "Damaged Pavement",
      location: "Peelamedu, Coimbatore",
      date: "18 Aug 2026",
      priority: "Low",
      status: "Pending",
    },
    {
      id: "CMP005",
      title: "Missing Footpath Tiles",
      location: "Singanallur, Coimbatore",
      date: "17 Aug 2026",
      priority: "Medium",
      status: "In Progress",
    },
  ];

  // Temporary dashboard counts
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "Pending"
  ).length;
  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;
  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  return (
    <div className="worker-dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Worker Dashboard</h1>
          <p>Manage and monitor assigned footpath complaints</p>
        </div>

        <div className="worker-info">
          <div className="worker-avatar">M</div>
          <div>
            <h3>Mohan Kumar</h3>
            <span>Coimbatore</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">

        <div className="stat-card">
          <div className="stat-icon total">📋</div>
          <div>
            <p>Total Complaints</p>
            <h2>{totalComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div>
            <p>Pending</p>
            <h2>{pendingComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress">🔧</div>
          <div>
            <p>In Progress</p>
            <h2>{inProgressComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">✓</div>
          <div>
            <p>Resolved</p>
            <h2>{resolvedComplaints}</h2>
          </div>
        </div>

      </div>

      {/* Complaints Section */}
      <div className="complaints-section">

        <div className="section-header">
          <div>
            <h2>Assigned Complaints</h2>
            <p>View and manage complaints assigned to you</p>
          </div>

          <button className="refresh-btn">↻ Refresh</button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="complaints-table">

            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Issue</th>
                <th>Location</th>
                <th>Reported Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {complaints.map((complaint) => (
                <tr key={complaint.id}>

                  <td>
                    <span className="complaint-id">
                      {complaint.id}
                    </span>
                  </td>

                  <td>
                    <span className="issue-title">
                      {complaint.title}
                    </span>
                  </td>

                  <td>
                    <span className="location">
                      📍 {complaint.location}
                    </span>
                  </td>

                  <td>{complaint.date}</td>

                  <td>
                    <span
                      className={`priority ${complaint.priority.toLowerCase()}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status ${complaint.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {complaint.status}
                    </span>
                  </td>

                  <td>
                    <button className="view-btn">
                      View
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
};

export default WorkerDashboard;