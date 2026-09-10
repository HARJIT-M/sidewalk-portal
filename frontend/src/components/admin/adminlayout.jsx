import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./adminLayout.css";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("admin-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div className={`admin-app-layout ${collapsed ? "admin-sidebar-collapsed" : ""}`}>

      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="admin-main-content">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;