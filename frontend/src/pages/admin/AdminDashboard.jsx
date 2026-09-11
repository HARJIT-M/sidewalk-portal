import React, { useState, useEffect } from "react";
import { getAdminDashboardStats } from "../../services/adminApi";
import {
  Users,
  UserCheck,
  UserCog,
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Flame,
  UserPlus,
} from "lucide-react";
import "./admindashboard.css";

// Color tokens shared by the tone-based icons/badges below.
// Kept as inline styles so these panels render correctly even if
// the external stylesheet isn't fully wired up in the host app.
const TONES = {
  indigo: { bg: "#e0e7ff", fg: "#4f46e5" },
  violet: { bg: "#ede9fe", fg: "#7c3aed" },
  blue: { bg: "#dbeafe", fg: "#2563eb" },
  amber: { bg: "#fef3c7", fg: "#d97706" },
  green: { bg: "#dcfce7", fg: "#16a34a" },
  red: { bg: "#fee2e2", fg: "#dc2626" },
};

const SEVERITY_TONE = {
  High: "red",
  Medium: "amber",
  Low: "green",
};

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminDashboardStats();
        setStatsData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="admin-dashboard">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="admin-dashboard">Error: {error}</div>;
  }

  const { users: uData, complaints: cData, hotspotAreas, recentActivity } = statsData || {};

  const userStats = [
    { label: "Total Citizens", value: uData?.totalCitizens || 0, note: "Registered citizens", icon: Users, tone: "indigo" },
    { label: "Total Workers", value: uData?.totalWorkers || 0, note: "Registered workers", icon: Wrench, tone: "blue" },
    { label: "Total Managers", value: uData?.totalManagers || 0, note: "Registered managers", icon: UserCog, tone: "violet" },
    { label: "Active Accounts", value: uData?.activeAccounts || 0, note: "Currently active", icon: UserCheck, tone: "green" },
  ];

  const complaintStats = [
    { label: "Total Complaints", value: cData?.totalComplaints || 0, note: "All reported issues", icon: ClipboardList, tone: "indigo" },
    { label: "Pending", value: cData?.pendingComplaints || 0, note: "Waiting for action", icon: Clock, tone: "amber" },
    { label: "In Progress", value: cData?.inProgressComplaints || 0, note: "Currently being repaired", icon: Wrench, tone: "blue" },
    { label: "Resolved", value: cData?.resolvedComplaints || 0, note: "Successfully completed", icon: CheckCircle2, tone: "green" },
  ];

  const maxHotspotComplaints = hotspotAreas?.length ? Math.max(...hotspotAreas.map((a) => a.complaints)) : 1;

  const activity = recentActivity?.length ? recentActivity : [
    { icon: UserPlus, title: "No recent activity", meta: "", time: "", tone: "indigo" },
  ];

  return (
    <div className="admin-dashboard">

      {/* ================= HEADER ================= */}
      <div className="admin-dashboard-header">
        <div>
          <span className="admin-header-eyebrow">Admin Overview</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor users, workers, managers and footpath complaints</p>
        </div>

        <div className="admin-info">
          <div className="admin-avatar">
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <div>
            <h3>Administrator</h3>
            <span>Full system access</span>
          </div>
        </div>
      </div>


      {/* ================= USER STATISTICS ================= */}
      <section className="admin-section">
        <div className="admin-section-title">
          <h2>Account Overview</h2>
          <span>Users &amp; Accounts</span>
        </div>

        <div className="admin-stats-grid">
          {userStats.map((stat) => (
            <div className="admin-stat-card" key={stat.label}>
              <div className={`admin-stat-icon ${stat.tone}`}>
                <stat.icon size={22} strokeWidth={2} />
              </div>
              <div className="admin-stat-content">
                <span>{stat.label}</span>
                <h3>{stat.value}</h3>
                <p>{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= COMPLAINT STATISTICS ================= */}
      <section className="admin-section">
        <div className="admin-section-title">
          <h2>Complaint Overview</h2>
          <span>Current system status</span>
        </div>

        <div className="admin-stats-grid">
          {complaintStats.map((stat) => (
            <div className="admin-stat-card" key={stat.label}>
              <div className={`admin-stat-icon ${stat.tone}`}>
                <stat.icon size={22} strokeWidth={2} />
              </div>
              <div className="admin-stat-content">
                <span>{stat.label}</span>
                <h3>{stat.value}</h3>
                <p>{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= LOWER SECTION ================= */}
      <div className="admin-dashboard-columns">

        {/* RECENT ACTIVITY */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest system activity</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {activity.map((item, index) => {
              const tone = TONES[item.tone];
              return (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "13px",
                    padding: "14px 0",
                    borderBottom: index === activity.length - 1 ? "none" : "1px solid #f2f1f8",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: tone.bg,
                      color: tone.fg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={18} strokeWidth={2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <strong style={{ fontSize: "13px", color: "#1e1b2e" }}>{item.title}</strong>
                      <span style={{ fontSize: "10px", color: "#a9a5bd", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {item.time}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#7b7794" }}>{item.meta}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* COMPLAINT HOTSPOTS */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Flame size={15} strokeWidth={2} color="#d97706" /> Complaint Hotspots
              </h2>
              <p>Areas with the most reported footpath issues</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {hotspotAreas.map((spot, index) => {
              const tone = TONES[SEVERITY_TONE[spot.severity]];
              const widthPct = Math.round((spot.complaints / maxHotspotComplaints) * 100);
              return (
                <div key={spot.area} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>

                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      flexShrink: 0,
                      borderRadius: "8px",
                      background: "#eef2ff",
                      color: "#4f46e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      marginTop: "1px",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginBottom: "7px",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#1e1b2e",
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <MapPin size={12} strokeWidth={2} color="#b3affc" style={{ flexShrink: 0 }} />
                        {spot.area}
                      </span>

                      <span
                        style={{
                          flexShrink: 0,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: tone.bg,
                          color: tone.fg,
                        }}
                      >
                        {spot.severity}
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        background: "#f0f0f6",
                        borderRadius: "10px",
                        overflow: "hidden",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: `${widthPct}%`,
                          height: "100%",
                          borderRadius: "10px",
                          background: tone.fg,
                        }}
                      ></div>
                    </div>

                    <span style={{ fontSize: "10.5px", color: "#a9a5bd" }}>{spot.complaints} complaints</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="admin-alert-box" style={{ marginTop: "20px" }}>
            <AlertCircle size={18} />
            <div>
              <strong>Field Inspection Suggested</strong>
              <p>Gandhipuram and RS Puram have the highest complaint density this month.</p>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
};

export default AdminDashboard;
