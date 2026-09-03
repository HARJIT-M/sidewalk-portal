
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "./usersidebar";
import "./UserLayout.css";

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("user-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("user-sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <UserSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;