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
import userApi from "../../../services/userApi";
import "./new_track.css";

const WorkTracking = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedWorkDetails, setSelectedWorkDetails] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWorks();
  }, [statusFilter]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const data = await userApi.getUserComplaints(statusFilter);
      if (data.success) {
        setWorks(data.complaints);
        if (data.complaints.length > 0 && !selectedId) {
          setSelectedId(data.complaints[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch works:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchWorkDetails(selectedId);
    }
  }, [selectedId]);

  const fetchWorkDetails = async (id) => {
    try {
      const data = await userApi.getComplaintDetails(id);
      if (data.success) {
        setSelectedWorkDetails(data.complaint);
      }
    } catch (error) {
      console.error("Failed to fetch complaint details:", error);
    }
  };

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

  // Filter work
  const filteredWorks = works.filter((work) => {
    const matchesSearch =
      work.id.toLowerCase().includes(search.toLowerCase()) ||
      work.title.toLowerCase().includes(search.toLowerCase()) ||
      work.location.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const selectedWorkListItem = works.find((w) => w.id === selectedId) || null;

  // Counts
  const totalWorks = works.length;

  const assignedWorks = works.filter(
    (work) => formatStatus(work.status) === "Assigned" || formatStatus(work.status) === "Pending"
  ).length;

  const inProgressWorks = works.filter(
    (work) => formatStatus(work.status) === "In Progress"
  ).length;

  const completedWorks = works.filter(
    (work) => formatStatus(work.status) === "Completed"
  ).length;

  const statusClass = (status) => status ? status.toLowerCase().replace(" ", "-") : "";


  return (
    <div className="work-tracking-page">

      {/* ================= HEADER ================= */}

      <div className="tracking-header">
        <div>
          <h1>Work Tracking</h1>
          <p>Monitor assigned complaints and repair progress</p>
        </div>
      </div>


      {/* ================= STATISTICS ================= */}

      <div className="tracking-stats">

        <div className="tracking-stat">
          <div className="stat-icon total-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Total Works</span>
            <strong>{totalWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon assigned-icon">
            <Pin size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Assigned</span>
            <strong>{assignedWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon progress-icon">
            <Wrench size={22} strokeWidth={2} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{inProgressWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon completed-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedWorks}</strong>
          </div>
        </div>

      </div>


      {/* ================= SPLIT LAYOUT ================= */}

      <div className="tracking-split">

        {/* -------- LEFT: WORK LIST -------- */}

        <div className="tracking-list-panel">

          <div className="tracking-search">
            <Search size={16} strokeWidth={2} />

            <input
              type="text"
              placeholder="Search complaint or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="status-pill-filters">
            {["All", "Assigned", "In Progress", "Completed"].map((s) => (
              <button
                key={s}
                className={`status-pill-filter ${
                  statusFilter === s ? "active" : ""
                }`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="work-list-scroll">

            {filteredWorks.length > 0 ? (

              filteredWorks.map((work) => {
                const displayStatus = formatStatus(work.status);
                let progress = 10;
                if (displayStatus === "Assigned") progress = 30;
                if (displayStatus === "In Progress") progress = 75;
                if (displayStatus === "Completed") progress = 100;

                return (
                <button
                  key={work.id}
                  className={`work-list-item ${
                    selectedId === work.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedId(work.id)}
                >

                  <div className="work-list-item-top">
                    <span className="work-id-tag">{work.id}</span>
                    <span
                      className={`work-status ${statusClass(displayStatus)}`}
                    >
                      {displayStatus}
                    </span>
                  </div>

                  <h3>{work.title}</h3>

                  <p className="work-list-location">
                    <MapPin size={12} strokeWidth={2} />
                    {work.location}
                  </p>

                  <div className="work-list-progress">
                    <div className="work-list-progress-track">
                      <div
                        className={`work-list-progress-fill ${statusClass(
                          displayStatus
                        )}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span>{progress}%</span>
                  </div>

                </button>
              )})

            ) : (

              <div className="work-list-empty">No matching work items.</div>

            )}

          </div>

        </div>


        {/* -------- RIGHT: DETAIL PANEL -------- */}

        <div className="tracking-detail-panel">

          {selectedWorkDetails ? (

            <>
              {/* Detail Header */}

              <div className="detail-header">

                <div>
                  <span className="work-id-tag">{selectedWorkDetails.id}</span>
                  <h2>{selectedWorkDetails.title}</h2>
                  <p className="work-list-location">
                    <MapPin size={13} strokeWidth={2} />
                    {selectedWorkDetails.location}
                  </p>
                </div>

                <div className="detail-header-badges">
                  <span
                    className={`work-status ${statusClass(formatStatus(selectedWorkDetails.status))}`}
                  >
                    {formatStatus(selectedWorkDetails.status)}
                  </span>
                  <span
                    className={`priority-small ${formatPriority(selectedWorkDetails.priority).toLowerCase()}`}
                  >
                    <Flag size={11} strokeWidth={2.5} />
                    {formatPriority(selectedWorkDetails.priority)}
                  </span>
                </div>

              </div>


              {/* Progress */}

              <div className="detail-progress-box">
                {(() => {
                  let p = 10;
                  const s = formatStatus(selectedWorkDetails.status);
                  if (s === "Assigned") p = 30;
                  if (s === "In Progress") p = 75;
                  if (s === "Completed") p = 100;

                  return (
                    <>
                      <div className="detail-progress-top">
                        <span>Repair Progress</span>
                        <strong>{p}%</strong>
                      </div>

                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${statusClass(s)}`}
                          style={{ width: `${p}%` }}
                        ></div>
                      </div>
                    </>
                  );
                })()}
              </div>


              {/* Info Grid */}

              <div className="detail-info-grid">

                <div className="detail-info-item">
                  <span>
                    <Calendar size={13} strokeWidth={2} /> Reported Date
                  </span>
                  <strong>{selectedWorkDetails.reportedDate || "-"}</strong>
                </div>

                <div className="detail-info-item">
                  <span>
                    <Clock size={13} strokeWidth={2} /> Assigned Date
                  </span>
                  <strong>{selectedWorkDetails.assignedDate || "-"}</strong>
                </div>

                <div className="detail-info-item">
                  <span>
                    <Calendar size={13} strokeWidth={2} /> Work Started
                  </span>
                  <strong>{selectedWorkDetails.workStartDate ? new Date(selectedWorkDetails.workStartDate).toLocaleDateString() : "-"}</strong>
                </div>

              </div>


              {/* Assigned Team */}
              {selectedWorkDetails.assignedWorkers && selectedWorkDetails.assignedWorkers.length > 0 && (
                <div className="detail-team-block">
                  <h3>
                    <Users size={15} strokeWidth={2} /> Assigned Team
                  </h3>

                  <div className="worker-list">
                    {selectedWorkDetails.assignedWorkers.map((worker, i) => (
                      <span key={i}>👤 {worker}</span>
                    ))}
                  </div>
                </div>
              )}


              {/* Update History */}
              <div className="work-history">
                <h3>Work Updates & History</h3>

                {selectedWorkDetails.statusHistory && selectedWorkDetails.statusHistory.length > 0 ? (
                  selectedWorkDetails.statusHistory.map((update, index) => (
                    <div className="history-item" key={index}>
                      <div className="history-line">
                        <div className="history-dot"></div>
                      </div>
                      <div className="history-content">
                        <div className="history-top">
                          <strong>{update.changedBy}</strong>
                          <span>{update.date}</span>
                        </div>
                        <p>{update.note}</p>
                        <span className="history-progress">
                          Status: {formatStatus(update.status)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    No updates available.
                  </div>
                )}
              </div>

            </>

          ) : (

            <div className="detail-empty">
              Select a work item from the list to view its details.
            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default WorkTracking;