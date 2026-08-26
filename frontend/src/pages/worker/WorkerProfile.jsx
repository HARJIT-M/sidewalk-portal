import React, { useState, useEffect } from "react";
import { getStoredProfile, saveStoredProfile } from "./workerData";
import "./WorkerProfile.css";

const WorkerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    emergencyContact: "",
    address: "",
    zone: "",
  });

  // Password form state
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirmPass: "",
  });

  useEffect(() => {
    const loaded = getStoredProfile();
    setProfile(loaded);
    setEditForm({
      name: loaded.name,
      phone: loaded.phone,
      email: loaded.email,
      emergencyContact: loaded.emergencyContact || "9876543219",
      address: loaded.address || "42 Cross Road, Gandhipuram, Coimbatore",
      zone: loaded.zone || "Zone 2 - Gandhipuram Central",
    });
  }, []);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      emergencyContact: editForm.emergencyContact,
      address: editForm.address,
      zone: editForm.zone,
    };
    setProfile(updated);
    saveStoredProfile(updated);
    setShowEditModal(false);
    setAlertMessage("Profile updated successfully!");
    setTimeout(() => setAlertMessage(""), 4000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.newPass || !passwords.confirmPass) {
      alert("Please fill all password fields.");
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      alert("New password and confirm password do not match.");
      return;
    }
    setShowPasswordModal(false);
    setPasswords({ current: "", newPass: "", confirmPass: "" });
    setAlertMessage("Password changed successfully!");
    setTimeout(() => setAlertMessage(""), 4000);
  };

  if (!profile) return null;

  return (
    <div className="worker-profile-page">
      {alertMessage && (
        <div className="profile-alert-banner">
          <span>✅ {alertMessage}</span>
        </div>
      )}

      {/* =========================================
          PROFILE HERO BANNER
      ========================================= */}
      <div className="profile-hero-card">
        <div className="profile-avatar-box">
          <div className="profile-avatar-large">
            {profile.name.charAt(0)}
          </div>
          <span className="profile-status-indicator active"></span>
        </div>

        <div className="profile-hero-text">
          <div className="profile-title-row">
            <h1>{profile.name}</h1>
            <span className="worker-id-pill">{profile.id}</span>
            <span className="role-tag">{profile.role}</span>
          </div>
          <p className="profile-meta-sub">
            🏢 {profile.zone} • Joined {profile.joinedDate}
          </p>
          <div className="profile-stats-chips">
            <span className="stat-chip">
              ⭐ <strong>4.9/5</strong> Rating
            </span>
            <span className="stat-chip">
              ⏱️ <strong>96%</strong> On-Time Rate
            </span>
            <span className="stat-chip">
              🛠️ <strong>18</strong> Total Repairs Completed
            </span>
          </div>
        </div>

        <div className="profile-header-actions">
          <button
            className="btn-edit-profile"
            onClick={() => setShowEditModal(true)}
          >
            ✏️ Edit Profile
          </button>
          <button
            className="btn-change-pass"
            onClick={() => setShowPasswordModal(true)}
          >
            🔒 Change Password
          </button>
        </div>
      </div>

      {/* =========================================
          INFORMATION DETAILS GRID
      ========================================= */}
      <div className="profile-details-grid">
        {/* Contact & Personal Info */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>👤 Personal & Contact Information</h3>
          </div>

          <div className="profile-info-list">
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <strong className="info-value">{profile.name}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Worker ID:</span>
              <strong className="info-value id-val">{profile.id}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Official Email:</span>
              <strong className="info-value">✉️ {profile.email}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Primary Phone:</span>
              <strong className="info-value">📞 {profile.phone}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Emergency Contact:</span>
              <strong className="info-value">🚨 {profile.emergencyContact || "9876543219"}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Operational Zone:</span>
              <strong className="info-value">📍 {profile.zone}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Residential Address:</span>
              <strong className="info-value">{profile.address}</strong>
            </div>
          </div>
        </div>

        {/* Work & Deployment Details */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>🧰 Deployment & Equipment</h3>
          </div>

          <div className="profile-info-list">
            <div className="info-row">
              <span className="info-label">Work Shift:</span>
              <strong className="info-value">🕒 {profile.shift}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Employment Status:</span>
              <strong className="info-value status-active">🟢 Active / On Duty</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Assigned Supervisor:</span>
              <strong className="info-value">Harjit Singh (Field Manager)</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Assigned Gear:</span>
              <strong className="info-value">{profile.assignedEquipment}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Safety Clearance:</span>
              <strong className="info-value">Level 2 Field Infrastructure Certified</strong>
            </div>
          </div>

          <div className="skills-section">
            <h4>Certified Skills & Specializations</h4>
            <div className="skills-tags-wrap">
              {profile.skills && profile.skills.map((skill) => (
                <span key={skill} className="skill-tag">
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          EDIT PROFILE MODAL
      ========================================= */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2>Edit Worker Profile</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="modal-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="modal-field-grid">
                <div className="modal-field">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Emergency Contact</label>
                  <input
                    type="text"
                    value={editForm.emergencyContact}
                    onChange={(e) =>
                      setEditForm({ ...editForm, emergencyContact: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="modal-field">
                <label>Assigned Zone</label>
                <input
                  type="text"
                  value={editForm.zone}
                  onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          CHANGE PASSWORD MODAL
      ========================================= */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2>Change Password</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="modal-field">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords({ ...passwords, current: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={passwords.newPass}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPass: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwords.confirmPass}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPass: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save">
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
