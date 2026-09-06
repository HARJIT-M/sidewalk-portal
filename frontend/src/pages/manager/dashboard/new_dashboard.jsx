// new_dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getManagerDashboard } from "../../../services/managerApi";
import "./new_dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manager, setManager] = useState({
    name: "Field Manager",
    city: "Coimbatore",
    zone: "Central Municipal Zone",
  });
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
  });
  const [complaints, setComplaints] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getManagerDashboard();
      if (res && res.success) {
        if (res.manager) setManager(res.manager);
        if (res.stats) setStats(res.stats);
        if (res.complaints) setComplaints(res.complaints);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load manager dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getInitial = (name) => {
    if (!name) return "M";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="worker-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Manager Dashboard</h1>
          <p>Supervise and dispatch municipal footpath repairs in real-time</p>
        </div>

        <div className="worker-info">
          <div className="worker-avatar">{getInitial(manager.name)}</div>
          <div>
            <h3>{manager.name}</h3>
            <span>{manager.city || manager.zone || "Municipal Corp"}</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #fecaca"
        }}>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon total">📋</div>
          <div>
            <p>Total Complaints</p>
            <h2>{loading ? "..." : stats.totalComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div>
            <p>Pending Review</p>
            <h2>{loading ? "..." : stats.pendingComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress">🔧</div>
          <div>
            <p>In Progress</p>
            <h2>{loading ? "..." : stats.inProgressComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">✓</div>
          <div>
            <p>Resolved</p>
            <h2>{loading ? "..." : stats.resolvedComplaints}</h2>
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="complaints-section">
        <div className="section-header">
          <div>
            <h2>Recent Complaints Overview</h2>
            <p>Live feed of citizen reported issues and repair progress</p>
          </div>

          <button
            className="refresh-btn"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? "↻ Updating..." : "↻ Refresh"}
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
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                    Loading complaints from database...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                    No complaints registered in the system yet.
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr key={complaint.id || complaint.mongoId}>
                    <td>
                      <span className="complaint-id">{complaint.id}</span>
                    </td>

                    <td>
                      <span className="issue-title">{complaint.title}</span>
                    </td>

                    <td>
                      <span className="location">
                        📍 {complaint.location}
                      </span>
                    </td>

                    <td>{complaint.date}</td>

                    <td>
                      <span
                        className={`priority ${(complaint.priority || "medium").toLowerCase()}`}
                      >
                        {complaint.priority || "Medium"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status ${(complaint.status || "pending")
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {complaint.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="view-btn"
                        onClick={() => navigate("/complaints")}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;