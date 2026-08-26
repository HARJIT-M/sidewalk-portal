import React, { useState } from "react";
import "./new_complaint.css";

const PRIORITY_LEVELS = ["Not Set", "Low", "Medium", "High", "Critical"];
const STATUS_FLOW = ["Not Assigned", "Assigned", "In Progress", "Completed"];

const WorkerComplaints = () => {
  const [complaints, setComplaints] = useState([
    {
      id: "CMP001",
      title: "Broken Footpath",
      location: "Gandhipuram, Coimbatore",
      description:
        "The footpath is badly damaged near the main bus stop. Several tiles are broken and the surface is uneven, making it difficult for pedestrians to walk safely.",
      reportedBy: "Arun Kumar",
      date: "21 Aug 2026",
      priority: "Not Set",
      status: "Not Assigned",
      image:
        "https://images.unsplash.com/photo-1590644365607-1c5a1c2c8a2a?auto=format&fit=crop&w=900&q=80",
      assignedWorkers: [],
      workStartDate: "",
      workEndDate: "",
    },
    {
      id: "CMP002",
      title: "Large Pothole",
      location: "RS Puram, Coimbatore",
      description:
        "A large pothole has developed on the pedestrian pathway. Water accumulates in the damaged area during rain.",
      reportedBy: "Priya S",
      date: "20 Aug 2026",
      priority: "High",
      status: "In Progress",
      image:
        "https://images.unsplash.com/photo-1517999349371-c43520457b23?auto=format&fit=crop&w=900&q=80",
      assignedWorkers: ["Ravi", "Karthik"],
      workStartDate: "2026-08-22",
      workEndDate: "2026-08-26",
    },
    {
      id: "CMP003",
      title: "Cracked Sidewalk",
      location: "Saibaba Colony, Coimbatore",
      description:
        "Multiple cracks have appeared along the sidewalk. One section has become loose and may cause pedestrians to trip.",
      reportedBy: "Rahul M",
      date: "19 Aug 2026",
      priority: "Medium",
      status: "Completed",
      image:
        "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=900&q=80",
      assignedWorkers: ["Manoj", "Suresh"],
      workStartDate: "2026-08-20",
      workEndDate: "2026-08-23",
    },
    {
      id: "CMP004",
      title: "Damaged Pavement",
      location: "Peelamedu, Coimbatore",
      description:
        "The pavement has been damaged due to construction work. Broken concrete pieces are blocking part of the pedestrian pathway.",
      reportedBy: "Vignesh",
      date: "18 Aug 2026",
      priority: "Not Set",
      status: "Not Assigned",
      image:
        "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=900&q=80",
      assignedWorkers: [],
      workStartDate: "",
      workEndDate: "",
    },
    {
      id: "CMP005",
      title: "Missing Footpath Tiles",
      location: "Singanallur, Coimbatore",
      description:
        "Several tiles are missing from the footpath near the shopping area. The exposed surface is dangerous for pedestrians.",
      reportedBy: "Sanjay",
      date: "17 Aug 2026",
      priority: "Medium",
      status: "Not Assigned",
      image:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
      assignedWorkers: [],
      workStartDate: "",
      workEndDate: "",
    },
  ]);

  const availableWorkers = [
    { id: 1, name: "Ravi", role: "Maintenance Worker" },
    { id: 2, name: "Karthik", role: "Maintenance Worker" },
    { id: 3, name: "Manoj", role: "Maintenance Worker" },
    { id: 4, name: "Suresh", role: "Maintenance Worker" },
    { id: 5, name: "Arun", role: "Maintenance Worker" },
    { id: 6, name: "Dinesh", role: "Maintenance Worker" },
  ];

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.id.toLowerCase().includes(search.toLowerCase()) ||
      complaint.title.toLowerCase().includes(search.toLowerCase()) ||
      complaint.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || complaint.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" || complaint.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ---- Priority ----
  const handlePriorityChange = (complaintId, newPriority) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId ? { ...c, priority: newPriority } : c
      )
    );

    if (selectedComplaint?.id === complaintId) {
      setSelectedComplaint((prev) => ({ ...prev, priority: newPriority }));
    }
  };

  // ---- Details ----
  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  // ---- Assign ----
  const handleOpenAssign = (complaint) => {
    if (complaint.priority === "Not Set") {
      alert("Please set a priority before assigning workers.");
      return;
    }
    setSelectedComplaint(complaint);
    setSelectedWorkers(complaint.assignedWorkers || []);
    setStartDate(complaint.workStartDate || "");
    setEndDate(complaint.workEndDate || "");
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

  const handleAssignWorkers = () => {
    if (selectedWorkers.length < 2) {
      alert("Please select at least 2 workers.");
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
    alert("Workers assigned successfully!");
  };

  // ---- Status progression ----
  const advanceStatus = (complaintId, nextStatus) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId ? { ...c, status: nextStatus } : c
      )
    );

    if (selectedComplaint?.id === complaintId) {
      setSelectedComplaint((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  const statusClass = (status) => status.toLowerCase().replace(" ", "-");

  const priorityClass = (priority) => priority.toLowerCase().replace(" ", "-");

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
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
          <p>View, manage and assign reported footpath issues</p>
        </div>

        <div className="complaint-count">
          <strong>{filteredComplaints.length}</strong>
          <span>Complaints</span>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="filters-container">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search complaint, location..."
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
              {filteredComplaints.map((complaint) => {
                const overdue = getOverdueInfo(complaint);

                return (
                  <tr key={complaint.id}>
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

                    <td>{complaint.reportedBy}</td>
                    <td>{complaint.date}</td>

                    {/* PRIORITY DROPDOWN */}
                    <td>
                      <select
                        className={`priority-select ${priorityClass(
                          complaint.priority
                        )}`}
                        value={complaint.priority}
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
                      {complaint.assignedWorkers.length === 0 ? (
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

                        {complaint.status === "Not Assigned" && (
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

                        {complaint.status === "Assigned" && (
                          <button
                            className="progress-btn"
                            onClick={() =>
                              advanceStatus(complaint.id, "In Progress")
                            }
                          >
                            Start Work
                          </button>
                        )}

                        {complaint.status === "In Progress" && (
                          <button
                            className="complete-btn"
                            onClick={() =>
                              advanceStatus(complaint.id, "Completed")
                            }
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <div className="no-results">
              <h3>No complaints found</h3>
              <p>Try changing your search or filters.</p>
            </div>
          )}
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
                    <strong>{selectedComplaint.reportedBy}</strong>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">📅</div>
                  <div>
                    <span>Reported Date</span>
                    <strong>{selectedComplaint.date}</strong>
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
                <p>{selectedComplaint.description}</p>
              </div>

              <div className="assigned-section">
                <h3>Assigned Team</h3>

                {selectedComplaint.assignedWorkers.length === 0 ? (
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

              {selectedComplaint.status === "Not Assigned" && (
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

              {selectedComplaint.status === "Assigned" && (
                <button
                  className="assign-main-btn"
                  onClick={() =>
                    advanceStatus(selectedComplaint.id, "In Progress")
                  }
                >
                  Start Work
                </button>
              )}

              {selectedComplaint.status === "In Progress" && (
                <button
                  className="assign-main-btn"
                  onClick={() =>
                    advanceStatus(selectedComplaint.id, "Completed")
                  }
                >
                  Mark Completed
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
                {availableWorkers.map((worker) => {
                  const isSelected = selectedWorkers.includes(worker.name);

                  return (
                    <div
                      key={worker.id}
                      className={`worker-option ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => toggleWorker(worker.name)}
                    >
                      <div className="worker-avatar-small">
                        {worker.name.charAt(0)}
                      </div>

                      <div className="worker-details">
                        <strong>{worker.name}</strong>
                        <span>{worker.role}</span>
                      </div>

                      <div className="worker-checkbox">
                        {isSelected ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
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
                disabled={selectedWorkers.length < 2}
              >
                Assign {selectedWorkers.length} Workers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerComplaints;