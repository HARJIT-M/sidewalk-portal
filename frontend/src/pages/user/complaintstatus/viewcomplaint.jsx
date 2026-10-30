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
  Link2,
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
  const [loadingDetails, setLoadingDetails] = useState(false);
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

  const handleOpenDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setLoadingDetails(true);
    try {
      const res = await userApi.getComplaintDetails(complaint.id || complaint.mongoId);
      if (res && res.success && res.complaint) {
        setSelectedComplaint((prev) => ({
          ...prev,
          ...res.complaint,
        }));
      }
    } catch (err) {
      console.warn("Could not load extended details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "CLOSED" || status === "COMPLETED") return "Completed";
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
      (complaint.location || "").toLowerCase().includes(query) ||
      (complaint.workGroupId || "").toLowerCase().includes(query)
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
          <p>Track and view the complaints you have submitted with real-time maintenance updates.</p>
        </div>

        <div className="vc-user">
          <div className="vc-avatar">{initial}</div>
          <div className="vc-user-text">
            <strong>{user.name || "Citizen"}</strong>
            <span>Verified Citizen</span>
          </div>
        </div>
      </div>


      {/* ============================
          STAT CARDS
      ============================ */}

      <div className="vc-stats">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              className={`vc-stat vc-stat-${card.tone} ${card.tone}`}
              key={card.label}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="vc-stat-icon">
                <Icon size={22} strokeWidth={2.4} />
              </div>
              <div className="vc-stat-text">
                <strong className="vc-stat-num">{card.value}</strong>
                <span className="vc-stat-label">{card.label}</span>
              </div>
            </div>
          );
        })}
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
            placeholder="Search by complaint ID, title, location or WorkGroup..."
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

                  {complaint.isDuplicate && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "12px",
                      background: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                      marginBottom: "8px",
                      width: "fit-content",
                    }}>
                      <Link2 size={12} /> Linked to {complaint.workGroupId || "Maintenance Group"}
                    </div>
                  )}

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
                      onClick={() => handleOpenDetails(complaint)}
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
        const submittedPhoto = selectedComplaint.image || (selectedComplaint.images && selectedComplaint.images[0]?.url) || null;

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

                {selectedComplaint.workGroupId && (
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "12px",
                    background: "#ede9fe",
                    color: "#6d28d9",
                    border: "1px solid #ddd6fe",
                  }}>
                    WorkGroup: {selectedComplaint.workGroupId}
                  </span>
                )}
              </div>

              {/* SMART DUPLICATE / UNIFIED MAINTENANCE ACTIVITY BANNER */}
              {selectedComplaint.isDuplicate && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  marginBottom: "18px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}>
                  <div style={{ color: "#16a34a", marginTop: "2px" }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#15803d", marginBottom: "3px", fontSize: "14px" }}>
                      Unified Maintenance Activity {selectedComplaint.workGroupId ? `(${selectedComplaint.workGroupId})` : ""}
                    </div>
                    <div style={{ fontSize: "13px", color: "#166534", lineHeight: "1.4" }}>
                      {selectedComplaint.linkedMessage ||
                        "Your complaint has been linked to an existing maintenance activity at this location. Our maintenance team is already working on this issue."}
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="vc-details">
                <div className="vc-detail">
                  <label>Complaint ID</label>
                  <span>{selectedComplaint.id}</span>
                </div>

                <div className="vc-detail">
                  <label>Reported Date</label>
                  <span>{selectedComplaint.date || selectedComplaint.reportedDate}</span>
                </div>

                <div className="vc-detail">
                  <label>Issue Type</label>
                  <span>{selectedComplaint.issueType}</span>
                </div>

                <div className="vc-detail">
                  <label>Reported Location</label>
                  <span>{selectedComplaint.location}</span>
                </div>

                {selectedComplaint.latitude && selectedComplaint.longitude && (
                  <>
                    <div className="vc-detail">
                      <label>Latitude</label>
                      <span>{selectedComplaint.latitude}</span>
                    </div>

                    <div className="vc-detail">
                      <label>Longitude</label>
                      <span>{selectedComplaint.longitude}</span>
                    </div>
                  </>
                )}

                {/* Assigned maintenance crew (workers) */}
                {selectedComplaint.assignedWorkers && selectedComplaint.assignedWorkers.length > 0 && (
                  <div className="vc-detail">
                    <label>Assigned Maintenance Crew</label>
                    <span style={{ fontWeight: 600, color: "#4f46e5" }}>
                      {selectedComplaint.assignedWorkers.join(", ")}
                    </span>
                  </div>
                )}

                {/* Scheduled / Work Dates */}
                {selectedComplaint.workStartDate && (
                  <div className="vc-detail">
                    <label>Work Start Date</label>
                    <span>
                      {new Date(selectedComplaint.workStartDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {selectedComplaint.workEndDate && (
                  <div className="vc-detail">
                    <label>Estimated / Completed Date</label>
                    <span>
                      {new Date(selectedComplaint.workEndDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="vc-description">
                <label>Description</label>
                <p>{selectedComplaint.description || "No description provided."}</p>
              </div>

              {/* Submitted Photo */}
              {submittedPhoto && (
                <div style={{ marginTop: "14px", marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    Your Submitted Photo
                  </label>
                  <img
                    src={submittedPhoto}
                    alt="Reported footpath damage"
                    style={{
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              )}

              {/* Timeline */}
              <div className="vc-timeline-wrap">
                <h3>Shared Maintenance Progress</h3>

                <div className="vc-timeline">

                  <div className="vc-tl-item done">
                    <div className="vc-tl-dot">
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                    </div>
                    <div>
                      <strong>Complaint Submitted</strong>
                      <span>{selectedComplaint.date || selectedComplaint.reportedDate}</span>
                    </div>
                  </div>

                  <div className={`vc-tl-item ${stage >= 2 ? "done" : ""}`}>
                    <div className="vc-tl-dot">2</div>
                    <div>
                      <strong>Work Assigned</strong>
                      <span>
                        {stage >= 2
                          ? selectedComplaint.assignedWorkers?.length
                            ? `Assigned to ${selectedComplaint.assignedWorkers.join(", ")}`
                            : "Maintenance crew assigned"
                          : "Waiting for assignment"}
                      </span>
                    </div>
                  </div>

                  <div className={`vc-tl-item ${stage >= 3 ? "done" : ""}`}>
                    <div className="vc-tl-dot">3</div>
                    <div>
                      <strong>Work In Progress</strong>
                      <span>
                        {stage >= 3 ? "Repair work actively in progress on site" : "Not started"}
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
                        {stage >= 4 ? "Footpath repair completed and verified" : "Waiting for completion"}
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
