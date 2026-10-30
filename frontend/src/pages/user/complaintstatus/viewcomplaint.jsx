import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CircleDot,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  Inbox,
  X,
} from "lucide-react";
import userApi from "../../../services/userApi";
import "./viewcomplaint.css";

// logged in user (saved by the login page)
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

const STEPS = ["Submitted", "Assigned", "In Progress", "Completed"];

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  // close the details popup with the Escape key
  useEffect(() => {
    if (!selectedComplaint) return;
    const onKey = (e) => e.key === "Escape" && setSelectedComplaint(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedComplaint]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await userApi.getUserComplaints("All");
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setLoading(false);
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

  const cls = (value) => value.toLowerCase().replace(/\s+/g, "-");

  // how far along the repair is: 1 = submitted ... 4 = completed
  const stageOf = (status) => {
    const s = formatStatus(status);
    if (s === "Completed") return 4;
    if (s === "In Progress") return 3;
    if (s === "Assigned") return 2;
    return 1;
  };

  // ============================
  // SEARCH
  // ============================
  const query = search.toLowerCase();

  const filteredComplaints = complaints.filter(
    (complaint) =>
      (complaint.id || "").toLowerCase().includes(query) ||
      (complaint.title || "").toLowerCase().includes(query) ||
      (complaint.location || "").toLowerCase().includes(query)
  );

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => stageOf(c.status) <= 2).length,
    progress: complaints.filter((c) => stageOf(c.status) === 3).length,
    completed: complaints.filter((c) => stageOf(c.status) === 4).length,
  };

  const user = getUser();
  const initial = (user.name || "M").trim().charAt(0).toUpperCase();

  const statCards = [
    { label: "Total Reported", value: stats.total, icon: ClipboardList, tone: "total" },
    { label: "Not Assigned", value: stats.pending, icon: CircleDot, tone: "pending" },
    { label: "In Progress", value: stats.progress, icon: Wrench, tone: "progress" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "done" },
  ];

  return (
    <div className="vc-page">

      {/* ============================
          HEADER
      ============================ */}

      <div className="vc-header">
        <div className="vc-header-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="vc-header-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="vc-header-text">
          <h1>My Complaints</h1>
          <p>Track and view the complaints you have submitted.</p>
        </div>

        <div className="vc-user">
          <div className="vc-avatar">{initial}</div>
          <div>
            <h3>{user.name || "My Account"}</h3>
            {user.email && <span>{user.email}</span>}
          </div>
        </div>
      </div>


      {/* ============================
          STATISTICS
      ============================ */}

      <div className="vc-stats">
        {statCards.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`vc-stat vc-stat-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="vc-stat-icon">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>


      {/* ============================
          COMPLAINT CARDS
      ============================ */}

      <div className="vc-section">

        <div className="vc-section-head">
          <div>
            <h2>All Complaints</h2>
            <p>Search the complaints you have submitted</p>
          </div>

          <button
            className="vc-refresh"
            onClick={fetchComplaints}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              strokeWidth={2.5}
              className={loading ? "vc-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* SEARCH */}
        <div className="vc-search">
          <Search size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search by complaint ID, title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="vc-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="vc-loading">
            <div className="vc-loader" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
            </div>
            <p>Loading your complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="vc-empty">
            <Inbox size={36} strokeWidth={1.8} />
            <p>No complaints found.</p>
          </div>
        ) : (
          <div className="vc-grid">
            {filteredComplaints.map((complaint, i) => {
              const displayStatus = formatStatus(complaint.status);
              const displayPriority = formatPriority(complaint.priority);
              const stage = stageOf(complaint.status);

              return (
                <article
                  className={`vc-card vc-card-${cls(displayStatus)}`}
                  key={complaint.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}
                >
                  <div className="vc-card-top">
                    <span className="vc-id">{complaint.id}</span>
                    <span className={`vc-status ${cls(displayStatus)}`}>
                      <span className="vc-dot"></span>
                      {displayStatus}
                    </span>
                  </div>

                  <h3 className="vc-card-title">{complaint.title}</h3>

                  <div className="vc-meta">
                    <span>
                      <MapPin size={14} strokeWidth={2} />
                      {complaint.location}
                    </span>
                    <span>
                      <Calendar size={14} strokeWidth={2} />
                      {complaint.date}
                    </span>
                  </div>

                  {/* repair progress tracker */}
                  <div className="vc-track" aria-label={`Stage ${stage} of 4`}>
                    {STEPS.map((step, idx) => (
                      <div
                        key={step}
                        className={`vc-track-step ${idx + 1 <= stage ? "on" : ""} ${idx + 1 === stage ? "now" : ""}`}
                      >
                        <i></i>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="vc-card-bottom">
                    <span className={`vc-priority ${cls(displayPriority)}`}>
                      {displayPriority}
                    </span>

                    <button
                      className="vc-view"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      View Details
                      <ArrowRight size={15} strokeWidth={2.4} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>


      {/* ============================
          COMPLAINT DETAILS MODAL
      ============================ */}

      {selectedComplaint && (() => {
        const displayStatus = formatStatus(selectedComplaint.status);
        const displayPriority = formatPriority(selectedComplaint.priority);
        const stage = stageOf(selectedComplaint.status);

        return (
          <div
            className="vc-overlay"
            onClick={() => setSelectedComplaint(null)}
          >
            <div
              className="vc-modal"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Modal Header */}
              <div className="vc-modal-head">
                <div>
                  <span className="vc-modal-id">{selectedComplaint.id}</span>
                  <h2>{selectedComplaint.title}</h2>
                </div>

                <button
                  className="vc-close"
                  onClick={() => setSelectedComplaint(null)}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Status */}
              <div className="vc-modal-status">
                <span className={`vc-status ${cls(displayStatus)}`}>
                  <span className="vc-dot"></span>
                  {displayStatus}
                </span>

                <span className={`vc-priority ${cls(displayPriority)}`}>
                  {displayPriority} Priority
                </span>
              </div>

              {/* Details */}
              <div className="vc-details">
                <div className="vc-detail">
                  <label>Complaint ID</label>
                  <span>{selectedComplaint.id}</span>
                </div>

                <div className="vc-detail">
                  <label>Reported Date</label>
                  <span>{selectedComplaint.date}</span>
                </div>

                <div className="vc-detail">
                  <label>Issue Type</label>
                  <span>{selectedComplaint.issueType}</span>
                </div>

                <div className="vc-detail">
                  <label>Location</label>
                  <span>{selectedComplaint.location}</span>
                </div>

                <div className="vc-detail">
                  <label>Latitude</label>
                  <span>{selectedComplaint.latitude}</span>
                </div>

                <div className="vc-detail">
                  <label>Longitude</label>
                  <span>{selectedComplaint.longitude}</span>
                </div>
              </div>

              {/* Description */}
              <div className="vc-description">
                <label>Description</label>
                <p>{selectedComplaint.description}</p>
              </div>

              {/* Timeline */}
              <div className="vc-timeline-wrap">
                <h3>Complaint Status</h3>

                <div className="vc-timeline">

                  <div className="vc-tl-item done">
                    <div className="vc-tl-dot">
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                    </div>
                    <div>
                      <strong>Complaint Submitted</strong>
                      <span>{selectedComplaint.date}</span>
                    </div>
                  </div>

                  <div className={`vc-tl-item ${stage >= 2 ? "done" : ""}`}>
                    <div className="vc-tl-dot">2</div>
                    <div>
                      <strong>Work Assigned</strong>
                      <span>
                        {stage >= 2 ? "Workers assigned" : "Waiting for assignment"}
                      </span>
                    </div>
                  </div>

                  <div className={`vc-tl-item ${stage >= 3 ? "done" : ""}`}>
                    <div className="vc-tl-dot">3</div>
                    <div>
                      <strong>Work In Progress</strong>
                      <span>
                        {stage >= 3 ? "Repair work started" : "Not started"}
                      </span>
                    </div>
                  </div>

                  <div className={`vc-tl-item ${stage >= 4 ? "done" : ""}`}>
                    <div className="vc-tl-dot">
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                    </div>
                    <div>
                      <strong>Completed</strong>
                      <span>
                        {stage >= 4 ? "Repair completed" : "Waiting for completion"}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Close */}
              <button
                className="vc-modal-close"
                onClick={() => setSelectedComplaint(null)}
              >
                Close
              </button>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default ViewComplaints;