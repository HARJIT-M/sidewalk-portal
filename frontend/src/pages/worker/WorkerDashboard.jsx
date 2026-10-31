// WorkerDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkerDashboard, updateWorkerAvailability } from "../../services/workerApi";
import "./WorkerDashboard.css";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const [availability, setAvailability] = useState("ACTIVE");
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleToggleAvailability = async (targetStatus) => {
    if (updatingAvailability || availability === targetStatus) return;
    setUpdatingAvailability(true);
    setStatusMsg("");
    try {
      const res = await updateWorkerAvailability(targetStatus);
      if (res && res.success) {
        setAvailability(res.availabilityStatus);
        setStatusMsg(
          targetStatus === "ACTIVE"
            ? "Status updated: You are now Available for new tasks."
            : "Status updated: You are on leave. You will not receive new assignments."
        );
        setTimeout(() => setStatusMsg(""), 4000);
      }
    } catch (err) {
      console.error("Failed to update availability:", err);
      alert(err.message || "Failed to update availability.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const loadDashboard = () => {
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        return getWorkerDashboard();
      })
      .then((res) => {
        if (res && res.success) {
          setDashboardData(res.dashboard);
          if (res.dashboard?.worker?.availabilityStatus) {
            setAvailability(res.dashboard.worker.availabilityStatus);
          }
        } else {
          throw new Error(res?.message || "Server returned no dashboard data.");
        }
      })
      .catch((err) => {
        console.error("Failed to load worker dashboard:", err);
        setError(err.message || "Could not load dashboard data from server.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const worker = dashboardData?.worker || {
    id: "",
    name: "Worker",
    team: "Assigned Team",
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
  const weeklyMaximum = Math.max(1, ...weeklyData.map((item) => item.count));

  if (loading && !dashboardData) {
    return (
      <div className="worker-dashboard">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <h2>Loading your dashboard…</h2>
          <p>Fetching live task metrics from the database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-dashboard">
      {/* =========================================
          1. HEADER
      ========================================= */}
      <header className="dashboard-header">
        <div className="header-text">
          <span className="header-eyebrow">Worker Panel</span>
          <h1>Good day, {worker.name} 👋</h1>
          <p>Here&apos;s a live summary of your assigned work.</p>
        </div>

        <div className="header-right-controls">
          <div className="availability-card">
            <span className="availability-label">Availability</span>
            <div className="availability-switcher-pill">
              <button
                type="button"
                className={`avail-btn available ${availability === "ACTIVE" ? "active" : ""}`}
                disabled={updatingAvailability}
                onClick={() => handleToggleAvailability("ACTIVE")}
                title="Mark yourself available for tasks"
              >
                <span className="avail-dot dot-active"></span>
                Available
              </button>
              <button
                type="button"
                className={`avail-btn on-leave ${availability === "ON_LEAVE" ? "active" : ""}`}
                disabled={updatingAvailability}
                onClick={() => handleToggleAvailability("ON_LEAVE")}
                title="Mark yourself on leave"
              >
                <span className="avail-dot dot-leave"></span>
                On Leave
              </button>
            </div>
          </div>

          <div className="worker-info">
            <div className="worker-avatar">
              {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
            </div>
            <div className="worker-meta">
              <h3>{worker.name}</h3>
              <span>
                {worker.team} {worker.id && `· ${worker.id}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {statusMsg && (
        <div className="availability-toast">
          <span>✓ {statusMsg}</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadDashboard}>Retry</button>
        </div>
      )}

      {/* =========================================
          2. STATISTICS CARDS
      ========================================= */}
      <section className="stats-container">
        <div
          className="stat-card tone-indigo"
          onClick={() => navigate("/worker/my-complaints")}
        >
          <div className="stat-icon">📋</div>
          <div className="stat-body">
            <p>Assigned Tasks</p>
            <h2>{stats.totalAssigned}</h2>
          </div>
          <span className="stat-arrow">→</span>
        </div>

        <div
          className="stat-card tone-blue"
          onClick={() => navigate("/worker/my-complaints?filter=IN_PROGRESS")}
        >
          <div className="stat-icon">🔧</div>
          <div className="stat-body">
            <p>In Progress</p>
            <h2>{stats.inProgress}</h2>
          </div>
          <span className="stat-arrow">→</span>
        </div>

        <div
          className="stat-card tone-green"
          onClick={() => navigate("/worker/my-complaints?filter=RESOLVED")}
        >
          <div className="stat-icon">✓</div>
          <div className="stat-body">
            <p>Completed</p>
            <h2>{stats.completed}</h2>
          </div>
          <span className="stat-arrow">→</span>
        </div>

        <div
          className="stat-card tone-red"
          onClick={() => navigate("/worker/my-complaints?filter=HIGH_PRIORITY")}
        >
          <div className="stat-icon">🚨</div>
          <div className="stat-body">
            <p>High Priority</p>
            <h2>{stats.highPriority}</h2>
          </div>
          <span className="stat-arrow">→</span>
        </div>
      </section>

      {/* =========================================
          3. MAIN GRID
      ========================================= */}
      <div className="dashboard-main-grid">
        {/* ---------- LEFT COLUMN ---------- */}
        <div className="main-col">
          {/* Active Work Order */}
          {activeTask ? (
            <div className="card featured-work-box">
              <div className="section-header">
                <div>
                  <h2>Active Work Order</h2>
                  <p>Your current on-site repair task</p>
                </div>
                <span className={`priority ${(activeTask.priority || "HIGH").toLowerCase()}`}>
                  {activeTask.priority || "High"} Priority
                </span>
              </div>

              <div className="featured-task-body">
                <div className="featured-task-info">
                  <div className="task-header-line">
                    <span className="complaint-id">#{activeTask.id}</span>
                    <span className="issue-title">{activeTask.issue}</span>
                  </div>
                  <p className="location">
                    📍 {activeTask.location}{" "}
                    {activeTask.landmark && `(${activeTask.landmark})`}
                  </p>
                  {(activeTask.locality || activeTask.city) && (
                    <p className="location">
                      {[activeTask.locality, activeTask.city, activeTask.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {Number.isFinite(activeTask.latitude) &&
                    Number.isFinite(activeTask.longitude) && (
                      <a
                        href={activeTask.navigationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="map-anchor"
                      >
                        🧭 Navigate to exact pin ({activeTask.latitude}, {activeTask.longitude})
                      </a>
                    )}
                  <p className="featured-desc">{activeTask.description}</p>
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
                    <span
                      className={`status ${(activeTask.status || "IN_PROGRESS")
                        .toLowerCase()
                        .replace("_", "-")}`}
                    >
                      {activeTask.status === "IN_PROGRESS"
                        ? "In Progress"
                        : activeTask.status === "RESOLVED"
                        ? "Resolved"
                        : "Assigned"}
                    </span>
                  </div>
                </div>

                <div className="featured-actions-row">
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/worker/complaints/${activeTask.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="refresh-btn"
                    onClick={() =>
                      navigate(`/worker/complaints/${activeTask.id}#work-update-section`)
                    }
                  >
                    Update Progress →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card featured-work-box empty-state">
              <div className="empty-emoji">🛠️</div>
              <p>No active repair tasks currently in progress.</p>
              <button
                className="refresh-btn"
                onClick={() => navigate("/worker/my-complaints")}
              >
                Browse Assigned Complaints
              </button>
            </div>
          )}

          {/* Weekly Performance */}
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Weekly Performance</h2>
                <p>Tasks completed and logged this week</p>
              </div>
              <span className="count-pill">This week</span>
            </div>

            <div className="bar-chart-container">
              <div className="y-axis-labels">
                <span>{weeklyMaximum}</span>
                <span>{Math.round(weeklyMaximum * 0.75)}</span>
                <span>{Math.round(weeklyMaximum * 0.5)}</span>
                <span>{Math.round(weeklyMaximum * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="bars-area" onMouseLeave={() => setActiveBarIndex(null)}>
                {weeklyData.map((item, index) => {
                  const heightPercent = (item.count / weeklyMaximum) * 100;
                  const isHovered = activeBarIndex === index;
                  return (
                    <div
                      key={item.day}
                      className="bar-item"
                      onMouseEnter={() => setActiveBarIndex(index)}
                    >
                      <div className="tooltip-slot">
                        {isHovered && <div className="bar-tooltip-popup">{item.label}</div>}
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
                  <p className="muted-note center">No weekly activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="side-col">
          {/* Status Donut */}
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Task Status</h2>
                <p>Current workload breakdown</p>
              </div>
              <span className="count-pill">{stats.totalAssigned} Total</span>
            </div>

            <div className="donut-chart-container">
              <div className="donut-svg-wrapper">
                <svg viewBox="0 0 42 42" className="donut-svg">
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#eef0f6"
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
                      <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
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

          {/* Completion */}
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Completion Rate</h2>
                <p>Target and performance</p>
              </div>
              <span className="status resolved">{completionPercent}%</span>
            </div>

            <div className="completion-card-body">
              <div className="big-target-box">
                <div className="target-top-line">
                  <span>Resolution progress</span>
                  <strong>
                    {stats.completed} / {stats.totalAssigned}
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
                  <h3 className="text-amber">
                    {Math.max(0, stats.totalAssigned - stats.completed - stats.inProgress)}
                  </h3>
                </div>
                <div className="month-box">
                  <p>Rating</p>
                  <h3>⭐ {worker.rating}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          4. BOTTOM ROW
      ========================================= */}
      <div className="dashboard-grid-three">
        {/* High Priority */}
        <div className="card">
          <div className="section-header">
            <div>
              <h2>High Priority</h2>
              <p>Needs immediate attention</p>
            </div>
            <span className="priority high">{highPriorityTasks.length} Urgent</span>
          </div>

          <div className="priority-items-list">
            {highPriorityTasks.map((task) => (
              <div key={task.id} className="priority-row-card">
                <div className="priority-row-info">
                  <div className="task-header-line">
                    <span className="complaint-id">#{task.id}</span>
                    <span className="issue-title small">{task.issue}</span>
                  </div>
                  <p className="location">📍 {task.location}</p>
                  <span className="due-badge">⏳ Priority: {task.priority}</span>
                </div>
                <button
                  className="view-btn"
                  onClick={() => navigate(`/worker/complaints/${task.id}`)}
                >
                  View →
                </button>
              </div>
            ))}
            {highPriorityTasks.length === 0 && (
              <p className="muted-note">No urgent high-priority tasks pending.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest status changes</p>
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
              <p className="muted-note">No recent activity records.</p>
            )}
          </div>
        </div>

        {/* Team & Schedule */}
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Team &amp; Schedule</h2>
              <p>Scheduled by your team manager</p>
            </div>
          </div>

          <div className="area-schedule-content">
            <div className="area-highlight-card">
              <div className="area-icon">🧰</div>
              <div>
                <strong>Assigned team</strong>
                <p>{worker.team || "Team not assigned"}</p>
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
                <p className="muted-note italic">No upcoming scheduled work.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;