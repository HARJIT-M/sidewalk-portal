import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getStoredComplaints,
  saveStoredComplaints,
  getStoredProfile,
} from "./workerData";
import "./MyComplaints.css";

const MyComplaints = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);

  // Filters & State
  const initialFilter = searchParams.get("filter") || "ALL";
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setComplaints(getStoredComplaints());
    setProfile(getStoredProfile());
  }, []);

  // Update status filter if query param changes
  useEffect(() => {
    const qFilter = searchParams.get("filter");
    if (qFilter) {
      setStatusFilter(qFilter);
    }
  }, [searchParams]);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    if (status === "ALL") {
      searchParams.delete("filter");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ filter: status });
    }
  };

  const handleStartWork = (id) => {
    const updated = complaints.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: "IN_PROGRESS",
          statusHistory: [
            ...c.statusHistory,
            {
              status: "IN_PROGRESS",
              date: new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              note: `Work started on-site by ${profile?.name || "Worker"}.`,
            },
          ],
        };
      }
      return c;
    });
    setComplaints(updated);
    saveStoredComplaints(updated);
    navigate(`/worker/complaints/${id}`);
  };

  // Filter complaints
  const filteredComplaints = complaints
    .filter((complaint) => {
      // Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "ASSIGNED" && complaint.status !== "ASSIGNED" && complaint.status !== "PENDING") {
          return false;
        }
        if (statusFilter === "IN_PROGRESS" && complaint.status !== "IN_PROGRESS") {
          return false;
        }
        if (statusFilter === "RESOLVED" && complaint.status !== "RESOLVED" && complaint.status !== "COMPLETED") {
          return false;
        }
      }

      // Priority Filter
      if (priorityFilter !== "ALL" && complaint.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesId = complaint.id.toLowerCase().includes(query);
        const matchesIssue = complaint.issue.toLowerCase().includes(query);
        const matchesLocation = complaint.location.toLowerCase().includes(query);
        const matchesLandmark = complaint.landmark?.toLowerCase().includes(query) || false;
        return matchesId || matchesIssue || matchesLocation || matchesLandmark;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const weight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      if (sortBy === "id") {
        return a.id.localeCompare(b.id);
      }
      // default newest
      return b.id.localeCompare(a.id);
    });

  // Counts for tabs
  const countAll = complaints.length;
  const countAssigned = complaints.filter(
    (c) => c.status === "ASSIGNED" || c.status === "PENDING"
  ).length;
  const countInProgress = complaints.filter(
    (c) => c.status === "IN_PROGRESS"
  ).length;
  const countResolved = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "COMPLETED"
  ).length;

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "badge-high";
      case "MEDIUM":
        return "badge-medium";
      case "LOW":
        return "badge-low";
      default:
        return "badge-medium";
    }
  };

  const getStatusInfo = (status) => {
    switch (status?.toUpperCase()) {
      case "ASSIGNED":
        return { label: "Assigned", className: "pill-assigned" };
      case "IN_PROGRESS":
        return { label: "In Progress", className: "pill-inprogress" };
      case "RESOLVED":
      case "COMPLETED":
        return { label: "Resolved", className: "pill-resolved" };
      default:
        return { label: status, className: "pill-default" };
    }
  };

  return (
    <div className="my-complaints-page">
      {/* =========================================
          PAGE HEADER
      ========================================= */}
      <div className="complaints-header-row">
        <div>
          <h1>My Assigned Complaints</h1>
          <p>
            Track and manage sidewalk repair tasks assigned directly to you (
            <strong>{profile?.id || "WRK001"}</strong>)
          </p>
        </div>

        <div className="header-stat-pills">
          <span className="header-pill">
            Active Tasks: <strong>{countAssigned + countInProgress}</strong>
          </span>
          <span className="header-pill success">
            Completed: <strong>{countResolved}</strong>
          </span>
        </div>
      </div>

      {/* =========================================
          STATUS TABS
      ========================================= */}
      <div className="status-tabs-container">
        <button
          className={`status-tab ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => handleStatusFilterChange("ALL")}
        >
          All Complaints
          <span className="tab-count">{countAll}</span>
        </button>

        <button
          className={`status-tab ${statusFilter === "ASSIGNED" ? "active" : ""}`}
          onClick={() => handleStatusFilterChange("ASSIGNED")}
        >
          Assigned / Pending
          <span className="tab-count warning">{countAssigned}</span>
        </button>

        <button
          className={`status-tab ${statusFilter === "IN_PROGRESS" ? "active" : ""}`}
          onClick={() => handleStatusFilterChange("IN_PROGRESS")}
        >
          In Progress
          <span className="tab-count info">{countInProgress}</span>
        </button>

        <button
          className={`status-tab ${statusFilter === "RESOLVED" ? "active" : ""}`}
          onClick={() => handleStatusFilterChange("RESOLVED")}
        >
          Resolved / Completed
          <span className="tab-count success">{countResolved}</span>
        </button>
      </div>

      {/* =========================================
          SEARCH & FILTER TOOLBAR
      ========================================= */}
      <div className="complaints-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by ID (e.g. CMP001), issue, or street name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="control-item">
            <label>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          <div className="control-item">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Latest Assigned</option>
              <option value="priority">Highest Priority</option>
              <option value="id">Complaint ID</option>
            </select>
          </div>

          <div className="view-toggle-buttons">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              ▦
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Table List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          COMPLAINTS CARDS / LIST
      ========================================= */}
      {filteredComplaints.length === 0 ? (
        <div className="no-complaints-box">
          <div className="no-complaints-icon">📋</div>
          <h3>No assigned complaints found</h3>
          <p>
            No repair tasks match your current search or filter criteria.
          </p>
          <button
            className="btn-reset-filters"
            onClick={() => {
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
              setSearchQuery("");
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="complaints-grid-layout">
          {filteredComplaints.map((complaint) => {
            const statusInfo = getStatusInfo(complaint.status);
            return (
              <div key={complaint.id} className="worker-task-card">
                {/* Card Top */}
                <div className="card-top-row">
                  <span className="card-task-id">{complaint.id}</span>
                  <div className="card-badges">
                    <span className={`priority-badge-sm ${getPriorityClass(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                    <span className={`status-pill-sm ${statusInfo.className}`}>
                      <span className="status-dot"></span>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Card Title & Location */}
                <h3 className="card-issue-title">{complaint.issue}</h3>
                <p className="card-location-text">
                  📍 {complaint.location}
                  {complaint.landmark && (
                    <span className="card-landmark-hint"> ({complaint.landmark})</span>
                  )}
                </p>

                {/* Card Description */}
                <p className="card-description-snippet">
                  {complaint.description}
                </p>

                {/* Card Image preview if available */}
                {complaint.reportedImage && (
                  <div className="card-image-preview">
                    <img
                      src={complaint.reportedImage}
                      alt={complaint.issue}
                      loading="lazy"
                    />
                    <span className="image-tag">Damage Photo</span>
                  </div>
                )}

                {/* Card Meta & Dates */}
                <div className="card-meta-row">
                  <div>
                    <span className="meta-label">Assigned Date:</span>
                    <strong className="meta-val">{complaint.assignedDate}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Est. Time:</span>
                    <strong className="meta-val">{complaint.estimatedHours || "4 Hours"}</strong>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="card-actions-row">
                  <button
                    className="btn-card-details"
                    onClick={() => navigate(`/worker/complaints/${complaint.id}`)}
                  >
                    View Details
                  </button>

                  {complaint.status === "ASSIGNED" && (
                    <button
                      className="btn-card-primary start"
                      onClick={() => handleStartWork(complaint.id)}
                    >
                      🚀 Start Work
                    </button>
                  )}

                  {complaint.status === "IN_PROGRESS" && (
                    <button
                      className="btn-card-primary update"
                      onClick={() => navigate(`/worker/complaints/${complaint.id}`)}
                    >
                      🛠️ Update Work
                    </button>
                  )}

                  {(complaint.status === "RESOLVED" || complaint.status === "COMPLETED") && (
                    <button
                      className="btn-card-primary resolved"
                      onClick={() => navigate(`/worker/complaints/${complaint.id}`)}
                    >
                      ✅ View Summary
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="complaints-table-wrapper">
          <table className="worker-list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Issue Description</th>
                <th>Location & Landmark</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => {
                const statusInfo = getStatusInfo(complaint.status);
                return (
                  <tr key={complaint.id}>
                    <td>
                      <span className="table-task-id">{complaint.id}</span>
                    </td>
                    <td>
                      <div className="table-desc-cell">
                        <strong>{complaint.issue}</strong>
                        <span>{complaint.description.slice(0, 75)}...</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-loc-cell">
                        <span>📍 {complaint.location}</span>
                        {complaint.landmark && (
                          <small>{complaint.landmark}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge-sm ${getPriorityClass(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill-sm ${statusInfo.className}`}>
                        <span className="status-dot"></span>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <span className="table-date-val">{complaint.assignedDate}</span>
                    </td>
                    <td>
                      <div className="table-btns-cell">
                        {complaint.status === "ASSIGNED" ? (
                          <button
                            className="btn-list-start"
                            onClick={() => handleStartWork(complaint.id)}
                          >
                            Start Work
                          </button>
                        ) : (
                          <button
                            className="btn-list-update"
                            onClick={() => navigate(`/worker/complaints/${complaint.id}`)}
                          >
                            {complaint.status === "IN_PROGRESS" ? "Update" : "Details"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
