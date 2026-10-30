import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import "./layout.css";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;