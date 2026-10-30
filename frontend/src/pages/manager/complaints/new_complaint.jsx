import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  CalendarRange,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Check,
  Inbox,
  ClipboardList,
  Users,
  Clock,
  Layers,
  Copy,
} from "lucide-react";
import {
  getManagerComplaints,
  getAvailableWorkers,
  updateComplaintPriority,
  assignComplaintWorkers,
  getComplaintDetails,
  getComplaintDuplicates,
} from "../../../services/managerApi";
import "./new_complaint.css";

const PRIORITY_LEVELS = ["Not Set", "Low", "Medium", "High", "Critical"];
const STATUS_FLOW = ["Not Assigned", "Assigned", "In Progress", "Completed"];
const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const loadData = () => {
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setErrorMsg("");
        return getManagerComplaints();
      })
      .then((compRes) => {
        if (!compRes?.success) {
          throw new Error(compRes?.message || "Server returned no complaints.");
        }
        setComplaints(compRes.complaints || []);
      })
      .catch((err) => {
        console.error("Error loading complaints data:", err);
        setErrorMsg(err.message || "Failed to load complaints.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showAssignPopup || !startDate || !endDate) {
      return undefined;
    }

    let isCurrentRequest = true;
    Promise.resolve()
      .then(() => {
        if (!isCurrentRequest) return null;
        setLoadingWorkers(true);
        return getAvailableWorkers({ startDate, endDate });
      })
      .then((res) => {
        if (!isCurrentRequest || !res) return;
        setAvailableWorkers(
          (res.workers || []).map((worker) => ({
            id: worker.workerId,
            employeeCode: worker.employeeCode,
            name: worker.name,
            role: worker.role || "Maintenance Worker",
            team: worker.team || "Assigned Team",
            phone: worker.phone || "",
          }))
        );
      })
      .catch((err) => {
        if (!isCurrentRequest) return;
        setAvailableWorkers([]);
        setErrorMsg(err.message || "Failed to load available workers.");
      })
      .finally(() => {
        if (isCurrentRequest) setLoadingWorkers(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [showAssignPopup, startDate, endDate]);

  // close popups with the Escape key
  useEffect(() => {
    if (!showDetails && !showAssignPopup) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowDetails(false);
        setShowAssignPopup(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showDetails, showAssignPopup]);

  const filteredComplaints = complaints.filter((complaint) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (complaint.id && complaint.id.toLowerCase().includes(q)) ||
      (complaint.title && complaint.title.toLowerCase().includes(q)) ||
      (complaint.location && complaint.location.toLowerCase().includes(q)) ||
      (complaint.city && complaint.city.toLowerCase().includes(q)) ||
      (complaint.locality && complaint.locality.toLowerCase().includes(q)) ||
      (complaint.reportedBy && complaint.reportedBy.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "All" ||
      (complaint.status && complaint.status.toLowerCase() === statusFilter.toLowerCase());

    const matchesPriority =
      priorityFilter === "All" ||
      (complaint.priority && complaint.priority.toLowerCase() === priorityFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ---- Priority Change ----
  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      setErrorMsg("");
      await updateComplaintPriority(complaintId, newPriority);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, priority: newPriority } : c
        )
      );

      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint((prev) => ({ ...prev, priority: newPriority }));
      }
      setSuccessMsg(`Priority updated to ${newPriority}.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error updating priority:", err);
      setErrorMsg(err.message || "Failed to update priority.");
    }
  };

  // ---- View Details ----
  const handleViewDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
    try {
      const res = await getComplaintDetails(complaint.id || complaint.mongoId);
      if (res && res.success && res.complaint) {
        setSelectedComplaint((prev) => ({
          ...prev,
          ...res.complaint,
        }));
      }
    } catch (err) {
      console.warn("Could not load extended details:", err);
    }
  };

  // ---- Assign Workers ----
  const handleOpenAssign = (complaint) => {
    if (complaint.priority === "Not Set" || !complaint.priority) {
      alert("Please set a priority before assigning workers.");
      return;
    }
    setSelectedComplaint(complaint);
    setSelectedWorkers([]);
    const start = complaint.workStartDate
      ? complaint.workStartDate.split("T")[0]
      : toDateInputValue(new Date());
    setStartDate(start);
    setEndDate(
      complaint.workEndDate ? complaint.workEndDate.split("T")[0] : start
    );
    setPotentialDuplicates([]);
    setSelectedDuplicates([]);
    setLoadingDuplicates(true);
    setShowAssignPopup(true);

    getComplaintDuplicates(complaint.id || complaint.mongoId)
      .then((res) => {
        if (res && res.success) {
          const dups = res.duplicates || [];
          setPotentialDuplicates(dups);
          setSelectedDuplicates(dups.map((d) => d.id || d.mongoId));
        }
      })
      .catch((err) => {
        console.warn("Could not load duplicate complaints:", err);
      })
      .finally(() => {
        setLoadingDuplicates(false);
      });
  };

  const toggleDuplicate = (dupId) => {
    setSelectedDuplicates((prev) =>
      prev.includes(dupId) ? prev.filter((id) => id !== dupId) : [...prev, dupId]
    );
  };

  const toggleAllDuplicates = () => {
    if (selectedDuplicates.length === potentialDuplicates.length) {
      setSelectedDuplicates([]);
    } else {
      setSelectedDuplicates(potentialDuplicates.map((d) => d.id || d.mongoId));
    }
  };

  const toggleWorker = (workerId) => {
    if (selectedWorkers.includes(workerId)) {
      setSelectedWorkers(selectedWorkers.filter((id) => id !== workerId));
    } else {
      if (selectedWorkers.length >= 3) {
        alert("You can assign a maximum of 3 workers.");
        return;
      }
      setSelectedWorkers([...selectedWorkers, workerId]);
    }
  };

  const updateScheduleDate = (setter, value) => {
    setSelectedWorkers([]);
    setter(value);
  };

  const handleAssignWorkers = async () => {
    if (selectedWorkers.length < 1) {
      alert("Please select at least 1 worker.");
      return;
    }

    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    setAssigning(true);
    setErrorMsg("");
    try {
      const res = await assignComplaintWorkers(selectedComplaint.id || selectedComplaint.mongoId, {
        selectedWorkers,
        startDate,
        endDate,
        linkedDuplicateIds: selectedDuplicates,
      });

      if (res && res.success) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === selectedComplaint.id || selectedDuplicates.includes(c.id) || selectedDuplicates.includes(c.mongoId)
              ? {
                  ...c,
                  assignedWorkerIds: selectedWorkers,
                  assignedWorkers: availableWorkers
                    .filter((worker) => selectedWorkers.includes(worker.id))
                    .map((worker) => worker.name),
                  status: "Assigned",
                  workStartDate: startDate,
                  workEndDate: endDate,
                }
              : c
          )
        );

        setSelectedComplaint((prev) => ({
          ...prev,
          assignedWorkerIds: selectedWorkers,
          assignedWorkers: availableWorkers
            .filter((worker) => selectedWorkers.includes(worker.id))
            .map((worker) => worker.name),
          status: "Assigned",
          workStartDate: startDate,
          workEndDate: endDate,
        }));

        setShowAssignPopup(false);
        setSuccessMsg(
          `Workers assigned successfully!${
            selectedDuplicates.length > 0
              ? ` (Grouped with ${selectedDuplicates.length} nearby duplicate reports)`
              : ""
          }`
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error assigning workers:", err);
      setErrorMsg(err.message || "Failed to assign workers.");
    } finally {
      setAssigning(false);
    }
  };

  const statusClass = (status) =>
    status ? status.toLowerCase().replace(/\s+/g, "-") : "pending";

  const priorityClass = (priority) =>
    priority ? priority.toLowerCase().replace(/\s+/g, "-") : "medium";

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOverdueInfo = (complaint) => {
    if (complaint.status !== "In Progress" || !complaint.workEndDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(complaint.workEndDate);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)}d`, type: "overdue" };
    }
    if (diffDays === 0) {
      return { label: "Due today", type: "due-today" };
    }
    return { label: `${diffDays}d left`, type: "on-track" };
  };

  return (
    <div className="mc-page">

      {/* ================= HEADER ================= */}
      <section className="mc-hero">
        <div className="mc-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="mc-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="mc-hero-text">
          <span className="mc-hero-tag">
            <ClipboardList size={14} strokeWidth={2.4} /> Manager Console
          </span>
          <h1>Complaints</h1>
          <p>Supervise, prioritize and assign reported footpath issues</p>
        </div>

        <div className="mc-count">
          <strong>{filteredComplaints.length}</strong>
          <span>Complaints</span>
        </div>
      </section>

      {successMsg && (
        <div className="mc-alert success" role="status">
          <CheckCircle2 size={18} strokeWidth={2.2} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mc-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          {errorMsg}
        </div>
      )}

      {/* ================= FILTERS ================= */}
      <div className="mc-filters">
        <div className="mc-search">
          <Search size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search complaint, location, reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="mc-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <select
          className="mc-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="mc-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priority</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button className="mc-refresh" onClick={loadData} disabled={loading}>
          <RefreshCw
            size={14}
            strokeWidth={2.5}
            className={loading ? "mc-spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ================= COMPLAINT CARDS ================= */}
      {loading ? (
        <div className="mc-state">
          <div className="mc-loader" aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </div>
          <p>Loading city complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="mc-state">
          <Inbox size={36} strokeWidth={1.8} />
          <p>No complaints match the selected filters.</p>
        </div>
      ) : (
        <div className="mc-grid">
          {filteredComplaints.map((complaint, i) => {
            const overdue = getOverdueInfo(complaint);
            const canAssign =
              complaint.status === "Not Assigned" ||
              complaint.status === "Pending";

            return (
              <article
                className={`mc-card mc-card-${statusClass(complaint.status)}`}
                key={complaint.id || complaint.mongoId}
                style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}
              >
                {complaint.image && (
                  <img
                    className="mc-card-image"
                    src={complaint.image}
                    alt={`Reported issue: ${complaint.title}`}
                  />
                )}

                <div className="mc-card-body">
                  <div className="mc-card-top">
                    <span className="mc-id">{complaint.id}</span>
                    <span className={`mc-status ${statusClass(complaint.status)}`}>
                      <span className="mc-dot"></span>
                      {complaint.status}
                    </span>
                  </div>

                  <h2>{complaint.title}</h2>

                  <p className="mc-card-location">
                    <MapPin size={14} strokeWidth={2} />
                    <span>
                      {complaint.location}
                      {(complaint.locality || complaint.city) &&
                        ` · ${[complaint.locality, complaint.city]
                          .filter(Boolean)
                          .join(", ")}`}
                    </span>
                  </p>

                  <div className="mc-card-meta">
                    <span>
                      <User size={13} strokeWidth={2} />
                      {complaint.reportedBy || "Citizen"}
                    </span>
                    <span>
                      <Calendar size={13} strokeWidth={2} />
                      {complaint.date}
                    </span>
                  </div>

                  <div className="mc-card-controls">
                    <label>
                      Priority
                      <select
                        className={`mc-priority-select ${priorityClass(complaint.priority)}`}
                        value={complaint.priority || "Not Set"}
                        onChange={(event) =>
                          handlePriorityChange(complaint.id, event.target.value)
                        }
                      >
                        {PRIORITY_LEVELS.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="mc-schedule">
                      <span className="mc-schedule-label">
                        <CalendarRange size={12} strokeWidth={2.2} />
                        Schedule
                      </span>
                      <strong>
                        {complaint.workStartDate
                          ? `${formatDate(complaint.workStartDate)} → ${formatDate(
                              complaint.workEndDate
                            )}`
                          : "Not scheduled"}
                      </strong>
                      {overdue && (
                        <span className={`mc-overdue ${overdue.type}`}>
                          <Clock size={11} strokeWidth={2.5} />
                          {overdue.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mc-team">
                    <span className="mc-team-label">
                      <Users size={13} strokeWidth={2.2} />
                      Assigned team
                    </span>
                    {complaint.assignedWorkers?.length ? (
                      <div className="mc-team-names">
                        {complaint.assignedWorkers.map((worker) => (
                          <span key={worker}>{worker}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="mc-not-assigned">Not assigned</span>
                    )}
                  </div>

                  <div className="mc-actions">
                    <button
                      className="mc-btn-soft"
                      onClick={() => handleViewDetails(complaint)}
                    >
                      View complaint
                    </button>
                    {canAssign && (
                      <button
                        className="mc-btn-main"
                        disabled={complaint.priority === "Not Set"}
                        title={
                          complaint.priority === "Not Set"
                            ? "Set priority first"
                            : ""
                        }
                        onClick={() => handleOpenAssign(complaint)}
                      >
                        Assign workers
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ================================================= */}
      {/* COMPLAINT DETAILS POPUP */}
      {/* ================================================= */}
      {showDetails && selectedComplaint && (
        <div className="mc-overlay" onClick={() => setShowDetails(false)}>
          <div className="mc-modal mc-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-head">
              <div>
                <span className="mc-modal-id">{selectedComplaint.id}</span>
                <h2>{selectedComplaint.title}</h2>
              </div>

              <button
                className="mc-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mc-modal-body">
              {selectedComplaint.image && (
                <div className="mc-image-wrap">
                  <img
                    src={selectedComplaint.image}
                    alt={selectedComplaint.title}
                  />

                  <div className="mc-image-badges">
                    <span
                      className={`mc-priority ${priorityClass(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority === "Not Set"
                        ? "Priority Not Set"
                        : `${selectedComplaint.priority} Priority`}
                    </span>

                    <span
                      className={`mc-status ${statusClass(
                        selectedComplaint.status
                      )}`}
                    >
                      <span className="mc-dot"></span>
                      {selectedComplaint.status}
                    </span>
                  </div>
                </div>
              )}

              {/* PRIORITY EDITOR IN MODAL */}
              <div className="mc-priority-editor">
                <span>Set Priority</span>
                <div className="mc-priority-options">
                  {PRIORITY_LEVELS.filter((p) => p !== "Not Set").map((p) => (
                    <button
                      key={p}
                      className={`mc-pill ${priorityClass(p)} ${
                        selectedComplaint.priority === p ? "active" : ""
                      }`}
                      onClick={() =>
                        handlePriorityChange(selectedComplaint.id, p)
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mc-info-grid">
                <div className="mc-info">
                  <div className="mc-info-icon">
                    <MapPin size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <label>Location</label>
                    <strong>{selectedComplaint.location}</strong>
                    {(selectedComplaint.locality || selectedComplaint.city) && (
                      <small>
                        {[selectedComplaint.locality, selectedComplaint.city]
                          .filter(Boolean)
                          .join(", ")}
                      </small>
                    )}
                    {selectedComplaint.navigationUrl && (
                      <a
                        href={selectedComplaint.navigationUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open exact pin in Maps
                        <ExternalLink size={12} strokeWidth={2.4} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mc-info">
                  <div className="mc-info-icon">
                    <User size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <label>Reported By</label>
                    <strong>{selectedComplaint.reportedBy || "Citizen"}</strong>
                  </div>
                </div>

                <div className="mc-info">
                  <div className="mc-info-icon">
                    <Calendar size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <label>Reported Date</label>
                    <strong>{selectedComplaint.date || selectedComplaint.reportedDate}</strong>
                  </div>
                </div>

                {selectedComplaint.workStartDate && (
                  <div className="mc-info">
                    <div className="mc-info-icon">
                      <CalendarRange size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <label>Work Timeline</label>
                      <strong>
                        {formatDate(selectedComplaint.workStartDate)} →{" "}
                        {formatDate(selectedComplaint.workEndDate)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const overdue = getOverdueInfo(selectedComplaint);
                return overdue ? (
                  <div className={`mc-banner ${overdue.type}`}>
                    {overdue.type === "overdue" ? (
                      <AlertCircle size={16} strokeWidth={2.4} />
                    ) : (
                      <Clock size={16} strokeWidth={2.4} />
                    )}
                    {overdue.label} to complete this work
                  </div>
                ) : null;
              })()}

              <div className="mc-description">
                <h3>Description</h3>
                <p>{selectedComplaint.description || "No additional description provided."}</p>
              </div>

              <div className="mc-crew">
                <h3>Assigned Maintenance Crew</h3>

                {!selectedComplaint.assignedWorkers || selectedComplaint.assignedWorkers.length === 0 ? (
                  <p className="mc-no-workers">No workers assigned yet.</p>
                ) : (
                  <div className="mc-crew-list">
                    {selectedComplaint.assignedWorkers.map((worker) => (
                      <span key={worker}>
                        <span className="mc-crew-avatar">
                          {worker.charAt(0)}
                        </span>
                        {worker}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mc-modal-footer">
              <button
                className="mc-cancel"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>

              {(selectedComplaint.status === "Not Assigned" || selectedComplaint.status === "Pending") && (
                <button
                  className="mc-save"
                  disabled={selectedComplaint.priority === "Not Set"}
                  onClick={() => {
                    setShowDetails(false);
                    handleOpenAssign(selectedComplaint);
                  }}
                >
                  Assign Workers
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* ASSIGN WORKERS POPUP */}
      {/* ================================================= */}
      {showAssignPopup && selectedComplaint && (
        <div
          className="mc-overlay"
          onClick={() => setShowAssignPopup(false)}
        >
          <div className="mc-modal mc-modal-narrow" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-head">
              <div>
                <span className="mc-modal-id">{selectedComplaint.id}</span>
                <h2>Assign Maintenance Team</h2>
              </div>

              <button
                className="mc-close"
                onClick={() => setShowAssignPopup(false)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mc-modal-body">
              <div className="mc-assign-info">
                <h3>{selectedComplaint.title}</h3>
                <p>
                  <MapPin size={14} strokeWidth={2} />
                  {selectedComplaint.location}
                </p>
                <span
                  className={`mc-priority ${priorityClass(
                    selectedComplaint.priority
                  )}`}
                >
                  {selectedComplaint.priority} Priority
                </span>
              </div>

              {/* POTENTIAL DUPLICATES SECTION (GPS PROXIMITY) */}
              <div className="mc-duplicates-section">
                <div className="mc-dups-header">
                  <div className="mc-dups-title">
                    <Layers size={16} />
                    <span>Potential Duplicate Reports (GPS Proximity)</span>
                  </div>

                  {potentialDuplicates.length > 0 && (
                    <button
                      type="button"
                      className="mc-dups-toggle-btn"
                      onClick={toggleAllDuplicates}
                    >
                      {selectedDuplicates.length === potentialDuplicates.length
                        ? "Deselect All"
                        : "Select All to Group"}
                    </button>
                  )}
                </div>

                {loadingDuplicates ? (
                  <div className="mc-dups-loading">
                    <span className="dups-spinner"></span>
                    <span>Scanning for nearby reports within 100 meters...</span>
                  </div>
                ) : potentialDuplicates.length === 0 ? (
                  <div className="mc-dups-empty">
                    <CheckCircle2 size={15} color="#10b981" />
                    <span>No duplicate reports found within 100m. This appears to be an isolated issue.</span>
                  </div>
                ) : (
                  <div className="mc-dups-container">
                    <div className="mc-dups-alert">
                      <span>⚠️ <strong>{potentialDuplicates.length} potential duplicate(s)</strong> detected within 100m. Select reports to assign and resolve simultaneously:</span>
                    </div>

                    <div className="mc-dups-list">
                      {potentialDuplicates.map((dup) => {
                        const isChecked = selectedDuplicates.includes(dup.id || dup.mongoId);

                        return (
                          <div
                            key={dup.id || dup.mongoId}
                            className={`mc-dup-card ${isChecked ? "checked" : ""}`}
                            onClick={() => toggleDuplicate(dup.id || dup.mongoId)}
                          >
                            <div className="mc-dup-check">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                              />
                            </div>

                            {dup.image && (
                              <img
                                src={dup.image}
                                alt="Report"
                                className="mc-dup-thumb"
                              />
                            )}

                            <div className="mc-dup-info">
                              <div className="mc-dup-top">
                                <span className="mc-dup-id">{dup.id}</span>
                                <span className="mc-dup-distance">
                                  <MapPin size={11} /> {dup.distanceFormatted}
                                </span>
                                <span className={`mc-dup-match ${dup.matchConfidence.toLowerCase().replace(/\s+/g, "-")}`}>
                                  {dup.matchConfidence} Match
                                </span>
                              </div>
                              <h5 className="mc-dup-title">{dup.title}</h5>
                              <p className="mc-dup-desc">{dup.description?.slice(0, 85)}{dup.description?.length > 85 ? "..." : ""}</p>
                              <div className="mc-dup-foot">
                                <span>Reported by: <strong>{dup.reportedBy}</strong></span>
                                <span>{dup.reportedDate}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* WORK SCHEDULE */}
              <div className="mc-dates">
                <div className="mc-date-field">
                  <label>Work Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => updateScheduleDate(setStartDate, e.target.value)}
                  />
                </div>

                <div className="mc-date-field">
                  <label>Work End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => updateScheduleDate(setEndDate, e.target.value)}
                  />
                </div>
              </div>

              <div className="mc-selected">
                <div className="mc-selected-text">
                  <span>Selected Workers</span>
                  <strong>{selectedWorkers.length} / 3</strong>
                </div>

                <div className="mc-progress">
                  <div
                    className="mc-progress-fill"
                    style={{
                      width: `${(selectedWorkers.length / 3) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mc-workers">
                {loadingWorkers ? (
                  <p className="mc-workers-note">
                    Checking team availability for these dates...
                  </p>
                ) : !startDate || !endDate ? (
                  <p className="mc-workers-note">
                    Select a valid work date range to check availability.
                  </p>
                ) : availableWorkers.length === 0 ? (
                  <p className="mc-workers-note">
                    No available workers in your team for the selected dates.
                  </p>
                ) : (
                  availableWorkers.map((worker) => {
                    const isSelected = selectedWorkers.includes(worker.id);

                    return (
                      <div
                        key={worker.id}
                        className={`mc-worker ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleWorker(worker.id)}
                      >
                        <div className="mc-worker-avatar">
                          {worker.name.charAt(0)}
                        </div>

                        <div className="mc-worker-details">
                          <strong>{worker.name} ({worker.employeeCode || "WRK"})</strong>
                          <span>
                            {worker.team} • {worker.role} • {worker.phone}
                          </span>
                        </div>

                        <div className="mc-worker-check">
                          {isSelected && <Check size={14} strokeWidth={3.2} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mc-modal-footer">
              <button
                className="mc-cancel"
                onClick={() => setShowAssignPopup(false)}
              >
                Cancel
              </button>

              <button
                className="mc-save"
                onClick={handleAssignWorkers}
                disabled={selectedWorkers.length < 1 || assigning}
              >
                {assigning
                  ? "Assigning..."
                  : `Assign ${selectedWorkers.length} Worker(s)${
                      selectedDuplicates.length > 0
                        ? ` (+${selectedDuplicates.length} Duplicates)`
                        : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;