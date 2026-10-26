import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Wrench,
  CircleDot,
  TrendingUp,
  ShieldCheck,
  Lock,
  KeyRound,
  Pencil,
  AlertCircle,
  X,
} from "lucide-react";
import userApi from "../../../services/userApi";
import "./userprofile.css";

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
  address: "",
  joinedDate: "",
};

const UserProfile = () => {
  const [user, setUser] = useState(EMPTY_PROFILE);
  const [formData, setFormData] = useState(EMPTY_PROFILE);
  const [statsData, setStatsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // personal | account
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  const [alertMsg, setAlertMsg] = useState({ text: "", type: "success" });
  const [modalError, setModalError] = useState("");

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  // close popups with the Escape key
  useEffect(() => {
    if (!showEditPopup && !showPasswordPopup) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        closeEdit();
        closePassword();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showEditPopup, showPasswordPopup]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.getProfile();
      if (data.success && data.profile) {
        setUser(data.profile);
        setFormData(data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await userApi.getDashboard();
      if (data.success && data.stats) {
        setStatsData(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const flash = (text, type = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: "", type: "success" }), 4000);
  };

  // ---------- edit profile ----------

  const openEdit = () => {
    setFormData(user);
    setModalError("");
    setShowEditPopup(true);
  };

  const closeEdit = () => {
    setShowEditPopup(false);
    setModalError("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setModalError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError("");
    try {
      const data = await userApi.updateProfile(formData);
      if (data.success) {
        setUser(data.profile);
        setFormData(data.profile);

        // keep the name shown on other pages in sync
        try {
          const stored = JSON.parse(localStorage.getItem("user")) || {};
          localStorage.setItem(
            "user",
            JSON.stringify({ ...stored, name: data.profile.name, email: data.profile.email })
          );
        } catch {
          /* ignore */
        }

        closeEdit();
        flash("Profile updated successfully.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setModalError(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- change password ----------

  const openPassword = () => {
    setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setModalError("");
    setShowPasswordPopup(true);
  };

  const closePassword = () => {
    setShowPasswordPopup(false);
    setModalError("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passForm.currentPassword || !passForm.newPassword) {
      setModalError("Please fill all password fields.");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setModalError("New passwords do not match.");
      return;
    }
    if (typeof userApi.changePassword !== "function") {
      setModalError("Password change is not available yet.");
      return;
    }

    setSaving(true);
    setModalError("");
    try {
      const res = await userApi.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      if (res.success) {
        closePassword();
        flash("Password changed successfully.");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setModalError(error.response?.data?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- loading ----------

  if (loading) {
    return (
      <div className="up-page up-loading">
        <div className="up-loader" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const initial = (user.name || "").trim().charAt(0).toUpperCase() || "U";

  const total = statsData?.totalReported || 0;
  const resolved = statsData?.resolved || 0;
  const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const stats = [
    { label: "Total Complaints", value: total, icon: ClipboardList, tone: "total" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, tone: "done" },
    { label: "In Progress", value: statsData?.inProgress || 0, icon: Wrench, tone: "progress" },
    { label: "Pending", value: statsData?.pending || 0, icon: CircleDot, tone: "pending" },
  ];

  return (
    <div className="up-page">

      {/* =================================
          HEADER
      ================================= */}
      <div className="up-header">
        <div className="up-header-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="up-header-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="up-identity">
          <div className="up-header-avatar">{initial}</div>

          <div>
            <span className="up-eyebrow">My Profile</span>
            <h1>{user.name}</h1>
            <p>{user.email}{user.joinedDate ? ` · Member since ${user.joinedDate}` : ""}</p>
          </div>
        </div>

        <div className="up-header-btns">
          <button className="up-btn-light" onClick={openEdit}>
            <Pencil size={14} strokeWidth={2.5} />
            Edit Profile
          </button>
          <button className="up-btn-ghost" onClick={openPassword}>
            <KeyRound size={14} strokeWidth={2.5} />
            Change Password
          </button>
        </div>
      </div>

      {alertMsg.text && (
        <div className={`up-alert ${alertMsg.type}`} role="status">
          {alertMsg.type === "success" ? (
            <CheckCircle2 size={17} strokeWidth={2.4} />
          ) : (
            <AlertCircle size={17} strokeWidth={2.4} />
          )}
          {alertMsg.text}
        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}
      <div className="up-stats">
        {stats.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`up-stat up-stat-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="up-stat-icon">
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* =================================
          MAIN CONTENT
      ================================= */}
      <div className="up-main">

        {/* -------- LEFT: QUICK CONTACT CARD -------- */}
        <div className="up-side">
          <div className="up-side-avatar">{initial}</div>

          <h3>{user.name}</h3>
          <span className="up-side-role">Citizen Reporter</span>

          <span className="up-side-pill">
            <CheckCircle2 size={12} strokeWidth={2.5} />
            Active Account
          </span>

          <div className="up-divider"></div>

          <div className="up-contact-list">
            <div className="up-contact">
              <Mail size={15} strokeWidth={2} />
              <span>{user.email || "No email provided"}</span>
            </div>

            <div className="up-contact">
              <Phone size={15} strokeWidth={2} />
              <span>{user.phone || "No phone provided"}</span>
            </div>

            <div className="up-contact">
              <Home size={15} strokeWidth={2} />
              <span>{user.address || "No address provided"}</span>
            </div>
          </div>

          <div className="up-divider"></div>

          <div className="up-note">
            <ShieldCheck size={15} strokeWidth={2} />
            Your details are stored securely and only used to process your complaints.
          </div>
        </div>

        {/* -------- RIGHT: TABBED DETAILS -------- */}
        <div className="up-details">
          <div className="up-tabs">
            <button
              className={`up-tab ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <User size={15} strokeWidth={2} />
              Personal & Contact
            </button>

            <button
              className={`up-tab ${activeTab === "account" ? "active" : ""}`}
              onClick={() => setActiveTab("account")}
            >
              <TrendingUp size={15} strokeWidth={2} />
              Account & Activity
            </button>
          </div>

          {activeTab === "personal" ? (
            <div className="up-info-list">
              <div className="up-info">
                <span className="label"><User size={14} strokeWidth={2} /> Full Name</span>
                <strong className="value">{user.name || "—"}</strong>
              </div>

              <div className="up-info">
                <span className="label"><Mail size={14} strokeWidth={2} /> Email Address</span>
                <strong className="value">{user.email || "—"}</strong>
              </div>

              <div className="up-info">
                <span className="label"><Phone size={14} strokeWidth={2} /> Phone Number</span>
                <strong className="value">{user.phone || "—"}</strong>
              </div>

              <div className="up-info">
                <span className="label"><Home size={14} strokeWidth={2} /> Address</span>
                <strong className="value">{user.address || "—"}</strong>
              </div>
            </div>
          ) : (
            <>
              <div className="up-info-list">
                <div className="up-info">
                  <span className="label"><Calendar size={14} strokeWidth={2} /> Member Since</span>
                  <strong className="value">{user.joinedDate || "—"}</strong>
                </div>

                <div className="up-info">
                  <span className="label"><ClipboardList size={14} strokeWidth={2} /> Complaints Reported</span>
                  <strong className="value">{total}</strong>
                </div>

                <div className="up-info">
                  <span className="label"><CheckCircle2 size={14} strokeWidth={2} /> Complaints Resolved</span>
                  <strong className="value">{resolved}</strong>
                </div>

                <div className="up-info">
                  <span className="label"><Lock size={14} strokeWidth={2} /> Password</span>
                  <strong className="value">
                    <button className="up-link-btn" onClick={openPassword}>
                      Change password
                    </button>
                  </strong>
                </div>
              </div>

              <div className="up-impact">
                <h3>Your Impact</h3>
                <div className="up-impact-bar">
                  <div
                    className="up-impact-fill"
                    style={{ width: `${resolvedRate}%` }}
                  ></div>
                </div>
                <p>
                  {total > 0
                    ? `${resolvedRate}% of your reported issues have been fixed.`
                    : "Report your first footpath issue to start making a difference."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================
          EDIT PROFILE MODAL
      ================================= */}
      {showEditPopup && (
        <div className="up-overlay" onClick={closeEdit}>
          <div className="up-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-head">
              <div>
                <span className="up-modal-label">MY ACCOUNT</span>
                <h2>Edit Profile Details</h2>
              </div>
              <button className="up-close" onClick={closeEdit} aria-label="Close">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSave} className="up-form">
              {modalError && (
                <div className="up-error" role="alert">
                  <AlertCircle size={16} strokeWidth={2.2} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="up-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="up-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="up-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="up-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="up-modal-footer">
                <button type="button" className="up-cancel" onClick={closeEdit}>
                  Cancel
                </button>
                <button type="submit" className="up-save" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================
          CHANGE PASSWORD MODAL
      ================================= */}
      {showPasswordPopup && (
        <div className="up-overlay" onClick={closePassword}>
          <div className="up-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-head">
              <div>
                <span className="up-modal-label">SECURITY SETTINGS</span>
                <h2>Change Password</h2>
              </div>
              <button className="up-close" onClick={closePassword} aria-label="Close">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="up-form">
              {modalError && (
                <div className="up-error" role="alert">
                  <AlertCircle size={16} strokeWidth={2.2} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="up-group">
                <label><Lock size={12} strokeWidth={2.5} /> Current Password *</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passForm.currentPassword}
                  onChange={(e) => {
                    setPassForm({ ...passForm, currentPassword: e.target.value });
                    setModalError("");
                  }}
                  required
                />
              </div>

              <div className="up-group">
                <label><Lock size={12} strokeWidth={2.5} /> New Password *</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passForm.newPassword}
                  onChange={(e) => {
                    setPassForm({ ...passForm, newPassword: e.target.value });
                    setModalError("");
                  }}
                  required
                />
              </div>

              <div className="up-group">
                <label><Lock size={12} strokeWidth={2.5} /> Confirm New Password *</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passForm.confirmPassword}
                  onChange={(e) => {
                    setPassForm({ ...passForm, confirmPassword: e.target.value });
                    setModalError("");
                  }}
                  required
                />
              </div>

              <div className="up-modal-footer">
                <button type="button" className="up-cancel" onClick={closePassword}>
                  Cancel
                </button>
                <button type="submit" className="up-save" disabled={saving}>
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;