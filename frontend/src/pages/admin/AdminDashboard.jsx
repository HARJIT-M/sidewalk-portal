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
  Activity,
  PieChart,
  Gauge,
  HardHat,
  Percent,
  Scale,
} from "lucide-react";
import "./admindashboard.css";

// icon shown for an activity item, chosen by its tone
const ACTIVITY_ICONS = {
  indigo: UserPlus,
  violet: UserCog,
  blue: Wrench,
  amber: Clock,
  green: CheckCircle2,
  red: AlertCircle,
};

const SEVERITY_TONE = {
  High: "red",
  Medium: "amber",
  Low: "green",
};

const toPercent = (part, whole) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

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
    return (
      <div className="ad-page ad-center">
        <div className="ad-loader" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-page ad-center">
        <div className="ad-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          Error: {error}
        </div>
      </div>
    );
  }

  const { users: uData, complaints: cData, hotspotAreas, recentActivity } = statsData || {};

  // ---------- user + complaint numbers ----------
  const totalCitizens = uData?.totalCitizens || 0;
  const totalWorkers = uData?.totalWorkers || 0;
  const totalManagers = uData?.totalManagers || 0;
  const activeAccounts = uData?.activeAccounts || 0;
  const totalUsers = totalCitizens + totalWorkers + totalManagers;

  const totalComplaints = cData?.totalComplaints || 0;
  const pending = cData?.pendingComplaints || 0;
  const inProgress = cData?.inProgressComplaints || 0;
  const resolved = cData?.resolvedComplaints || 0;
  const other = Math.max(totalComplaints - pending - inProgress - resolved, 0);

  const userStats = [
    { label: "Total Citizens", value: totalCitizens, note: "Registered citizens", icon: Users, tone: "indigo" },
    { label: "Total Workers", value: totalWorkers, note: "Registered workers", icon: Wrench, tone: "blue" },
    { label: "Total Managers", value: totalManagers, note: "Registered managers", icon: UserCog, tone: "violet" },
    { label: "Active Accounts", value: activeAccounts, note: "Currently active", icon: UserCheck, tone: "green" },
  ];

  const complaintStats = [
    { label: "Total Complaints", value: totalComplaints, note: "All reported issues", icon: ClipboardList, tone: "indigo" },
    { label: "Pending", value: pending, note: "Waiting for action", icon: Clock, tone: "amber" },
    { label: "In Progress", value: inProgress, note: "Currently being repaired", icon: Wrench, tone: "blue" },
    { label: "Resolved", value: resolved, note: "Successfully completed", icon: CheckCircle2, tone: "green" },
  ];

  // ---------- complaint status breakdown ----------
  const breakdown = [
    { label: "Pending", value: pending, tone: "amber" },
    { label: "In Progress", value: inProgress, tone: "blue" },
    { label: "Resolved", value: resolved, tone: "green" },
    ...(other > 0 ? [{ label: "Other", value: other, tone: "grey" }] : []),
  ];

  // ---------- project snapshot ----------
  const resolutionRate = toPercent(resolved, totalComplaints);
  const activeRate = toPercent(activeAccounts, totalUsers);
  const complaintsPerWorker =
    totalWorkers > 0 ? (totalComplaints / totalWorkers).toFixed(1) : "—";
  const workersPerManager =
    totalManagers > 0 ? (totalWorkers / totalManagers).toFixed(1) : "—";

  const snapshot = [
    { label: "Active account rate", value: `${activeRate}%`, note: "Of all registered users", icon: Percent, tone: "green" },
    { label: "Complaints per worker", value: complaintsPerWorker, note: "Average workload", icon: HardHat, tone: "blue" },
    { label: "Workers per manager", value: workersPerManager, note: "Team size", icon: Scale, tone: "violet" },
  ];

  // ---------- hotspots ----------
  const hotspots = hotspotAreas || [];
  const maxHotspotComplaints = hotspots.length
    ? Math.max(...hotspots.map((a) => a.complaints), 1)
    : 1;
  const topAreas = hotspots.slice(0, 2).map((spot) => spot.area);

  // ---------- recent activity: latest 3 ----------
  const activity = (recentActivity || []).slice(0, 3);

  return (
    <div className="ad-page">

      {/* ================= HERO ================= */}
      <section className="ad-hero">
        <div className="ad-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="ad-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="ad-hero-text">
          <span className="ad-hero-tag">
            <ShieldCheck size={14} strokeWidth={2.4} /> Admin Overview
          </span>
          <h1>Admin Dashboard</h1>
          <p>Monitor users, workers, managers and footpath complaints</p>
        </div>

        <div className="ad-admin">
          <div className="ad-admin-avatar">
            <ShieldCheck size={21} strokeWidth={2.2} />
          </div>
          <div>
            <h3>Administrator</h3>
            <span>Full system access</span>
          </div>
        </div>
      </section>


      {/* ================= USER STATISTICS ================= */}
      <section className="ad-section">
        <div className="ad-section-title">
          <h2>Account Overview</h2>
          <span>Users &amp; Accounts</span>
        </div>

        <div className="ad-stats">
          {userStats.map(({ label, value, note, icon: Icon, tone }, i) => (
            <div
              className={`ad-stat tone-${tone}`}
              key={label}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="ad-stat-icon">
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <div className="ad-stat-text">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= COMPLAINT STATISTICS ================= */}
      <section className="ad-section">
        <div className="ad-section-title">
          <h2>Complaint Overview</h2>
          <span>Current system status</span>
        </div>

        <div className="ad-stats">
          {complaintStats.map(({ label, value, note, icon: Icon, tone }, i) => (
            <div
              className={`ad-stat tone-${tone}`}
              key={label}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="ad-stat-icon">
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <div className="ad-stat-text">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= INSIGHTS ROW ================= */}
      <div className="ad-row ad-row-even">

        {/* STATUS BREAKDOWN */}
        <section className="ad-panel">
          <div className="ad-panel-head">
            <div className="ad-panel-icon">
              <PieChart size={19} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Complaint Status Breakdown</h2>
              <p>How reported issues are distributed</p>
            </div>
          </div>

          {totalComplaints === 0 ? (
            <p className="ad-empty">No complaints reported yet.</p>
          ) : (
            <>
              <div className="ad-stack" role="img" aria-label="Complaint status distribution">
                {breakdown.map((part) =>
                  part.value > 0 ? (
                    <span
                      key={part.label}
                      className={`ad-stack-part tone-${part.tone}`}
                      style={{ width: `${(part.value / totalComplaints) * 100}%` }}
                      title={`${part.label}: ${part.value}`}
                    />
                  ) : null
                )}
              </div>

              <ul className="ad-legend">
                {breakdown.map((part) => (
                  <li key={part.label} className={`tone-${part.tone}`}>
                    <i></i>
                    <span>{part.label}</span>
                    <strong>{part.value}</strong>
                    <small>{toPercent(part.value, totalComplaints)}%</small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* PROJECT SNAPSHOT */}
        <section className="ad-panel">
          <div className="ad-panel-head">
            <div className="ad-panel-icon">
              <Gauge size={19} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Project Snapshot</h2>
              <p>Resolution progress and team metrics</p>
            </div>
          </div>

          <div className="ad-snapshot">
            <div
              className="ad-ring"
              style={{ "--pct": `${resolutionRate}%` }}
              role="img"
              aria-label={`Resolution rate ${resolutionRate} percent`}
            >
              <div className="ad-ring-inner">
                <strong>{resolutionRate}%</strong>
                <span>Resolved</span>
              </div>
            </div>

            <div className="ad-mini-list">
              {snapshot.map(({ label, value, note, icon: Icon, tone }) => (
                <div className={`ad-mini tone-${tone}`} key={label}>
                  <div className="ad-mini-icon">
                    <Icon size={16} strokeWidth={2.3} />
                  </div>
                  <div>
                    <span>{label}</span>
                    <small>{note}</small>
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>


      {/* ================= LOWER SECTION ================= */}
      <div className="ad-row ad-row-wide">

        {/* RECENT ACTIVITY */}
        <section className="ad-panel">
          <div className="ad-panel-head">
            <div className="ad-panel-icon">
              <Activity size={19} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Recent Activity</h2>
              <p>Latest 3 system updates</p>
            </div>
          </div>

          {activity.length === 0 ? (
            <p className="ad-empty">No recent activity.</p>
          ) : (
            <div className="ad-activity">
              {activity.map((item, index) => {
                const Icon = ACTIVITY_ICONS[item.tone] || Activity;
                return (
                  <div
                    className={`ad-activity-item tone-${item.tone || "indigo"}`}
                    key={`${item.title}-${index}`}
                  >
                    <div className="ad-activity-icon">
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="ad-activity-body">
                      <div className="ad-activity-top">
                        <strong>{item.title}</strong>
                        {item.time && <time>{item.time}</time>}
                      </div>
                      {item.meta && <span>{item.meta}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLAINT HOTSPOTS */}
        <section className="ad-panel">
          <div className="ad-panel-head">
            <div className="ad-panel-icon ad-panel-icon-hot">
              <Flame size={19} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Complaint Hotspots</h2>
              <p>Areas with the most reported footpath issues</p>
            </div>
          </div>

          {hotspots.length === 0 ? (
            <p className="ad-empty">No hotspot data available yet.</p>
          ) : (
            <div className="ad-hotspots">
              {hotspots.map((spot, index) => {
                const tone = SEVERITY_TONE[spot.severity] || "indigo";
                const widthPct = Math.round((spot.complaints / maxHotspotComplaints) * 100);
                return (
                  <div className={`ad-hotspot tone-${tone}`} key={spot.area}>
                    <div className="ad-hotspot-rank">{index + 1}</div>

                    <div className="ad-hotspot-info">
                      <div className="ad-hotspot-top">
                        <span className="ad-hotspot-area">
                          <MapPin size={13} strokeWidth={2.2} />
                          {spot.area}
                        </span>
                        <span className="ad-severity">{spot.severity}</span>
                      </div>

                      <div className="ad-track">
                        <div className="ad-track-fill" style={{ width: `${widthPct}%` }} />
                      </div>

                      <small>{spot.complaints} complaints</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {topAreas.length > 0 && (
            <div className="ad-notice">
              <AlertCircle size={18} strokeWidth={2.2} />
              <div>
                <strong>Field Inspection Suggested</strong>
                <p>
                  {topAreas.join(" and ")} {topAreas.length > 1 ? "have" : "has"} the
                  highest complaint density right now.
                </p>
              </div>
            </div>
          )}
        </section>

      </div>

    </div>
  );
};

export default AdminDashboard;