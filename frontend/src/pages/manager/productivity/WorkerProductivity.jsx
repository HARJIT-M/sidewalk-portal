import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  Star,
  Search,
  RefreshCw,
  Phone,
  Mail,
  ChevronRight,
  X,
  Activity,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { getWorkerProductivity } from "../../../services/managerApi";
import "./WorkerProductivity.css";

const WorkerProductivity = () => {
  const [productivityData, setProductivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All | Available | On Leave
  const [sortBy, setSortBy] = useState("completed"); // completed | rate | rating | ontime
  const [selectedWorker, setSelectedWorker] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getWorkerProductivity();
      if (res && res.success) {
        setProductivityData(res);
      } else {
        throw new Error(res?.message || "Failed to load productivity data.");
      }
    } catch (err) {
      console.error("Error loading productivity:", err);
      setErrorMsg(err.message || "Failed to load worker productivity metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = productivityData?.summary || {
    totalWorkers: 0,
    activeWorkers: 0,
    onLeaveWorkers: 0,
    totalAssignedTasks: 0,
    totalCompletedTasks: 0,
    totalInProgressTasks: 0,
    teamCompletionRate: 0,
    averageTeamRating: 4.8,
  };

  const rawWorkers = productivityData?.workers || [];
  const leaderboard = productivityData?.leaderboard || [];

  // Filter & Search
  const filteredWorkers = rawWorkers
    .filter((worker) => {
      const q = search.toLowerCase();
      const matchesSearch =
        worker.name.toLowerCase().includes(q) ||
        worker.employeeCode.toLowerCase().includes(q) ||
        worker.role.toLowerCase().includes(q) ||
        worker.phone.includes(q);

      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "Available" && worker.availabilityStatus === "ACTIVE") ||
        (filterStatus === "On Leave" && worker.availabilityStatus === "ON_LEAVE");

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "completed") return b.completedCount - a.completedCount;
      if (sortBy === "rate") return b.completionRate - a.completionRate;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "ontime") return b.onTimeRate - a.onTimeRate;
      return 0;
    });

  return (
    <div className="wp-page">
      {/* =========================================
          1. HEADER BANNER
      ========================================= */}
      <section className="wp-hero">
        <div className="wp-hero-content">
          <div className="wp-title-group">
            <span className="wp-badge">
              <Activity size={14} /> Team Performance Operations
            </span>
            <h1>Worker Productivity Dashboard</h1>
            <p>
              Monitor team resolution velocity, completion rates, workforce availability, and individual worker performance in real time.
            </p>
          </div>

          <div className="wp-hero-actions">
            <button className="wp-refresh-btn" onClick={loadData} disabled={loading}>
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              {loading ? "Refreshing..." : "Refresh Metrics"}
            </button>
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="wp-error-alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
          <button onClick={loadData}>Retry</button>
        </div>
      )}

      {/* =========================================
          2. KPI SUMMARY CARDS
      ========================================= */}
      <section className="wp-kpi-grid">
        <div className="wp-kpi-card accent-blue">
          <div className="wp-kpi-top">
            <span className="wp-kpi-label">Completed Repairs</span>
            <div className="wp-kpi-icon blue">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="wp-kpi-value">{summary.totalCompletedTasks}</div>
          <div className="wp-kpi-foot">
            Out of <strong>{summary.totalAssignedTasks}</strong> total assigned tasks
          </div>
        </div>

        <div className="wp-kpi-card accent-green">
          <div className="wp-kpi-top">
            <span className="wp-kpi-label">Team Completion Rate</span>
            <div className="wp-kpi-icon green">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="wp-kpi-value">{summary.teamCompletionRate}%</div>
          <div className="wp-kpi-progress">
            <div
              className="wp-kpi-bar"
              style={{ width: `${Math.min(100, summary.teamCompletionRate)}%` }}
            />
          </div>
        </div>

        <div className="wp-kpi-card accent-purple">
          <div className="wp-kpi-top">
            <span className="wp-kpi-label">Workforce Status</span>
            <div className="wp-kpi-icon purple">
              <Users size={20} />
            </div>
          </div>
          <div className="wp-kpi-value">
            <span style={{ color: "#10b981" }}>{summary.activeWorkers}</span>
            <span style={{ fontSize: "16px", color: "#94a3b8", margin: "0 6px" }}>/</span>
            <span style={{ color: "#f59e0b" }}>{summary.onLeaveWorkers}</span>
          </div>
          <div className="wp-kpi-foot">
            <span className="dot dot-active"></span> {summary.activeWorkers} Available ·
            <span className="dot dot-leave" style={{ marginLeft: "8px" }}></span> {summary.onLeaveWorkers} On Leave
          </div>
        </div>

        <div className="wp-kpi-card accent-amber">
          <div className="wp-kpi-top">
            <span className="wp-kpi-label">Avg Quality Rating</span>
            <div className="wp-kpi-icon amber">
              <Star size={20} />
            </div>
          </div>
          <div className="wp-kpi-value">{summary.averageTeamRating} ★</div>
          <div className="wp-kpi-foot">Based on verified completed maintenance work</div>
        </div>
      </section>

      {/* =========================================
          3. LEADERBOARD / TOP PERFORMERS
      ========================================= */}
      {leaderboard.length > 0 && (
        <section className="wp-section wp-leaderboard-section">
          <div className="wp-section-head">
            <div className="wp-head-title">
              <Award size={20} className="wp-gold-icon" />
              <div>
                <h2>Top Performing Workers</h2>
                <p>Leading crew members ranked by total completed repairs and efficiency</p>
              </div>
            </div>
          </div>

          <div className="wp-leaderboard-grid">
            {leaderboard.slice(0, 3).map((worker, idx) => {
              const rankClass = idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : "rank-3";
              const rankLabel = idx === 0 ? "🥇 #1 Performer" : idx === 1 ? "🥈 #2 Runner Up" : "🥉 #3 Star Worker";

              return (
                <div key={worker.workerId} className={`wp-leader-card ${rankClass}`}>
                  <span className="wp-rank-pill">{rankLabel}</span>

                  <div className="wp-leader-avatar">
                    {worker.name.charAt(0).toUpperCase()}
                  </div>

                  <h3>{worker.name}</h3>
                  <span className="wp-leader-code">{worker.employeeCode} · {worker.role}</span>

                  <div className="wp-leader-stats">
                    <div className="wp-lstat">
                      <strong>{worker.completedCount}</strong>
                      <span>Completed</span>
                    </div>
                    <div className="wp-lstat-divider"></div>
                    <div className="wp-lstat">
                      <strong>{worker.completionRate}%</strong>
                      <span>Rate</span>
                    </div>
                    <div className="wp-lstat-divider"></div>
                    <div className="wp-lstat">
                      <strong>{worker.onTimeRate}%</strong>
                      <span>On-Time</span>
                    </div>
                  </div>

                  <div className="wp-leader-badge">
                    <span className={`avail-indicator ${worker.availabilityStatus === "ACTIVE" ? "active" : "leave"}`}>
                      ● {worker.statusDisplay}
                    </span>
                    <span className="wp-rating-tag">★ {worker.rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================
          4. ALL WORKERS PRODUCTIVITY ROSTER
      ========================================= */}
      <section className="wp-section">
        <div className="wp-controls-row">
          <div className="wp-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search worker by name, ID, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </div>

          <div className="wp-filter-group">
            <div className="wp-pills">
              {["All", "Available", "On Leave"].map((tab) => (
                <button
                  key={tab}
                  className={`wp-pill-btn ${filterStatus === tab ? "active" : ""}`}
                  onClick={() => setFilterStatus(tab)}
                >
                  {tab === "Available" && <span className="dot dot-active"></span>}
                  {tab === "On Leave" && <span className="dot dot-leave"></span>}
                  {tab}
                </button>
              ))}
            </div>

            <div className="wp-sort-select">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="completed">Most Completed</option>
                <option value="rate">Highest Completion Rate</option>
                <option value="rating">Highest Rating</option>
                <option value="ontime">Best On-Time Rate</option>
              </select>
            </div>
          </div>
        </div>

        {/* WORKER PRODUCTIVITY CARDS */}
        {filteredWorkers.length === 0 ? (
          <div className="wp-empty-state">
            <Users size={48} strokeWidth={1.5} />
            <h3>No workers found</h3>
            <p>Try adjusting your search criteria or availability filter.</p>
          </div>
        ) : (
          <div className="wp-workers-grid">
            {filteredWorkers.map((worker) => (
              <div key={worker.workerId} className="wp-worker-card">
                {/* CARD HEADER */}
                <div className="wp-card-header">
                  <div className="wp-avatar-box">
                    <div className="wp-avatar-circle">
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{worker.name}</h4>
                      <span className="wp-code">{worker.employeeCode} · {worker.role}</span>
                    </div>
                  </div>

                  <span
                    className={`wp-status-chip ${
                      worker.availabilityStatus === "ACTIVE"
                        ? "status-available"
                        : worker.availabilityStatus === "ON_LEAVE"
                        ? "status-on-leave"
                        : "status-inactive"
                    }`}
                  >
                    ● {worker.statusDisplay}
                  </span>
                </div>

                {/* METRICS ROW */}
                <div className="wp-metrics-row">
                  <div className="wp-metric-box">
                    <span className="m-val">{worker.completedCount}</span>
                    <span className="m-lbl">Completed</span>
                  </div>
                  <div className="wp-metric-box">
                    <span className="m-val in-prog">{worker.inProgressCount}</span>
                    <span className="m-lbl">In Progress</span>
                  </div>
                  <div className="wp-metric-box">
                    <span className="m-val pending">{worker.pendingCount}</span>
                    <span className="m-lbl">Pending</span>
                  </div>
                  <div className="wp-metric-box">
                    <span className="m-val total">{worker.totalAssigned}</span>
                    <span className="m-lbl">Total Tasks</span>
                  </div>
                </div>

                {/* COMPLETION RATE BAR */}
                <div className="wp-progress-section">
                  <div className="wp-prog-labels">
                    <span>Task Completion Rate</span>
                    <strong>{worker.completionRate}%</strong>
                  </div>
                  <div className="wp-prog-track">
                    <div
                      className="wp-prog-fill"
                      style={{
                        width: `${worker.completionRate}%`,
                        backgroundColor:
                          worker.completionRate >= 75
                            ? "#10b981"
                            : worker.completionRate >= 40
                            ? "#4f46e5"
                            : "#f59e0b",
                      }}
                    />
                  </div>
                </div>

                {/* EXTRA DETAILS */}
                <div className="wp-card-footer-info">
                  <div className="wp-foot-item">
                    <Clock size={14} />
                    <span>Avg Turnaround: <strong>~{worker.avgCompletionHours}h</strong></span>
                  </div>
                  <div className="wp-foot-item">
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <span>Rating: <strong>{worker.rating}</strong></span>
                  </div>
                  <div className="wp-foot-item">
                    <span>On-Time: <strong>{worker.onTimeRate}%</strong></span>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="wp-card-action">
                  <button
                    className="wp-view-btn"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    View Performance Breakdown <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================
          5. WORKER DETAIL POPUP MODAL
      ========================================= */}
      {selectedWorker && (
        <div className="wp-modal-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="wp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wp-modal-head">
              <div className="wp-modal-user">
                <div className="wp-modal-avatar">
                  {selectedWorker.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedWorker.name}</h3>
                  <span>{selectedWorker.employeeCode} · {selectedWorker.role}</span>
                </div>
              </div>

              <button className="wp-close-btn" onClick={() => setSelectedWorker(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="wp-modal-body">
              {/* STATUS & CONTACT BANNER */}
              <div className="wp-modal-banner">
                <div className="wp-mb-item">
                  <span className="lbl">Availability</span>
                  <span
                    className={`wp-status-chip ${
                      selectedWorker.availabilityStatus === "ACTIVE"
                        ? "status-available"
                        : "status-on-leave"
                    }`}
                  >
                    ● {selectedWorker.statusDisplay}
                  </span>
                </div>
                <div className="wp-mb-item">
                  <span className="lbl">Shift</span>
                  <strong>{selectedWorker.shift}</strong>
                </div>
                <div className="wp-mb-item">
                  <span className="lbl">Phone</span>
                  <strong>{selectedWorker.phone || "N/A"}</strong>
                </div>
                <div className="wp-mb-item">
                  <span className="lbl">Overall Rating</span>
                  <strong style={{ color: "#f59e0b" }}>★ {selectedWorker.rating} / 5.0</strong>
                </div>
              </div>

              {/* STATS OVERVIEW */}
              <div className="wp-modal-stats-grid">
                <div className="wp-mstat">
                  <span className="val">{selectedWorker.totalAssigned}</span>
                  <span className="tit">Total Assigned</span>
                </div>
                <div className="wp-mstat">
                  <span className="val green">{selectedWorker.completedCount}</span>
                  <span className="tit">Completed</span>
                </div>
                <div className="wp-mstat">
                  <span className="val blue">{selectedWorker.inProgressCount}</span>
                  <span className="tit">In Progress</span>
                </div>
                <div className="wp-mstat">
                  <span className="val purple">{selectedWorker.completionRate}%</span>
                  <span className="tit">Completion Rate</span>
                </div>
              </div>

              {/* RECENT COMPLETED TASKS */}
              <div className="wp-modal-tasks-section">
                <h4>Recent Completed Tasks</h4>
                {selectedWorker.recentCompleted && selectedWorker.recentCompleted.length > 0 ? (
                  <div className="wp-tasks-list">
                    {selectedWorker.recentCompleted.map((t) => (
                      <div key={t.assignmentId} className="wp-task-row">
                        <div className="wp-task-icon">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="wp-task-desc">
                          <strong>{t.complaintCode}: {t.title}</strong>
                          <span>Completed on: {t.completedAt || "Recently"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="wp-no-tasks-text">No completed tasks on record yet for this worker.</p>
                )}
              </div>
            </div>

            <div className="wp-modal-foot">
              <button className="wp-btn-close" onClick={() => setSelectedWorker(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerProductivity;

