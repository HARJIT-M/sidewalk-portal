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
          <div className="stat-icon complete-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{loading ? "..." : completedWorks}</strong>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className="tracking-controls">
        <div className="tracking-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search work ID, issue title, location, worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* ================= MAIN SPLIT LAYOUT ================= */}
      <div className="tracking-layout">
        {/* LEFT COLUMN: LIST OF WORK */}
        <div className="tracking-list">
          {loading ? (
            <div className="no-works">
              <p>Loading live repair operations...</p>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="no-works">
              <p>No repair works found matching the criteria.</p>
            </div>
          ) : (
            filteredWorks.map((work) => {
              const isSelected = selectedWork && selectedWork.id === work.id;

              return (
                <div
                  key={work.id || work.mongoId}
                  className={`work-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedId(work.id)}
                >
                  <div className="work-item-top">
                    <span className="work-id">{work.id}</span>
                    <span
                      className={`status-badge ${statusClass(work.status)}`}
                    >
                      {work.status}
                    </span>
                  </div>

                  <h3 className="work-title">{work.title}</h3>

                  <div className="work-location">
                    <MapPin size={14} />
                    <span>{work.location}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-container">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${work.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{work.progress || 0}%</span>
                  </div>

                  <div className="work-meta">
                    <span>
                      <Users size={14} />
                      {work.assignedWorkers && work.assignedWorkers.length > 0
                        ? work.assignedWorkers.join(", ")
                        : "Unassigned"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: WORK DETAILS & TIMELINE */}
        <div className="tracking-details">
          {selectedWork ? (
            <>
              <div className="details-card-header">
                <div>
                  <div className="header-meta">
                    <span className="selected-id">{selectedWork.id}</span>
                    <span
                      className={`status-badge ${statusClass(
                        selectedWork.status
                      )}`}
                    >
                      {selectedWork.status}
                    </span>
                  </div>

                  <h2>{selectedWork.title}</h2>
                  <p className="detail-location">
                    <MapPin size={16} />
                    {selectedWork.location}
                  </p>
                </div>

                <div className="priority-tag">
                  <Flag size={14} />
                  <span>{selectedWork.priority || "Medium"} Priority</span>
                </div>
              </div>

              {/* Progress Large */}
              <div className="details-progress-card">
                <div className="progress-header">
                  <span>Current Repair Completion</span>
                  <strong>{selectedWork.progress || 0}%</strong>
                </div>

                <div className="progress-bar-large-bg">
                  <div
                    className="progress-bar-large-fill"
                    style={{ width: `${selectedWork.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="details-grid">
                <div className="grid-item">
                  <Calendar size={18} />
                  <div>
                    <label>Assigned Date</label>
                    <span>{selectedWork.assignedDate || "—"}</span>
                  </div>
                </div>

                <div className="grid-item">
                  <Clock size={18} />
                  <div>
                    <label>Work Started</label>
                    <span>{selectedWork.startedDate || "—"}</span>
                  </div>
                </div>

                <div className="grid-item">
                  <Users size={18} />
                  <div>
                    <label>Maintenance Team</label>
                    <span>
                      {selectedWork.assignedWorkers &&
                      selectedWork.assignedWorkers.length > 0
                        ? selectedWork.assignedWorkers.join(", ")
                        : "None assigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Update Box */}
              <div className="latest-update-box">
                <h4>Latest Field Observation</h4>
                <p>{selectedWork.lastUpdate || "No field notes logged yet."}</p>
                <div className="update-meta">
                  <span>Updated by: {selectedWork.updatedBy || "System"}</span>
                  <span>{selectedWork.updatedAt || ""}</span>
                </div>
              </div>

              {/* History Timeline */}
              <div className="timeline-section">
                <h4>Execution Timeline & Status Updates</h4>

                <div className="timeline-list">
                  {!selectedWork.history || selectedWork.history.length === 0 ? (
                    <p style={{ color: "#6b7280", padding: "10px 0" }}>
                      No history events recorded yet.
                    </p>
                  ) : (
                    selectedWork.history.map((item, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-top">
                            <strong>{item.worker || "Crew Member"}</strong>
                            <span className="timeline-time">{item.date}</span>
                          </div>
                          <p>{item.message}</p>
                          <span className="timeline-progress-tag">
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
            <div className="no-selection">
              <ClipboardList size={40} />
              <h3>Select a Task</h3>
              <p>Choose an assigned work from the left panel to inspect real-time progress.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkTracking;