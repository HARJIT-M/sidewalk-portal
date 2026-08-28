import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredNotifications,
  saveStoredNotifications,
} from "./workerData";
import "./WorkerNotifications.css";

const WorkerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    setNotifications(getStoredNotifications());
  }, []);

  const handleMarkAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleDeleteNotif = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveStoredNotifications(updated);
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
    if (filter === "Updates") return n.type === "STATUS_UPDATE";
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
          <p>Task assignments, manager reviews, and status alerts</p>
        </div>

        <div className="header-actions">
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllRead}>
              ✓ Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

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
                    : notif.type === "STATUS_UPDATE"
                    ? "update"
                    : "system"
                }`}
              >
                {notif.type === "ASSIGNMENT" ? "📋" : notif.type === "STATUS_UPDATE" ? "⚙️" : "🔔"}
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
    </div>
  );
};

export default WorkerNotifications;
