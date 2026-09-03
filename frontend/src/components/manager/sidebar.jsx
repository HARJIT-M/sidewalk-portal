
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./sidebar.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  // ================= MANAGER MENU =================
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Complaints",
      path: "/complaints",
      icon: ClipboardList,
    },
    {
      name: "Work Tracking",
      path: "/work-tracking",
      icon: Wrench,
    },
    {
      name: "Workers",
      path: "/workers",
      icon: Users,
    },
  ];

  // ================= LOGOUT =================
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      navigate("/login");
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* ================= TOGGLE BUTTON ================= */}
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


      {/* ================= BRAND ================= */}
      <div className="sidebar-brand">

        <div className="brand-icon">
          F
        </div>

        <div className="brand-text">
          <h2>Footpath</h2>
          <span>Manager Portal</span>
        </div>

      </div>


      {/* ================= NAVIGATION ================= */}
      <nav className="sidebar-nav">

        <p className="nav-title">
          MANAGER MENU
        </p>

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
                <Icon
                  size={19}
                  strokeWidth={2}
                />
              </span>

              <span className="sidebar-label">
                {item.name}
              </span>

            </NavLink>
          );
        })}

      </nav>


      {/* ================= BOTTOM ================= */}
      <div className="sidebar-bottom">

        <div className="sidebar-divider"></div>

        <button
          className="sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >

          <span className="sidebar-icon">
            <LogOut
              size={19}
              strokeWidth={2}
            />
          </span>

          <span className="sidebar-label">
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
};

export default Sidebar;