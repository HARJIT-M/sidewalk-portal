import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getWorkerComplaints, getWorkerProfile } from "../../services/workerApi";
import {
  Search,
  MapPin,
  Calendar,
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Flag,
} from "lucide-react";
import "./MyComplaints.css";

const MyComplaints = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [complaintsRes, profileRes] = await Promise.allSettled([
        getWorkerComplaints({
          status: statusFilter !== "All" ? statusFilter : undefined,
          priority: priorityFilter !== "All" ? priorityFilter : undefined,
          search: search.trim() ? search.trim() : undefined,
        }),
        getWorkerProfile(),
      ]);

      if (complaintsRes.status === "fulfilled" && complaintsRes.value.success) {
        setComplaints(complaintsRes.value.complaints);
      }
      if (profileRes.status === "fulfilled" && profileRes.value.success) {
        setProfile(profileRes.value.profile);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError("Failed to load assigned complaints from database.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    const qFilter = searchParams.get("filter");
    if (qFilter) {
      if (qFilter === "ASSIGNED") setStatusFilter("Pending");
      else if (qFilter === "IN_PROGRESS") setStatusFilter("In Progress");
      else if (qFilter === "RESOLVED") setStatusFilter("Completed");
    }
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const getStatusDisplay = (status) => {
    if (status === "ASSIGNED" || status === "PENDING") return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "COMPLETED" || status === "CLOSED") return "Completed";
    return status;
  };

  // Client-side quick filter / safety pass
  const filteredComplaints = complaints.filter((complaint) => {
    const displayStatus = getStatusDisplay(complaint.status);
    const matchesSearch =
      search === "" ||
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

  // Stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => getStatusDisplay(c.status) === "Pending"
  ).length;
  const progressCount = complaints.filter(
    (c) => getStatusDisplay(c.status) === "In Progress"
  ).length;
  const completedCount = complaints.filter(
    (c) => getStatusDisplay(c.status) === "Completed"
  ).length;

  const statusIcon = (status) => {
    if (status === "Pending") return <Clock size={13} strokeWidth={2.5} />;
    if (status === "In Progress") return <Wrench size={13} strokeWidth={2.5} />;
    return <CheckCircle2 size={13} strokeWidth={2.5} />;
  };

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
          <ClipboardList size={20} strokeWidth={2} />
          <div>
            <strong>{filteredComplaints.length}</strong>
            <span>Complaints</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 18px", borderRadius: "10px", margin: "14px 0", fontWeight: "500" }}>
          ⚠️ {error}
        </div>
      )}

      {/* =========================
          STATS STRIP
      ========================= */}
      <div className="stats-strip">
        <div className="stat-pill" onClick={() => setStatusFilter("All")} style={{ cursor: "pointer" }}>
          <div className="stat-pill-icon total">
            <ClipboardList size={17} strokeWidth={2} />
          </div>
          <div>
            <strong>{totalCount}</strong>
            <span>Total</span>
          </div>
        </div>

        <div className="stat-pill" onClick={() => setStatusFilter("Pending")} style={{ cursor: "pointer" }}>
          <div className="stat-pill-icon pending">
            <Clock size={17} strokeWidth={2} />
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <span>Pending</span>
          </div>
        </div>

        <div className="stat-pill" onClick={() => setStatusFilter("In Progress")} style={{ cursor: "pointer" }}>
          <div className="stat-pill-icon progress">
            <Wrench size={17} strokeWidth={2} />
          </div>
          <div>
            <strong>{progressCount}</strong>
            <span>In Progress</span>
          </div>
        </div>

        <div className="stat-pill" onClick={() => setStatusFilter("Completed")} style={{ cursor: "pointer" }}>
          <div className="stat-pill-icon completed">
            <CheckCircle2 size={17} strokeWidth={2} />
          </div>
          <div>
            <strong>{completedCount}</strong>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* =========================
          FILTERS
      ========================= */}
      <div className="filters-container">
        <div className="search-box">
          <Search size={16} strokeWidth={2} />
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
          COMPLAINTS CARD GRID
      ========================= */}
      {loading && complaints.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <p>Loading complaints from MongoDB...</p>
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="complaint-cards-grid">
          {filteredComplaints.map((complaint) => {
            const statusDisplay = getStatusDisplay(complaint.status);
            const statusClass = statusDisplay.toLowerCase().replace(" ", "-");
            const priorityClass = complaint.priority?.toLowerCase() || "medium";

            return (
              <div className="complaint-card" key={complaint.id}>
                <div className={`complaint-card-accent ${statusClass}`}></div>

                <div className="complaint-card-body">
                  <div className="complaint-card-top">
                    <span className="complaint-id">{complaint.id}</span>
                    <span className={`status ${statusClass}`}>
                      {statusIcon(statusDisplay)}
                      {statusDisplay}
                    </span>
                  </div>

                  <h3 className="issue-title">{complaint.issue}</h3>

                  <p className="location">
                    <MapPin size={13} strokeWidth={2} className="inline-icon" />
                    {complaint.location}
                  </p>

                  <div className="complaint-card-meta">
                    <span className="meta-item">
                      <Calendar size={12} strokeWidth={2} />
                      {complaint.reportedDate}
                    </span>

                    <span className={`priority ${priorityClass}`}>
                      <Flag size={11} strokeWidth={2.5} />
                      {complaint.priority}
                    </span>
                  </div>

                  <button
                    className="view-btn"
                    onClick={() =>
                      navigate(`/worker/complaints/${complaint.id}`)
                    }
                  >
                    {statusDisplay === "Pending" ? "Start / View" : "View Details"}
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-complaints">
          <div className="no-complaint-icon">
            <ClipboardList size={30} strokeWidth={1.5} />
          </div>
          <h3>No complaints found</h3>
          <p>Try changing your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;