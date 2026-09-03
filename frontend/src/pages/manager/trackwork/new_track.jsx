import React, { useState } from "react";
import {
  ClipboardList,
  Pin,
  Wrench,
  CheckCircle2,
  Search,
  MapPin,
  Users,
  Calendar,
  Flag,
  RefreshCw,
  Clock,
} from "lucide-react";
import "./new_track.css";

const WorkTracking = () => {
  // Temporary work tracking data
  const [works] = useState([
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

  const [selectedId, setSelectedId] = useState(works[0]?.id || null);
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

  const selectedWork =
    works.find((w) => w.id === selectedId) || filteredWorks[0] || null;

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

  const statusClass = (status) => status.toLowerCase().replace(" ", "-");

  return (
    <div className="work-tracking-page">

      {/* ================= HEADER ================= */}

      <div className="tracking-header">
        <div>
          <h1>Work Tracking</h1>
          <p>Monitor assigned complaints and repair progress</p>
        </div>
      </div>


      {/* ================= STATISTICS ================= */}

      <div className="tracking-stats">

        <div className="tracking-stat">
          <div className="stat-icon total-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Total Works</span>
            <strong>{totalWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon assigned-icon">
            <Pin size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Assigned</span>
            <strong>{assignedWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon progress-icon">
            <Wrench size={22} strokeWidth={2} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{inProgressWorks}</strong>
          </div>
        </div>

        <div className="tracking-stat">
          <div className="stat-icon completed-icon">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedWorks}</strong>
          </div>
        </div>

      </div>


      {/* ================= SPLIT LAYOUT ================= */}

      <div className="tracking-split">

        {/* -------- LEFT: WORK LIST -------- */}

        <div className="tracking-list-panel">

          <div className="tracking-search">
            <Search size={16} strokeWidth={2} />

            <input
              type="text"
              placeholder="Search complaint or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="status-pill-filters">
            {["All", "Assigned", "In Progress", "Completed"].map((s) => (
              <button
                key={s}
                className={`status-pill-filter ${
                  statusFilter === s ? "active" : ""
                }`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="work-list-scroll">

            {filteredWorks.length > 0 ? (

              filteredWorks.map((work) => (

                <button
                  key={work.id}
                  className={`work-list-item ${
                    selectedWork && selectedWork.id === work.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => setSelectedId(work.id)}
                >

                  <div className="work-list-item-top">
                    <span className="work-id-tag">{work.id}</span>
                    <span
                      className={`work-status ${statusClass(work.status)}`}
                    >
                      {work.status}
                    </span>
                  </div>

                  <h3>{work.title}</h3>

                  <p className="work-list-location">
                    <MapPin size={12} strokeWidth={2} />
                    {work.location}
                  </p>

                  <div className="work-list-progress">
                    <div className="work-list-progress-track">
                      <div
                        className={`work-list-progress-fill ${statusClass(
                          work.status
                        )}`}
                        style={{ width: `${work.progress}%` }}
                      ></div>
                    </div>
                    <span>{work.progress}%</span>
                  </div>

                </button>

              ))

            ) : (

              <div className="work-list-empty">No matching work items.</div>

            )}

          </div>

        </div>


        {/* -------- RIGHT: DETAIL PANEL -------- */}

        <div className="tracking-detail-panel">

          {selectedWork ? (

            <>
              {/* Detail Header */}

              <div className="detail-header">

                <div>
                  <span className="work-id-tag">{selectedWork.id}</span>
                  <h2>{selectedWork.title}</h2>
                  <p className="work-list-location">
                    <MapPin size={13} strokeWidth={2} />
                    {selectedWork.location}
                  </p>
                </div>

                <div className="detail-header-badges">
                  <span
                    className={`work-status ${statusClass(
                      selectedWork.status
                    )}`}
                  >
                    {selectedWork.status}
                  </span>
                  <span
                    className={`priority-small ${selectedWork.priority.toLowerCase()}`}
                  >
                    <Flag size={11} strokeWidth={2.5} />
                    {selectedWork.priority}
                  </span>
                </div>

              </div>


              {/* Progress */}

              <div className="detail-progress-box">

                <div className="detail-progress-top">
                  <span>Repair Progress</span>
                  <strong>{selectedWork.progress}%</strong>
                </div>

                <div className="progress-bar">
                  <div
                    className={`progress-fill ${statusClass(
                      selectedWork.status
                    )}`}
                    style={{ width: `${selectedWork.progress}%` }}
                  ></div>
                </div>

              </div>


              {/* Info Grid */}

              <div className="detail-info-grid">

                <div className="detail-info-item">
                  <span>
                    <Calendar size={13} strokeWidth={2} /> Assigned Date
                  </span>
                  <strong>{selectedWork.assignedDate}</strong>
                </div>

                <div className="detail-info-item">
                  <span>
                    <Clock size={13} strokeWidth={2} /> Started Date
                  </span>
                  <strong>{selectedWork.startedDate}</strong>
                </div>

                <div className="detail-info-item">
                  <span>
                    <Calendar size={13} strokeWidth={2} /> Expected Completion
                  </span>
                  <strong>{selectedWork.expectedDate}</strong>
                </div>

                <div className="detail-info-item">
                  <span>
                    <RefreshCw size={13} strokeWidth={2} /> Last Updated By
                  </span>
                  <strong>{selectedWork.updatedBy}</strong>
                </div>

              </div>


              {/* Assigned Team */}

              <div className="detail-team-block">
                <h3>
                  <Users size={15} strokeWidth={2} /> Assigned Team
                </h3>

                <div className="worker-list">
                  {selectedWork.assignedWorkers.map((worker) => (
                    <span key={worker}>👤 {worker}</span>
                  ))}
                </div>
              </div>


              {/* Latest Update */}

              <div className="last-update">
                <div className="update-icon">
                  <RefreshCw size={18} strokeWidth={2} />
                </div>

                <div>
                  <span>Latest Update</span>
                  <p>{selectedWork.lastUpdate}</p>
                  <small>{selectedWork.updatedAt}</small>
                </div>
              </div>


              {/* Update History */}

              <div className="work-history">
                <h3>Work Updates</h3>

                {selectedWork.history.map((update, index) => (
                  <div className="history-item" key={index}>

                    <div className="history-line">
                      <div className="history-dot"></div>
                    </div>

                    <div className="history-content">

                      <div className="history-top">
                        <strong>{update.worker}</strong>
                        <span>{update.date}</span>
                      </div>

                      <p>{update.message}</p>

                      <span className="history-progress">
                        Progress: {update.progress}%
                      </span>

                    </div>

                  </div>
                ))}
              </div>

            </>

          ) : (

            <div className="detail-empty">
              Select a work item from the list to view its details.
            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default WorkTracking;