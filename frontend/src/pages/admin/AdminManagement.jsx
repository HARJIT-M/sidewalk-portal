import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  UserCog,
  Wrench,
  UserCheck,
  UserX,
  Trash2,
  ShieldOff,
  ShieldCheck,
  SlidersHorizontal,
  AlertTriangle,
  X,
} from "lucide-react";
import { getAllUsers, updateUserStatus, deleteUser } from "../../services/adminApi";
import "./adminmanagement.css";

const ROLE_STYLE = {
  CITIZEN: { tone: "indigo", icon: Users },
  WORKER: { tone: "green", icon: Wrench },
  MANAGER: { tone: "amber", icon: UserCog },
  ADMIN: { tone: "violet", icon: ShieldCheck },
};

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [pendingDelete, setPendingDelete] = useState(null);

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
