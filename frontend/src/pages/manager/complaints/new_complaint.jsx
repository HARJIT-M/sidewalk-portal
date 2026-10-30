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
  Link2,
} from "lucide-react";
import {
  getManagerComplaints,
  getAvailableWorkers,
  updateComplaintPriority,
  assignComplaintWorkers,
  getComplaintDetails,
  getComplaintDuplicates,
  updateWorkGroupStatus,
  getWorkGroupDetails,
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
  const [showLinkedReports, setShowLinkedReports] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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
        const workers = (res.workers || []).map((w) => {
          const workerId = String(w.workerId || w._id || w.id);
          return {
            id: workerId,
            workerId: workerId,
            name: w.name,
            employeeCode: w.employeeCode || w.employee_code || "WRK",
            team: w.team || w.zone || w.area || "City Maintenance",
            role: w.role || w.specialization || "Sidewalk Repair",
            phone: w.phone || "",
          };
        });
        setAvailableWorkers(workers);
      })
      .catch((err) => {
        if (!isCurrentRequest) return;
        console.warn("Could not load available workers for dates:", err);
        setAvailableWorkers([]);
      })
      .finally(() => {
        if (isCurrentRequest) {
          setLoadingWorkers(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [showAssignPopup, startDate, endDate]);

  const updateScheduleDate = (setter, value) => {
    setter(value);
    setSelectedWorkers([]);
  };

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      await updateComplaintPriority(complaintId, newPriority);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                priority: newPriority === "Not Set" ? "Medium" : newPriority,
                rawPriority: newPriority,
              }
            : c
        )
      );

      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint((prev) => ({
          ...prev,
          priority: newPriority === "Not Set" ? "Medium" : newPriority,
          rawPriority: newPriority,
        }));
      }

      setSuccessMsg(`Priority updated to ${newPriority}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error updating priority:", err);
      alert(err.message || "Failed to update priority.");
    }
  };

  // ---- View Details ----
  const handleViewDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
    setShowLinkedReports(false);
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

  // ---- Open Assign Popup ----
  const handleOpenAssign = (complaint) => {
    if (complaint.priority === "Not Set" || !complaint.priority) {
      alert("Please set a priority before assigning workers.");
      return;
    }
    setSelectedComplaint(complaint);
    setSelectedWorkers([]);
    setShowLinkedReports(false);
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
      setSelectedWorkers((prev) => prev.filter((id) => id !== workerId));
    } else {
      if (selectedWorkers.length >= 3) {
        alert("You can select up to 3 workers.");
        return;
      }
      setSelectedWorkers((prev) => [...prev, workerId]);
    }
  };

  // ---- Manager Updates WorkGroup Status Directly ----
  const handleUpdateWorkGroupStatus = async (status) => {
    if (!selectedComplaint) return;
    const targetId = selectedComplaint.workGroupId || selectedComplaint.id;
    setUpdatingStatus(true);
    try {
      const res = await updateWorkGroupStatus(targetId, status);
      if (res && res.success) {
        setSuccessMsg(`WorkGroup ${targetId} and all linked complaints updated to ${status}!`);
        setTimeout(() => setSuccessMsg(""), 3500);
        loadData();
        const displayStatus =
          status === "RESOLVED" || status === "CLOSED" || status === "COMPLETED"
            ? "Completed"
            : status === "IN_PROGRESS"
            ? "In Progress"
            : status === "ASSIGNED"
            ? "Assigned"
            : "Pending";
        setSelectedComplaint((prev) => ({
          ...prev,
          status: displayStatus,
          rawStatus: status,
        }));
      }
    } catch (err) {
      alert(err.message || "Failed to update WorkGroup status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---- Handle Worker Assignment Submission ----
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
                  isWorkGroupAssigned: true,
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
          isWorkGroupAssigned: true,
        }));

        setShowAssignPopup(false);
        setSuccessMsg(
          `Workers assigned successfully to WorkGroup ${res.workGroupId || ""}!${
            selectedDuplicates.length > 0
              ? ` (Grouped with ${selectedDuplicates.length} nearby duplicate reports)`
              : ""
          }`
        );
        setTimeout(() => setSuccessMsg(""), 3500);
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

    const end = new Date(complaint.workEndDate);
    if (isNaN(end.getTime())) return null;

    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        type: "overdue",
        label: `${Math.abs(diffDays)}d overdue`,
      };
    }
    if (diffDays <= 2) {
      return {
        type: "warning",
        label: `${diffDays}d left`,
      };
    }
    return null;
  };

  // ---- FILTERS ----
  const filteredComplaints = complaints.filter((c) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.id.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      (c.location && c.location.toLowerCase().includes(query)) ||
      (c.locality && c.locality.toLowerCase().includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      (c.reportedBy && c.reportedBy.toLowerCase().includes(query)) ||
      (c.workGroupId && c.workGroupId.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "All" ||
      c.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPriority =
      priorityFilter === "All" ||
      c.priority.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="mc-page">
      {/* ================= HERO BANNER ================= */}
      <section className="mc-hero">
        <div className="mc-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="mc-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="mc-hero-text">
          <span className="mc-hero-tag">
            <ClipboardList size={14} strokeWidth={2.4} /> Manager Portal
          </span>
          <h1>Footpath Complaints</h1>
          <p>Review damage reports, link duplicates into unified maintenance WorkGroups, and assign teams.</p>
        </div>

        <div className="mc-count">
          <strong>{complaints.length}</strong>
          <span>Total Complaints</span>
        </div>
      </section>

      {/* ================= STATISTICS ROW ================= */}
      <div className="mc-stats">
        <div className="mc-stat mc-stat-total">
          <div className="mc-stat-icon">
            <ClipboardList size={22} strokeWidth={2.2} />
          </div>
          <div className="mc-stat-text">
            <strong>{complaints.length}</strong>
            <span>Total Reported</span>
          </div>
        </div>

        <div className="mc-stat mc-stat-pending">
          <div className="mc-stat-icon">
            <Clock size={22} strokeWidth={2.2} />
          </div>
          <div className="mc-stat-text">
            <strong>
              {complaints.filter((c) => c.status === "Pending" || c.status === "Not Assigned").length}
            </strong>
            <span>Pending Review</span>
          </div>
        </div>

        <div className="mc-stat mc-stat-progress">
          <div className="mc-stat-icon">
            <RefreshCw size={22} strokeWidth={2.2} />
          </div>
          <div className="mc-stat-text">
            <strong>
              {complaints.filter((c) => c.status === "In Progress" || c.status === "Assigned").length}
            </strong>
            <span>Active / Assigned</span>
          </div>
        </div>

        <div className="mc-stat mc-stat-done">
          <div className="mc-stat-icon">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <div className="mc-stat-text">
            <strong>
              {complaints.filter((c) => c.status === "Completed" || c.status === "Resolved" || c.status === "Closed").length}
            </strong>
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* ================= ALERTS ================= */}
      {errorMsg && (
        <div className="mc-alert mc-alert-error">
          <AlertCircle size={16} strokeWidth={2.4} />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mc-alert mc-alert-success">
          <CheckCircle2 size={16} strokeWidth={2.4} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= TOOLBAR ================= */}
      <div className="mc-toolbar">
        <div className="mc-search">
          <Search size={16} strokeWidth={2.2} />
          <input
            type="text"
            placeholder="Search by ID, title, locality or WorkGroup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="mc-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span className="mc-id">{complaint.id}</span>

                      {/* WorkGroup & Duplicate Badge */}
                      {complaint.isDuplicate ? (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "10px",
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}>
                          Duplicate · {complaint.workGroupId || "WG"}
                        </span>
                      ) : complaint.linkedCount > 1 ? (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "10px",
                          background: "#e0e7ff",
                          color: "#3730a3",
                          border: "1px solid #c7d2fe",
                        }}>
                          Lead ({complaint.linkedCount} reports · {complaint.workGroupId || "WG"})
                        </span>
                      ) : complaint.workGroupId ? (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "10px",
                          background: "#f3f4f6",
                          color: "#4b5563",
                        }}>
                          {complaint.workGroupId}
                        </span>
                      ) : null}
                    </div>

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

              {/* UNIFIED WORKGROUP BANNER & CONTROLS */}
              {selectedComplaint.workGroupId && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700 }}>
                      <CheckCircle2 size={18} />
                      <span>Unified Maintenance WorkGroup ({selectedComplaint.workGroupId})</span>
                    </div>

                    <span style={{ fontSize: "12px", background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "10px", fontWeight: 600 }}>
                      {selectedComplaint.workGroup?.linkedComplaintsCount || selectedComplaint.linkedCount || 1} Citizen Report(s) Linked
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", fontSize: "13px", marginTop: "10px" }}>
                    <div>
                      <span style={{ color: "#6b7280" }}>Lead Report:</span>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{selectedComplaint.masterComplaintId || selectedComplaint.id}</div>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Shared Status:</span>
                      <div style={{ fontWeight: 600, color: "#16a34a" }}>{selectedComplaint.status}</div>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Assigned Crew:</span>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {selectedComplaint.assignedWorkers?.join(", ") || "No crew assigned yet"}
                      </div>
                    </div>
                  </div>

                  {/* UPDATE SHARED STATUS BUTTONS */}
                  <div style={{ marginTop: "14px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", borderTop: "1px dashed #bbf7d0", paddingTop: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Update WorkGroup Status:</span>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      style={{ padding: "4px 10px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                      onClick={() => handleUpdateWorkGroupStatus("IN_PROGRESS")}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      style={{ padding: "4px 10px", borderRadius: "10px", background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                      onClick={() => handleUpdateWorkGroupStatus("COMPLETED")}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      style={{ padding: "4px 10px", borderRadius: "10px", background: "#6b7280", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                      onClick={() => handleUpdateWorkGroupStatus("PENDING")}
                    >
                      Reset to Pending
                    </button>
                  </div>

                  {/* VIEW ALL LINKED REPORTS ACCORDION */}
                  {selectedComplaint.workGroup?.linkedComplaints?.length > 1 && (
                    <div style={{ marginTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setShowLinkedReports(!showLinkedReports)}
                        style={{
                          background: "#fff",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#374151",
                        }}
                      >
                        <Layers size={13} />
                        {showLinkedReports ? "Hide Linked Citizen Reports" : `View All ${selectedComplaint.workGroup.linkedComplaints.length} Linked Reports`}
                      </button>

                      {showLinkedReports && (
                        <div style={{ marginTop: "10px", maxHeight: "180px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px", background: "#ffffff" }}>
                          {selectedComplaint.workGroup.linkedComplaints.map((lc) => (
                            <div key={lc.id} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                <span>{lc.id} {lc.isMaster ? "(Lead)" : "(Duplicate)"}</span>
                                <span style={{ color: "#16a34a" }}>{lc.status}</span>
                              </div>
                              <div style={{ color: "#4b5563" }}>{lc.title} · {lc.description?.slice(0, 50)}...</div>
                              <div style={{ color: "#9ca3af", fontSize: "11px" }}>Reported by: {lc.reportedBy} ({lc.reportedPhone || "No phone"})</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
      {/* ASSIGN WORKERS POPUP (WORKGROUP AWARE) */}
      {/* ================================================= */}
      {showAssignPopup && selectedComplaint && (() => {
        const isAlreadyAssigned = Boolean(
          selectedComplaint.isWorkGroupAssigned ||
          (selectedComplaint.assignedWorkers && selectedComplaint.assignedWorkers.length > 0 && selectedComplaint.status !== "Not Assigned" && selectedComplaint.status !== "Pending")
        );

        return (
          <div
            className="mc-overlay"
            onClick={() => setShowAssignPopup(false)}
          >
            <div className="mc-modal mc-modal-narrow" onClick={(e) => e.stopPropagation()}>
              <div className="mc-modal-head">
                <div>
                  <span className="mc-modal-id">{selectedComplaint.id}</span>
                  <h2>{isAlreadyAssigned ? "Unified WorkGroup Details" : "Assign Maintenance Team"}</h2>
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

                {/* IF ALREADY ASSIGNED: Display WorkGroup Info, DO NOT show worker assignment form */}
                {isAlreadyAssigned ? (
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginTop: "16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700, marginBottom: "8px" }}>
                      <CheckCircle2 size={18} />
                      <span>Unified Maintenance WorkGroup ({selectedComplaint.workGroupId || "WG001"})</span>
                    </div>

                    <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#166534" }}>
                      This complaint is already linked to an active maintenance group. All linked reports share the same assigned workers and repair progress.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "14px" }}>
                      <div>
                        <span style={{ color: "#6b7280" }}>Lead Complaint ID:</span>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{selectedComplaint.masterComplaintId || selectedComplaint.id}</div>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Total Linked Reports:</span>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{selectedComplaint.workGroup?.linkedComplaintsCount || selectedComplaint.linkedCount || 1} report(s)</div>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Shared Assigned Workers:</span>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{selectedComplaint.assignedWorkers?.join(", ") || "Assigned Crew"}</div>
                      </div>
                      <div>
                        <span style={{ color: "#6b7280" }}>Current Status:</span>
                        <div style={{ fontWeight: 600, color: "#16a34a" }}>{selectedComplaint.status}</div>
                      </div>
                    </div>

                    {/* Quick Shared Status Update Buttons */}
                    <div style={{ borderTop: "1px dashed #bbf7d0", paddingTop: "12px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                        Update Shared WorkGroup Status:
                      </span>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          style={{ padding: "5px 12px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                          onClick={() => handleUpdateWorkGroupStatus("IN_PROGRESS")}
                        >
                          Mark In Progress
                        </button>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          style={{ padding: "5px 12px", borderRadius: "10px", background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                          onClick={() => handleUpdateWorkGroupStatus("COMPLETED")}
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
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
                            <span>⚠️ <strong>{potentialDuplicates.length} potential duplicate(s)</strong> detected within 100m. Select reports to link to this WorkGroup:</span>
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
                  </>
                )}
              </div>

              <div className="mc-modal-footer">
                <button
                  className="mc-cancel"
                  onClick={() => setShowAssignPopup(false)}
                >
                  {isAlreadyAssigned ? "Close" : "Cancel"}
                </button>

                {!isAlreadyAssigned && (
                  <button
                    className="mc-save"
                    onClick={handleAssignWorkers}
                    disabled={selectedWorkers.length < 1 || assigning}
                  >
                    {assigning
                      ? "Assigning..."
                      : `Assign to WorkGroup${
                          selectedDuplicates.length > 0
                            ? ` (${selectedWorkers.length} Workers · ${selectedDuplicates.length + 1} Reports)`
                            : ` (${selectedWorkers.length} Workers)`
                        }`}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Complaints;
