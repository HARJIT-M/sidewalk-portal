import React, { useState, useEffect } from "react";
import {
  getAllWorkers,
  addWorker,
  updateWorkerStatus,
  deleteWorker,
} from "../../../services/managerApi";
import "./new_worker.css";

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showRemovePopup, setShowRemovePopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);

  // New worker form
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: "",
    email: "",
    role: "Maintenance Worker",
    zone: "Central Municipal Zone",
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
          role: "Maintenance Worker",
          zone: "Central Municipal Zone",
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
    if (!selectedWorker) return;
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
    }
  };

  const openRemovePopup = (worker) => {
    setSelectedWorker(worker);
    setShowRemovePopup(true);
  };

  return (
    <div className="workers-page">
      {/* =================================
          HEADER
      ================================= */}
      <div className="workers-header">
        <div>
          <h1>Worker Management</h1>
          <p>Supervise maintenance crew, workloads, and real-time availability</p>
        </div>

        <button
          className="add-worker-btn"
          onClick={() => setShowAddPopup(true)}
        >
          + Add Worker
        </button>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: "#f0fdf4",
          color: "#166534",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #bbf7d0"
        }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #fecaca"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}
      <div className="worker-stats">
        <div className="worker-stat-card">
          <div className="worker-stat-icon total">👥</div>
          <div>
            <span>Total Workers</span>
            <strong>{loading ? "..." : totalWorkers}</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon active">🟢</div>
          <div>
            <span>Active & Ready</span>
            <strong>{loading ? "..." : activeWorkers}</strong>
          </div>
        </div>

        <div className="worker-stat-card">
          <div className="worker-stat-icon inactive">🔴</div>
          <div>
            <span>Inactive / On Leave</span>
            <strong>{loading ? "..." : inactiveWorkers}</strong>
          </div>
        </div>
      </div>

      {/* =================================
          CONTROLS / FILTERS
      ================================= */}
      <div className="worker-controls">
        <div className="worker-search">
          <input
            type="text"
            placeholder="Search by worker ID, name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button
          onClick={loadWorkers}
          style={{
            padding: "10px 18px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px"
          }}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* =================================
          WORKER TABLE
      ================================= */}
      <div className="worker-table-container">
        <table className="worker-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Zone / Role</th>
              <th>Status</th>
              <th>Assigned Tasks</th>
              <th>Joined Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  Loading workers from database...
                </td>
              </tr>
            ) : filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  No workers match your filter.
                </td>
              </tr>
            ) : (
              filteredWorkers.map((worker) => (
                <tr key={worker.id || worker.mongoId}>
                  <td>
                    <span className="worker-id-badge">{worker.id}</span>
                  </td>

                  <td>
                    <strong>{worker.name}</strong>
                  </td>

                  <td>{worker.phone || "—"}</td>

                  <td>{worker.email || "—"}</td>

                  <td>{worker.zone || worker.role}</td>

                  <td>
                    <span
                      onClick={() => handleToggleStatus(worker)}
                      style={{ cursor: "pointer" }}
                      title="Click to toggle status"
                      className={`status-pill ${
                        worker.status === "Active" ? "active" : "inactive"
                      }`}
                    >
                      {worker.status} ⇄
                    </span>
                  </td>

                  <td>
                    <strong>{worker.assignedWorks || 0} active</strong>
                  </td>

                  <td>{worker.joinedDate}</td>

                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => openRemovePopup(worker)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =================================
          ADD WORKER POPUP
      ================================= */}
      {showAddPopup && (
        <div className="worker-modal-overlay" onClick={() => setShowAddPopup(false)}>
          <div className="worker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="worker-modal-header">
              <h2>Add New Field Worker</h2>
              <button
                className="worker-modal-close"
                onClick={() => setShowAddPopup(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="worker-form">
              <div className="worker-form-group">
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

              <div className="worker-form-group">
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

              <div className="worker-form-group">
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

              <div className="worker-form-group">
                <label>Assigned Zone</label>
                <input
                  type="text"
                  name="zone"
                  placeholder="e.g. Zone 2 - Gandhipuram Central"
                  value={newWorker.zone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="worker-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddPopup(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="confirm-btn"
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
        <div className="worker-modal-overlay" onClick={() => setShowRemovePopup(false)}>
          <div className="worker-modal remove-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Remove Field Worker</h2>

            <p>
              Are you sure you want to deactivate worker{" "}
              <strong>{selectedWorker.name}</strong> ({selectedWorker.id})?
            </p>

            <div className="worker-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowRemovePopup(false)}
              >
                Cancel
              </button>

              <button
                className="delete-confirm-btn"
                onClick={handleRemoveWorker}
              >
                Deactivate Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;