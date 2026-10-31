import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWorkerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteWorkerNotification,
} from "../../services/workerApi";
import "./WorkerNotifications.css";

/* ---------- Inline SVG icon set (no extra packages needed) ---------- */
const ICONS = {
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  assign: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
  megaphone: (
    <>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  checkall: (
    <>
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  alert: (
    <>
      <path d="m10.3 3.9-8.5 14.7A2 2 0 0 0 3.5 21.6h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
  ),
};

const Icon = ({ name, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
);

const isUpdateType = (type) => type === "STATUS_CHANGE" || type === "REPAIR_COMPLETED";

const getKind = (type) =>
  type === "ASSIGNMENT" ? "assign" : isUpdateType(type) ? "update" : "system";

const getIconName = (type) =>
  type === "ASSIGNMENT" ? "assign" : isUpdateType(type) ? "wrench" : "megaphone";

const getTypeLabel = (type) =>
  type === "ASSIGNMENT" ? "Assignment" : isUpdateType(type) ? "Status Update" : "System";

const WorkerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  const loadNotifs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkerNotifications();
      if (res && res.success) {
        setNotifications(res.notifications || []);
      } else {
        setNotifications(res?.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to connect to notifications service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await deleteWorkerNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNavigateToTask = (notif) => {
    handleMarkAsRead(notif.id);
    if (notif.complaintId) {
      navigate(`/worker/complaints/${notif.complaintId}`);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "Unread") return !n.read;
    if (filter === "Assignments") return n.type === "ASSIGNMENT";
    if (filter === "Updates") return isUpdateType(n.type);
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.urgent && !n.read).length;
  const assignmentCount = notifications.filter((n) => n.type === "ASSIGNMENT").length;
  const updateCount = notifications.filter((n) => isUpdateType(n.type)).length;

  const filterItems = [
    { key: "All", label: "All Notifications", icon: "inbox", count: notifications.length },
    { key: "Unread", label: "Unread", icon: "mail", count: unreadCount },
    { key: "Assignments", label: "Assignments", icon: "assign", count: assignmentCount },
    { key: "Updates", label: "Status Updates", icon: "wrench", count: updateCount },
  ];

  const activeFilterLabel =
    filterItems.find((f) => f.key === filter)?.label || "All Notifications";

  return (
    <div className="wn-page">
      {/* =========================
          HERO HEADER
      ========================= */}
      <header className="wn-hero">
        <div className="wn-hero-top">
          <div className="wn-hero-title">
            <div className="wn-hero-icon">
              <Icon name="bell" size={26} />
              {unreadCount > 0 && <span className="wn-hero-ping" />}
            </div>
            <div>
              <span className="wn-eyebrow">Worker Panel</span>
              <h1>Notifications</h1>
              <p>Task assignments, manager reviews and status alerts</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button className="wn-markall-btn" onClick={handleMarkAllRead}>
              <Icon name="checkall" size={16} />
              Mark all as read
            </button>
          )}
        </div>

        <div className="wn-hero-stats">
          <div className="wn-hero-stat">
            <span className="wn-hero-stat-icon">
              <Icon name="inbox" size={18} />
            </span>
            <div>
              <strong>{notifications.length}</strong>
              <span>Total</span>
            </div>
          </div>
          <div className="wn-hero-stat">
            <span className="wn-hero-stat-icon">
              <Icon name="mail" size={18} />
            </span>
            <div>
              <strong>{unreadCount}</strong>
              <span>Unread</span>
            </div>
          </div>
          <div className="wn-hero-stat">
            <span className="wn-hero-stat-icon warn">
              <Icon name="alert" size={18} />
            </span>
            <div>
              <strong>{urgentCount}</strong>
              <span>Urgent</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="wn-error">
          <span className="wn-error-text">
            <Icon name="alert" size={16} /> {error}
          </span>
          <button onClick={loadNotifs}>Retry</button>
        </div>
      )}

      {/* =========================
          FILTER TABS
      ========================= */}
      <div className="wn-tabs">
        {filterItems.map((item) => (
          <button
            key={item.key}
            className={`wn-tab ${filter === item.key ? "active" : ""}`}
            onClick={() => setFilter(item.key)}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
            <em>{item.count}</em>
          </button>
        ))}
      </div>

      {/* =========================
          FEED
      ========================= */}
      <div className="wn-feed-header">
        <h2>{activeFilterLabel}</h2>
        <span className="wn-feed-count">
          {filteredNotifications.length}{" "}
          {filteredNotifications.length === 1 ? "item" : "items"}
        </span>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="wn-loading">
          <div className="wn-spinner" />
          <p>Loading notifications…</p>
        </div>
      ) : (
        <div className="wn-list">
          {filteredNotifications.map((notif) => {
            const kind = getKind(notif.type);
            return (
              <article
                key={notif.id}
                className={`wn-card ${kind} ${!notif.read ? "unread" : ""} ${
                  notif.urgent ? "urgent" : ""
                }`}
              >
                <div className={`wn-tile ${kind}`}>
                  <Icon name={getIconName(notif.type)} size={24} />
                </div>

                <div className="wn-body">
                  <div className="wn-card-top">
                    <div className="wn-tags">
                      <span className={`wn-chip ${kind}`}>{getTypeLabel(notif.type)}</span>
                      {notif.urgent && (
                        <span className="wn-chip urgent">
                          <Icon name="alert" size={12} /> Urgent
                        </span>
                      )}
                      {!notif.read && <span className="wn-chip new">New</span>}
                    </div>
                    <span className="wn-time">
                      <Icon name="clock" size={13} /> {notif.time}
                    </span>
                  </div>

                  <h3 className="wn-title">{notif.title}</h3>
                  <p className="wn-message">{notif.message}</p>

                  <div className="wn-actions">
                    {notif.complaintId ? (
                      <button
                        className="wn-primary-btn"
                        onClick={() => handleNavigateToTask(notif)}
                      >
                        View Complaint #{notif.complaintId}
                        <Icon name="arrow" size={15} />
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="wn-secondary">
                      {!notif.read && (
                        <button
                          className="wn-ghost-btn"
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <Icon name="check" size={14} /> Mark read
                        </button>
                      )}
                      <button
                        className="wn-ghost-btn danger"
                        onClick={() => handleDeleteNotif(notif.id)}
                      >
                        <Icon name="trash" size={14} /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="wn-empty">
              <div className="wn-empty-icon">
                <Icon name="sparkle" size={34} />
              </div>
              <h3>You&apos;re all caught up</h3>
              <p>No notifications in this filter right now.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerNotifications;