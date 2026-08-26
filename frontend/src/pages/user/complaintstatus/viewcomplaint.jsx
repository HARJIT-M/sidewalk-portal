import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./viewcomplaint.css";

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/user/complaints");
        setComplaints(res.data.complaints || []);
      } catch (err) {
        console.warn("Could not load complaints:", err.message || err);
      }
    })();
  }, []);

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
              <div className="complaint-info">

                <strong>
                  {complaint.id}
                </strong>

                <span>
                  {complaint.title}
                </span>

              </div>


              <div className="date">
                {complaint.date}
              </div>



              <div className="location">
                📍 {complaint.location}
              </div>

              <div>

                <span
                  className={`priority ${complaint.priority
                    .toLowerCase()}`}
                >
                  {complaint.priority}
                </span>

              </div>



              <div>

                <span
                  className={`status ${complaint.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {complaint.status}
                </span>

              </div>

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


            <div className="description-section">

              <label>
                Description
              </label>

              <p>
                {selectedComplaint.description}
              </p>

            </div>

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