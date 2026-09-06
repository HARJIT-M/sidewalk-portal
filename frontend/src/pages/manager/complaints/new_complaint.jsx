import React, { useState, useEffect } from "react";
import {
  getManagerComplaints,
  getAvailableWorkers,
  updateComplaintPriority,
  assignComplaintWorkers,
  getComplaintDetails,
} from "../../../services/managerApi";
import "./new_complaint.css";

const PRIORITY_LEVELS = ["Not Set", "Low", "Medium", "High", "Critical"];
const STATUS_FLOW = ["Not Assigned", "Assigned", "In Progress", "Completed"];

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [compRes, workRes] = await Promise.all([
        getManagerComplaints(),
        getAvailableWorkers(),
      ]);

      if (compRes && compRes.success) {
        setComplaints(compRes.complaints || []);
      }
      if (workRes && workRes.success) {
        const formattedWorkers = (workRes.workers || []).map((w) => ({
          id: w._id || w.id,
          employeeCode: w.id || w.employee_code,
          name: w.name,
          role: w.role || "Maintenance Worker",
          phone: w.phone,
        }));
        setAvailableWorkers(formattedWorkers);
      }
    } catch (err) {
      console.error("Error loading complaints data:", err);
      setErrorMsg(err.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComplaints = complaints.filter((complaint) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (complaint.id && complaint.id.toLowerCase().includes(q)) ||
      (complaint.title && complaint.title.toLowerCase().includes(q)) ||
      (complaint.location && complaint.location.toLowerCase().includes(q)) ||
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
    setSelectedWorkers(complaint.assignedWorkers || []);
    setStartDate(complaint.workStartDate ? complaint.workStartDate.split("T")[0] : "");
    setEndDate(complaint.workEndDate ? complaint.workEndDate.split("T")[0] : "");
    setShowAssignPopup(true);
  };

  const toggleWorker = (workerName) => {
    if (selectedWorkers.includes(workerName)) {
      setSelectedWorkers(selectedWorkers.filter((w) => w !== workerName));
    } else {
      if (selectedWorkers.length >= 3) {
        alert("You can assign a maximum of 3 workers.");
        return;
      }
      setSelectedWorkers([...selectedWorkers, workerName]);
    }
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
      });

      if (res && res.success) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === selectedComplaint.id
              ? {
                  ...c,
                  assignedWorkers: selectedWorkers,
                  status: "Assigned",
                  workStartDate: startDate,
                  workEndDate: endDate,
                }
              : c
          )
        );

        setSelectedComplaint((prev) => ({
          ...prev,
          assignedWorkers: selectedWorkers,
          status: "Assigned",
          workStartDate: startDate,
          workEndDate: endDate,
        }));

        setShowAssignPopup(false);
        setSuccessMsg("Workers assigned successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error assigning workers:", err);
      setErrorMsg(err.message || "Failed to assign workers.");
    } finally {
      setAssigning(false);
    }
  };

  const statusClass = (status) => (status ? status.toLowerCase().replace(" ", "-") : "pending");

  const priorityClass = (priority) => (priority ? priority.toLowerCase().replace(" ", "-") : "medium");

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
    <div className="complaints-page">
      {/* ================= HEADER ================= */}
      <div className="page-header">
        <div>
          <h1>Complaints</h1>
          <p>Supervise, prioritize and assign reported footpath issues</p>
        </div>

        <div className="complaint-count">
          <strong>{filteredComplaints.length}</strong>
          <span>Complaints</span>
        </div>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: "#f0fdf4",
          color: "#166534",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #bbf7d0"
        }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #fecaca"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ================= FILTERS ================= */}
      <div className="filters-container">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search complaint, location, reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
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

        <button
          onClick={loadData}
          style={{
            padding: "10px 18px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px"
          }}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* ================= COMPLAINT TABLE ================= */}
      <div className="complaints-card">
        <div className="table-wrapper">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Complaint</th>
                <th>Location</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Timeline</th>
                <th>Assigned Team</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Loading complaints from database...
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    No complaints match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => {
                  const overdue = getOverdueInfo(complaint);

                  return (
                    <tr key={complaint.id || complaint.mongoId}>
                      <td>
                        <span className="complaint-id">{complaint.id}</span>
                      </td>

                      <td>
                        <strong>{complaint.title}</strong>
                      </td>

                      <td>
                        <span className="location-text">
                          📍 {complaint.location}
                        </span>
                      </td>

                      <td>{complaint.reportedBy || "Citizen"}</td>
                      <td>{complaint.date}</td>

                      {/* PRIORITY DROPDOWN */}
                      <td>
                        <select
                          className={`priority-select ${priorityClass(
                            complaint.priority
                          )}`}
                          value={complaint.priority || "Not Set"}
                          onChange={(e) =>
                            handlePriorityChange(complaint.id, e.target.value)
                          }
                        >
                          {PRIORITY_LEVELS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${statusClass(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </td>

                      {/* TIMELINE */}
                      <td>
                        {complaint.workStartDate ? (
                          <div className="timeline-cell">
                            <span className="timeline-text">
                              {formatDate(complaint.workStartDate)} →{" "}
                              {formatDate(complaint.workEndDate)}
                            </span>
                            {overdue && (
                              <span className={`overdue-badge ${overdue.type}`}>
                                {overdue.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="not-assigned">—</span>
                        )}
                      </td>

                      <td>
                        {!complaint.assignedWorkers || complaint.assignedWorkers.length === 0 ? (
                          <span className="not-assigned">Not Assigned</span>
                        ) : (
                          <div className="team-names">
                            {complaint.assignedWorkers.map((worker) => (
                              <span key={worker}>{worker}</span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="details-btn"
                            onClick={() => handleViewDetails(complaint)}
                          >
                            View
                          </button>

                          {(complaint.status === "Not Assigned" || complaint.status === "Pending") && (
                            <button
                              className="assign-btn"
                              disabled={complaint.priority === "Not Set"}
                              title={
                                complaint.priority === "Not Set"
                                  ? "Set priority first"
                                  : ""
                              }
                              onClick={() => handleOpenAssign(complaint)}
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================= */}
      {/* COMPLAINT DETAILS POPUP */}
      {/* ================================================= */}
      {showDetails && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-id">{selectedComplaint.id}</span>
                <h2>{selectedComplaint.title}</h2>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>

            <div className="details-content">
              {selectedComplaint.image && (
                <div className="complaint-image-container">
                  <img
                    src={selectedComplaint.image}
                    alt={selectedComplaint.title}
                    className="complaint-image"
                  />

                  <div className="image-badges">
                    <span
                      className={`priority-badge ${priorityClass(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority === "Not Set"
                        ? "Priority Not Set"
                        : `${selectedComplaint.priority} Priority`}
                    </span>

                    <span
                      className={`status-badge ${statusClass(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status}
                    </span>
                  </div>
                </div>
              )}

              {/* PRIORITY EDITOR IN MODAL */}
              <div className="priority-editor">
                <span>Set Priority</span>
                <div className="priority-options">
                  {PRIORITY_LEVELS.filter((p) => p !== "Not Set").map((p) => (
                    <button
                      key={p}
                      className={`priority-pill ${priorityClass(p)} ${
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

              <div className="complaint-information">
                <div className="info-row">
                  <div className="info-icon">📍</div>
                  <div>
                    <span>Location</span>
                    <strong>{selectedComplaint.location}</strong>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">🧑</div>
                  <div>
                    <span>Reported By</span>
                    <strong>{selectedComplaint.reportedBy || "Citizen"}</strong>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">📅</div>
                  <div>
                    <span>Reported Date</span>
                    <strong>{selectedComplaint.date || selectedComplaint.reportedDate}</strong>
                  </div>
                </div>

                {selectedComplaint.workStartDate && (
                  <div className="info-row">
                    <div className="info-icon">🗓️</div>
                    <div>
                      <span>Work Timeline</span>
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
                  <div className={`overdue-banner ${overdue.type}`}>
                    {overdue.type === "overdue" && "⚠️ "}
                    {overdue.label} to complete this work
                  </div>
                ) : null;
              })()}

              <div className="description-section">
                <h3>Description</h3>
                <p>{selectedComplaint.description || "No additional description provided."}</p>
              </div>

              <div className="assigned-section">
                <h3>Assigned Maintenance Crew</h3>

                {!selectedComplaint.assignedWorkers || selectedComplaint.assignedWorkers.length === 0 ? (
                  <p className="no-workers">No workers assigned yet.</p>
                ) : (
                  <div className="assigned-workers">
                    {selectedComplaint.assignedWorkers.map((worker) => (
                      <span key={worker}>
                        <span className="assigned-avatar">
                          {worker.charAt(0)}
                        </span>
                        {worker}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>

              {(selectedComplaint.status === "Not Assigned" || selectedComplaint.status === "Pending") && (
                <button
                  className="assign-main-btn"
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
          className="modal-overlay"
          onClick={() => setShowAssignPopup(false)}
        >
          <div className="assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-id">{selectedComplaint.id}</span>
                <h2>Assign Maintenance Team</h2>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowAssignPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="assign-content">
              <div className="assignment-info">
                <h3>{selectedComplaint.title}</h3>
                <p>📍 {selectedComplaint.location}</p>
                <span
                  className={`priority-badge ${priorityClass(
                    selectedComplaint.priority
                  )}`}
                >
                  {selectedComplaint.priority} Priority
                </span>
              </div>

              {/* WORK SCHEDULE */}
              <div className="date-range-section">
                <div className="date-field">
                  <label>Work Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="date-field">
                  <label>Work End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="selected-count">
                <div className="selected-count-text">
                  <span>Selected Workers</span>
                  <strong>{selectedWorkers.length} / 3</strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(selectedWorkers.length / 3) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="workers-list">
                {availableWorkers.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                    No available workers found in this zone. Add workers from the Workers tab.
                  </p>
                ) : (
                  availableWorkers.map((worker) => {
                    const identifier = worker.employeeCode || worker.name;
                    const isSelected = selectedWorkers.includes(identifier) || selectedWorkers.includes(worker.name);

                    return (
                      <div
                        key={worker.id || worker.employeeCode}
                        className={`worker-option ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => toggleWorker(identifier)}
                      >
                        <div className="worker-avatar-small">
                          {worker.name.charAt(0)}
                        </div>

                        <div className="worker-details">
                          <strong>{worker.name} ({worker.employeeCode || "WRK"})</strong>
                          <span>{worker.role} • {worker.phone}</span>
                        </div>

                        <div className="worker-checkbox">
                          {isSelected ? "✓" : ""}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowAssignPopup(false)}
              >
                Cancel
              </button>

              <button
                className="assign-main-btn"
                onClick={handleAssignWorkers}
                disabled={selectedWorkers.length < 1 || assigning}
              >
                {assigning ? "Assigning..." : `Assign ${selectedWorkers.length} Worker(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;