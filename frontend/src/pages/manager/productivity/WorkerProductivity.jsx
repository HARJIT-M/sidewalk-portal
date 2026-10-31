import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Star,
  Search,
  RefreshCw,
  ChevronRight,
  X,
  Activity,
  AlertCircle,
  Trophy,
  Medal,
  Phone,
  Timer,
} from "lucide-react";
import { getWorkerProductivity } from "../../../services/managerApi";
import "./WorkerProductivity.css";

const RANKS = [
  { cls: "rank-1", label: "#1 Performer", icon: Trophy },
  { cls: "rank-2", label: "#2 Runner Up", icon: Medal },
  { cls: "rank-3", label: "#3 Star Worker", icon: Medal },
];

// colour tier of a completion-rate bar
const rateTier = (rate) => (rate >= 75 ? "high" : rate >= 40 ? "mid" : "low");

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

  // close the details popup with the Escape key
  useEffect(() => {
    if (!selectedWorker) return undefined;
    const onKey = (e) => e.key === "Escape" && setSelectedWorker(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedWorker]);

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
        (worker.name || "").toLowerCase().includes(q) ||
        (worker.employeeCode || "").toLowerCase().includes(q) ||
        (worker.role || "").toLowerCase().includes(q) ||
        (worker.phone || "").includes(q);

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

  const availabilityClass = (status) =>
    status === "ACTIVE"
      ? "available"
      : status === "ON_LEAVE"
      ? "on-leave"
      : "inactive";

  const kpiCards = [
    {
      label: "Completed Repairs",
      icon: CheckCircle2,
      tone: "blue",
      value: summary.totalCompletedTasks,
      foot: (
        <>
          Out of <strong>{summary.totalAssignedTasks}</strong> total assigned tasks
        </>
      ),
    },
    {
      label: "Team Completion Rate",
      icon: TrendingUp,
      tone: "green",
      value: `${summary.teamCompletionRate}%`,
      bar: Math.min(100, summary.teamCompletionRate),
    },
    {
      label: "Workforce Status",
      icon: Users,
      tone: "purple",
      value: (
        <>
          <span className="wp-num-active">{summary.activeWorkers}</span>
          <span className="wp-num-sep">/</span>
          <span className="wp-num-leave">{summary.onLeaveWorkers}</span>
        </>
      ),
      foot: (
        <>
          <span className="wp-dot wp-dot-active"></span> {summary.activeWorkers} Available
          <span className="wp-foot-gap"></span>
          <span className="wp-dot wp-dot-leave"></span> {summary.onLeaveWorkers} On Leave
        </>
      ),
    },
    {
      label: "Avg Quality Rating",
      icon: Star,
      tone: "amber",
      value: `${summary.averageTeamRating} ★`,
      foot: "Based on verified completed maintenance work",
    },
  ];

  return (
    <div className="wp-page">

      {/* =========================================
          1. HERO
      ========================================= */}
      <section className="wp-hero">
        <div className="wp-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="wp-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="wp-hero-text">
          <span className="wp-hero-tag">
            <Activity size={14} strokeWidth={2.4} /> Team Performance Operations
          </span>
          <h1>Worker Productivity Dashboard</h1>
          <p>
            Monitor team resolution velocity, completion rates, workforce availability, and
            individual worker performance in real time.
          </p>
        </div>

        <button className="wp-hero-btn" onClick={loadData} disabled={loading}>
          <RefreshCw
            size={16}
            strokeWidth={2.5}
            className={loading ? "wp-spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh Metrics"}
        </button>
      </section>

      {errorMsg && (
        <div className="wp-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          <span>{errorMsg}</span>
          <button onClick={loadData}>Retry</button>
        </div>
      )}

      {/* =========================================
          2. KPI SUMMARY CARDS
      ========================================= */}
      <section className="wp-kpis">
        {kpiCards.map(({ label, icon: Icon, tone, value, foot, bar }, i) => (
          <div
            className={`wp-kpi wp-kpi-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="wp-kpi-top">
              <span>{label}</span>
              <div className="wp-kpi-icon">
                <Icon size={21} strokeWidth={2.2} />
              </div>
            </div>
            <div className="wp-kpi-value">{loading && !productivityData ? "..." : value}</div>
            {bar !== undefined && (
              <div className="wp-kpi-track">
                <div className="wp-kpi-fill" style={{ width: `${bar}%` }} />
              </div>
            )}
            {foot && <div className="wp-kpi-foot">{foot}</div>}
          </div>
        ))}
      </section>

      {/* =========================================
          3. LEADERBOARD
      ========================================= */}
      {leaderboard.length > 0 && (
        <section className="wp-panel">
          <div className="wp-panel-head">
            <div className="wp-panel-icon gold">
              <Award size={21} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Top Performing Workers</h2>
              <p>Leading crew members ranked by total completed repairs and efficiency</p>
            </div>
          </div>

          <div className="wp-leaders">
            {leaderboard.slice(0, 3).map((worker, idx) => {
              const rank = RANKS[idx];
              const RankIcon = rank.icon;

              return (
                <div key={worker.workerId} className={`wp-leader ${rank.cls}`}>
                  <span className="wp-rank-pill">
                    <RankIcon size={13} strokeWidth={2.5} />
                    {rank.label}
                  </span>

                  <div className="wp-leader-avatar">
                    {worker.name.charAt(0).toUpperCase()}
                  </div>

                  <h3>{worker.name}</h3>
                  <span className="wp-leader-code">
                    {worker.employeeCode} · {worker.role}
                  </span>

                  <div className="wp-leader-stats">
                    <div>
                      <strong>{worker.completedCount}</strong>
                      <span>Completed</span>
                    </div>
                    <i></i>
                    <div>
                      <strong>{worker.completionRate}%</strong>
                      <span>Rate</span>
                    </div>
                    <i></i>
                    <div>
                      <strong>{worker.onTimeRate}%</strong>
                      <span>On-Time</span>
                    </div>
                  </div>

                  <div className="wp-leader-foot">
                    <span className={`wp-chip ${availabilityClass(worker.availabilityStatus)}`}>
                      <span className="wp-dot"></span>
                      {worker.statusDisplay}
                    </span>
                    <span className="wp-rating">
                      <Star size={13} fill="currentColor" strokeWidth={0} />
                      {worker.rating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================
          4. ROSTER
      ========================================= */}
      <section className="wp-panel">
        <div className="wp-controls">
          <div className="wp-search">
            <Search size={18} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search worker by name, ID, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="wp-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="wp-control-group">
            <div className="wp-tabs">
              {["All", "Available", "On Leave"].map((tab) => (
                <button
                  key={tab}
                  className={`wp-tab ${filterStatus === tab ? "active" : ""}`}
                  onClick={() => setFilterStatus(tab)}
                >
                  {tab === "Available" && <span className="wp-dot wp-dot-active"></span>}
                  {tab === "On Leave" && <span className="wp-dot wp-dot-leave"></span>}
                  {tab}
                </button>
              ))}
            </div>

            <label className="wp-sort">
              Sort by
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="completed">Most Completed</option>
                <option value="rate">Highest Completion Rate</option>
                <option value="rating">Highest Rating</option>
                <option value="ontime">Best On-Time Rate</option>
              </select>
            </label>
          </div>
        </div>

        {filteredWorkers.length === 0 ? (
          <div className="wp-empty">
            <Users size={44} strokeWidth={1.6} />
            <h3>No workers found</h3>
            <p>Try adjusting your search criteria or availability filter.</p>
          </div>
        ) : (
          <div className="wp-grid">
            {filteredWorkers.map((worker, i) => (
              <article
                key={worker.workerId}
                className={`wp-card ${availabilityClass(worker.availabilityStatus)}`}
                style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}
              >
                {/* header */}
                <div className="wp-card-head">
                  <div className="wp-person">
                    <div className="wp-avatar">
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{worker.name}</h4>
                      <span className="wp-code">
                        {worker.employeeCode} · {worker.role}
                      </span>
                    </div>
                  </div>

                  <span className={`wp-chip ${availabilityClass(worker.availabilityStatus)}`}>
                    <span className="wp-dot"></span>
                    {worker.statusDisplay}
                  </span>
                </div>

                {/* metrics */}
                <div className="wp-metrics">
                  <div>
                    <strong className="done">{worker.completedCount}</strong>
                    <span>Completed</span>
                  </div>
                  <div>
                    <strong className="prog">{worker.inProgressCount}</strong>
                    <span>In Progress</span>
                  </div>
                  <div>
                    <strong className="pend">{worker.pendingCount}</strong>
                    <span>Pending</span>
                  </div>
                  <div>
                    <strong>{worker.totalAssigned}</strong>
                    <span>Total</span>
                  </div>
                </div>

                {/* completion rate */}
                <div className="wp-rate">
                  <div className="wp-rate-top">
                    <span>Task Completion Rate</span>
                    <strong>{worker.completionRate}%</strong>
                  </div>
                  <div className="wp-track">
                    <div
                      className={`wp-track-fill ${rateTier(worker.completionRate)}`}
                      style={{ width: `${worker.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* extra details */}
                <div className="wp-extras">
                  <span>
                    <Clock size={14} strokeWidth={2.2} />
                    Avg <strong>~{worker.avgCompletionHours}h</strong>
                  </span>
                  <span>
                    <Star size={14} fill="#f59e0b" strokeWidth={0} />
                    <strong>{worker.rating}</strong>
                  </span>
                  <span>
                    <Timer size={14} strokeWidth={2.2} />
                    On-time <strong>{worker.onTimeRate}%</strong>
                  </span>
                </div>

                <button
                  className="wp-view"
                  onClick={() => setSelectedWorker(worker)}
                >
                  View Performance Breakdown
                  <ChevronRight size={15} strokeWidth={2.5} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =========================================
          5. DETAIL POPUP
      ========================================= */}
      {selectedWorker && (
        <div className="wp-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="wp-modal" onClick={(e) => e.stopPropagation()}>

            <div className="wp-modal-head">
              <div className="wp-modal-user">
                <div className="wp-modal-avatar">
                  {selectedWorker.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedWorker.name}</h3>
                  <span>
                    {selectedWorker.employeeCode} · {selectedWorker.role}
                  </span>
                </div>
              </div>

              <button
                className="wp-close"
                onClick={() => setSelectedWorker(null)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="wp-modal-body">

              {/* status & contact */}
              <div className="wp-banner">
                <div>
                  <label>Availability</label>
                  <span className={`wp-chip ${availabilityClass(selectedWorker.availabilityStatus)}`}>
                    <span className="wp-dot"></span>
                    {selectedWorker.statusDisplay}
                  </span>
                </div>
                <div>
                  <label>Shift</label>
                  <strong>{selectedWorker.shift || "N/A"}</strong>
                </div>
                <div>
                  <label>Phone</label>
                  <strong className="wp-with-icon">
                    <Phone size={13} strokeWidth={2.3} />
                    {selectedWorker.phone || "N/A"}
                  </strong>
                </div>
                <div>
                  <label>Overall Rating</label>
                  <strong className="wp-gold">★ {selectedWorker.rating} / 5.0</strong>
                </div>
              </div>

              {/* stats overview */}
              <div className="wp-mstats">
                <div>
                  <strong>{selectedWorker.totalAssigned}</strong>
                  <span>Total Assigned</span>
                </div>
                <div>
                  <strong className="green">{selectedWorker.completedCount}</strong>
                  <span>Completed</span>
                </div>
                <div>
                  <strong className="blue">{selectedWorker.inProgressCount}</strong>
                  <span>In Progress</span>
                </div>
                <div>
                  <strong className="purple">{selectedWorker.completionRate}%</strong>
                  <span>Completion Rate</span>
                </div>
              </div>

              {/* recent completed */}
              <div className="wp-tasks">
                <h4>Recent Completed Tasks</h4>
                {selectedWorker.recentCompleted && selectedWorker.recentCompleted.length > 0 ? (
                  <div className="wp-tasks-list">
                    {selectedWorker.recentCompleted.map((t) => (
                      <div key={t.assignmentId} className="wp-task">
                        <div className="wp-task-icon">
                          <CheckCircle2 size={17} strokeWidth={2.4} />
                        </div>
                        <div>
                          <strong>
                            {t.complaintCode}: {t.title}
                          </strong>
                          <span>Completed on: {t.completedAt || "Recently"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="wp-no-tasks">
                    No completed tasks on record yet for this worker.
                  </p>
                )}
              </div>
            </div>

            <div className="wp-modal-foot">
              <button className="wp-btn-main" onClick={() => setSelectedWorker(null)}>
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