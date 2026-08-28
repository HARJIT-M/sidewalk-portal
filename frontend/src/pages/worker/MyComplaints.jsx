import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredComplaints, getStoredProfile } from "./workerData";
import "./MyComplaints.css";

const MyComplaints = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    setComplaints(getStoredComplaints());
    setProfile(getStoredProfile());
  }, []);

  useEffect(() => {
    const qFilter = searchParams.get("filter");
    if (qFilter) {
      if (qFilter === "ASSIGNED") setStatusFilter("Pending");
      else if (qFilter === "IN_PROGRESS") setStatusFilter("In Progress");
      else if (qFilter === "RESOLVED") setStatusFilter("Completed");
    }
  }, [searchParams]);

  const getStatusDisplay = (status) => {
    if (status === "ASSIGNED" || status === "PENDING") return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "COMPLETED") return "Completed";
    return status;
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const displayStatus = getStatusDisplay(complaint.status);
    const matchesSearch =
      complaint.id.toLowerCase().includes(search.toLowerCase()) ||
      complaint.issue.toLowerCase().includes(search.toLowerCase()) ||
      complaint.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || displayStatus === statusFilter;

    const matchesPriority =
      priorityFilter === "All" ||
      complaint.priority?.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="complaints-page">
      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="page-header">
        <div>
          <h1>My Assigned Complaints</h1>
          <p>
            View and manage footpath damage complaints assigned to you (
            {profile?.id || "WRK001"})
          </p>
        </div>

        <div className="complaint-count">
          <strong>{filteredComplaints.length}</strong>
          <span>Complaints</span>
        </div>
      </div>

      {/* =========================
          FILTERS
      ========================= */}
      <div className="filters-container">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search complaint by ID, issue or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending / Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed / Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* =========================
          COMPLAINTS TABLE
      ========================= */}
      <div className="complaints-card">
        <div className="table-wrapper">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Issue</th>
                <th>Location</th>
                <th>Reported Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredComplaints.map((complaint) => {
                const statusDisplay = getStatusDisplay(complaint.status);
                const statusClass = statusDisplay.toLowerCase().replace(" ", "-");
                return (
                  <tr key={complaint.id}>
                    <td>
                      <span className="complaint-id">{complaint.id}</span>
                    </td>

                    <td>
                      <span className="issue-title">{complaint.issue}</span>
                    </td>

                    <td>
                      <span className="location">📍 {complaint.location}</span>
                    </td>

                    <td>{complaint.reportedDate}</td>

                    <td>
                      <span
                        className={`priority ${complaint.priority?.toLowerCase()}`}
                      >
                        {complaint.priority}
                      </span>
                    </td>

                    <td>
                      <span className={`status ${statusClass}`}>
                        {statusDisplay}
                      </span>
                    </td>

                    <td>
                      <button
                        className="view-btn"
                        onClick={() =>
                          navigate(`/worker/complaints/${complaint.id}`)
                        }
                      >
                        {statusDisplay === "Pending" ? "Start / View" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <div className="no-complaints">
              <div className="no-complaint-icon">📋</div>
              <h3>No complaints found</h3>
              <p>Try changing your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyComplaints;
