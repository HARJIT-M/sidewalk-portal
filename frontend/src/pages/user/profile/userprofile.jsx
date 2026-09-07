import React, { useState, useEffect } from "react";
import userApi from "../../../services/userApi";
import "./userprofile.css";

const UserProfile = () => {

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    joined: "",
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

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

  const stats = [
    { label: "Total Complaints", value: statsData?.totalReported || 0, icon: "📋", type: "total" },
    { label: "Resolved", value: statsData?.resolved || 0, icon: "✓", type: "resolved" },
    { label: "In Progress", value: statsData?.inProgress || 0, icon: "🔧", type: "progress" },
    { label: "Pending", value: statsData?.pending || 0, icon: "⏳", type: "pending" },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      const data = await userApi.updateProfile(formData);
      if (data.success) {
        setUser(data.profile);
        setIsEditing(false);
        alert("Profile updated successfully");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

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