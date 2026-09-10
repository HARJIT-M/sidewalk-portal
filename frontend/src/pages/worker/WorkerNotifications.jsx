import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredNotifications,
  saveStoredNotifications,
} from "./workerData";
import {
  Bell,
  ClipboardList,
  Settings,
  CheckCheck,
  X,
  ArrowRight,
  BellOff,
} from "lucide-react";
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
  const assignmentCount = notifications.filter(
    (n) => n.type === "ASSIGNMENT"
  ).length;
  const updateCount = notifications.filter(
    (n) => n.type === "STATUS_UPDATE"
  ).length;

  const notifIcon = (type) => {
    if (type === "ASSIGNMENT") return <ClipboardList size={17} strokeWidth={2} />;
    if (type === "STATUS_UPDATE") return <Settings size={17} strokeWidth={2} />;
    return <Bell size={17} strokeWidth={2} />;
  };

  const FILTERS = [
    { key: "All", label: "All", count: notifications.length },
    { key: "Unread", label: "Unread", count: unreadCount },
    { key: "Assignments", label: "Assignments", count: assignmentCount },
    { key: "Updates", label: "Status Updates", count: updateCount },
  ];

  return (
    <div className="notifications-page">

      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <Bell size={22} strokeWidth={2} />
          </div>
          <div>
            <h1>Notifications</h1>
            <p>Task assignments, manager reviews, and status alerts</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            <CheckCheck size={15} strokeWidth={2.5} />
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* =========================
          FILTER TABS
      ========================= */}
      <div className="filters-container">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="filter-tab-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* =========================
          NOTIFICATIONS TIMELINE
      ========================= */}

      {filteredNotifications.length > 0 ? (

        <div className="notif-timeline">

          {filteredNotifications.map((notif) => {
            const typeClass =
              notif.type === "ASSIGNMENT"
                ? "assign"
                : notif.type === "STATUS_UPDATE"
                ? "update"
                : "system";

            return (
              <div
                key={notif.id}
                className={`notif-row ${!notif.read ? "unread" : ""}`}
              >

                <div className={`notif-avatar ${typeClass}`}>
                  {notifIcon(notif.type)}
                </div>

                <div className="notif-body">

                  <div className="notif-top-row">
                    <div className="title-box">
                      <h3>{notif.title}</h3>
                      {notif.urgent && (
                        <span className="priority high">Urgent</span>
                      )}
                      {!notif.read && <span className="unread-dot"></span>}
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
                        View Complaint ({notif.complaintId})
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="item-actions">
                      {!notif.read && (
                        <button
                          className="icon-action-btn"
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark as read"
                        >
                          <CheckCheck size={14} strokeWidth={2.2} />
                        </button>
                      )}
                      <button
                        className="icon-action-btn delete"
                        onClick={() => handleDeleteNotif(notif.id)}
                        title="Dismiss"
                      >
                        <X size={14} strokeWidth={2.2} />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      ) : (

        <div className="no-notifications-card">
          <div className="no-notif-icon">
            <BellOff size={30} strokeWidth={1.5} />
          </div>
          <h3>No notifications in this filter</h3>
          <p>You're all caught up with your task assignments.</p>
        </div>

      )}

    </div>
  );
};

export default WorkerNotifications;