import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import WorkerSidebar from "./WorkerSidebar";
import "./WorkerLayout.css";

const WorkerLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("worker-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("worker-sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div className={`worker-layout-root ${collapsed ? "sidebar-collapsed" : ""}`}>
      <WorkerSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="worker-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default WorkerLayout;
