import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CircleDot,
  RefreshCw,
  CheckCircle2,
  Plus,
  MapPin,
  Calendar,
  ArrowRight,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import userApi from "../../../services/userApi";
import "./userdashboard.css";

// number of complaints shown per page
const PAGE_SIZE = 5;

// first name of the logged in user (saved by the login page)
const getFirstName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.name ? user.name.trim().split(" ")[0] : "";
  } catch {
    return "";
  }
};

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

const UserDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await userApi.getDashboard();
        if (data.success) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch user dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="ud-page ud-loading">
        <div className="ud-loader" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Statistics
  const stats = dashboardData?.stats || {
    totalReported: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  };
  const complaints = dashboardData?.recentActivity || [];

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

  const badgeClass = (value) => value.toLowerCase().replace(/\s+/g, "-");

  const formatStatus = (status) => {
    if (!status) return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "CLOSED") return "Completed";
    if (status === "ASSIGNED") return "Assigned";
    return "Pending";
  };

  const formatPriority = (priority) => {
    if (!priority) return "Medium";
    if (priority === "CRITICAL") return "Critical";
    if (priority === "HIGH") return "High";
    if (priority === "MEDIUM") return "Medium";
    if (priority === "LOW") return "Low";
    return "Not Set";
  };

  const firstName = getFirstName();

  const statCards = [
    { label: "Total Complaints", value: stats.totalReported, icon: ClipboardList, tone: "total" },
    { label: "Not Assigned", value: stats.pending, icon: CircleDot, tone: "pending" },
    { label: "In Progress", value: stats.inProgress, icon: RefreshCw, tone: "progress" },
    { label: "Completed", value: stats.resolved, icon: CheckCircle2, tone: "done" },
  ];

  return (
    <div className="ud-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="ud-hero">
        <div className="ud-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="ud-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="ud-hero-text">
          <span className="ud-hero-tag">
            <MapPin size={14} strokeWidth={2.4} /> UrbanStep
          </span>
          <h1>
            Welcome back{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p>Track your reported footpath and sidewalk issues.</p>
        </div>

        <button
          className="ud-hero-btn"
          onClick={() => navigate("/user/add-complaint")}
        >
          <Plus size={18} strokeWidth={2.6} />
          Report an Issue
        </button>
      </section>

      {/* =========================
          STATISTICS
      ========================= */}

      <section className="ud-stats">
        {statCards.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`ud-stat ud-stat-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="ud-stat-icon">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="ud-stat-text">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* =========================
          QUICK ACTION
      ========================= */}

      <section className="ud-quick">
        <div className="ud-quick-pin" aria-hidden="true">
          <MapPin size={26} strokeWidth={2.2} />
        </div>

        <div className="ud-quick-text">
          <h2>Spotted a damaged footpath?</h2>
          <p>
            Report potholes, cracks or any other pedestrian infrastructure
            issue in seconds.
          </p>
        </div>

        <button onClick={() => navigate("/user/add-complaint")}>
          Report Now
          <ArrowRight size={17} strokeWidth={2.4} />
        </button>
      </section>

      {/* =========================
          RECENT COMPLAINTS
      ========================= */}

      <section className="ud-recent">
        <div className="ud-section-head">
          <div>
            <h2>Recent Complaints</h2>
            <p>Your recently reported issues</p>
          </div>

          <button
            className="ud-viewall"
            onClick={() => navigate("/user/view-complaint")}
          >
            View All
            <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="ud-empty">
            <Inbox size={34} strokeWidth={1.8} />
            <p>No complaints yet. Your reported issues will show up here.</p>
          </div>
        ) : (
          <>
            {/* ---- DESKTOP / TABLET TABLE ---- */}
            <div className="ud-table-wrap">
              <table className="ud-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Issue</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedComplaints.map((complaint) => {
                    const displayStatus = formatStatus(complaint.status);
                    const displayPriority = formatPriority(complaint.priority);
                    return (
                      <tr key={complaint.id}>
                        <td>
                          <span className="ud-id">{complaint.id}</span>
                        </td>

                        <td className="ud-issue">{complaint.issue}</td>

                        <td>
                          <span className="ud-loc">
                            <MapPin size={13} strokeWidth={2} />
                            {complaint.location}
                          </span>
                        </td>

                        <td>{complaint.date}</td>

                        <td>
                          <span className={`ud-priority ${badgeClass(displayPriority)}`}>
                            {displayPriority}
                          </span>
                        </td>

                        <td>
                          <span className={`ud-status ${badgeClass(displayStatus)}`}>
                            <span className="ud-dot"></span>
                            {displayStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---- MOBILE CARD LIST ---- */}
            <div className="ud-cards">
              {pagedComplaints.map((complaint) => {
                const displayStatus = formatStatus(complaint.status);
                const displayPriority = formatPriority(complaint.priority);
                return (
                  <div className="ud-card" key={complaint.id}>
                    <div className="ud-card-top">
                      <span className="ud-id">{complaint.id}</span>
                      <span className={`ud-status ${badgeClass(displayStatus)}`}>
                        <span className="ud-dot"></span>
                        {displayStatus}
                      </span>
                    </div>

                    <h3>{complaint.issue}</h3>

                    <div className="ud-card-meta">
                      <span>
                        <MapPin size={13} strokeWidth={2} />
                        {complaint.location}
                      </span>
                      <span>
                        <Calendar size={13} strokeWidth={2} />
                        {complaint.date}
                      </span>
                    </div>

                    <div className="ud-card-bottom">
                      <span className={`ud-priority ${badgeClass(displayPriority)}`}>
                        {displayPriority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---- PAGINATION ---- */}
            <div className="ud-pagination">
              <span className="ud-page-info">
                Showing <strong>{showingFrom}–{showingTo}</strong> of{" "}
                <strong>{complaints.length}</strong> complaints
              </span>

              {totalPages > 1 && (
                <nav className="ud-page-controls" aria-label="Complaints pagination">
                  <button
                    className="ud-page-btn ud-page-nav"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} strokeWidth={2.6} />
                    <span>Prev</span>
                  </button>

                  {getPageNumbers(safePage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span className="ud-page-ellipsis" key={`dots-${i}`}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`ud-page-btn ${p === safePage ? "active" : ""}`}
                        onClick={() => goToPage(p)}
                        aria-current={p === safePage ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="ud-page-btn ud-page-nav"
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

export default UserDashboard;