import React, { useState } from "react";
import "./new_worker.css";

const Workers = () => {
  // Temporary worker data
  const [workers, setWorkers] = useState([
    {
      id: "WRK001",
      name: "Ravi Kumar",
      phone: "9876543210",
      email: "ravi@gmail.com",
      role: "Maintenance Worker",
      status: "Active",
      joinedDate: "12 Jan 2025",
      assignedWorks: 3,
    },
    {
      id: "WRK002",
      name: "Karthik S",
      phone: "9876543211",
      email: "karthik@gmail.com",
      role: "Maintenance Worker",
      status: "Active",
      joinedDate: "25 Feb 2025",
      assignedWorks: 2,
    },
    {
      id: "WRK003",
      name: "Manoj Kumar",
      phone: "9876543212",
      email: "manoj@gmail.com",
      role: "Maintenance Worker",
      status: "Active",
      joinedDate: "18 Mar 2025",
      assignedWorks: 4,
    },
    {
      id: "WRK004",
      name: "Suresh R",
      phone: "9876543213",
      email: "suresh@gmail.com",
      role: "Maintenance Worker",
      status: "Inactive",
      joinedDate: "05 Apr 2025",
      assignedWorks: 0,
    },
    {
      id: "WRK005",
      name: "Arun Prakash",
      phone: "9876543214",
      email: "arun@gmail.com",
      role: "Maintenance Worker",
      status: "Active",
      joinedDate: "22 May 2025",
      assignedWorks: 1,
    },
    {
      id: "WRK006",
      name: "Dinesh M",
      phone: "9876543215",
      email: "dinesh@gmail.com",
      role: "Maintenance Worker",
      status: "Inactive",
      joinedDate: "10 Jun 2025",
      assignedWorks: 0,
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showRemovePopup, setShowRemovePopup] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);

  // New worker form
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: "",
    email: "",
    role: "Maintenance Worker",
  });

  // ==============================
  // COUNTS
  // ==============================

  const totalWorkers = workers.length;

  const activeWorkers = workers.filter(
    (worker) => worker.status === "Active"
  ).length;

  const inactiveWorkers = workers.filter(
    (worker) => worker.status === "Inactive"
  ).length;


  // ==============================
  // FILTER WORKERS
  // ==============================

  const filteredWorkers = workers.filter((worker) => {

    const matchesSearch =
      worker.name.toLowerCase().includes(search.toLowerCase()) ||
      worker.id.toLowerCase().includes(search.toLowerCase()) ||
      worker.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      worker.status === statusFilter;

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

  const handleAddWorker = (e) => {
    e.preventDefault();

    if (
      !newWorker.name ||
      !newWorker.phone ||
      !newWorker.email
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const worker = {
      id: `WRK${String(workers.length + 1).padStart(3, "0")}`,
      name: newWorker.name,
      phone: newWorker.phone,
      email: newWorker.email,
      role: newWorker.role,
      status: "Active",
      joinedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      assignedWorks: 0,
    };

    setWorkers([...workers, worker]);

    setNewWorker({
      name: "",
      phone: "",
      email: "",
      role: "Maintenance Worker",
    });

    setShowAddPopup(false);

    alert("Worker added successfully!");
  };


  // ==============================
  // REMOVE WORKER
  // ==============================

  const handleRemoveWorker = () => {

    setWorkers(
      workers.filter(
        (worker) => worker.id !== selectedWorker.id
      )
    );

    setShowRemovePopup(false);
    setSelectedWorker(null);

    alert("Worker removed successfully!");
  };


  // ==============================
  // OPEN REMOVE POPUP
  // ==============================

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
          <h1>Workers</h1>

          <p>
            Manage maintenance workers and their availability
          </p>
        </div>

        <button
          className="add-worker-btn"
          onClick={() => setShowAddPopup(true)}
        >
          + Add Worker
        </button>

      </div>


      {/* =================================
          STATISTICS
      ================================= */}

      <div className="worker-stats">

        <div className="worker-stat-card">

          <div className="worker-stat-icon total">
            👥
          </div>

          <div>
            <span>Total Workers</span>
            <strong>{totalWorkers}</strong>
          </div>

        </div>


        <div className="worker-stat-card">

          <div className="worker-stat-icon active">
            ✓
          </div>

          <div>
            <span>Active Workers</span>
            <strong>{activeWorkers}</strong>
          </div>

        </div>


        <div className="worker-stat-card">

          <div className="worker-stat-icon inactive">
            ○
          </div>

          <div>
            <span>Inactive Workers</span>
            <strong>{inactiveWorkers}</strong>
          </div>

        </div>


        <div className="worker-stat-card">

          <div className="worker-stat-icon available">
            🔧
          </div>

          <div>
            <span>Available Now</span>

            <strong>
              {
                workers.filter(
                  (worker) =>
                    worker.status === "Active" &&
                    worker.assignedWorks === 0
                ).length
              }
            </strong>

          </div>

        </div>

      </div>


      {/* =================================
          FILTER SECTION
      ================================= */}

      <div className="worker-filters">

        <div className="worker-search">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search worker by name, ID or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Workers</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

      </div>


      {/* =================================
          WORKER TABLE
      ================================= */}

      <div className="workers-container">

        <div className="workers-table-wrapper">

          <table className="workers-table">

            <thead>

              <tr>

                <th>Worker</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned Works</th>
                <th>Joined Date</th>
                <th>Action</th>

              </tr>

            </thead>


            <tbody>

              {filteredWorkers.map((worker) => (

                <tr key={worker.id}>

                  {/* Worker */}

                  <td>

                    <div className="worker-profile">

                      <div className="worker-avatar">
                        {worker.name.charAt(0)}
                      </div>

                      <div>

                        <strong>
                          {worker.name}
                        </strong>

                        <span>
                          {worker.id}
                        </span>

                      </div>

                    </div>

                  </td>


                  {/* Contact */}

                  <td>

                    <div className="contact-details">

                      <span>
                        📞 {worker.phone}
                      </span>

                      <span>
                        ✉ {worker.email}
                      </span>

                    </div>

                  </td>


                  {/* Role */}

                  <td>
                    <span className="role-text">
                      {worker.role}
                    </span>
                  </td>


                  {/* Status */}

                  <td>

                    <span
                      className={`worker-status ${worker.status.toLowerCase()}`}
                    >

                      <span className="status-dot"></span>

                      {worker.status}

                    </span>

                  </td>


                  {/* Assigned Works */}

                  <td>

                    <span
                      className={`assigned-count ${
                        worker.assignedWorks > 0
                          ? "has-work"
                          : "no-work"
                      }`}
                    >
                      {worker.assignedWorks}
                    </span>

                  </td>


                  {/* Joined Date */}

                  <td>
                    {worker.joinedDate}
                  </td>


                  {/* Action */}

                  <td>

                    <button
                      className="remove-btn"
                      onClick={() =>
                        openRemovePopup(worker)
                      }
                    >
                      Remove
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>


          {filteredWorkers.length === 0 && (

            <div className="no-workers">

              <div className="no-worker-icon">
                👥
              </div>

              <h3>
                No workers found
              </h3>

              <p>
                Try changing your search or filter.
              </p>

            </div>

          )}

        </div>

      </div>


      {/* =================================
          ADD WORKER POPUP
      ================================= */}

      {showAddPopup && (

        <div
          className="worker-modal-overlay"
          onClick={() => setShowAddPopup(false)}
        >

          <div
            className="worker-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="worker-modal-header">

              <div>

                <span className="modal-label">
                  WORKER MANAGEMENT
                </span>

                <h2>
                  Add New Worker
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowAddPopup(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleAddWorker}
              className="worker-form"
            >

              {/* Name */}

              <div className="form-group">

                <label>
                  Full Name *
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter worker name"
                  value={newWorker.name}
                  onChange={handleInputChange}
                />

              </div>


              {/* Phone */}

              <div className="form-group">

                <label>
                  Phone Number *
                </label>

                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={newWorker.phone}
                  onChange={handleInputChange}
                />

              </div>


              {/* Email */}

              <div className="form-group">

                <label>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={newWorker.email}
                  onChange={handleInputChange}
                />

              </div>


              {/* Role */}

              <div className="form-group">

                <label>
                  Role
                </label>

                <select
                  name="role"
                  value={newWorker.role}
                  onChange={handleInputChange}
                >

                  <option>
                    Maintenance Worker
                  </option>

                  <option>
                    Senior Maintenance Worker
                  </option>

                  <option>
                    Field Supervisor
                  </option>

                </select>

              </div>


              {/* Footer */}

              <div className="worker-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    setShowAddPopup(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-add-btn"
                >
                  Add Worker
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

        <div
          className="worker-modal-overlay"
          onClick={() => setShowRemovePopup(false)}
        >

          <div
            className="remove-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="remove-icon">
              !
            </div>

            <h2>
              Remove Worker?
            </h2>

            <p>

              Are you sure you want to remove

              <strong>
                {" "}{selectedWorker.name}
              </strong>

              {" "}from the worker list?

            </p>

            {selectedWorker.assignedWorks > 0 && (

              <div className="remove-warning">

                ⚠ This worker currently has{" "}
                <strong>
                  {selectedWorker.assignedWorks}
                </strong>{" "}
                assigned work(s).

              </div>

            )}


            <div className="remove-actions">

              <button
                className="cancel-remove-btn"
                onClick={() =>
                  setShowRemovePopup(false)
                }
              >
                Cancel
              </button>

              <button
                className="confirm-remove-btn"
                onClick={handleRemoveWorker}
              >
                Remove Worker
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Workers;