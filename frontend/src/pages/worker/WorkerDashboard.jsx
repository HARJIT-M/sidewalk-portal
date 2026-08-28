// WorkerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredComplaints,
  getStoredProfile,
  getStoredNotifications,
} from "./workerData";
import "./WorkerDashboard.css";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeBarIndex, setActiveBarIndex] = useState(4); // Friday default

  const loadData = () => {
    setComplaints(getStoredComplaints());
    setProfile(getStoredProfile());
    const notifs = getStoredNotifications();
    setUnreadCount(notifs.filter((n) => !n.read).length);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary counts
  const totalAssigned = complaints.length || 12;
  const inProgressCount =
    complaints.filter((c) => c.status === "IN_PROGRESS").length || 4;
  const completedCount = 28;
  const highPriorityCount =
    complaints.filter((c) => c.priority === "HIGH").length || 2;

  // Active spotlight task
  const activeTask =
    complaints.find((c) => c.id === "CMP001") ||
    complaints.find((c) => c.status === "IN_PROGRESS") ||
    complaints[0] || {
      id: "CMP001",
      issue: "Broken Footpath & Sunk Paver Blocks",
      location: "Gandhipuram, Coimbatore",
      landmark: "Opposite City Bus Stand Gate #2",
      priority: "High",
      status: "In Progress",
      progress: 80,
    };

  // High priority tasks list
  const highPriorityTasks = complaints.filter(
    (c) => c.priority === "HIGH" || c.id === "CMP001" || c.id === "CMP004"
  );

  // Weekly performance bar chart data (Mon - Sat)
  const weeklyData = [
    { day: "Mon", count: 4, label: "4 Tasks" },
    { day: "Tue", count: 6, label: "6 Tasks" },
    { day: "Wed", count: 5, label: "5 Tasks" },
    { day: "Thu", count: 7, label: "7 Tasks" },
    { day: "Fri", count: 8, label: "8 Tasks" },
    { day: "Sat", count: 3, label: "3 Tasks" },
  ];

  // Donut chart status data
  const statusData = [
    { label: "Resolved", count: 8, color: "#16a34a", percent: 47 },
    { label: "In Progress", count: 4, color: "#4f46e5", percent: 24 },
    { label: "Assigned", count: 5, color: "#d97706", percent: 29 },
  ];

  return (
    <div className="worker-dashboard">
      {/* =========================================
          1. HEADER (Manager Gradient Banner)
      ========================================= */}
      <div className="dashboard-header">
        <div>
          <h1>Worker Dashboard</h1>
          <p>
            Good Morning, {profile?.name || "Ravi Kumar"} 👋 • Here’s your work summary for today
          </p>
        </div>

        <div className="worker-info">
          <div className="worker-avatar">
            {profile?.name ? profile.name.charAt(0) : "R"}
          </div>
          <div>
            <h3>{profile?.name || "Ravi Kumar"}</h3>
            <span>{profile?.zone || "Coimbatore"} ({profile?.id || "WRK001"})</span>
          </div>
        </div>
      </div>

      {/* =========================================
          2. QUICK ACTIONS BAR
      ========================================= */}
      <div className="quick-actions-card">
        <span className="quick-actions-title">⚡ Quick Actions:</span>
        <div className="quick-buttons-row">
          <button
            className="action-pill-btn"
            onClick={() => navigate("/worker/my-complaints")}
          >
            📋 My Assigned Tasks
          </button>
          <button
            className="action-pill-btn"
            onClick={() =>
              navigate(`/worker/complaints/${activeTask.id || "CMP001"}`)
            }
          >
            🔧 Update Active Task
          </button>
          <button
            className="action-pill-btn"
            onClick={() =>
              navigate(
                `/worker/complaints/${activeTask.id || "CMP001"}#work-update-section`
              )
            }
          >
            📷 Upload Repair Proof
          </button>
          <button
            className="action-pill-btn"
            onClick={() =>
              navigate("/worker/my-complaints?filter=RESOLVED")
            }
          >
            📜 Completed History
          </button>
          <button
            className="action-pill-btn notif"
            onClick={() => navigate("/worker/notifications")}
          >
            🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {/* =========================================
          3. FOUR STATISTICS CARDS (Manager Design)
      ========================================= */}
      <div className="stats-container">
        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints")}
        >
          <div className="stat-icon total">📋</div>
          <div>
            <p>Assigned Tasks</p>
            <h2>{totalAssigned}</h2>

          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints?filter=IN_PROGRESS")}
        >
          <div className="stat-icon progress">🔧</div>
          <div>
            <p>In Progress</p>
            <h2>{inProgressCount}</h2>

          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints?filter=RESOLVED")}
        >
          <div className="stat-icon resolved">✓</div>
          <div>
            <p>Completed</p>
            <h2>{completedCount}</h2>

          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints?filter=ASSIGNED")}
        >
          <div className="stat-icon pending">🚨</div>
          <div>
            <p>High Priority</p>
            <h2>{highPriorityCount}</h2>

          </div>
        </div>
      </div>

      {/* =========================================
          4. TODAY'S WORK — FEATURED WORK ORDER
      ========================================= */}
      <div className="complaints-section featured-work-box">
        <div className="section-header">
          <div>
            <h2>📋 Today's Assigned Work</h2>
            <p>Current active on-site repair task</p>
          </div>
          <span className="priority high">High Priority</span>
        </div>

        <div className="featured-task-body">
          <div className="featured-task-info">
            <div className="task-header-line">
              <span className="complaint-id">#{activeTask.id || "CMP001"}</span>
              <span className="issue-title">
                {activeTask.issue || "Broken Footpath & Sunk Paver Blocks"}
              </span>
            </div>
            <p className="location">
              📍 {activeTask.location || "Gandhipuram, Coimbatore"}{" "}
              {activeTask.landmark && `(${activeTask.landmark})`}
            </p>
            <p className="featured-desc">
              {activeTask.description ||
                "Multiple interlock tiles have sunk or broken creating an 8-inch trip hazard for daily pedestrians near the main bus stop."}
            </p>
          </div>

          <div className="progress-box">
            <div className="progress-label-row">
              <span className="progress-text-label">Repair Progress</span>
              <strong>{activeTask.progress || 80}% Complete</strong>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-indicator"
                style={{ width: `${activeTask.progress || 80}%` }}
              ></div>
            </div>
            <div className="progress-footer-note">
              <span>Status:</span>{" "}
              <span className="status in-progress">In Progress</span> •
              Excavation done, laying interlock pavers
            </div>
          </div>

          <div className="featured-actions-row">
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/worker/complaints/${activeTask.id || "CMP001"}`)
              }
            >
              View Details
            </button>
            <button
              className="refresh-btn"
              onClick={() =>
                navigate(
                  `/worker/complaints/${activeTask.id || "CMP001"}#work-update-section`
                )
              }
            >
              Update Progress →
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          5. CHARTS GRID (Weekly Performance + Status Donut)
      ========================================= */}
      <div className="dashboard-grid-two">
        {/* Weekly Performance Bar Chart */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>📊 Weekly Work Performance</h2>
              <p>Tasks completed each day this week</p>
            </div>
            <span className="count-pill">Total: 33 Tasks</span>
          </div>

          <div className="bar-chart-container">
            <div className="y-axis-labels">
              <span>8</span>
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>

            <div className="bars-area">
              {weeklyData.map((item, index) => {
                const heightPercent = (item.count / 8) * 100;
                const isHovered = activeBarIndex === index;
                return (
                  <div
                    key={item.day}
                    className="bar-item"
                    onMouseEnter={() => setActiveBarIndex(index)}
                  >
                    <div className="tooltip-slot">
                      {isHovered && (
                        <div className="bar-tooltip-popup">{item.label}</div>
                      )}
                    </div>
                    <div className="bar-slot">
                      <div
                        className={`bar-column-fill ${isHovered ? "active" : ""}`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className={`bar-day-label ${isHovered ? "active" : ""}`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Status Donut Distribution */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>🥧 Task Status Distribution</h2>
              <p>Current workload breakdown</p>
            </div>
            <span className="count-pill">17 Total</span>
          </div>

          <div className="donut-chart-container">
            <div className="donut-svg-wrapper">
              <svg width="140" height="140" viewBox="0 0 42 42" className="donut-svg">
                <circle
                  className="donut-bg-ring"
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#f7f7fb"
                  strokeWidth="5"
                />
                {/* Resolved (47%) */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#16a34a"
                  strokeWidth="5"
                  strokeDasharray="47 53"
                  strokeDashoffset="25"
                />
                {/* In Progress (24%) */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#4f46e5"
                  strokeWidth="5"
                  strokeDasharray="24 76"
                  strokeDashoffset="78"
                />
                {/* Assigned (29%) */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#d97706"
                  strokeWidth="5"
                  strokeDasharray="29 71"
                  strokeDashoffset="54"
                />
              </svg>
              <div className="donut-label-center">
                <strong>17</strong>
                <span>Tasks</span>
              </div>
            </div>

            <div className="donut-legend-list">
              {statusData.map((item) => (
                <div key={item.label} className="legend-item">
                  <div className="legend-left">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="legend-title">{item.label}</span>
                  </div>
                  <div className="legend-right">
                    <strong>{item.count}</strong>
                    <span className="legend-pct">({item.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          6. HIGH PRIORITY TASKS & MONTHLY PROGRESS
      ========================================= */}
      <div className="dashboard-grid-two">
        {/* High Priority Tasks */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>🚨 High Priority Tasks</h2>
              <p>Complaints needing immediate inspection & repair</p>
            </div>
            <span className="priority high">{highPriorityTasks.length} Urgent</span>
          </div>

          <div className="priority-items-list">
            {highPriorityTasks.map((task) => (
              <div key={task.id} className="priority-row-card">
                <div className="priority-row-info">
                  <div className="task-header-line">
                    <span className="complaint-id">#{task.id}</span>
                    <span className="issue-title">{task.issue}</span>
                  </div>
                  <p className="location">📍 {task.location}</p>
                  <span className="due-badge">⏳ Due: Today</span>
                </div>

                <button
                  className="refresh-btn"
                  onClick={() => navigate(`/worker/complaints/${task.id}`)}
                >
                  View Task →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Completion & Monthly Stats */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>📈 Overall Completion Progress</h2>
              <p>Monthly target and performance metrics</p>
            </div>
            <span className="status resolved">80% Rate</span>
          </div>

          <div className="completion-card-body">
            <div className="big-target-box">
              <div className="target-top-line">
                <span>Month Target Progress</span>
                <strong>28 / 35 Tasks Completed</strong>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-indicator"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>

            <div className="month-stats-grid">
              <div className="month-box">
                <p>Completed</p>
                <h3 className="text-green">28</h3>
              </div>
              <div className="month-box">
                <p>In Progress</p>
                <h3 className="text-purple">4</h3>
              </div>
              <div className="month-box">
                <p>Assigned</p>
                <h3 className="text-amber">3</h3>
              </div>
              <div className="month-box">
                <p>On-Time</p>
                <h3>96%</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          7. RECENT ACTIVITY & ASSIGNED AREA
      ========================================= */}
      <div className="dashboard-grid-two">
        {/* Recent Activity */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>🔔 Recent Activity</h2>
              <p>Live updates and work audit log</p>
            </div>
          </div>

          <div className="activity-list">
            <div className="activity-row">
              <div className="activity-icon-pill resolved">✓</div>
              <div className="activity-desc">
                <p>
                  Complaint <strong className="complaint-id">#CMP012</strong> marked{" "}
                  <span className="status resolved">Resolved</span>
                </p>
                <span>10 minutes ago</span>
              </div>
            </div>

            <div className="activity-row">
              <div className="activity-icon-pill progress">🔧</div>
              <div className="activity-desc">
                <p>
                  Complaint <strong className="complaint-id">#CMP001</strong> progress updated to{" "}
                  <strong>80%</strong>
                </p>
                <span>1 hour ago</span>
              </div>
            </div>

            <div className="activity-row">
              <div className="activity-icon-pill assigned">📋</div>
              <div className="activity-desc">
                <p>
                  New urgent task <strong className="complaint-id">#CMP004</strong> assigned by Manager
                </p>
                <span>2 hours ago</span>
              </div>
            </div>

            <div className="activity-row">
              <div className="activity-icon-pill photo">📷</div>
              <div className="activity-desc">
                <p>
                  Repair evidence photo uploaded for <strong className="complaint-id">#CMP012</strong>
                </p>
                <span>Yesterday at 04:30 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Assigned Area & Schedule */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>📍 Current Assigned Area & Schedule</h2>
              <p>Active field deployment zones</p>
            </div>
          </div>

          <div className="area-schedule-content">
            <div className="area-highlight-card">
              <div className="area-icon">📍</div>
              <div>
                <strong>Active Operational Zone:</strong>
                <p>Gandhipuram Central & 100 Feet Road, Coimbatore</p>
                <a
                  href="https://maps.google.com/?q=Gandhipuram+Coimbatore"
                  target="_blank"
                  rel="noreferrer"
                  className="map-anchor"
                >
                  View Location on Google Maps →
                </a>
              </div>
            </div>

            <div className="upcoming-schedule-section">
              <h3>Upcoming Scheduled Work</h3>
              <div className="schedule-card-item">
                <span className="schedule-day-badge">Tomorrow</span>
                <div>
                  <strong>Saibaba Colony Sidewalk Repair</strong>
                  <span className="location">Priority: Medium • 2 Workers Assigned</span>
                </div>
              </div>

              <div className="schedule-card-item">
                <span className="schedule-day-badge">Friday</span>
                <div>
                  <strong>Peelamedu Storm Drainage Paving</strong>
                  <span className="location">Priority: High • Concrete Curing Check</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;