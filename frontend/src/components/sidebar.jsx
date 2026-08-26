import React from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "⌂" },
    { name: "Complaints", path: "/complaints", icon: "▣" },
    { name: "Work Tracking", path: "/work-tracking", icon: "↻" },
    { name: "Workers", path: "/workers", icon: "♙" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* TOGGLE BUTTON */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label="Toggle sidebar"
      >
        {collapsed ? "›" : "‹"}
      </button>

      <div className="sidebar-brand">
        <div className="brand-icon">F</div>
        <div className="brand-text">
          <h2>Footpath</h2>
          <span>Repair Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-title">MAIN MENU</p>

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
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-divider"></div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
          title={collapsed ? "Settings" : undefined}
        >
          <span className="sidebar-icon">⚙</span>
          <span className="sidebar-label">Settings</span>
        </NavLink>

        <button
          className="sidebar-logout"
          onClick={() => console.log("Logout clicked")}
          title={collapsed ? "Logout" : undefined}
        >
          <span className="sidebar-icon">⇥</span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;