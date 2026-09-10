import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./adminSidebar.css";

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  // ================= ADMIN MENU =================
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Management",
      path: "/admin/management",
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
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* ================= TOGGLE BUTTON ================= */}
      <button
        className="admin-sidebar-toggle"
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
      <div className="admin-sidebar-brand">

        <div className="admin-brand-icon">
          F
        </div>

        <div className="admin-brand-text">
          <h2>Footpath</h2>
          <span>Admin Portal</span>
        </div>

      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="admin-sidebar-nav">

        <p className="admin-nav-title">
          ADMIN MENU
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "admin-sidebar-link active"
                  : "admin-sidebar-link"
              }
              title={collapsed ? item.name : undefined}
            >

              <span className="admin-sidebar-icon">
                <Icon
                  size={19}
                  strokeWidth={2}
                />
              </span>

              <span className="admin-sidebar-label">
                {item.name}
              </span>

            </NavLink>
          );
        })}

      </nav>

      {/* ================= BOTTOM ================= */}
      <div className="admin-sidebar-bottom">

        <div className="admin-sidebar-divider"></div>

        <button
          className="admin-sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >

          <span className="admin-sidebar-icon">
            <LogOut
              size={19}
              strokeWidth={2}
            />
          </span>

          <span className="admin-sidebar-label">
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
};

export default AdminSidebar;