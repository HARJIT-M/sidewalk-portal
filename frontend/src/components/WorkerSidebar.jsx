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
    if (window.confirm("Are you sure you want to log out from the Worker Portal?")) {
      navigate("/login");
    }
  };

  return (
    <aside className={`worker-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* TOGGLE BUTTON */}
      <button
        className="worker-sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label="Toggle sidebar"
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* BRAND */}
      <div className="worker-sidebar-brand">
        <div className="worker-brand-icon">W</div>
        <div className="worker-brand-text">
          <div className="worker-brand-title">
            <h2>Footpath</h2>
            <span className="worker-role-pill">WORKER</span>
          </div>
          <span className="worker-brand-sub">Field Maintenance</span>
        </div>
      </div>

      {/* WORKER QUICK STATUS PILL */}
      <div className="worker-quick-user">
        <div className="worker-avatar-mini">R</div>
        <div className="worker-user-info">
          <strong>Ravi Kumar</strong>
          <span>
            <span className="worker-status-dot online"></span> On Duty (WRK001)
          </span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="worker-sidebar-nav">
        <p className="worker-nav-title">WORKER MENU</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "worker-sidebar-link active" : "worker-sidebar-link"
            }
            title={collapsed ? item.name : undefined}
          >
            <span className="worker-nav-icon">{item.icon}</span>
            <span className="worker-nav-label">{item.name}</span>
            {item.badge && (
              <span className="worker-nav-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM ACTIONS */}
      <div className="worker-sidebar-bottom">
        <div className="worker-sidebar-divider"></div>

        <button
          className="worker-sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <span className="worker-nav-icon">⇥</span>
          <span className="worker-nav-label">Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
