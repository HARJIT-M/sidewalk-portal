
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  FilePlus,
  ClipboardList,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./usersidebar.css";

const UserSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/user/dashboard",
      icon: Home,
    },
    {
      name: "Report",
      path: "/user/add-complaint",
      icon: FilePlus,
    },
    {
      name: "Complaints",
      path: "/user/view-complaint",
      icon: ClipboardList,
    },
    {
      name: "Profile",
      path: "/user/profile",
      icon: User,
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      navigate("/login");
    }
  };

  return (
    <>
      {/* ============================
          DESKTOP / TABLET SIDEBAR
      ============================ */}

      <aside className={`user-sidebar ${collapsed ? "collapsed" : ""}`}>

        {/* TOGGLE BUTTON */}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="brand-icon">U</div>

          <div className="brand-text">
            <h2>Footpath</h2>
            <span>Citizen Portal</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="sidebar-nav">
          <p className="nav-title">USER MENU</p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                title={collapsed ? item.name : undefined}
              >
                <span className="sidebar-icon">
                  <Icon size={19} strokeWidth={2} />
                </span>

                <span className="sidebar-label">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider"></div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <span className="sidebar-icon">
              <LogOut size={19} strokeWidth={2} />
            </span>

            <span className="sidebar-label">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ============================
          MOBILE BOTTOM NAV BAR
      ============================ */}

      <nav className="mobile-bottom-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "bottom-nav-link active"
                  : "bottom-nav-link"
              }
            >
              <span className="bottom-nav-icon">
                <Icon size={21} strokeWidth={2} />
              </span>

              <span className="bottom-nav-label">
                {item.name}
              </span>
            </NavLink>
          );
        })}

        <button
          className="bottom-nav-link logout-link"
          onClick={handleLogout}
        >
          <span className="bottom-nav-icon">
            <LogOut size={21} strokeWidth={2} />
          </span>

          <span className="bottom-nav-label">
            Logout
          </span>
        </button>
      </nav>
    </>
  );
};

export default UserSidebar;