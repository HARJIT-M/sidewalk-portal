// UserProfile.jsx
import React, { useState } from "react";
import "./userprofile.css";

const UserProfile = () => {

  // ============================
  // SAMPLE USER DATA
  // ============================

  const [user, setUser] = useState({
    name: "Karthik Raja",
    email: "karthik.raja@example.com",
    phone: "+91 98765 43210",
    address: "12, Gandhi Street, Coimbatore",
    city: "Coimbatore",
    pincode: "641001",
    joined: "12 Jan 2025",
  });

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState(user);


  // ============================
  // STATS (sample)
  // ============================

  const stats = [
    { label: "Total Complaints", value: 12, icon: "📋", type: "total" },
    { label: "Resolved", value: 8, icon: "✓", type: "resolved" },
    { label: "In Progress", value: 3, icon: "🔧", type: "progress" },
    { label: "Pending", value: 1, icon: "⏳", type: "pending" },
  ];


  // ============================
  // HANDLERS
  // ============================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    setUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };


  return (
    <div className="profile-page">

      {/* ============================
          HEADER
      ============================ */}

      <div className="profile-header">

        <div className="profile-header-left">

          <div className="profile-avatar-large">
            {user.name.charAt(0)}
          </div>

          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <span className="joined-tag">
              Member since {user.joined}
            </span>
          </div>

        </div>

        {!isEditing && (
          <button
            className="edit-btn"
            onClick={() => setIsEditing(true)}
          >
            ✎ Edit Profile
          </button>
        )}

      </div>


      {/* ============================
          STATS
      ============================ */}

      <div className="stats-container">

        {stats.map((stat, index) => (

          <div className="stat-card" key={index}>

            <div className={`stat-icon ${stat.type}`}>
              {stat.icon}
            </div>

            <div>
              <p>{stat.label}</p>
              <h2>{stat.value}</h2>
            </div>

          </div>

        ))}

      </div>


      {/* ============================
          PROFILE DETAILS
      ============================ */}

      <div className="profile-section">

        <div className="section-header">

          <div>
            <h2>Personal Information</h2>
            <p>Manage your personal details and contact information</p>
          </div>

          {isEditing && (
            <div className="edit-actions">
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          )}

        </div>


        <div className="details-grid">

          <div className="detail-item">
            <label>Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            ) : (
              <span>{user.name}</span>
            )}
          </div>

          <div className="detail-item">
            <label>Email Address</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            ) : (
              <span>{user.email}</span>
            )}
          </div>

          <div className="detail-item">
            <label>Phone Number</label>
            {isEditing ? (
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            ) : (
              <span>{user.phone}</span>
            )}
          </div>

          <div className="detail-item">
            <label>City</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            ) : (
              <span>{user.city}</span>
            )}
          </div>

          <div className="detail-item full-width">
            <label>Address</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            ) : (
              <span>{user.address}</span>
            )}
          </div>

          <div className="detail-item">
            <label>Pincode</label>
            {isEditing ? (
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            ) : (
              <span>{user.pincode}</span>
            )}
          </div>

        </div>

      </div>


      {/* ============================
          SECURITY SECTION
      ============================ */}

      <div className="profile-section">

        <div className="section-header">
          <div>
            <h2>Security</h2>
            <p>Manage your password and account security</p>
          </div>
        </div>

        <div className="security-row">

          <div>
            <strong>Password</strong>
            <span>Last changed 3 months ago</span>
          </div>

          <button className="secondary-btn">
            Change Password
          </button>

        </div>

      </div>

    </div>
  );
};

export default UserProfile;