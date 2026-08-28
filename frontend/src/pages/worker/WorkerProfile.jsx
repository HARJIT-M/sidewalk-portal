import React, { useState, useEffect } from "react";
import { getStoredProfile, saveStoredProfile } from "./workerData";
import "./WorkerProfile.css";

const WorkerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

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

  useEffect(() => {
    const loaded = getStoredProfile();
    setProfile(loaded);
    setEditForm({
      name: loaded.name,
      phone: loaded.phone,
      email: loaded.email,
      zone: loaded.zone || "Zone 2 - Coimbatore Central",
      emergencyContact: loaded.emergencyContact || "9876543219",
      address: loaded.address || "42 Cross Road, Gandhipuram, Coimbatore",
    });
  }, []);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      zone: editForm.zone,
      emergencyContact: editForm.emergencyContact,
      address: editForm.address,
    };
    setProfile(updated);
    saveStoredProfile(updated);
    setShowEditPopup(false);
    alert("Profile updated successfully!");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword) {
      alert("Please fill all password fields.");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setShowPasswordPopup(false);
    setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    alert("Password updated successfully!");
  };

  if (!profile) return null;

  return (
    <div className="workers-page">
      {/* =================================
          HEADER
      ================================= */}
      <div className="workers-header">
        <div>
          <h1>My Profile</h1>
          <p>View and manage worker account details and availability</p>
        </div>

        <div className="header-btn-row">
          <button
            className="add-worker-btn"
            onClick={() => setShowEditPopup(true)}
          >
            Edit Profile
          </button>
          <button
            className="password-worker-btn"
            onClick={() => setShowPasswordPopup(true)}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* =================================
          STATISTICS
      ================================= */}
      <div className="worker-stats">
        <div className="worker-stat-card">
          <div className="worker-stat-icon total">👤</div>
          <div>
            <span>Worker ID</span>
            <strong>{profile.id}</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon active">✓</div>
          <div>
            <span>Status</span>
            <strong>{profile.status}</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon available">⭐</div>
          <div>
            <span>Performance Rating</span>
            <strong>4.9 / 5.0</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon inactive">🛠️</div>
          <div>
            <span>Total Completed</span>
            <strong>18 Tasks</strong>
          </div>
        </div>
      </div>

      {/* =================================
          DETAILS CONTAINER
      ================================= */}
      <div className="profile-content-grid">
        {/* Contact Info */}
        <div className="profile-details-card">
          <div className="details-card-header">
            <h2>Personal & Contact Information</h2>
          </div>

          <div className="profile-info-table">
            <div className="info-item">
              <span className="label">Full Name:</span>
              <strong className="value">{profile.name}</strong>
            </div>

            <div className="info-item">
              <span className="label">Worker ID:</span>
              <strong className="value id-text">{profile.id}</strong>
            </div>

            <div className="info-item">
              <span className="label">Email Address:</span>
              <strong className="value">✉ {profile.email}</strong>
            </div>

            <div className="info-item">
              <span className="label">Phone Number:</span>
              <strong className="value">📞 {profile.phone}</strong>
            </div>

            <div className="info-item">
              <span className="label">Emergency Contact:</span>
              <strong className="value">🚨 {profile.emergencyContact || "9876543219"}</strong>
            </div>

            <div className="info-item">
              <span className="label">Assigned Zone:</span>
              <strong className="value">📍 {profile.zone || "Zone 2 - Coimbatore Central"}</strong>
            </div>

            <div className="info-item">
              <span className="label">Residential Address:</span>
              <strong className="value">{profile.address}</strong>
            </div>
          </div>
        </div>

        {/* Work & Deployment */}
        <div className="profile-details-card">
          <div className="details-card-header">
            <h2>Deployment & Equipment</h2>
          </div>

          <div className="profile-info-table">
            <div className="info-item">
              <span className="label">Role:</span>
              <strong className="value">{profile.role}</strong>
            </div>

            <div className="info-item">
              <span className="label">Joining Date:</span>
              <strong className="value">{profile.joinedDate}</strong>
            </div>

            <div className="info-item">
              <span className="label">Shift:</span>
              <strong className="value">{profile.shift}</strong>
            </div>

            <div className="info-item">
              <span className="label">Supervisor:</span>
              <strong className="value">Harjit Singh (Field Manager)</strong>
            </div>

            <div className="info-item">
              <span className="label">Assigned Kit & Van:</span>
              <strong className="value">{profile.assignedEquipment}</strong>
            </div>
          </div>

          <div className="skills-block">
            <h3>Certified Specializations</h3>
            <div className="skill-pills-wrap">
              {profile.skills &&
                profile.skills.map((s) => (
                  <span key={s} className="skill-pill">
                    ✓ {s}
                  </span>
                ))}
            </div>
          </div>
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
                <h2>Edit Profile Details</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowEditPopup(false)}
              >
                ×
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
                <h2>Change Password</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowPasswordPopup(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="worker-form">
              <div className="form-group">
                <label>Current Password *</label>
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
                <label>New Password *</label>
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
                <label>Confirm New Password *</label>
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
