import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  UserCog,
  Wrench,
  UserCheck,
  UserX,
  UserPlus,
  Trash2,
  ShieldOff,
  ShieldCheck,
  SlidersHorizontal,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { getAllUsers, updateUserStatus, deleteUser,createUser } from "../../services/adminApi";
import "./adminmanagement.css";

const ROLE_STYLE = {
  CITIZEN: { tone: "indigo", icon: Users },
  WORKER: { tone: "green", icon: Wrench },
  MANAGER: { tone: "amber", icon: UserCog },
  ADMIN: { tone: "violet", icon: ShieldCheck },
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  zone: "",
  password: "",
  role: "CITIZEN",
};

const ROLE_OPTIONS = [
  { key: "CITIZEN", label: "Citizen" },
  { key: "WORKER", label: "Worker" },
  { key: "MANAGER", label: "Manager" },
  { key: "ADMIN", label: "Admin" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [pendingDelete, setPendingDelete] = useState(null);

  // ---- Add user modal state ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateUserStatus(id, newStatus);
      // Update local state instead of re-fetching to be faster
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === id ? { ...user, status: newStatus } : user
        )
      );
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const requestDelete = (user) => {
    setPendingDelete(user);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUser(pendingDelete._id);
      setUsers((currentUsers) => currentUsers.filter((user) => user._id !== pendingDelete._id));
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    } finally {
      setPendingDelete(null);
    }
  };

  // ================= ADD USER =================
  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError("");
    setShowPassword(false);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (submitting) return;
    setShowAddModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = "Enter a valid email address";
    if (form.phone.trim() && !/^[0-9+\-\s()]{7,15}$/.test(form.phone.trim())) {
      errs.phone = "Enter a valid phone number";
    }
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        zone: form.zone.trim(),
        password: form.password,
        role: form.role,
        status: "ACTIVE", // new accounts are always created as active
      };
      console.log("Submitting new user:", payload);
      const res = await createUser(payload);
      // API returns the newly created user (without password)
      setUsers((currentUsers) => [res.data, ...currentUsers]);
      setShowAddModal(false);
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to create user";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-management">Loading accounts...</div>;
  }

  if (error) {
    return <div className="admin-management">Error: {error}</div>;
  }


  // ================= FILTER USERS =================
  const filteredUsers = users.filter((user) => {
    const nameMatch = user?.name?.toLowerCase().includes(search.toLowerCase());
    const emailMatch = user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleFilters = [
    { key: "ALL", label: "All Accounts", count: users.length },
    { key: "CITIZEN", label: "Citizens", count: users.filter((u) => u.role === "CITIZEN").length },
    { key: "WORKER", label: "Workers", count: users.filter((u) => u.role === "WORKER").length },
    { key: "MANAGER", label: "Managers", count: users.filter((u) => u.role === "MANAGER").length },
  ];

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="admin-management">

      {/* ================= HEADER ================= */}
      <div className="admin-management-header">
        <div>
          <span className="admin-management-eyebrow">User Administration</span>
          <h1>Account Management</h1>
          <p>Manage citizens, workers and managers across the portal</p>
        </div>

        <div className="admin-management-profile">
          <div className="admin-management-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>{users.length} accounts · Full access</span>
          </div>
        </div>
      </div>


      {/* ================= SUMMARY ================= */}
      <div className="admin-management-summary">

        <div className="admin-summary-card">
          <div className="admin-summary-icon indigo">
            <Users size={20} strokeWidth={2} />
          </div>
          <div className="admin-summary-content">
            <span>Citizens</span>
            <strong>{users.filter((u) => u.role === "CITIZEN").length}</strong>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon green">
            <Wrench size={20} strokeWidth={2} />
          </div>
          <div className="admin-summary-content">
            <span>Workers</span>
            <strong>{users.filter((u) => u.role === "WORKER").length}</strong>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon amber">
            <UserCog size={20} strokeWidth={2} />
          </div>
          <div className="admin-summary-content">
            <span>Managers</span>
            <strong>{users.filter((u) => u.role === "MANAGER").length}</strong>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon violet">
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <div className="admin-summary-content">
            <span>Active Accounts</span>
            <strong>
              {activeCount} <em>/ {users.length}</em>
            </strong>
          </div>
        </div>

      </div>


      {/* ================= MANAGEMENT PANEL ================= */}
      <div className="admin-management-panel">

        {/* ================= TOOLBAR ================= */}
        <div className="admin-management-toolbar">

          <div className="admin-search-box">
            <Search size={16} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-filter-tabs">
            <SlidersHorizontal size={13} strokeWidth={2} className="admin-filter-tabs-icon" />
            {roleFilters.map((filter) => (
              <button
                key={filter.key}
                className={roleFilter === filter.key ? "admin-filter-btn active" : "admin-filter-btn"}
                onClick={() => setRoleFilter(filter.key)}
              >
                {filter.label}
                <span className="admin-filter-count">{filter.count}</span>
              </button>
            ))}
          </div>

          <button className="admin-add-user-btn" onClick={openAddModal}>
            <UserPlus size={16} strokeWidth={2} />
            Add User
          </button>

        </div>


        {/* ================= TABLE ================= */}
        <div className="admin-table-container">

          <table className="admin-users-table">

            <thead>
              <tr>
                <th>Account</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="admin-th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const roleMeta = ROLE_STYLE[user.role] || { tone: "gray", icon: Users };
                  const RoleIcon = roleMeta.icon;

                  return (
                    <tr key={user._id}>

                      {/* ACCOUNT */}
                      <td>
                        <div className="admin-user-info">
                          <div className={`admin-user-avatar ${roleMeta.tone}`}>
                            {user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <strong>{user.name}</strong>
                            <span>Account ID #{String(user._id).substring(0, 6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td>
                        <span className="admin-user-email">{user.email}</span>
                      </td>

                      {/* ROLE */}
                      <td>
                        <span className={`admin-role-badge ${user?.role?.toLowerCase() || "unknown"}`}>
                          <RoleIcon size={11} strokeWidth={2.2} />
                          {user.role || "UNKNOWN"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span className={`admin-status-badge ${user?.status?.toLowerCase() || "unknown"}`}>
                          <span className="admin-status-dot"></span>
                          {user.status || "UNKNOWN"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="admin-action-buttons">

                          <button
                            className={
                              user.status === "ACTIVE"
                                ? "admin-action-btn revoke"
                                : "admin-action-btn activate"
                            }
                            onClick={() => handleStatusChange(user._id, user.status)}
                            title={
                              user.status === "ACTIVE"
                                ? "Revoke login access"
                                : "Restore login access"
                            }
                          >
                            {user.status === "ACTIVE" ? (
                              <ShieldOff size={14} strokeWidth={2} />
                            ) : (
                              <UserCheck size={14} strokeWidth={2} />
                            )}
                            {user.status === "ACTIVE" ? "Revoke" : "Activate"}
                          </button>

                          <button
                            className="admin-action-btn delete"
                            onClick={() => requestDelete(user)}
                            title="Remove account"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="admin-no-users">
                    <UserX size={26} strokeWidth={1.5} />
                    <strong>No accounts found</strong>
                    <span>Try adjusting your search or filter.</span>
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>

        <div className="admin-table-footer">
          <span>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> accounts
          </span>
        </div>

      </div>


      {/* ================= ADD USER MODAL ================= */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={closeAddModal}>
          <div
            className="admin-modal admin-modal-wide"
            onClick={(e) => e.stopPropagation()}
          >

            <button className="admin-modal-close" onClick={closeAddModal} type="button">
              <X size={16} strokeWidth={2} />
            </button>

            <div className="admin-modal-icon add">
              <UserPlus size={22} strokeWidth={2} />
            </div>

            <h2>Add New Account</h2>
            <p>Create a new account and assign its role and access status.</p>

            <form className="admin-add-form" onSubmit={handleAddUser} noValidate>

              <div className="admin-form-grid">

                <div className="admin-form-field full">
                  <label htmlFor="add-name">Full Name <em>*</em></label>
                  <input
                    id="add-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Priya Sharma"
                    className={formErrors.name ? "invalid" : ""}
                    autoFocus
                  />
                  {formErrors.name && <span className="admin-field-error">{formErrors.name}</span>}
                </div>

                <div className="admin-form-field full">
                  <label htmlFor="add-email">Email <em>*</em></label>
                  <input
                    id="add-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="name@example.com"
                    className={formErrors.email ? "invalid" : ""}
                  />
                  {formErrors.email && <span className="admin-field-error">{formErrors.email}</span>}
                </div>

                <div className="admin-form-field">
                  <label htmlFor="add-phone">Phone</label>
                  <input
                    id="add-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="Optional"
                    className={formErrors.phone ? "invalid" : ""}
                  />
                  {formErrors.phone && <span className="admin-field-error">{formErrors.phone}</span>}
                </div>

                <div className="admin-form-field">
                  <label htmlFor="add-zone">Zone</label>
                  <input
                    id="add-zone"
                    type="text"
                    name="zone"
                    value={form.zone}
                    onChange={handleFormChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="admin-form-field full">
                  <label htmlFor="add-password">Password <em>*</em></label>
                  <div className="admin-password-wrap">
                    <input
                      id="add-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="Minimum 6 characters"
                      className={formErrors.password ? "invalid" : ""}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      onClick={() => setShowPassword((s) => !s)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {formErrors.password && <span className="admin-field-error">{formErrors.password}</span>}
                </div>

                <div className="admin-form-field full">
                  <label>Role</label>
                  <div className="admin-role-chips" role="radiogroup" aria-label="Role">
                    {ROLE_OPTIONS.map((opt) => {
                      const meta = ROLE_STYLE[opt.key];
                      const ChipIcon = meta.icon;
                      const selected = form.role === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`admin-role-chip ${meta.tone}${selected ? " selected" : ""}`}
                          onClick={() => setForm((prev) => ({ ...prev, role: opt.key }))}
                        >
                          <ChipIcon size={13} strokeWidth={2.2} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {submitError && <div className="admin-form-alert">{submitError}</div>}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn cancel"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-modal-btn primary" disabled={submitting}>
                  <UserPlus size={14} strokeWidth={2} />
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {pendingDelete && (
        <div className="admin-modal-overlay" onClick={cancelDelete}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>

            <button className="admin-modal-close" onClick={cancelDelete}>
              <X size={16} strokeWidth={2} />
            </button>

            <div className="admin-modal-icon">
              <AlertTriangle size={22} strokeWidth={2} />
            </div>

            <h2>Remove this account?</h2>
            <p>
              You're about to permanently remove <strong>{pendingDelete.name}</strong>{" "}
              ({pendingDelete.email}) from the portal. This action can't be undone.
            </p>

            <div className="admin-modal-actions">
              <button className="admin-modal-btn cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="admin-modal-btn confirm" onClick={confirmDelete}>
                <Trash2 size={14} strokeWidth={2} />
                Remove Account
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminManagement;