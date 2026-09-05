import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWorkerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteWorkerNotification,
} from "../../services/workerApi";
import "./WorkerNotifications.css";

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
    if (filter === "Updates") return n.type === "STATUS_CHANGE" || n.type === "REPAIR_COMPLETED";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notifications-page">
      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="page-header">
        <div>
          <h1>Worker Notifications</h1>
          <p>Task assignments, manager reviews, and status alerts (MongoDB)</p>
        </div>

        <div className="header-actions">
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllRead}>
              ✓ Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 18px", borderRadius: "10px", margin: "14px 0", fontWeight: "500", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {error}</span>
          <button onClick={loadNotifs} style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Retry</button>
        </div>
      )}

      {/* =========================
          FILTERS
      ========================= */}
      <div className="filters-container">
        <button
          className={`filter-btn ${filter === "All" ? "active" : ""}`}
          onClick={() => setFilter("All")}
        >
          All ({notifications.length})
        </button>

        <button
          className={`filter-btn ${filter === "Unread" ? "active" : ""}`}
          onClick={() => setFilter("Unread")}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>

        <button
          className={`filter-btn ${filter === "Assignments" ? "active" : ""}`}
          onClick={() => setFilter("Assignments")}
        >
          Assignments
        </button>

        <button
          className={`filter-btn ${filter === "Updates" ? "active" : ""}`}
          onClick={() => setFilter("Updates")}
        >
          Status Updates
        </button>
      </div>

      {/* =========================
          NOTIFICATIONS LIST
      ========================= */}
      {loading && notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <p>Loading notifications from MongoDB...</p>
        </div>
      ) : (
        <div className="notif-cards-container">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item-card ${!notif.read ? "unread" : ""}`}
            >
              <div className="notif-icon-col">
                <div
                  className={`notif-avatar ${
                    notif.type === "ASSIGNMENT"
                      ? "assign"
                      : notif.type === "STATUS_CHANGE" || notif.type === "REPAIR_COMPLETED"
                      ? "update"
                      : "system"
                  }`}
                >
                  {notif.type === "ASSIGNMENT" ? "📋" : notif.type === "STATUS_CHANGE" || notif.type === "REPAIR_COMPLETED" ? "⚙️" : "🔔"}
                </div>
              </div>

              <div className="notif-info-col">
                <div className="notif-top-row">
                  <div className="title-box">
                    {!notif.read && <span className="unread-dot"></span>}
                    <h3>{notif.title}</h3>
                    {notif.urgent && (
                      <span className="priority high">Urgent</span>
                    )}
                  </div>
                  <span className="notif-time">{notif.time}</span>
                </div>

                <p className="notif-body-text">{notif.message}</p>

                <div className="notif-bottom-row">
                  {notif.complaintId ? (
                    <button
                      className="view-btn"
                      onClick={() => handleNavigateToTask(notif)}
                    >
                      View Complaint ({notif.complaintId}) →
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="item-actions">
                    {!notif.read && (
                      <button
                        className="text-action-btn"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      className="text-action-btn delete"
                      onClick={() => handleDeleteNotif(notif.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="no-notifications-card">
              <div className="no-notif-icon">🔔</div>
              <h3>No notifications in this filter</h3>
              <p>You're all caught up with your task assignments.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerNotifications;
