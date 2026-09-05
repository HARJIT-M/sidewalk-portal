// WorkerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkerDashboard } from "../../services/workerApi";
import "./WorkerDashboard.css";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBarIndex, setActiveBarIndex] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkerDashboard();
      if (res && res.success) {
        setDashboardData(res.dashboard);
      }
    } catch (err) {
      console.error("Failed to load worker dashboard:", err);
      setError("Could not load dashboard data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const worker = dashboardData?.worker || {
    id: "",
    name: "Worker",
    zone: "",
    rating: 0,
    onTimeRate: 0,
  };

  const stats = dashboardData?.stats || {
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    highPriority: 0,
    unreadNotifications: 0,
  };

  const activeTask = dashboardData?.activeTask || null;
  const highPriorityTasks = dashboardData?.highPriorityTasks || [];
  const weeklyData = dashboardData?.weeklyData || [];
  const statusData = dashboardData?.statusData || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const upcomingSchedule = dashboardData?.upcomingSchedule || [];

  const completionPercent =
    stats.totalAssigned > 0
      ? Math.round((stats.completed / stats.totalAssigned) * 100)
      : 0;

  if (loading && !dashboardData) {
    return (
      <div className="worker-dashboard">
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>
          <h2>Loading live dashboard metrics from database...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-dashboard">
      {/* =========================================
          1. HEADER (Gradient Banner)
      ========================================= */}
      <div className="dashboard-header">
        <div>
          <h1>Worker Dashboard</h1>
          <p>
            Good Day, {worker.name} 👋 • Live MongoDB Task Summary
          </p>
        </div>

        <div className="worker-info">
          <div className="worker-avatar">
            {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
          </div>
          <div>
            <h3>{worker.name}</h3>
            <span>
              {worker.zone ? `${worker.zone} (${worker.id})` : worker.id}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 18px", borderRadius: "10px", margin: "14px 0", fontWeight: "500", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {error}</span>
          <button onClick={loadDashboard} style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Retry</button>
        </div>
      )}

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
            📋 My Assigned Tasks ({stats.totalAssigned})
          </button>
          <button
            className="action-pill-btn"
            onClick={() =>
              activeTask
                ? navigate(`/worker/complaints/${activeTask.id}`)
                : navigate("/worker/my-complaints")
            }
          >
            🔧 {activeTask ? "Update Active Task" : "View Assigned Tasks"}
          </button>
          <button
            className="action-pill-btn"
            onClick={() =>
              activeTask
                ? navigate(`/worker/complaints/${activeTask.id}#work-update-section`)
                : navigate("/worker/my-complaints")
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
            🔔 Notifications {stats.unreadNotifications > 0 && `(${stats.unreadNotifications})`}
          </button>
        </div>
      </div>

      {/* =========================================
          3. FOUR STATISTICS CARDS
      ========================================= */}
      <div className="stats-container">
        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints")}
        >
          <div className="stat-icon total">📋</div>
          <div>
            <p>Assigned Tasks</p>
            <h2>{stats.totalAssigned}</h2>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints?filter=IN_PROGRESS")}
        >
          <div className="stat-icon progress">🔧</div>
          <div>
            <p>In Progress</p>
            <h2>{stats.inProgress}</h2>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints?filter=RESOLVED")}
        >
          <div className="stat-icon resolved">✓</div>
          <div>
            <p>Completed</p>
            <h2>{stats.completed}</h2>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/worker/my-complaints?filter=ASSIGNED")}
        >
          <div className="stat-icon pending">🚨</div>
          <div>
            <p>High Priority</p>
            <h2>{stats.highPriority}</h2>
          </div>
        </div>
      </div>

      {/* =========================================
          4. TODAY'S WORK — FEATURED WORK ORDER
      ========================================= */}
      {activeTask ? (
        <div className="complaints-section featured-work-box">
          <div className="section-header">
            <div>
              <h2>📋 Active Work Order</h2>
              <p>Current on-site repair task from MongoDB</p>
            </div>
            <span className={`priority ${(activeTask.priority || "HIGH").toLowerCase()}`}>
              {activeTask.priority || "High"} Priority
            </span>
          </div>

          <div className="featured-task-body">
            <div className="featured-task-info">
              <div className="task-header-line">
                <span className="complaint-id">#{activeTask.id}</span>
                <span className="issue-title">
                  {activeTask.issue}
                </span>
              </div>
              <p className="location">
                📍 {activeTask.location}{" "}
                {activeTask.landmark && `(${activeTask.landmark})`}
              </p>
              <p className="featured-desc">
                {activeTask.description}
              </p>
            </div>

            <div className="progress-box">
              <div className="progress-label-row">
                <span className="progress-text-label">Repair Progress</span>
                <strong>{activeTask.progress || 0}% Complete</strong>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-indicator"
                  style={{ width: `${activeTask.progress || 0}%` }}
                ></div>
              </div>
              <div className="progress-footer-note">
                <span>Status:</span>{" "}
                <span className={`status ${(activeTask.status || "IN_PROGRESS").toLowerCase().replace("_", "-")}`}>
                  {activeTask.status === "IN_PROGRESS" ? "In Progress" : activeTask.status === "RESOLVED" ? "Resolved" : "Assigned"}
                </span>{" "}
                • Live database assignment
              </div>
            </div>

            <div className="featured-actions-row">
              <button
                className="view-btn"
                onClick={() =>
                  navigate(`/worker/complaints/${activeTask.id}`)
                }
              >
                View Details
              </button>
              <button
                className="refresh-btn"
                onClick={() =>
                  navigate(
                    `/worker/complaints/${activeTask.id}#work-update-section`
                  )
                }
              >
                Update Progress →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="complaints-section featured-work-box" style={{ textAlign: "center", padding: "30px 20px" }}>
          <p style={{ color: "#64748b", margin: "0 0 12px 0", fontSize: "15px" }}>
            No active repair tasks currently in progress.
          </p>
          <button
            className="action-pill-btn"
            onClick={() => navigate("/worker/my-complaints")}
            style={{ margin: "0 auto", display: "inline-flex" }}
          >
            📋 Browse Assigned Complaints
          </button>
        </div>
      )}

      {/* =========================================
          5. CHARTS GRID (Weekly Performance + Status Donut)
      ========================================= */}
      <div className="dashboard-grid-two">
        {/* Weekly Performance Bar Chart */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>📊 Weekly Work Performance</h2>
              <p>Tasks completed and logged this week</p>
            </div>
            <span className="count-pill">Live Active Stats</span>
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
                const heightPercent = Math.min(100, (item.count / 8) * 100);
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
              {weeklyData.length === 0 && (
                <p style={{ color: "#64748b", padding: "20px", textAlign: "center" }}>No weekly activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Task Status Donut Distribution */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>🥧 Task Status Distribution</h2>
              <p>Current workload breakdown in MongoDB</p>
            </div>
            <span className="count-pill">{stats.totalAssigned} Total</span>
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
                {/* Resolved */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#16a34a"
                  strokeWidth="5"
                  strokeDasharray={`${statusData[0]?.percent || 0} ${100 - (statusData[0]?.percent || 0)}`}
                  strokeDashoffset="25"
                />
                {/* In Progress */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#4f46e5"
                  strokeWidth="5"
                  strokeDasharray={`${statusData[1]?.percent || 0} ${100 - (statusData[1]?.percent || 0)}`}
                  strokeDashoffset={`${25 - (statusData[0]?.percent || 0)}`}
                />
                {/* Assigned */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#d97706"
                  strokeWidth="5"
                  strokeDasharray={`${statusData[2]?.percent || 0} ${100 - (statusData[2]?.percent || 0)}`}
                  strokeDashoffset={`${25 - (statusData[0]?.percent || 0) - (statusData[1]?.percent || 0)}`}
                />
              </svg>
              <div className="donut-label-center">
                <strong>{stats.totalAssigned}</strong>
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
          6. HIGH PRIORITY TASKS & OVERALL STATS
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
                  <span className="due-badge">⏳ Priority: {task.priority}</span>
                </div>

                <button
                  className="refresh-btn"
                  onClick={() => navigate(`/worker/complaints/${task.id}`)}
                >
                  View Task →
                </button>
              </div>
            ))}
            {highPriorityTasks.length === 0 && (
              <p style={{ color: "#64748b", padding: "16px 0" }}>No urgent high-priority tasks pending.</p>
            )}
          </div>
        </div>

        {/* Overall Completion & Monthly Stats */}
        <div className="complaints-section">
          <div className="section-header">
            <div>
              <h2>📈 Overall Completion Progress</h2>
              <p>Target and performance metrics</p>
            </div>
            <span className="status resolved">{completionPercent}% Rate</span>
          </div>

          <div className="completion-card-body">
            <div className="big-target-box">
              <div className="target-top-line">
                <span>Task Resolution Rate</span>
                <strong>
                  {stats.completed} / {stats.totalAssigned} Tasks Completed
                </strong>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-indicator"
                  style={{ width: `${completionPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="month-stats-grid">
              <div className="month-box">
                <p>Completed</p>
                <h3 className="text-green">{stats.completed}</h3>
              </div>
              <div className="month-box">
                <p>In Progress</p>
                <h3 className="text-purple">{stats.inProgress}</h3>
              </div>
              <div className="month-box">
                <p>Assigned</p>
                <h3 className="text-amber">{Math.max(0, stats.totalAssigned - stats.completed - stats.inProgress)}</h3>
              </div>
              <div className="month-box">
                <p>Rating</p>
                <h3>{worker.rating} / 5</h3>
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
              <p>Live status change audit logs</p>
            </div>
          </div>

          <div className="activity-list">
            {recentActivity.map((act) => (
              <div key={act.id} className="activity-row">
                <div className={`activity-icon-pill ${act.iconType}`}>
                  {act.iconType === "resolved" ? "✓" : act.iconType === "progress" ? "🔧" : "📋"}
                </div>
                <div className="activity-desc">
                  <p>
                    Complaint <strong className="complaint-id">#{act.complaintCode}</strong>: {act.text}
                  </p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p style={{ color: "#64748b", padding: "16px 0" }}>No recent activity records.</p>
            )}
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
                <p>{worker.zone || "Operational Zone Assigned by Field Manager"}</p>
                {worker.zone && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(worker.zone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="map-anchor"
                  >
                    View Location on Google Maps →
                  </a>
                )}
              </div>
            </div>

            <div className="upcoming-schedule-section">
              <h3>Upcoming Scheduled Work</h3>
              {upcomingSchedule.map((sch, i) => (
                <div key={i} className="schedule-card-item">
                  <span className="schedule-day-badge">{sch.day}</span>
                  <div>
                    <strong>{sch.title}</strong>
                    <span className="location">{sch.info}</span>
                  </div>
                </div>
              ))}
              {upcomingSchedule.length === 0 && (
                <p style={{ color: "#64748b", fontStyle: "italic" }}>No upcoming scheduled work.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;