import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredComplaints,
  getStoredProfile,
  getStoredNotifications,
  saveStoredComplaints
} from "./workerData";
import "./WorkerDashboard.css";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dutyStatus, setDutyStatus] = useState("On Duty");

  useEffect(() => {
    const loadedComplaints = getStoredComplaints();
    const loadedProfile = getStoredProfile();
    const loadedNotifs = getStoredNotifications();
    setComplaints(loadedComplaints);
    setProfile(loadedProfile);
    setUnreadCount(loadedNotifs.filter((n) => !n.read).length);
  }, []);

  // Stats calculation
  const totalAssigned = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === "ASSIGNED" || c.status === "PENDING"
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "IN_PROGRESS"
  ).length;
  const completedCount = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "COMPLETED"
  ).length;

  // Active or top priority complaint
  const activeTask =
    complaints.find((c) => c.status === "IN_PROGRESS") ||
    complaints.find((c) => c.status === "ASSIGNED" && c.priority === "HIGH") ||
    complaints[0];

  const handleStartWork = (id) => {
    const updated = complaints.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: "IN_PROGRESS",
          statusHistory: [
            ...c.statusHistory,
            {
              status: "IN_PROGRESS",
              date: new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              note: `Work initiated on-site by ${profile?.name || "Worker"}.`,
            },
          ],
        };
      }
      return c;
    });
    setComplaints(updated);
    saveStoredComplaints(updated);
    navigate(`/worker/complaints/${id}`);
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "priority-high";
      case "MEDIUM":
        return "priority-medium";
      case "LOW":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "ASSIGNED":
        return { label: "Assigned (Pending)", className: "status-assigned" };
      case "IN_PROGRESS":
        return { label: "In Progress", className: "status-inprogress" };
      case "RESOLVED":
      case "COMPLETED":
        return { label: "Completed / Resolved", className: "status-resolved" };
      default:
        return { label: status, className: "status-default" };
    }
  };

  return (
    <div className="worker-dashboard-container">
      {/* =========================================
          WELCOME HERO BANNER
      ========================================= */}
      <div className="worker-hero-card">
        <div className="worker-hero-content">
          <div className="worker-badge-pill">
            <span className="live-dot"></span> FIELD WORKER PORTAL
          </div>
          <h1>
            Welcome back, {profile?.name || "Ravi Kumar"}! 👋
          </h1>
          <p>
            You have <strong>{pendingCount + inProgressCount} active repair tasks</strong> requiring your attention today.
          </p>

          <div className="worker-hero-meta">
            <span className="hero-meta-item">
              <strong>ID:</strong> {profile?.id || "WRK001"}
            </span>
            <span className="hero-meta-divider">•</span>
            <span className="hero-meta-item">
              <strong>Zone:</strong> {profile?.zone || "Zone 2 - Gandhipuram"}
            </span>
            <span className="hero-meta-divider">•</span>
            <span className="hero-meta-item">
              <strong>Shift:</strong> {profile?.shift || "08:00 AM - 05:00 PM"}
            </span>
          </div>
        </div>

        <div className="worker-hero-controls">
          <div className="status-toggle-wrapper">
            <label>Duty Status:</label>
            <select
              value={dutyStatus}
              onChange={(e) => setDutyStatus(e.target.value)}
              className={`duty-select ${dutyStatus.toLowerCase().replace(" ", "-")}`}
            >
              <option value="On Duty">🟢 On Duty</option>
              <option value="On Break">🟡 On Break</option>
              <option value="Off Duty">⚪ Off Duty</option>
            </select>
          </div>

          <button
            className="hero-action-btn"
            onClick={() => navigate("/worker/my-complaints")}
          >
            View All Tasks (📋 {totalAssigned})
          </button>
        </div>
      </div>

      {/* =========================================
          STATISTICS COUNTERS
      ========================================= */}
      <div className="worker-stats-grid">
        <div
          className="worker-stat-card card-total"
          onClick={() => navigate("/worker/my-complaints")}
        >
          <div className="stat-icon-box total">📋</div>
          <div className="stat-text-box">
            <span className="stat-label">Assigned Works</span>
            <strong className="stat-value">{totalAssigned}</strong>
            <span className="stat-subtext">Total tasks assigned</span>
          </div>
        </div>

        <div
          className="worker-stat-card card-pending"
          onClick={() => navigate("/worker/my-complaints?filter=ASSIGNED")}
        >
          <div className="stat-icon-box pending">⏳</div>
          <div className="stat-text-box">
            <span className="stat-label">Pending / Assigned</span>
            <strong className="stat-value">{pendingCount}</strong>
            <span className="stat-subtext">Ready to start</span>
          </div>
        </div>

        <div
          className="worker-stat-card card-progress"
          onClick={() => navigate("/worker/my-complaints?filter=IN_PROGRESS")}
        >
          <div className="stat-icon-box progress">⚙️</div>
          <div className="stat-text-box">
            <span className="stat-label">In Progress</span>
            <strong className="stat-value">{inProgressCount}</strong>
            <span className="stat-subtext">Active repairs</span>
          </div>
        </div>

        <div
          className="worker-stat-card card-completed"
          onClick={() => navigate("/worker/my-complaints?filter=RESOLVED")}
        >
          <div className="stat-icon-box completed">✅</div>
          <div className="stat-text-box">
            <span className="stat-label">Completed</span>
            <strong className="stat-value">{completedCount}</strong>
            <span className="stat-subtext">Awaiting verification</span>
          </div>
        </div>
      </div>

      {/* =========================================
          ACTIVE TASK SPOTLIGHT & QUICK TOOLS
      ========================================= */}
      <div className="worker-dashboard-row">
        {/* Active Task Spotlight */}
        {activeTask && (
          <div className="active-task-banner">
            <div className="active-task-header">
              <div className="active-task-tag">
                <span>⚡ CURRENT SPOTLIGHT TASK</span>
              </div>
              <span className={`priority-tag ${getPriorityClass(activeTask.priority)}`}>
                {activeTask.priority} PRIORITY
              </span>
            </div>

            <div className="active-task-body">
              <div className="active-task-main">
                <span className="active-task-id">{activeTask.id}</span>
                <h2>{activeTask.issue}</h2>
                <p className="active-task-location">
                  📍 {activeTask.location} {activeTask.landmark && `(${activeTask.landmark})`}
                </p>
                <p className="active-task-desc">{activeTask.description}</p>
              </div>

              <div className="active-task-actions">
                <div className="active-status-preview">
                  <span className="status-label">Current Status:</span>
                  <span className={`status-pill ${getStatusBadge(activeTask.status).className}`}>
                    {getStatusBadge(activeTask.status).label}
                  </span>
                </div>

                <div className="action-buttons-group">
                  {activeTask.status === "ASSIGNED" ? (
                    <button
                      className="btn-start-work"
                      onClick={() => handleStartWork(activeTask.id)}
                    >
                      🚀 Start Work Now
                    </button>
                  ) : (
                    <button
                      className="btn-update-work"
                      onClick={() => navigate(`/worker/complaints/${activeTask.id}`)}
                    >
                      🛠️ Update Work Details
                    </button>
                  )}
                  <button
                    className="btn-view-details"
                    onClick={() => navigate(`/worker/complaints/${activeTask.id}`)}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safety & Shift Checklist */}
        <div className="worker-side-card">
          <div className="side-card-header">
            <h3>🧰 Daily Field Checklist</h3>
            <span className="side-card-badge">Safety 1st</span>
          </div>
          <ul className="field-checklist">
            <li>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Wear High-Visibility Safety Vest</span>
              </label>
            </li>
            <li>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Place Barricade / Traffic Cones</span>
              </label>
            </li>
            <li>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Take "Before" photo on arrival</span>
              </label>
            </li>
            <li>
              <label>
                <input type="checkbox" />
                <span>Level and compact sub-base surface</span>
              </label>
            </li>
            <li>
              <label>
                <input type="checkbox" />
                <span>Take clear "After" photo & mark resolved</span>
              </label>
            </li>
          </ul>

          <div className="manager-contact-box">
            <span>Need Materials / Support?</span>
            <strong>Manager Harjit: 📞 98765-43200</strong>
          </div>
        </div>
      </div>

      {/* =========================================
          RECENT ASSIGNMENTS SECTION
      ========================================= */}
      <div className="recent-assignments-section">
        <div className="section-title-bar">
          <div>
            <h2>Recent Assigned Complaints</h2>
            <p>Direct assignments queue for maintenance & repairs</p>
          </div>
          <button
            className="btn-see-all"
            onClick={() => navigate("/worker/my-complaints")}
          >
            See All Complaints ({totalAssigned}) →
          </button>
        </div>

        <div className="assignments-table-container">
          <table className="worker-assignments-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Issue Details</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.slice(0, 5).map((complaint) => {
                const statusInfo = getStatusBadge(complaint.status);
                return (
                  <tr key={complaint.id}>
                    <td>
                      <span className="table-id-badge">{complaint.id}</span>
                    </td>
                    <td>
                      <div className="table-issue-cell">
                        <strong>{complaint.issue}</strong>
                        <span className="table-reporter">Rep: {complaint.reporterName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-location">📍 {complaint.location}</span>
                    </td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${statusInfo.className}`}>
                        <span className="status-dot"></span>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <span className="table-date">{complaint.assignedDate}</span>
                    </td>
                    <td>
                      <div className="table-action-cell">
                        {complaint.status === "ASSIGNED" ? (
                          <button
                            className="table-btn-start"
                            onClick={() => handleStartWork(complaint.id)}
                          >
                            Start Work
                          </button>
                        ) : (
                          <button
                            className="table-btn-view"
                            onClick={() => navigate(`/worker/complaints/${complaint.id}`)}
                          >
                            {complaint.status === "IN_PROGRESS" ? "Update" : "View"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
