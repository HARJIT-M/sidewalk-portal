import React, { useState } from "react";
import "./new_track.css";

const WorkTracking = () => {
  // Temporary work tracking data
  const [works, setWorks] = useState([
    {
      id: "CMP001",
      title: "Broken Footpath",
      location: "Gandhipuram, Coimbatore",
      priority: "High",
      status: "In Progress",
      progress: 65,
      assignedWorkers: ["Ravi", "Karthik", "Manoj"],
      assignedDate: "21 Aug 2026",
      startedDate: "21 Aug 2026",
      expectedDate: "24 Aug 2026",
      lastUpdate: "Broken tiles have been removed. New tiles are being installed.",
      updatedBy: "Ravi",
      updatedAt: "21 Aug 2026, 11:30 AM",
      history: [
        {
          date: "21 Aug 2026, 11:30 AM",
          worker: "Ravi",
          message:
            "Broken tiles have been removed. New tiles are being installed.",
          progress: 65,
        },
        {
          date: "21 Aug 2026, 09:00 AM",
          worker: "Karthik",
          message: "Work started. Damaged section was inspected.",
          progress: 30,
        },
      ],
    },

    {
      id: "CMP002",
      title: "Large Pothole",
      location: "RS Puram, Coimbatore",
      priority: "High",
      status: "In Progress",
      progress: 40,
      assignedWorkers: ["Suresh", "Arun"],
      assignedDate: "20 Aug 2026",
      startedDate: "20 Aug 2026",
      expectedDate: "23 Aug 2026",
      lastUpdate: "Pothole area has been cleaned and prepared for repair.",
      updatedBy: "Suresh",
      updatedAt: "21 Aug 2026, 10:15 AM",
      history: [
        {
          date: "21 Aug 2026, 10:15 AM",
          worker: "Suresh",
          message:
            "Pothole area has been cleaned and prepared for repair.",
          progress: 40,
        },
        {
          date: "20 Aug 2026, 03:00 PM",
          worker: "Arun",
          message: "Repair work started.",
          progress: 20,
        },
      ],
    },

    {
      id: "CMP003",
      title: "Cracked Sidewalk",
      location: "Saibaba Colony, Coimbatore",
      priority: "Medium",
      status: "Completed",
      progress: 100,
      assignedWorkers: ["Manoj", "Dinesh"],
      assignedDate: "18 Aug 2026",
      startedDate: "18 Aug 2026",
      expectedDate: "20 Aug 2026",
      lastUpdate: "Cracked sidewalk has been completely repaired.",
      updatedBy: "Manoj",
      updatedAt: "20 Aug 2026, 04:30 PM",
      history: [
        {
          date: "20 Aug 2026, 04:30 PM",
          worker: "Manoj",
          message:
            "Cracked sidewalk has been completely repaired.",
          progress: 100,
        },
        {
          date: "19 Aug 2026, 02:00 PM",
          worker: "Dinesh",
          message: "Damaged section was repaired.",
          progress: 75,
        },
        {
          date: "18 Aug 2026, 10:00 AM",
          worker: "Manoj",
          message: "Repair work started.",
          progress: 20,
        },
      ],
    },

    {
      id: "CMP004",
      title: "Damaged Pavement",
      location: "Peelamedu, Coimbatore",
      priority: "Low",
      status: "Assigned",
      progress: 0,
      assignedWorkers: ["Arun", "Suresh"],
      assignedDate: "21 Aug 2026",
      startedDate: "-",
      expectedDate: "25 Aug 2026",
      lastUpdate: "Work has been assigned. Waiting for the team to start.",
      updatedBy: "System",
      updatedAt: "21 Aug 2026, 08:00 AM",
      history: [
        {
          date: "21 Aug 2026, 08:00 AM",
          worker: "System",
          message: "Work assigned to maintenance team.",
          progress: 0,
        },
      ],
    },

    {
      id: "CMP005",
      title: "Missing Footpath Tiles",
      location: "Singanallur, Coimbatore",
      priority: "Medium",
      status: "Completed",
      progress: 100,
      assignedWorkers: ["Ravi", "Karthik"],
      assignedDate: "16 Aug 2026",
      startedDate: "16 Aug 2026",
      expectedDate: "19 Aug 2026",
      lastUpdate: "All missing tiles have been replaced successfully.",
      updatedBy: "Karthik",
      updatedAt: "19 Aug 2026, 05:15 PM",
      history: [
        {
          date: "19 Aug 2026, 05:15 PM",
          worker: "Karthik",
          message:
            "All missing tiles have been replaced successfully.",
          progress: 100,
        },
        {
          date: "18 Aug 2026, 01:30 PM",
          worker: "Ravi",
          message: "New tiles are being installed.",
          progress: 70,
        },
      ],
    },
  ]);

  const [selectedWork, setSelectedWork] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Filter work
  const filteredWorks = works.filter((work) => {
    const matchesSearch =
      work.id.toLowerCase().includes(search.toLowerCase()) ||
      work.title.toLowerCase().includes(search.toLowerCase()) ||
      work.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || work.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Counts
  const totalWorks = works.length;

  const assignedWorks = works.filter(
    (work) => work.status === "Assigned"
  ).length;

  const inProgressWorks = works.filter(
    (work) => work.status === "In Progress"
  ).length;

  const completedWorks = works.filter(
    (work) => work.status === "Completed"
  ).length;

  // Open details
  const handleViewDetails = (work) => {
    setSelectedWork(work);
    setShowDetails(true);
  };

  return (
    <div className="work-tracking-page">

      {/* ================= HEADER ================= */}

      <div className="tracking-header">
        <div>
          <h1>Work Tracking</h1>
          <p>
            Monitor assigned complaints and repair progress
          </p>
        </div>
      </div>


      {/* ================= STATISTICS ================= */}

      <div className="tracking-stats">

        <div className="tracking-stat">
          <div className="stat-icon total-icon">
            📋
          </div>

          <div>
            <span>Total Works</span>
            <strong>{totalWorks}</strong>
          </div>
        </div>


        <div className="tracking-stat">
          <div className="stat-icon assigned-icon">
            📌
          </div>

          <div>
            <span>Assigned</span>
            <strong>{assignedWorks}</strong>
          </div>
        </div>


        <div className="tracking-stat">
          <div className="stat-icon progress-icon">
            🔧
          </div>

          <div>
            <span>In Progress</span>
            <strong>{inProgressWorks}</strong>
          </div>
        </div>


        <div className="tracking-stat">
          <div className="stat-icon completed-icon">
            ✓
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedWorks}</strong>
          </div>
        </div>

      </div>


      {/* ================= FILTERS ================= */}

      <div className="tracking-filters">

        <div className="tracking-search">
          🔍

          <input
            type="text"
            placeholder="Search complaint or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>


        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

      </div>


      {/* ================= WORK CARDS ================= */}

      <div className="work-list">

        {filteredWorks.map((work) => (

          <div className="work-card" key={work.id}>

            {/* Card Header */}

            <div className="work-card-header">

              <div>
                <span className="work-id">
                  {work.id}
                </span>

                <h2>{work.title}</h2>

                <p className="work-location">
                  📍 {work.location}
                </p>
              </div>


              <div className="work-status-area">

                <span
                  className={`work-status ${work.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {work.status}
                </span>

                <span
                  className={`priority-small ${work.priority.toLowerCase()}`}
                >
                  {work.priority}
                </span>

              </div>

            </div>


            {/* Progress */}

            <div className="progress-section">

              <div className="progress-header">
                <span>Repair Progress</span>

                <strong>
                  {work.progress}%
                </strong>
              </div>


              <div className="progress-bar">

                <div
                  className={`progress-fill ${work.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                  style={{
                    width: `${work.progress}%`,
                  }}
                ></div>

              </div>

            </div>


            {/* Work Details */}

            <div className="work-details-grid">

              <div>
                <span>Assigned Team</span>

                <div className="worker-list">

                  {work.assignedWorkers.map((worker) => (
                    <span key={worker}>
                      👤 {worker}
                    </span>
                  ))}

                </div>
              </div>


              <div>
                <span>Expected Completion</span>
                <strong>{work.expectedDate}</strong>
              </div>


              <div>
                <span>Last Updated By</span>
                <strong>{work.updatedBy}</strong>
              </div>

            </div>


            {/* Last Update */}

            <div className="last-update">

              <div className="update-icon">
                ↻
              </div>

              <div>
                <span>Latest Update</span>

                <p>
                  {work.lastUpdate}
                </p>

                <small>
                  {work.updatedAt}
                </small>
              </div>

            </div>


            {/* Footer */}

            <div className="work-card-footer">

              <span>
                Assigned on {work.assignedDate}
              </span>

              <button
                className="view-work-btn"
                onClick={() => handleViewDetails(work)}
              >
                View Work Details →
              </button>

            </div>

          </div>

        ))}

      </div>


      {/* ================= DETAILS POPUP ================= */}

      {showDetails && selectedWork && (

        <div className="tracking-modal-overlay">

          <div className="tracking-modal">

            {/* Modal Header */}

            <div className="tracking-modal-header">

              <div>
                <span className="work-id">
                  {selectedWork.id}
                </span>

                <h2>
                  {selectedWork.title}
                </h2>
              </div>

              <button
                className="tracking-close"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>

            </div>


            {/* Modal Content */}

            <div className="tracking-modal-content">

              {/* Current Status */}

              <div className="current-status-box">

                <div>

                  <span>Current Status</span>

                  <strong
                    className={`modal-status ${selectedWork.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {selectedWork.status}
                  </strong>

                </div>

                <div className="modal-progress-number">
                  {selectedWork.progress}%
                </div>

              </div>


              {/* Progress */}

              <div className="modal-progress">

                <div className="modal-progress-bar">

                  <div
                    style={{
                      width: `${selectedWork.progress}%`,
                    }}
                  ></div>

                </div>

              </div>


              {/* Information */}

              <div className="modal-info-grid">

                <div>
                  <span>Location</span>
                  <strong>
                    📍 {selectedWork.location}
                  </strong>
                </div>

                <div>
                  <span>Priority</span>

                  <strong
                    className={`priority-small ${selectedWork.priority.toLowerCase()}`}
                  >
                    {selectedWork.priority}
                  </strong>
                </div>

                <div>
                  <span>Started Date</span>
                  <strong>
                    {selectedWork.startedDate}
                  </strong>
                </div>

                <div>
                  <span>Expected Completion</span>
                  <strong>
                    {selectedWork.expectedDate}
                  </strong>
                </div>

              </div>


              {/* Assigned Team */}

              <div className="modal-team">

                <h3>Assigned Team</h3>

                <div>

                  {selectedWork.assignedWorkers.map(
                    (worker) => (
                      <span key={worker}>
                        👤 {worker}
                      </span>
                    )
                  )}

                </div>

              </div>


              {/* Update History */}

              <div className="work-history">

                <h3>Work Updates</h3>

                {selectedWork.history.map(
                  (update, index) => (

                    <div
                      className="history-item"
                      key={index}
                    >

                      <div className="history-line">

                        <div className="history-dot"></div>

                      </div>

                      <div className="history-content">

                        <div className="history-top">

                          <strong>
                            {update.worker}
                          </strong>

                          <span>
                            {update.date}
                          </span>

                        </div>

                        <p>
                          {update.message}
                        </p>

                        <span className="history-progress">
                          Progress: {update.progress}%
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* Footer */}

            <div className="tracking-modal-footer">

              <button
                className="close-modal-btn"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default WorkTracking;