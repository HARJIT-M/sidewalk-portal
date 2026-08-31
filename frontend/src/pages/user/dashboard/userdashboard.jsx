import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CircleDot,
  RefreshCw,
  CheckCircle2,
  Plus,
  MapPin,
  Calendar,
} from "lucide-react";
import "./userdashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();

  // Temporary sample data
  const complaints = [
    {
      id: "CMP001",
      issue: "Broken Footpath",
      location: "Gandhi Road",
      date: "22 Aug 2026",
      status: "In Progress",
      priority: "High",
    },
    {
      id: "CMP002",
      issue: "Footpath Crack",
      location: "Main Street",
      date: "20 Aug 2026",
      status: "Not Assigned",
      priority: "Not Set",
    },
    {
      id: "CMP003",
      issue: "Damaged Sidewalk",
      location: "Bus Stand Road",
      date: "15 Aug 2026",
      status: "Completed",
      priority: "Medium",
    },
  ];

  // Statistics
  const totalComplaints = complaints.length;

  const notAssigned = complaints.filter(
    (complaint) => complaint.status === "Not Assigned"
  ).length;

  const inProgress = complaints.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;

  const completed = complaints.filter(
    (complaint) => complaint.status === "Completed"
  ).length;

  const badgeClass = (value) => value.toLowerCase().replace(" ", "-");

  return (
    <div className="user-dashboard">
      {/* =========================
          HEADER
      ========================= */}

      <div className="user-dashboard-header">
        <div>
          <h1>Welcome Back!</h1>
          <p>Track your reported footpath and sidewalk issues.</p>
        </div>

        <button
          className="report-btn"
          onClick={() => navigate("/user/add-complaint")}
        >
          <Plus size={16} strokeWidth={2.5} /> Report an Issue
        </button>
      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="user-stat-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon total-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Total Complaints</span>
            <strong>{totalComplaints}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon pending-icon">
            <CircleDot size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Not Assigned</span>
            <strong>{notAssigned}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon progress-icon">
            <RefreshCw size={22} strokeWidth={2} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{inProgress}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon completed-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
        </div>
      </div>

      {/* =========================
          QUICK ACTION
      ========================= */}

      <div className="quick-report-card">
        <div className="quick-report-content">
          <div className="quick-report-icon">
            <Plus size={22} strokeWidth={2.5} />
          </div>

          <div>
            <h2>Report a Footpath Issue</h2>
            <p>
              Found a damaged footpath, pothole, crack or other pedestrian
              infrastructure issue?
            </p>
          </div>
        </div>

        <button onClick={() => navigate("/add-complaint")}>
          Report Now
        </button>
      </div>

      {/* =========================
          RECENT COMPLAINTS
      ========================= */}

      <div className="recent-complaints">
        <div className="section-header">
          <div>
            <h2>Recent Complaints</h2>
            <p>Your recently reported issues</p>
          </div>

          <button
            className="view-all-btn"
            onClick={() => navigate("/my-complaints")}
          >
            View All
          </button>
        </div>

        {/* ---- DESKTOP / TABLET TABLE ---- */}
        <div className="complaints-table-container">
          <table className="user-complaints-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Issue</th>
                <th>Location</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>
                    <strong>{complaint.id}</strong>
                  </td>

                  <td>{complaint.issue}</td>

                  <td>
                    <MapPin size={13} strokeWidth={2} className="inline-icon" />{" "}
                    {complaint.location}
                  </td>

                  <td>{complaint.date}</td>

                  <td>
                    <span
                      className={`priority-badge ${badgeClass(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${badgeClass(
                        complaint.status
                      )}`}
                    >
                      <span className="status-dot"></span>
                      {complaint.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- MOBILE CARD LIST ---- */}
        <div className="complaints-card-list">
          {complaints.map((complaint) => (
            <div className="complaint-mobile-card" key={complaint.id}>
              <div className="complaint-mobile-top">
                <span className="complaint-mobile-id">{complaint.id}</span>
                <span
                  className={`status-badge ${badgeClass(complaint.status)}`}
                >
                  <span className="status-dot"></span>
                  {complaint.status}
                </span>
              </div>

              <h3 className="complaint-mobile-title">{complaint.issue}</h3>

              <div className="complaint-mobile-meta">
                <span>
                  <MapPin size={13} strokeWidth={2} className="inline-icon" />{" "}
                  {complaint.location}
                </span>
                <span>
                  <Calendar size={13} strokeWidth={2} className="inline-icon" />{" "}
                  {complaint.date}
                </span>
              </div>

              <div className="complaint-mobile-bottom">
                <span
                  className={`priority-badge ${badgeClass(
                    complaint.priority
                  )}`}
                >
                  {complaint.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;