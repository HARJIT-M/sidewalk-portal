import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Pin,
  Wrench,
  CheckCircle2,
  Search,
  MapPin,
  Users,
  Calendar,
  Flag,
  RefreshCw,
  Clock,
} from "lucide-react";
import { getAllWorkTracking } from "../../../services/managerApi";
import "./new_track.css";

const WorkTracking = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadWorkTracking = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getAllWorkTracking();
      if (res && res.success) {
        const list = res.repairs || res.works || [];
        setWorks(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading work tracking data:", err);
      setErrorMsg(err.message || "Failed to load work tracking records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkTracking();
  }, []);

  // Filter work
  const filteredWorks = works.filter((work) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (work.id && work.id.toLowerCase().includes(q)) ||
      (work.title && work.title.toLowerCase().includes(q)) ||
      (work.location && work.location.toLowerCase().includes(q)) ||
      (work.assignedWorkers &&
        work.assignedWorkers.some((worker) => worker.toLowerCase().includes(q)));

    const matchesStatus =
      statusFilter === "All" ||
      (work.status && work.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const selectedWork =
    works.find((w) => w.id === selectedId) || filteredWorks[0] || null;

  // Counts
  const totalWorks = works.length;

  const assignedWorks = works.filter(
    (work) =>
      work.status === "Assigned" ||
      work.status === "ASSIGNED" ||
      work.status === "Pending" ||
      work.status === "PENDING"
  ).length;

  const inProgressWorks = works.filter(
    (work) =>
      work.status === "In Progress" || work.status === "IN_PROGRESS"
  ).length;

  const completedWorks = works.filter(
    (work) =>
      work.status === "Completed" ||
      work.status === "RESOLVED" ||
      work.status === "CLOSED"
  ).length;

  const statusClass = (status) =>
    status ? status.toLowerCase().replace(" ", "-") : "pending";

  return (
    <div className="work-tracking-page">
      {/* ================= HEADER ================= */}
      <div className="tracking-header">
        <div>
          <h1>Work Tracking</h1>
          <p>Monitor real-time task progress, on-site materials, and repair lifecycles</p>
        </div>

        <button
          onClick={loadWorkTracking}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #fecaca",
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ================= STATISTICS ================= */}
      <div className="tracking-stats">
        <div className="tracking-stat">
          <div className="stat-icon total-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Total Works</span>
            <strong>{loading ? "..." : totalWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon assigned-icon">
            <Pin size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Assigned</span>
            <strong>{loading ? "..." : assignedWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon progress-icon">
            <Wrench size={22} strokeWidth={2} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{loading ? "..." : inProgressWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon completed-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{loading ? "..." : completedWorks}</strong>
          </div>
        </div>
      </div>

      {/* ================= MAIN SPLIT LAYOUT ================= */}
      <div className="tracking-split">
        {/* LEFT COLUMN: LIST OF WORK */}
        <div className="tracking-list-panel">
          <div className="tracking-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search work ID, issue title, location, worker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="status-pill-filters">
            {["All", "Assigned", "In Progress", "Completed"].map((status) => (
              <div
                key={status}
                className={`status-pill-filter ${statusFilter === status ? "active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </div>
            ))}
          </div>

          <div className="work-list-scroll">
            {loading ? (
              <div className="work-list-empty">
                <p>Loading live repair operations...</p>
              </div>
            ) : filteredWorks.length === 0 ? (
              <div className="work-list-empty">
                <p>No repair works found matching the criteria.</p>
              </div>
            ) : (
              filteredWorks.map((work) => {
                const isSelected = selectedWork && selectedWork.id === work.id;

                return (
                  <div
                    key={work.id || work.mongoId}
                    className={`work-list-item ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedId(work.id)}
                  >
                    <div className="work-list-item-top">
                      <span className="work-id-tag">{work.id}</span>
                      <span
                        className={`work-status ${statusClass(work.status)}`}
                      >
                        {work.status}
                      </span>
                    </div>

                    <h3>{work.title}</h3>

                    <div className="work-list-location">
                      <MapPin size={14} />
                      <span>{work.location}</span>
                    </div>

                    <div className="work-list-location" style={{ marginTop: "2px" }}>
                      <Users size={14} />
                      <span>
                        {work.assignedWorkers && work.assignedWorkers.length > 0
                          ? work.assignedWorkers.join(", ")
                          : "Unassigned"}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="work-list-progress">
                      <div className="work-list-progress-track">
                        <div
                          className="work-list-progress-fill"
                          style={{
                            width: `${work.progress || 0}%`,
                            background: "linear-gradient(90deg, #4f46e5, #7c3aed)"
                          }}
                        ></div>
                      </div>
                      <span>{work.progress || 0}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORK DETAILS & TIMELINE */}
        <div className="tracking-detail-panel">
          {selectedWork ? (
            <>
              <div className="detail-header">
                <div>
                  <div className="detail-header-badges">
                    <span className="work-id-tag">{selectedWork.id}</span>
                    <span
                      className={`work-status ${statusClass(
                        selectedWork.status
                      )}`}
                    >
                      {selectedWork.status}
                    </span>
                    <span className={`priority-small ${selectedWork.priority ? selectedWork.priority.toLowerCase() : "medium"}`}>
                      <Flag size={12} /> {selectedWork.priority || "Medium"} Priority
                    </span>
                  </div>

                  <h2>{selectedWork.title}</h2>
                  <div className="work-list-location">
                    <MapPin size={16} />
                    <span>{selectedWork.location}</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="detail-progress-box">
                <div className="detail-progress-top">
                  <span>Current Repair Completion</span>
                  <strong>{selectedWork.progress || 0}%</strong>
                </div>

                <div className="progress-bar">
                  <div
                    className={`progress-fill ${statusClass(selectedWork.status)}`}
                    style={{ width: `${selectedWork.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <span>
                    <Calendar size={14} /> Assigned Date
                  </span>
                  <strong>{selectedWork.assignedDate || "—"}</strong>
                </div>

                <div className="detail-info-item">
                  <span>
                    <Clock size={14} /> Work Started
                  </span>
                  <strong>{selectedWork.startedDate || "—"}</strong>
                </div>
              </div>

              {/* Team Block */}
              <div className="detail-team-block">
                <h3>
                  <Users size={16} /> Maintenance Team
                </h3>
                <div className="worker-list">
                  {selectedWork.assignedWorkers &&
                  selectedWork.assignedWorkers.length > 0 ? (
                    selectedWork.assignedWorkers.map((worker, idx) => (
                      <span key={idx}>{worker}</span>
                    ))
                  ) : (
                    <span style={{ background: "#f0f0f6", color: "#a9a5bd" }}>None assigned</span>
                  )}
                </div>
              </div>

              {/* Latest Update Box */}
              <div className="last-update">
                <div className="update-icon">
                  <Wrench size={20} />
                </div>
                <div>
                  <span>Latest Field Observation</span>
                  <p>{selectedWork.lastUpdate || "No field notes logged yet."}</p>
                  <small>
                    Updated by {selectedWork.updatedBy || "System"}{" "}
                    {selectedWork.updatedAt && `• ${selectedWork.updatedAt}`}
                  </small>
                </div>
              </div>

              {/* History Timeline */}
              <div className="work-history">
                <h3>Execution Timeline & Status Updates</h3>
                <div style={{ marginTop: "15px" }}>
                  {!selectedWork.history || selectedWork.history.length === 0 ? (
                    <p style={{ color: "#9c99b4", fontSize: "13px" }}>
                      No history events recorded yet.
                    </p>
                  ) : (
                    selectedWork.history.map((item, index) => (
                      <div key={index} className="history-item">
                        <div className="history-line">
                          <div className="history-dot"></div>
                        </div>
                        <div className="history-content">
                          <div className="history-top">
                            <strong>{item.worker || "Crew Member"}</strong>
                            <span>{item.date}</span>
                          </div>
                          <p>{item.message}</p>
                          <span className="history-progress">
                            Progress reached: {item.progress}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <div style={{ textAlign: "center" }}>
                <ClipboardList size={40} style={{ margin: "0 auto 15px", color: "#d8d3f5" }} />
                <h3>Select a Task</h3>
                <p style={{ marginTop: "8px" }}>Choose an assigned work from the left panel to inspect real-time progress.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkTracking;