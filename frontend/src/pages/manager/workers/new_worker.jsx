import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  X,
  Inbox,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
  Trash2,
  Calendar,
  TriangleAlert,
  HardHat,
  TrendingUp,
} from "lucide-react";
import {
  getAllWorkers,
  addWorker,
  updateWorkerStatus,
  deleteWorker,
} from "../../../services/managerApi";
import "./new_worker.css";

const Workers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showRemovePopup, setShowRemovePopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingWorker, setRemovingWorker] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);

  // New worker form
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
  });

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getAllWorkers();
      if (res && res.success) {
        setWorkers(res.workers || []);
      }
    } catch (err) {
      console.error("Error loading workers:", err);
      setErrorMsg(err.message || "Failed to load workers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  // close popups with the Escape key
  useEffect(() => {
    if (!showAddPopup && !showRemovePopup) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowAddPopup(false);
        if (!removingWorker) setShowRemovePopup(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddPopup, showRemovePopup, removingWorker]);

  // ==============================
  // COUNTS
  // ==============================
  const totalWorkers = workers.length;

  const activeWorkers = workers.filter(
    (worker) => worker.status === "Active" || worker.availabilityStatus === "ACTIVE"
  ).length;

  const inactiveWorkers = workers.filter(
    (worker) => worker.status === "Inactive" || worker.availabilityStatus === "INACTIVE"
  ).length;

  // ==============================
  // FILTER WORKERS
  // ==============================
  const filteredWorkers = workers.filter((worker) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (worker.name && worker.name.toLowerCase().includes(q)) ||
      (worker.id && worker.id.toLowerCase().includes(q)) ||
      (worker.email && worker.email.toLowerCase().includes(q)) ||
      (worker.phone && worker.phone.includes(q));

    const matchesStatus =
      statusFilter === "All" ||
      worker.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // ==============================
  // INPUT CHANGE
  // ==============================
  const handleInputChange = (e) => {
    setNewWorker({
      ...newWorker,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // ADD WORKER
  // ==============================
  const handleAddWorker = async (e) => {
    e.preventDefault();

    if (!newWorker.name || !newWorker.phone || !newWorker.email) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await addWorker(newWorker);
      if (res && res.success) {
        setSuccessMsg("Worker added successfully! Default credentials created.");
        setTimeout(() => setSuccessMsg(""), 3000);
        setShowAddPopup(false);
        setNewWorker({
          name: "",
          phone: "",
          email: "",
          role: "",
        });
        await loadWorkers();
      }
    } catch (err) {
      console.error("Error adding worker:", err);
      alert(err.message || "Failed to add worker.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================
  // TOGGLE STATUS
  // ==============================
  const handleToggleStatus = async (worker) => {
    const newStatus = worker.status === "Active" ? "INACTIVE" : "ACTIVE";
    try {
      await updateWorkerStatus(worker.id || worker.mongoId, newStatus);
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === worker.id
            ? { ...w, status: newStatus === "ACTIVE" ? "Active" : "Inactive" }
            : w
        )
      );
    } catch (err) {
      console.error("Error updating worker status:", err);
      alert(err.message || "Failed to update status.");
    }
  };

  // ==============================
  // REMOVE WORKER
  // ==============================
  const handleRemoveWorker = async () => {
    if (!selectedWorker || selectedWorker.activeAssignments?.length || removingWorker) return;
    setRemovingWorker(true);
    try {
      await deleteWorker(selectedWorker.id || selectedWorker.mongoId);
      setWorkers(workers.filter((worker) => worker.id !== selectedWorker.id));
      setShowRemovePopup(false);
      setSelectedWorker(null);
      setSuccessMsg("Worker deactivated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error removing worker:", err);
      alert(err.message || "Failed to remove worker.");
    } finally {
      setRemovingWorker(false);
    }
  };

  const openRemovePopup = (worker) => {
    setSelectedWorker(worker);
    setShowRemovePopup(true);
  };

  const isWorkerActive = (worker) =>
    worker.status === "Active" || worker.availabilityStatus === "ACTIVE";

  const statCards = [
    { label: "Total Workers", value: totalWorkers, icon: Users, tone: "total" },
    { label: "Active & Ready", value: activeWorkers, icon: UserCheck, tone: "active" },
    { label: "Inactive / On Leave", value: inactiveWorkers, icon: UserX, tone: "inactive" },
  ];

  return (
    <div className="mw-page">
      {/* =================================
          HEADER
      ================================= */}
      <section className="mw-hero">
        <div className="mw-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="mw-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="mw-hero-text">
          <span className="mw-hero-tag">
            <HardHat size={14} strokeWidth={2.4} /> Manager Console
          </span>
          <h1>Worker Management</h1>
          <p>Supervise maintenance crew, workloads, and real-time availability</p>
        </div>

        <button
          className="mw-hero-btn"
          style={{ marginRight: "10px", background: "rgba(255, 255, 255, 0.18)", border: "1px solid rgba(255, 255, 255, 0.35)" }}
          onClick={() => navigate("/productivity")}
        >
          <TrendingUp size={18} strokeWidth={2.4} />
          Productivity Hub
        </button>

        <button
          className="mw-hero-btn"
          onClick={() => setShowAddPopup(true)}
        >
          <UserPlus size={18} strokeWidth={2.4} />
          Add Worker
        </button>
      </section>

      {successMsg && (
        <div className="mw-alert success" role="status">
          <CheckCircle2 size={18} strokeWidth={2.2} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mw-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          {errorMsg}
        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}
      <section className="mw-stats">
        {statCards.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`mw-stat mw-stat-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="mw-stat-icon">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="mw-stat-text">
              <strong>{loading ? "..." : value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* =================================
          CONTROLS / FILTERS
      ================================= */}
      <div className="mw-filters">
        <div className="mw-search">
          <Search size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search by worker ID, name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="mw-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <select
          className="mw-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button className="mw-refresh" onClick={loadWorkers} disabled={loading}>
          <RefreshCw
            size={14}
            strokeWidth={2.5}
            className={loading ? "mw-spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =================================
          WORKERS LIST
      ================================= */}
      <section className="mw-list">
        {loading ? (
          <div className="mw-state">
            <div className="mw-loader" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
            </div>
            <p>Loading workers from database...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="mw-state">
            <Inbox size={36} strokeWidth={1.8} />
            <h3>No Workers Found</h3>
            <p>No workers match your filter criteria.</p>
          </div>
        ) : (
          <>
            {/* ---- DESKTOP / TABLET TABLE ---- */}
            <div className="mw-table-wrap">
              <table className="mw-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Contact</th>
                    <th>Team / Role</th>
                    <th>Status</th>
                    <th>Tasks</th>
                    <th>Joined Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWorkers.map((worker) => {
                    const isActive = isWorkerActive(worker);
                    return (
                      <tr key={worker.id || worker.mongoId}>
                        <td>
                          <div className="mw-profile">
                            <div className="mw-avatar">
                              {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
                            </div>
                            <div>
                              <strong>{worker.name}</strong>
                              <span>{worker.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="mw-contact">
                            <span>
                              <Phone size={13} strokeWidth={2} />
                              {worker.phone || "—"}
                            </span>
                            <span>
                              <Mail size={13} strokeWidth={2} />
                              {worker.email || "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="mw-role">
                            {worker.team || "Assigned Team"}
                            <small>{worker.role}</small>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(worker)}
                            title="Click to toggle status"
                            className={`mw-status ${isActive ? "active" : "inactive"}`}
                          >
                            <span className="mw-dot"></span>
                            {isActive ? "Active" : "Inactive"}
                            <ArrowLeftRight size={12} strokeWidth={2.4} />
                          </button>
                        </td>

                        <td>
                          <span
                            className={`mw-count ${
                              (worker.assignedWorks || 0) > 0 ? "has-work" : "no-work"
                            }`}
                          >
                            {worker.assignedWorks || 0}
                          </span>
                        </td>

                        <td>{worker.joinedDate || "—"}</td>

                        <td>
                          <button
                            className="mw-remove"
                            onClick={() => openRemovePopup(worker)}
                          >
                            <Trash2 size={13} strokeWidth={2.3} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---- MOBILE CARD LIST ---- */}
            <div className="mw-cards">
              {filteredWorkers.map((worker) => {
                const isActive = isWorkerActive(worker);
                return (
                  <div className="mw-card" key={worker.id || worker.mongoId}>
                    <div className="mw-card-top">
                      <div className="mw-profile">
                        <div className="mw-avatar">
                          {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
                        </div>
                        <div>
                          <strong>{worker.name}</strong>
                          <span>{worker.id}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(worker)}
                        className={`mw-status ${isActive ? "active" : "inactive"}`}
                      >
                        <span className="mw-dot"></span>
                        {isActive ? "Active" : "Inactive"}
                        <ArrowLeftRight size={12} strokeWidth={2.4} />
                      </button>
                    </div>

                    <div className="mw-contact">
                      <span>
                        <Phone size={13} strokeWidth={2} />
                        {worker.phone || "—"}
                      </span>
                      <span>
                        <Mail size={13} strokeWidth={2} />
                        {worker.email || "—"}
                      </span>
                      <span>
                        <Calendar size={13} strokeWidth={2} />
                        {worker.joinedDate || "—"}
                      </span>
                    </div>

                    <div className="mw-card-bottom">
                      <div className="mw-role">
                        {worker.team || "Assigned Team"}
                        <small>{worker.role}</small>
                      </div>

                      <span
                        className={`mw-count ${
                          (worker.assignedWorks || 0) > 0 ? "has-work" : "no-work"
                        }`}
                        title="Assigned tasks"
                      >
                        {worker.assignedWorks || 0}
                      </span>

                      <button
                        className="mw-remove"
                        onClick={() => openRemovePopup(worker)}
                      >
                        <Trash2 size={13} strokeWidth={2.3} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* =================================
          ADD WORKER POPUP
      ================================= */}
      {showAddPopup && (
        <div className="mw-overlay" onClick={() => setShowAddPopup(false)}>
          <div className="mw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mw-modal-head">
              <div>
                <span className="mw-modal-label">NEW WORKER</span>
                <h2>Add New Field Worker</h2>
              </div>
              <button
                className="mw-close"
                onClick={() => setShowAddPopup(false)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="mw-form">
              <div className="mw-form-row">
                <div className="mw-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Suresh Kumar"
                    value={newWorker.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mw-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={newWorker.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="mw-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. suresh@example.com"
                  value={newWorker.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mw-modal-footer">
                <button
                  type="button"
                  className="mw-cancel"
                  onClick={() => setShowAddPopup(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mw-save"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================
          REMOVE WORKER POPUP
      ================================= */}
      {showRemovePopup && selectedWorker && (
        <div className="mw-overlay" onClick={() => setShowRemovePopup(false)}>
          <div className="mw-remove-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mw-remove-icon">
              <TriangleAlert size={26} strokeWidth={2.3} />
            </div>
            <h2>Remove Field Worker</h2>

            <p>
              Are you sure you want to remove worker{" "}
              <strong>{selectedWorker.name}</strong> ({selectedWorker.id})?
            </p>

            {selectedWorker.activeAssignments?.length > 0 ? (
              <div className="mw-warning">
                <strong>This worker is actively assigned to work:</strong>
                <ul>
                  {selectedWorker.activeAssignments.map((assignment) => (
                    <li key={assignment.id}>
                      {assignment.complaintCode} — {assignment.complaintTitle} ({assignment.status})
                    </li>
                  ))}
                </ul>
                Reassign or complete these tasks before removing the worker.
              </div>
            ) : (
              <div className="mw-warning mw-warning-ok">
                This worker has no active assignments and can be removed from the roster.
              </div>
            )}

            <div className="mw-remove-actions">
              <button
                className="mw-cancel"
                onClick={() => setShowRemovePopup(false)}
                disabled={removingWorker}
              >
                Cancel
              </button>

              <button
                className="mw-danger"
                onClick={handleRemoveWorker}
                disabled={
                  removingWorker || Boolean(selectedWorker.activeAssignments?.length)
                }
              >
                {removingWorker ? "Removing..." : "Remove Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;