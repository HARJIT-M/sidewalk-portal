import React, { useState, useEffect } from "react";
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
import userApi from "../../../services/userApi";
import "./userdashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await userApi.getDashboard();
        if (data.success) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch user dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="user-dashboard">Loading dashboard...</div>;
  }

  // Statistics
  const stats = dashboardData?.stats || { totalReported: 0, pending: 0, inProgress: 0, resolved: 0 };
  const complaints = dashboardData?.recentActivity || [];

  const badgeClass = (value) => value.toLowerCase().replace(" ", "-");

  const formatStatus = (status) => {
    if (!status) return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "CLOSED") return "Completed";
    if (status === "ASSIGNED") return "Assigned";
    return "Pending";
  };

  const formatPriority = (priority) => {
    if (!priority) return "Medium";
    if (priority === "CRITICAL") return "Critical";
    if (priority === "HIGH") return "High";
    if (priority === "MEDIUM") return "Medium";
    if (priority === "LOW") return "Low";
    return "Not Set";
  };

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
            <strong>{stats.totalReported}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon pending-icon">
            <CircleDot size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Not Assigned</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon progress-icon">
            <RefreshCw size={22} strokeWidth={2} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon completed-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{stats.resolved}</strong>
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
              {complaints.map((complaint) => {
                const displayStatus = formatStatus(complaint.status);
                const displayPriority = formatPriority(complaint.priority);
                return (
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
                      className={`priority-badge ${badgeClass(displayPriority)}`}
                    >
                      {displayPriority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${badgeClass(displayStatus)}`}
                    >
                      <span className="status-dot"></span>
                      {displayStatus}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* ---- MOBILE CARD LIST ---- */}
        <div className="complaints-card-list">
          {complaints.map((complaint) => {
            const displayStatus = formatStatus(complaint.status);
            const displayPriority = formatPriority(complaint.priority);
            return (
            <div className="complaint-mobile-card" key={complaint.id}>
              <div className="complaint-mobile-top">
                <span className="complaint-mobile-id">{complaint.id}</span>
                <span
                  className={`status-badge ${badgeClass(displayStatus)}`}
                >
                  <span className="status-dot"></span>
                  {displayStatus}
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
                  className={`priority-badge ${badgeClass(displayPriority)}`}
                >
                  {displayPriority}
                </span>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;