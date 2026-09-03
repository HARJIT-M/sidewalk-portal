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

  // ============================
  // SAMPLE DATA
  // ============================

  const complaints = [
    {
      id: "CMP001",
      title: "Broken Footpath Near Bus Stand",
      date: "24 Aug 2026",
      location: "Main Road, Near Bus Stand",
      priority: "High",
      status: "In Progress",
      issueType: "Broken Footpath",
      description:
        "The footpath has several broken tiles and is difficult for pedestrians to use safely.",
      latitude: 11.2746,
      longitude: 77.5871,
    },

    {
      id: "CMP002",
      title: "Large Pothole on Sidewalk",
      date: "20 Aug 2026",
      location: "Gandhi Road",
      priority: "Critical",
      status: "Not Assigned",
      issueType: "Pothole",
      description:
        "A large pothole has developed on the pedestrian pathway near the road junction.",
      latitude: 11.2751,
      longitude: 77.5882,
    },

    {
      id: "CMP003",
      title: "Cracked Footpath",
      date: "15 Aug 2026",
      location: "Market Street",
      priority: "Medium",
      status: "Completed",
      issueType: "Footpath Crack",
      description:
        "There is a long crack across the footpath which may cause pedestrians to trip.",
      latitude: 11.2764,
      longitude: 77.5890,
    },

    {
      id: "CMP004",
      title: "Uneven Sidewalk",
      date: "10 Aug 2026",
      location: "College Road",
      priority: "Low",
      status: "In Progress",
      issueType: "Uneven Surface",
      description:
        "Several sections of the sidewalk are uneven and need repair.",
      latitude: 11.2772,
      longitude: 77.5901,
    },

    {
      id: "CMP005",
      title: "Damaged Sidewalk Tiles",
      date: "05 Aug 2026",
      location: "Temple Road",
      priority: "Medium",
      status: "Completed",
      issueType: "Damaged Sidewalk",
      description:
        "Multiple sidewalk tiles are damaged and need to be replaced.",
      latitude: 11.2781,
      longitude: 77.5912,
    },
  ];


  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");


  // ============================
  // FILTER COMPLAINTS
  // ============================

  const filteredComplaints = complaints.filter(
    (complaint) => {

      const matchesSearch =
        complaint.id
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        complaint.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        complaint.location
          .toLowerCase()
          .includes(search.toLowerCase());


      const matchesStatus =
        statusFilter === "All" ||
        complaint.status === statusFilter;


      return matchesSearch && matchesStatus;
    }
  );


  // ============================
  // COUNTS (for stat cards)
  // ============================

  const totalComplaints = complaints.length;

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

      <div className="stats-container">

        <div className="stat-card">
          <div className="stat-icon total">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div>
            <p>Total Complaints</p>
            <h2>{totalComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <CircleDot size={22} strokeWidth={2} />
          </div>
          <div>
            <p>Not Assigned</p>
            <h2>{notAssignedComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress">
            <Wrench size={22} strokeWidth={2} />
          </div>
          <div>
            <p>In Progress</p>
            <h2>{inProgressComplaints}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">
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
                className={`status ${selectedComplaint.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {selectedComplaint.status}
              </span>

              <span
                className={`priority ${selectedComplaint.priority
                  .toLowerCase()}`}
              >
                {selectedComplaint.priority} Priority
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
                  className={`timeline-item ${
                    selectedComplaint.status !==
                    "Not Assigned"
                      ? "completed"
                      : ""
                  }`}
                >

                  <div className="timeline-dot">2</div>

                  <div>

                    <strong>Work Assigned</strong>

                    <span>
                      {selectedComplaint.status ===
                      "Not Assigned"
                        ? "Waiting for assignment"
                        : "Workers assigned"}
                    </span>

                  </div>

                </div>


                <div
                  className={`timeline-item ${
                    selectedComplaint.status ===
                      "In Progress" ||
                    selectedComplaint.status ===
                      "Completed"
                      ? "completed"
                      : ""
                  }`}
                >

                  <div className="timeline-dot">3</div>

                  <div>

                    <strong>Work In Progress</strong>

                    <span>
                      {selectedComplaint.status ===
                      "Not Assigned"
                        ? "Not started"
                        : "Repair work started"}
                    </span>

                  </div>

                </div>


                <div
                  className={`timeline-item ${
                    selectedComplaint.status ===
                    "Completed"
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
                      {selectedComplaint.status ===
                      "Completed"
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