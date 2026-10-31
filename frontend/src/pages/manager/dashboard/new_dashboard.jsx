// new_dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Hourglass,
  Wrench,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Calendar,
  ArrowRight,
  Inbox,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getManagerDashboard } from "../../../services/managerApi";
import "./new_dashboard.css";

// number of complaints shown per page
const PAGE_SIZE = 5;

// builds the page list, e.g. [1, "...", 4, 5, 6, "...", 10]
const getPageNumbers = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manager, setManager] = useState({
    name: "",
    city: "",
    zone: "",
  });
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
  });
  const [complaints, setComplaints] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getManagerDashboard();
      if (res && res.success) {
        if (res.manager) setManager(res.manager);
        if (res.stats) setStats(res.stats);
        if (res.complaints) setComplaints(res.complaints);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load manager dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getInitial = (name) => {
    if (!name) return "M";
    return name.trim().charAt(0).toUpperCase();
  };

  const cls = (value) => String(value).toLowerCase().replace(/\s+/g, "-");

  // Pagination (5 complaints per page)
  const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedComplaints = complaints.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = complaints.length === 0 ? 0 : startIndex + 1;
  const showingTo = startIndex + pagedComplaints.length;

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const statCards = [
    { label: "Total Complaints", value: stats.totalComplaints, icon: ClipboardList, tone: "total" },
    { label: "Pending Review", value: stats.pendingComplaints, icon: Hourglass, tone: "pending" },
    { label: "In Progress", value: stats.inProgressComplaints, icon: Wrench, tone: "progress" },
    { label: "Resolved", value: stats.resolvedComplaints, icon: CheckCircle2, tone: "done" },
  ];

  return (
    <div className="md-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="md-hero">
        <div className="md-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="md-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="md-hero-text">
          <span className="md-hero-tag">
            <Building2 size={14} strokeWidth={2.4} /> Manager Console
          </span>
          <h1>Manager Dashboard</h1>
          <p>Supervise and dispatch municipal footpath repairs in real-time</p>
        </div>

        <div className="md-manager">
          <div className="md-avatar">{getInitial(manager.name)}</div>
          <div>
            <h3>{manager.name || "Manager"}</h3>
            <span>{manager.city || manager.zone || "Municipal Corp"}</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="md-error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          {error}
        </div>
      )}

      {/* =========================
          STATISTICS
      ========================= */}

      <section className="md-stats">
        {statCards.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`md-stat md-stat-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="md-stat-icon">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="md-stat-text">
              <strong>{loading ? "..." : value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* =========================
          COMPLAINTS
      ========================= */}

      <section className="md-recent">
        <div className="md-section-head">
          <div>
            <h2>Recent Complaints Overview</h2>
            <p>Live feed of citizen reported issues and repair progress</p>
          </div>

          <button
            className="md-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              strokeWidth={2.5}
              className={loading ? "md-spin" : ""}
            />
            {loading ? "Updating..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="md-loading">
            <div className="md-loader" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
            </div>
            <p>Loading complaints from database...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="md-empty">
            <Inbox size={36} strokeWidth={1.8} />
            <p>No complaints registered in the system yet.</p>
          </div>
        ) : (
          <>
            {/* ---- DESKTOP / TABLET TABLE ---- */}
            <div className="md-table-wrap">
              <table className="md-table">
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
                  {pagedComplaints.map((complaint) => {
                    const priority = complaint.priority || "Medium";
                    const status = complaint.status || "Pending";
                    return (
                      <tr key={complaint.id || complaint.mongoId}>
                        <td>
                          <span className="md-id">{complaint.id}</span>
                        </td>

                        <td className="md-issue">{complaint.title}</td>

                        <td>
                          <span className="md-loc">
                            <MapPin size={13} strokeWidth={2} />
                            {complaint.location}
                          </span>
                        </td>

                        <td>{complaint.date}</td>

                        <td>
                          <span className={`md-priority ${cls(priority)}`}>
                            {priority}
                          </span>
                        </td>

                        <td>
                          <span className={`md-status ${cls(status)}`}>
                            <span className="md-dot"></span>
                            {status}
                          </span>
                        </td>

                        <td>
                          <button
                            className="md-manage"
                            onClick={() => navigate("/complaints")}
                          >
                            Manage
                            <ArrowRight size={14} strokeWidth={2.4} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---- MOBILE CARD LIST ---- */}
            <div className="md-cards">
              {pagedComplaints.map((complaint) => {
                const priority = complaint.priority || "Medium";
                const status = complaint.status || "Pending";
                return (
                  <div className="md-card" key={complaint.id || complaint.mongoId}>
                    <div className="md-card-top">
                      <span className="md-id">{complaint.id}</span>
                      <span className={`md-status ${cls(status)}`}>
                        <span className="md-dot"></span>
                        {status}
                      </span>
                    </div>

                    <h3>{complaint.title}</h3>

                    <div className="md-card-meta">
                      <span>
                        <MapPin size={13} strokeWidth={2} />
                        {complaint.location}
                      </span>
                      <span>
                        <Calendar size={13} strokeWidth={2} />
                        {complaint.date}
                      </span>
                    </div>

                    <div className="md-card-bottom">
                      <span className={`md-priority ${cls(priority)}`}>
                        {priority}
                      </span>
                      <button
                        className="md-manage"
                        onClick={() => navigate("/complaints")}
                      >
                        Manage
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---- PAGINATION ---- */}
            <div className="md-pagination">
              <span className="md-page-info">
                Showing <strong>{showingFrom}–{showingTo}</strong> of{" "}
                <strong>{complaints.length}</strong> complaints
              </span>

              {totalPages > 1 && (
                <nav className="md-page-controls" aria-label="Complaints pagination">
                  <button
                    className="md-page-btn md-page-nav"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} strokeWidth={2.6} />
                    <span>Prev</span>
                  </button>

                  {getPageNumbers(safePage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span className="md-page-ellipsis" key={`dots-${i}`}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`md-page-btn ${p === safePage ? "active" : ""}`}
                        onClick={() => goToPage(p)}
                        aria-current={p === safePage ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="md-page-btn md-page-nav"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} strokeWidth={2.6} />
                  </button>
                </nav>
              )}
            </div>
          </>
        )}
      </section>

    </div>
  );
};

export default Dashboard;