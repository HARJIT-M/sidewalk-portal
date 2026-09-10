// Dashboard.jsx
import React from "react";
import "./new_dashboard.css";
import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  MapPin,
  RefreshCw,
  ArrowRight,
  Flag,
  TrendingUp,
} from "lucide-react";

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

  // Priority breakdown for insights panel
  const priorityCounts = ["High", "Medium", "Low"].map((level) => ({
    level,
    count: complaints.filter((c) => c.priority === level).length,
  }));

  const resolutionRate = Math.round(
    (resolvedComplaints / totalComplaints) * 100
  );

  return (
    <div className="worker-dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <span className="header-eyebrow">Manager Overview</span>
          <h1>Manager Dashboard</h1>
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
          <div className="stat-icon total">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div>
            <p>Total Complaints</p>
            <h2>{totalComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={22} strokeWidth={2} />
          </div>
          <div>
            <p>Pending</p>
            <h2>{pendingComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress">
            <Wrench size={22} strokeWidth={2} />
          </div>
          <div>
            <p>In Progress</p>
            <h2>{inProgressComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <p>Resolved</p>
            <h2>{resolvedComplaints}</h2>
          </div>
        </div>

      </div>

      {/* Main content: table + insights sidebar */}
      <div className="dashboard-main-grid">

        {/* Complaints Section */}
        <div className="complaints-section">

          <div className="section-header">
            <div>
              <h2>
                <ClipboardList size={17} strokeWidth={2} /> Assigned Complaints
              </h2>
              <p>View and manage complaints assigned to you</p>
            </div>

            <button className="refresh-btn">
              <RefreshCw size={14} strokeWidth={2.5} /> Refresh
            </button>
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
                        <MapPin size={12} strokeWidth={2} className="inline-icon" />
                        {complaint.location}
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
                        View <ArrowRight size={12} strokeWidth={2.5} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>

        {/* Insights Sidebar */}
        <div className="insights-sidebar">

          <div className="insight-card">

            <div className="insight-card-header">
              <TrendingUp size={16} strokeWidth={2} />
              Resolution Rate
            </div>

            <div className="resolution-ring-wrap">
              <svg width="110" height="110" viewBox="0 0 42 42" className="resolution-svg">
                <circle
                  cx="21" cy="21" r="15.91549430918954"
                  fill="transparent" stroke="#f0f0f6" strokeWidth="5"
                />
                <circle
                  cx="21" cy="21" r="15.91549430918954"
                  fill="transparent" stroke="#16a34a" strokeWidth="5"
                  strokeDasharray={`${resolutionRate} ${100 - resolutionRate}`}
                  strokeDashoffset="25"
                  transform="rotate(-90 21 21)"
                />
              </svg>
              <div className="resolution-ring-label">
                <strong>{resolutionRate}%</strong>
                <span>Resolved</span>
              </div>
            </div>

          </div>

          <div className="insight-card">

            <div className="insight-card-header">
              <Flag size={16} strokeWidth={2} />
              Priority Breakdown
            </div>

            <div className="priority-breakdown-list">
              {priorityCounts.map((p) => (
                <div className="priority-breakdown-row" key={p.level}>
                  <div className="priority-breakdown-top">
                    <span className={`priority ${p.level.toLowerCase()}`}>
                      {p.level}
                    </span>
                    <strong>{p.count}</strong>
                  </div>
                  <div className="priority-breakdown-track">
                    <div
                      className={`priority-breakdown-fill ${p.level.toLowerCase()}`}
                      style={{
                        width: `${(p.count / totalComplaints) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default WorkerDashboard;