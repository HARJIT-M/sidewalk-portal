import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredNotifications } from "../pages/worker/workerData";
import "./WorkerSidebar.css";

const WorkerSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnread = () => {
      const notifs = getStoredNotifications();
      const count = notifs.filter((n) => !n.read).length;
      setUnreadCount(count);
    };
    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/worker/dashboard", icon: "⌂" },
    { name: "My Complaints", path: "/worker/my-complaints", icon: "📋" },
    {
      name: "Notifications",
      path: "/worker/notifications",
      icon: "🔔",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: "My Profile", path: "/worker/profile", icon: "👤" },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      navigate("/login");
    }
  };

  return (
    <aside className={`worker-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* TOGGLE BUTTON */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label="Toggle sidebar"
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* BRAND */}
      <div className="sidebar-brand">
        <div className="brand-icon">W</div>
        <div className="brand-text">
          <h2>Footpath</h2>
          <span>Worker Portal</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        <p className="nav-title">WORKER MENU</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
            title={collapsed ? item.name : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.name}</span>
            {item.badge && (
              <span className="sidebar-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM ACTIONS */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider"></div>

        <button
          className="sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <span className="sidebar-icon">⇥</span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
