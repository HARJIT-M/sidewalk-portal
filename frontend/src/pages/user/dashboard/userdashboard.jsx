import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
import "./userdashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaints() {
      try {
        const res = await api.get("/user/complaints");
        setComplaints(res.data.complaints || []);
      } catch (err) {
        console.warn("Could not fetch complaints:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, []);

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

  if (loading) return <div className="user-dashboard">Loading...</div>;

  return (
    <div className="user-dashboard">


      <div className="user-dashboard-header">
        <div>
          <h1>Welcome Back!</h1>
          <p>Track your reported footpath and sidewalk issues.</p>
        </div>

        <button
          className="report-btn"
          onClick={() => navigate("/add-complaint")}
        >
          + Report an Issue
        </button>
      </div>


      <div className="user-stat-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon total-icon">📋</div>
          <div>
            <span>Total Complaints</span>
            <strong>{totalComplaints}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon pending-icon">○</div>
          <div>
            <span>Not Assigned</span>
            <strong>{notAssigned}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon progress-icon">↻</div>
          <div>
            <span>In Progress</span>
            <strong>{inProgress}</strong>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon completed-icon">✓</div>
          <div>
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
        </div>
      </div>

      <div className="quick-report-card">
        <div className="quick-report-content">
          <div className="quick-report-icon">+</div>

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

                  <td>📍 {complaint.location}</td>

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
                <span>📍 {complaint.location}</span>
                <span>📅 {complaint.date}</span>
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