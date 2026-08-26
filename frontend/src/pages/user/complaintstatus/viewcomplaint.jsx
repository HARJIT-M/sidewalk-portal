import React, { useState } from "react";
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


  return (
    <div className="my-complaints-page">

      {/* ============================
          HEADER
      ============================ */}

      <div className="complaints-header">

        <div>

          <h1>My Complaints</h1>

          <p>
            Track and view the complaints you have
            submitted.
          </p>

        </div>

        <div className="total-count">

          <span>Total Complaints</span>

          <strong>
            {complaints.length}
          </strong>

        </div>

      </div>


      {/* ============================
          SEARCH / FILTER
      ============================ */}

      <div className="filter-section">

        <div className="search-box">

          <span>⌕</span>

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

          <option value="All">
            All Status
          </option>

          <option value="Not Assigned">
            Not Assigned
          </option>

          <option value="In Progress">
            In Progress
          </option>

          <option value="Completed">
            Completed
          </option>

        </select>

      </div>


      {/* ============================
          COMPLAINT LIST
      ============================ */}

      <div className="complaints-card">

        <div className="table-header">

          <span>Complaint</span>
          <span>Date</span>
          <span>Location</span>
          <span>Priority</span>
          <span>Status</span>
          <span></span>

        </div>


        {filteredComplaints.length > 0 ? (

          filteredComplaints.map((complaint) => (

            <div
              className="complaint-row"
              key={complaint.id}
              onClick={() =>
                setSelectedComplaint(complaint)
              }
            >

              {/* Complaint */}

              <div className="complaint-info">

                <strong>
                  {complaint.id}
                </strong>

                <span>
                  {complaint.title}
                </span>

              </div>


              {/* Date */}

              <div className="date">
                {complaint.date}
              </div>


              {/* Location */}

              <div className="location">
                📍 {complaint.location}
              </div>


              {/* Priority */}

              <div>

                <span
                  className={`priority ${complaint.priority
                    .toLowerCase()}`}
                >
                  {complaint.priority}
                </span>

              </div>


              {/* Status */}

              <div>

                <span
                  className={`status ${complaint.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {complaint.status}
                </span>

              </div>


              {/* View */}

              <div className="view-arrow">
                →
              </div>

            </div>

          ))

        ) : (

          <div className="no-results">

            <div>
              No complaints found.
            </div>

          </div>

        )}

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
                ×
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

                <label>
                  Complaint ID
                </label>

                <span>
                  {selectedComplaint.id}
                </span>

              </div>


              <div className="detail-item">

                <label>
                  Reported Date
                </label>

                <span>
                  {selectedComplaint.date}
                </span>

              </div>


              <div className="detail-item">

                <label>
                  Issue Type
                </label>

                <span>
                  {selectedComplaint.issueType}
                </span>

              </div>


              <div className="detail-item">

                <label>
                  Location
                </label>

                <span>
                  {selectedComplaint.location}
                </span>

              </div>


              <div className="detail-item">

                <label>
                  Latitude
                </label>

                <span>
                  {selectedComplaint.latitude}
                </span>

              </div>


              <div className="detail-item">

                <label>
                  Longitude
                </label>

                <span>
                  {selectedComplaint.longitude}
                </span>

              </div>

            </div>


            {/* Description */}

            <div className="description-section">

              <label>
                Description
              </label>

              <p>
                {selectedComplaint.description}
              </p>

            </div>


            {/* Timeline */}

            <div className="timeline-section">

              <h3>
                Complaint Status
              </h3>

              <div className="timeline">

                <div className="timeline-item completed">

                  <div className="timeline-dot">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Complaint Submitted
                    </strong>

                    <span>
                      {selectedComplaint.date}
                    </span>
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

                  <div className="timeline-dot">
                    2
                  </div>

                  <div>

                    <strong>
                      Work Assigned
                    </strong>

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

                  <div className="timeline-dot">
                    3
                  </div>

                  <div>

                    <strong>
                      Work In Progress
                    </strong>

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
                    ✓
                  </div>

                  <div>

                    <strong>
                      Completed
                    </strong>

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