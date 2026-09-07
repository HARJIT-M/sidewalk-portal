import React, { useState } from "react";
import {
  ClipboardList,
  CircleDot,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Search,
  MapPin,
  X,
} from "lucide-react";
import "./viewcomplaint.css";

const ViewComplaints = () => {

  const [complaints, setComplaints] = useState([]);
      const [loading, setLoading] = useState(true);

      const [selectedComplaint, setSelectedComplaint] = useState(null);
      const [search, setSearch] = useState("");
      const [statusFilter, setStatusFilter] = useState("All");

      useEffect(() => {
  fetchComplaints();
}, [statusFilter]);

const fetchComplaints = async () => {
  setLoading(true);
  try {
    const data = await userApi.getUserComplaints(statusFilter);
    if (data.success) {
      setComplaints(data.complaints);
    }
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
  } finally {
    setLoading(false);
  }
};

// ============================
// FILTER COMPLAINTS
// ============================

const notAssignedComplaints = complaints.filter(
  (complaint) => complaint.status === "Not Assigned"
).length;

const inProgressComplaints = complaints.filter(
  (complaint) => complaint.status === "In Progress"
).length;

const completedComplaints = complaints.filter(
  (complaint) => complaint.status === "Completed"
).length;


return (
  <div className="my-complaints-page">

    {/* ============================
          HEADER
      ============================ */}

    <div className="complaints-header">

      <div>
        <h1>My Complaints</h1>
        <p>Track and view the complaints you have submitted.</p>
      </div>

      <div className="user-info">
        <div className="user-avatar">M</div>
        <div>
          <h3>My Complaints</h3>
          <span>Coimbatore</span>
        </div>
      </div>

    </div>


    {/* ============================
          STATISTICS
      ============================ */}

    <div className="view-stats-grid">
      <div className="view-stat-card">
        <div className="view-stat-icon total-icon">
          <ClipboardList size={22} strokeWidth={2} />
        </div>
        <div className="view-stat-info">
          <span>Total Reported</span>
          <strong>{stats.total}</strong>
        </div>
      </div>

      <div className="view-stat-card">
        <div className="view-stat-icon pending-icon">
          <CircleDot size={22} strokeWidth={2} />
        </div>
        <div className="view-stat-info">
          <span>Not Assigned</span>
          <strong>{stats.pending}</strong>
        </div>
      </div>

      <div className="view-stat-card">
        <div className="view-stat-icon progress-icon">
          <Wrench size={22} strokeWidth={2} />
        </div>
        <div className="view-stat-info">
          <span>In Progress</span>
          <strong>{stats.progress}</strong>
        </div>
      </div>

      <div className="view-stat-card">
        <div className="view-stat-icon completed-icon">
          <CheckCircle2 size={22} strokeWidth={2} />
        </div>
        <div>
          <p>Completed</p>
          <h2>{completedComplaints}</h2>
        </div>
      </div>

    </div>


    {/* ============================
          COMPLAINT LIST
      ============================ */}

    <div className="complaints-section">

      <div className="section-header">

        <div>
          <h2>All Complaints</h2>
          <p>Search and filter complaints you have submitted</p>
        </div>

        <button className="refresh-btn">
          <RefreshCw size={14} strokeWidth={2.5} /> Refresh
        </button>

      </div>


      {/* SEARCH / FILTER */}

      <div className="filter-section">

        <div className="search-box">

          <Search size={17} strokeWidth={2} />

          <input
            type="text"
            placeholder="Search by complaint ID, title or location..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >

          <option value="All">All Status</option>
          <option value="Not Assigned">Not Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>

        </select>

      </div>


      {/* TABLE */}

      <div className="table-container">

        <table className="complaints-table">

          <thead>
            <tr>
              <th>Complaint</th>
              <th>Reported Date</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredComplaints.length > 0 ? (

              filteredComplaints.map((complaint) => (

                <tr key={complaint.id}>

                  <td>
                    <span className="complaint-id">
                      {complaint.id}
                    </span>
                    <br />
                    <span className="issue-title">
                      {complaint.title}
                    </span>
                  </td>

                  <td>{complaint.date}</td>

                  <td>
                    <span className="location">
                      <MapPin size={13} strokeWidth={2} className="inline-icon" />{" "}
                      {complaint.location}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`priority ${complaint.priority.toLowerCase()}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status ${complaint.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {complaint.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        setSelectedComplaint(complaint)
                      }
                    >
                      View
                    </button>
                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="6" className="no-results">
                  No complaints found.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>


    {/* ============================
          COMPLAINT DETAILS MODAL
      ============================ */}

    {selectedComplaint && (

      <div
        className="modal-overlay"
        onClick={() =>
          setSelectedComplaint(null)
        }
      >

        <div
          className="details-modal"
          onClick={(e) =>
            e.stopPropagation()
          }
        >

          {/* Modal Header */}

          <div className="modal-header">

            <div>

              <span className="modal-id">
                {selectedComplaint.id}
              </span>

              <h2>
                {selectedComplaint.title}
              </h2>

            </div>

            <button
              className="close-button"
              onClick={() =>
                setSelectedComplaint(null)
              }
            >
              <X size={18} strokeWidth={2.5} />
            </button>

          </div>


          {/* Status */}

          <div className="modal-status">

            <span
              className={`status ${formatStatus(selectedComplaint.status)
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {formatStatus(selectedComplaint.status)}
            </span>

            <span
              className={`priority ${formatPriority(selectedComplaint.priority)
                .toLowerCase()}`}
            >
              {formatPriority(selectedComplaint.priority)} Priority
            </span>

          </div>


          {/* Details */}

          <div className="details-grid">

            <div className="detail-item">
              <label>Complaint ID</label>
              <span>{selectedComplaint.id}</span>
            </div>

            <div className="detail-item">
              <label>Reported Date</label>
              <span>{selectedComplaint.date}</span>
            </div>

            <div className="detail-item">
              <label>Issue Type</label>
              <span>{selectedComplaint.issueType}</span>
            </div>

            <div className="detail-item">
              <label>Location</label>
              <span>{selectedComplaint.location}</span>
            </div>

            <div className="detail-item">
              <label>Latitude</label>
              <span>{selectedComplaint.latitude}</span>
            </div>

            <div className="detail-item">
              <label>Longitude</label>
              <span>{selectedComplaint.longitude}</span>
            </div>

          </div>


          {/* Description */}

          <div className="description-section">
            <label>Description</label>
            <p>{selectedComplaint.description}</p>
          </div>


          {/* Timeline */}

          <div className="timeline-section">

            <h3>Complaint Status</h3>

            <div className="timeline">

              <div className="timeline-item completed">

                <div className="timeline-dot">
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                </div>

                <div>
                  <strong>Complaint Submitted</strong>
                  <span>{selectedComplaint.date}</span>
                </div>

              </div>


              <div
                className={`timeline-item ${formatStatus(selectedComplaint.status) !== "Pending"
                  ? "completed"
                  : ""
                  }`}
              >

                <div className="timeline-dot">2</div>

                <div>

                  <strong>Work Assigned</strong>

                  <span>
                    {formatStatus(selectedComplaint.status) === "Pending"
                      ? "Waiting for assignment"
                      : "Workers assigned"}
                  </span>

                </div>

              </div>


              <div
                className={`timeline-item ${formatStatus(selectedComplaint.status) === "In Progress" ||
                  formatStatus(selectedComplaint.status) === "Completed"
                  ? "completed"
                  : ""
                  }`}
              >

                <div className="timeline-dot">3</div>

                <div>

                  <strong>Work In Progress</strong>

                  <span>
                    {formatStatus(selectedComplaint.status) === "Pending" || formatStatus(selectedComplaint.status) === "Assigned"
                      ? "Not started"
                      : "Repair work started"}
                  </span>

                </div>

              </div>


              <div
                className={`timeline-item ${formatStatus(selectedComplaint.status) === "Completed"
                  ? "completed"
                  : ""
                  }`}
              >

                <div className="timeline-dot">
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                </div>

                <div>

                  <strong>Completed</strong>

                  <span>
                    {formatStatus(selectedComplaint.status) === "Completed"
                      ? "Repair completed"
                      : "Waiting for completion"}
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* Close */}

          <button
            className="modal-close-btn"
            onClick={() =>
              setSelectedComplaint(null)
            }
          >
            Close
          </button>

        </div>

      </div>

    )}

  </div>
);
};

export default ViewComplaints;