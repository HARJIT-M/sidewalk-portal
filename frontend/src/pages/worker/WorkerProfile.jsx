import React, { useState, useEffect } from "react";
import {
  getWorkerProfile,
  updateWorkerProfile,
  changeWorkerPassword,
} from "../../services/workerApi";
import {
  User,
  IdCard,
  Mail,
  Phone,
  Siren,
  MapPin,
  Home,
  Star,
  CheckCircle2,
  Wrench,
  Calendar,
  Clock,
  UserRound,
  Truck,
  ShieldCheck,
  Lock,
  X,
  Pencil,
  KeyRound,
} from "lucide-react";
import "./WorkerProfile.css";

const WorkerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // personal | work
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "success" });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    zone: "",
    emergencyContact: "",
    address: "",
  });

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getWorkerProfile();
      if (res.success) {
        setProfile(res.profile);
        setEditForm({
          name: res.profile.name || "",
          phone: res.profile.phone || "",
          email: res.profile.email || "",
          zone: res.profile.zone || "Zone 2 - Gandhipuram Central",
          emergencyContact: res.profile.emergencyContact || "",
          address: res.profile.address || "",
        });
      }
    } catch (err) {
      console.error("Failed to load worker profile:", err);
      setAlertMsg({ text: "Failed to load profile from database.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateWorkerProfile(editForm);
      if (res.success) {
        setAlertMsg({ text: "Profile updated successfully in MongoDB!", type: "success" });
        setShowEditPopup(false);
        await loadProfile();
        setTimeout(() => setAlertMsg({ text: "", type: "success" }), 4000);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword) {
      alert("Please fill all password fields.");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      const res = await changeWorkerPassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });

      if (res.success) {
        setAlertMsg({ text: "Password changed successfully in MongoDB!", type: "success" });
        setShowPasswordPopup(false);
        setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setAlertMsg({ text: "", type: "success" }), 4000);
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      alert(err.response?.data?.message || "Failed to change password.");
    }
  };

  if (loading && !profile) {
    return (
      <div className="workers-page">
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
          <p>Loading worker profile from MongoDB...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "W";

  return (
    <div className="workers-page">
      {/* =================================
          HEADER
      ================================= */}
      <div className="workers-header">
        <div className="header-identity">
          <div className="header-avatar">{initial}</div>

          <div>
            <span className="header-eyebrow">Worker Profile</span>
            <h1>{profile.name}</h1>
            <p>{profile.role} · {profile.zone}</p>
          </div>
        </div>

        <div className="header-btn-row">
          <button
            className="add-worker-btn"
            onClick={() => setShowEditPopup(true)}
          >
            <Pencil size={14} strokeWidth={2.5} />
            Edit Profile
          </button>
          <button
            className="password-worker-btn"
            onClick={() => setShowPasswordPopup(true)}
          >
            <KeyRound size={14} strokeWidth={2.5} />
            Change Password
          </button>
        </div>
      </div>

      {alertMsg.text && (
        <div
          style={{
            background: alertMsg.type === "success" ? "#dcfce7" : "#fee2e2",
            color: alertMsg.type === "success" ? "#166534" : "#991b1b",
            border: alertMsg.type === "success" ? "1px solid #86efac" : "1px solid #fca5a5",
            padding: "12px 18px",
            borderRadius: "10px",
            margin: "14px 0",
            fontWeight: "500",
          }}
        >
          {alertMsg.type === "success" ? "✅" : "⚠️"} {alertMsg.text}
        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}
      <div className="worker-stats">
        <div className="worker-stat-card">
          <div className="worker-stat-icon total">
            <IdCard size={20} strokeWidth={2} />
          </div>
          <div>
            <span>Worker ID</span>
            <strong>{profile.id}</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon active">
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
          <div>
            <span>Status</span>
            <strong>{profile.status}</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon available">
            <Star size={20} strokeWidth={2} />
          </div>
          <div>
            <span>Performance Rating</span>
            <strong>{profile.stats?.rating || 4.9} / 5.0</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon inactive">
            <Wrench size={20} strokeWidth={2} />
          </div>
          <div>
            <span>Total Completed</span>
            <strong>{profile.stats?.completed || 0} Tasks</strong>
          </div>
        </div>
      </div>

      {/* =================================
          MAIN CONTENT
      ================================= */}
      <div className="profile-main-grid">
        {/* -------- LEFT: QUICK CONTACT CARD -------- */}
        <div className="profile-side-card">
          <div className="side-avatar">{initial}</div>

          <h3>{profile.name}</h3>
          <span className="side-role">{profile.role}</span>

          <span className="side-status-pill">
            <CheckCircle2 size={12} strokeWidth={2.5} />
            {profile.status}
          </span>

          <div className="side-divider"></div>

          <div className="side-contact-list">
            <div className="side-contact-item">
              <Mail size={15} strokeWidth={2} />
              <span>{profile.email}</span>
            </div>

            <div className="side-contact-item">
              <Phone size={15} strokeWidth={2} />
              <span>{profile.phone || "No phone provided"}</span>
            </div>

            <div className="side-contact-item">
              <Siren size={15} strokeWidth={2} />
              <span>{profile.emergencyContact || "No emergency contact"}</span>
            </div>

            <div className="side-contact-item">
              <MapPin size={15} strokeWidth={2} />
              <span>{profile.zone}</span>
            </div>
          </div>

          <div className="side-divider"></div>

          <div className="side-security-note">
            <ShieldCheck size={15} strokeWidth={2} />
            Your details are managed securely via MongoDB and accessible by your supervisor.
          </div>
        </div>

        {/* -------- RIGHT: TABBED DETAILS -------- */}
        <div className="profile-details-card">
          <div className="details-tabs">
            <button
              className={`details-tab ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <User size={15} strokeWidth={2} />
              Personal & Contact
            </button>

            <button
              className={`details-tab ${activeTab === "work" ? "active" : ""}`}
              onClick={() => setActiveTab("work")}
            >
              <Truck size={15} strokeWidth={2} />
              Deployment & Equipment
            </button>
          </div>

          {activeTab === "personal" ? (
            <div className="profile-info-table">
              <div className="info-item">
                <span className="label"><User size={14} strokeWidth={2} /> Full Name</span>
                <strong className="value">{profile.name}</strong>
              </div>

              <div className="info-item">
                <span className="label"><IdCard size={14} strokeWidth={2} /> Worker ID</span>
                <strong className="value id-text">{profile.id}</strong>
              </div>

              <div className="info-item">
                <span className="label"><Mail size={14} strokeWidth={2} /> Email Address</span>
                <strong className="value">{profile.email}</strong>
              </div>

              <div className="info-item">
                <span className="label"><Phone size={14} strokeWidth={2} /> Phone Number</span>
                <strong className="value">{profile.phone || "—"}</strong>
              </div>

              <div className="info-item">
                <span className="label"><Siren size={14} strokeWidth={2} /> Emergency Contact</span>
                <strong className="value">{profile.emergencyContact || "—"}</strong>
              </div>

              <div className="info-item">
                <span className="label"><MapPin size={14} strokeWidth={2} /> Assigned Zone</span>
                <strong className="value">{profile.zone}</strong>
              </div>

              <div className="info-item">
                <span className="label"><Home size={14} strokeWidth={2} /> Residential Address</span>
                <strong className="value">{profile.address || "—"}</strong>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-info-table">
                <div className="info-item">
                  <span className="label"><Wrench size={14} strokeWidth={2} /> Role</span>
                  <strong className="value">{profile.role}</strong>
                </div>

                <div className="info-item">
                  <span className="label"><Calendar size={14} strokeWidth={2} /> Joining Date</span>
                  <strong className="value">{profile.joinedDate}</strong>
                </div>

                <div className="info-item">
                  <span className="label"><Clock size={14} strokeWidth={2} /> Shift</span>
                  <strong className="value">{profile.shift}</strong>
                </div>

                <div className="info-item">
                  <span className="label"><UserRound size={14} strokeWidth={2} /> Field Manager</span>
                  <strong className="value">Mohan Kumar (Field Manager)</strong>
                </div>

                <div className="info-item">
                  <span className="label"><Truck size={14} strokeWidth={2} /> Assigned Kit & Van</span>
                  <strong className="value">{profile.assignedEquipment}</strong>
                </div>
              </div>

              <div className="skills-block">
                <h3>Certified Specializations</h3>
                <div className="skill-pills-wrap">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((s) => (
                      <span key={s} className="skill-pill">
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#64748b", fontStyle: "italic" }}>No skills recorded.</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================
          EDIT PROFILE MODAL
      ================================= */}
      {showEditPopup && (
        <div
          className="worker-modal-overlay"
          onClick={() => setShowEditPopup(false)}
        >
          <div
            className="worker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="worker-modal-header">
              <div>
                <span className="modal-label">WORKER ACCOUNT</span>
                <h2>Edit Profile Details (MongoDB)</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowEditPopup(false)}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="worker-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  type="text"
                  value={editForm.emergencyContact}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      emergencyContact: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned Zone</label>
                <input
                  type="text"
                  value={editForm.zone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, zone: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>

              <div className="worker-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowEditPopup(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-add-btn">
                  Save Changes
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
        <div
          className="worker-modal-overlay"
          onClick={() => setShowPasswordPopup(false)}
        >
          <div
            className="worker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="worker-modal-header">
              <div>
                <span className="modal-label">SECURITY SETTINGS</span>
                <h2>Change Password (MongoDB)</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowPasswordPopup(false)}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="worker-form">
              <div className="form-group">
                <label><Lock size={12} strokeWidth={2.5} /> Current Password *</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passForm.currentPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label><Lock size={12} strokeWidth={2.5} /> New Password *</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label><Lock size={12} strokeWidth={2.5} /> Confirm New Password *</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passForm.confirmPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="worker-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowPasswordPopup(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-add-btn">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;