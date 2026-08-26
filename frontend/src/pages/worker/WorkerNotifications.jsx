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
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, UNREAD, ASSIGNMENT, STATUS_UPDATE

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

  // Filter
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.read;
    if (activeTab === "ASSIGNMENT") return n.type === "ASSIGNMENT";
    if (activeTab === "STATUS_UPDATE") return n.type === "STATUS_UPDATE";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifIcon = (type, urgent) => {
    if (urgent) return "🚨";
    switch (type) {
      case "ASSIGNMENT":
        return "📋";
      case "STATUS_UPDATE":
        return "⚙️";
      case "SYSTEM":
        return "📢";
      default:
        return "🔔";
    }
  };

  return (
    <div className="worker-notifications-page">
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="notif-header-row">
        <div>
          <h1>Notifications & Work Alerts</h1>
          <p>
            Stay updated with new task assignments, manager reviews, and status updates.
          </p>
        </div>

        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button className="btn-mark-all-read" onClick={handleMarkAllRead}>
              ✓ Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* =========================================
          TABS
      ========================================= */}
      <div className="notif-tabs-bar">
        <button
          className={`notif-tab ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          All
          <span className="notif-pill">{notifications.length}</span>
        </button>

        <button
          className={`notif-tab ${activeTab === "UNREAD" ? "active" : ""}`}
          onClick={() => setActiveTab("UNREAD")}
        >
          Unread
          {unreadCount > 0 && (
            <span className="notif-pill unread">{unreadCount}</span>
          )}
        </button>

        <button
          className={`notif-tab ${activeTab === "ASSIGNMENT" ? "active" : ""}`}
          onClick={() => setActiveTab("ASSIGNMENT")}
        >
          Task Assignments
        </button>

        <button
          className={`notif-tab ${activeTab === "STATUS_UPDATE" ? "active" : ""}`}
          onClick={() => setActiveTab("STATUS_UPDATE")}
        >
          Status & Verification
        </button>
      </div>

      {/* =========================================
          NOTIFICATION LIST
      ========================================= */}
      <div className="notif-list-container">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifs-box">
            <div className="no-notif-icon">🔔</div>
            <h3>No notifications in this category</h3>
            <p>You are all caught up with your task assignments and alerts.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-card ${!notif.read ? "unread" : ""} ${
                notif.urgent ? "urgent-card" : ""
              }`}
            >
              <div className="notif-icon-col">
                <div className={`notif-icon-box ${notif.type.toLowerCase()}`}>
                  {getNotifIcon(notif.type, notif.urgent)}
                </div>
              </div>

              <div className="notif-body-col">
                <div className="notif-title-row">
                  <div className="title-wrap">
                    {!notif.read && <span className="unread-dot"></span>}
                    <strong>{notif.title}</strong>
                    {notif.urgent && (
                      <span className="urgent-badge">URGENT</span>
                    )}
                  </div>
                  <span className="notif-time">{notif.time}</span>
                </div>

                <p className="notif-msg-text">{notif.message}</p>

                <div className="notif-footer-row">
                  {notif.complaintId && (
                    <button
                      className="btn-view-task"
                      onClick={() => handleNavigateToTask(notif)}
                    >
                      View Complaint {notif.complaintId} →
                    </button>
                  )}

                  <div className="notif-item-actions">
                    {!notif.read && (
                      <button
                        className="btn-item-action read"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      className="btn-item-action delete"
                      onClick={() => handleDeleteNotif(notif.id)}
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkerNotifications;
