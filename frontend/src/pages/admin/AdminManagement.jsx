import { useState, useEffect, useRef } from "react";
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
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getUserDeletionDependencies,
  createUser,
  getCityManagerMappings,
  searchTamilNaduPlaces,
  createCityManagerArea,
  updateCityManager,
  getAdminRoutingComplaints,
  routeComplaintToManager,
} from "../../services/adminApi";
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
  password: "",
  role: "CITIZEN",
  manager_id: "",
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
  const [cityMappings, setCityMappings] = useState([]);
  const [mappingError, setMappingError] = useState("");
  const [savingCityId, setSavingCityId] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [placeSearchError, setPlaceSearchError] = useState("");
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [newAreaType, setNewAreaType] = useState("DISTRICT");
  const [newAreaParent, setNewAreaParent] = useState("");
  const [creatingArea, setCreatingArea] = useState(false);
  const [routingComplaints, setRoutingComplaints] = useState([]);
  const [routingSelections, setRoutingSelections] = useState({});
  const [routingError, setRoutingError] = useState("");
  const [savingComplaintId, setSavingComplaintId] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [pendingDelete, setPendingDelete] = useState(null);
  const deletionCheckRef = useRef(0);
  const [deletionDependencies, setDeletionDependencies] = useState(null);
  const [deletionDependencyError, setDeletionDependencyError] = useState("");
  const [loadingDeletionDependencies, setLoadingDeletionDependencies] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // ---- Add user modal state ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllUsers()
      .then((response) => {
        if (!cancelled) setUsers(response.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getCityManagerMappings()
      .then((response) => {
        if (!cancelled) {
          setCityMappings(response.areas || []);
          setMappingError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMappingError(err.message || "Failed to load city manager mappings.");
        }
      });
    getAdminRoutingComplaints()
      .then((response) => {
        if (!cancelled) setRoutingComplaints(response.complaints || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setRoutingError(err.message || "Failed to load complaints needing routing.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = placeSearchQuery.trim();
    if (query.length < 2) {
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setSearchingPlaces(true);
      setPlaceSearchError("");
      try {
        const response = await searchTamilNaduPlaces(
          query,
          newAreaType,
          newAreaParent
            ? cityMappings.find((area) => area.id === newAreaParent)?.name
            : ""
        );
        if (!cancelled) setPlaceSearchResults(response.places || []);
      } catch (err) {
        if (!cancelled) {
          setPlaceSearchResults([]);
          setPlaceSearchError(err.message || "Place search failed.");
        }
      } finally {
        if (!cancelled) setSearchingPlaces(false);
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [placeSearchQuery, newAreaType, newAreaParent, cityMappings]);

  const handleRouteComplaint = async (complaintId) => {
    const managerId = routingSelections[complaintId];
    if (!managerId) {
      setRoutingError("Select an active manager before routing the complaint.");
      return;
    }

    setSavingComplaintId(complaintId);
    setRoutingError("");
    try {
      await routeComplaintToManager(complaintId, managerId);
      setRoutingComplaints((current) =>
        current.filter((complaint) => complaint.id !== complaintId)
      );
      setRoutingSelections((current) => {
        const next = { ...current };
        delete next[complaintId];
        return next;
      });
    } catch (err) {
      setRoutingError(err.message || "Failed to route complaint.");
    } finally {
      setSavingComplaintId("");
    }
  };

  const handleCityManagerChange = async (area, managerId) => {
    setSavingCityId(area.id);
    setMappingError("");
    try {
      await updateCityManager(area.id, managerId || null);
      const manager = users.find((user) => user._id === managerId) || null;
      setCityMappings((current) =>
        current.map((item) =>
          item.id === area.id
            ? {
                ...item,
                manager: manager
                  ? { id: manager._id, name: manager.name, email: manager.email }
                  : null,
              }
            : item
        )
      );
    } catch (err) {
      setMappingError(err.message || "Failed to update city manager mapping.");
    } finally {
      setSavingCityId("");
    }
  };

  const handleCreateArea = async (event) => {
    event.preventDefault();
    if (!newAreaName) {
      setMappingError("Choose a location from the search results before adding it.");
      return;
    }
    if (newAreaType !== "DISTRICT" && !newAreaParent) {
      setMappingError("Choose a parent district or city before adding this area.");
      return;
    }
    setMappingError("");
    setCreatingArea(true);
    try {
      const response = await createCityManagerArea({
        name: newAreaName,
        type: newAreaType,
        parent_id: newAreaParent || null,
      });
      const parentArea = cityMappings.find((area) => area.id === newAreaParent);
      setCityMappings((current) =>
        [...current, { ...response.area, parent: parentArea?.name || null }]
          .sort((first, second) => first.name.localeCompare(second.name))
      );
      setNewAreaName("");
      setPlaceSearchQuery("");
      setPlaceSearchResults([]);
      if (newAreaType === "DISTRICT") {
        setNewAreaParent(response.area.id);
        setNewAreaType("CITY");
      } else if (newAreaType === "CITY") {
        setNewAreaParent(response.area.id);
        setNewAreaType("WARD");
      }
    } catch (err) {
      setMappingError(err.message || "Failed to create area mapping.");
    } finally {
      setCreatingArea(false);
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

  const requestDelete = async (user) => {
    const requestId = ++deletionCheckRef.current;
    setPendingDelete(user);
    setDeletionDependencies(null);
    setDeletionDependencyError("");
    setLoadingDeletionDependencies(true);
    try {
      const response = await getUserDeletionDependencies(user._id);
      if (requestId === deletionCheckRef.current) {
        setDeletionDependencies(response.dependencies);
      }
    } catch (err) {
      if (requestId === deletionCheckRef.current) {
        setDeletionDependencyError(err.message || "Unable to check account dependencies.");
      }
    } finally {
      if (requestId === deletionCheckRef.current) {
        setLoadingDeletionDependencies(false);
      }
    }
  };

  const cancelDelete = () => {
    if (deletingUser) return;
    deletionCheckRef.current += 1;
    setPendingDelete(null);
    setDeletionDependencies(null);
    setDeletionDependencyError("");
    setLoadingDeletionDependencies(false);
  };

  const confirmDelete = async () => {
    if (
      !pendingDelete ||
      loadingDeletionDependencies ||
      deletionDependencyError ||
      deletionDependencies?.activeAssignments?.length ||
      deletionDependencies?.managedWorkers ||
      deletionDependencies?.mappedAreas?.length
    ) return;
    setDeletingUser(true);
    let deleted = false;
    try {
      await deleteUser(pendingDelete._id);
      setUsers((currentUsers) => currentUsers.filter((user) => user._id !== pendingDelete._id));
      deleted = true;
    } catch (err) {
      const conflictDependencies = err.cause?.response?.data?.dependencies;
      if (conflictDependencies) {
        setDeletionDependencies(conflictDependencies);
        setDeletionDependencyError("");
      } else {
        setDeletionDependencyError(err.message || "Failed to delete user.");
      }
    } finally {
      setDeletingUser(false);
      if (deleted) {
        setPendingDelete(null);
        setDeletionDependencies(null);
      }
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
    if (form.role === "WORKER" && !form.manager_id) {
      errs.manager_id = "Select the manager whose team this worker will join";
    }
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
        password: form.password,
        role: form.role,
        ...(form.role === "WORKER" ? { manager_id: form.manager_id } : {}),
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

      <section className="city-manager-panel">
        <div>
          <h2>City / Area Manager Mapping</h2>
          <p>
            Search public place data to build a district-to-city-to-locality hierarchy, then assign
            managers to the specific areas they serve.
          </p>
        </div>
        {mappingError && <p className="city-manager-error">{mappingError}</p>}
        <form className="area-mapping-create-form" onSubmit={handleCreateArea}>
          <div className="area-place-search-field">
            <label htmlFor="area-place-search">Search Tamil Nadu locations</label>
            <input
              id="area-place-search"
              value={placeSearchQuery}
              onChange={(event) => {
                setPlaceSearchQuery(event.target.value);
                setNewAreaName("");
                setPlaceSearchResults([]);
                setPlaceSearchError("");
                setSearchingPlaces(false);
              }}
              placeholder="e.g. Coimbatore or Ukkadam"
              maxLength={100}
            />
            {newAreaName && (
              <span className="selected-area-name">Selected: {newAreaName}</span>
            )}
            {searchingPlaces && <span className="area-place-search-note">Searching places...</span>}
            {placeSearchError && (
              <span className="area-place-search-error">{placeSearchError}</span>
            )}
            {placeSearchResults.length > 0 && (
              <div className="area-place-search-results">
                {placeSearchResults.map((place) => (
                  <button
                    key={`${place.osmType}-${place.osmId}-${place.name}`}
                    type="button"
                    onClick={() => {
                      setNewAreaName(place.name);
                      setPlaceSearchQuery("");
                      setPlaceSearchResults([]);
                    }}
                  >
                    <strong>{place.name}</strong>
                    <small>{place.displayName}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <label>
            Area level
            <select
              value={newAreaType}
              onChange={(event) => {
                const type = event.target.value;
                setNewAreaType(type);
                setNewAreaName("");
                setPlaceSearchQuery("");
                setPlaceSearchResults([]);
                setPlaceSearchError("");
                setSearchingPlaces(false);
                if (type === "DISTRICT") setNewAreaParent("");
              }}
            >
              <option value="DISTRICT">District</option>
              <option value="CITY">City</option>
              <option value="WARD">Locality / Ward</option>
              <option value="ZONE">Zone</option>
            </select>
          </label>
          <label>
            Parent district / city
            <select
              value={newAreaParent}
              disabled={newAreaType === "DISTRICT"}
              required={newAreaType !== "DISTRICT"}
              onChange={(event) => {
                setNewAreaParent(event.target.value);
                setNewAreaName("");
                setPlaceSearchQuery("");
                setPlaceSearchResults([]);
                setPlaceSearchError("");
                setSearchingPlaces(false);
              }}
            >
              <option value="">Select parent area</option>
              {cityMappings
                .filter((area) => ["CITY", "DISTRICT", "ZONE"].includes(area.type))
                .map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.type})
                  </option>
                ))}
            </select>
          </label>
          <button type="submit" disabled={creatingArea || !newAreaName}>
            {creatingArea ? "Adding..." : "Add area"}
          </button>
        </form>
        <p className="area-hierarchy-hint">
          Add a district first, then select it as the parent to search its cities. Add a city next
          to search its localities. Workers remain on their manager&apos;s team.
        </p>
        {cityMappings.length === 0 ? (
          <p className="city-manager-empty">
            No cities or localities are configured yet. Add one above to create manager routing.
          </p>
        ) : (
          <div className="city-manager-table-wrap">
            <table className="city-manager-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Level</th>
                  <th>Parent</th>
                  <th>Manager</th>
                </tr>
              </thead>
              <tbody>
                {cityMappings.map((area) => (
                  <tr key={area.id}>
                    <td>{area.name}</td>
                    <td>{area.type}</td>
                    <td>{area.parent || "—"}</td>
                    <td>
                      <select
                        value={area.manager?.id || ""}
                        disabled={savingCityId === area.id}
                        onChange={(event) =>
                          handleCityManagerChange(area, event.target.value)
                        }
                        aria-label={`Manager for ${area.name}`}
                      >
                        <option value="">Use parent area's manager</option>
                        {users
                          .filter(
                            (user) =>
                              user.role === "MANAGER" && user.status === "ACTIVE"
                          )
                          .map((manager) => (
                            <option key={manager._id} value={manager._id}>
                              {manager.name} ({manager.email})
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="city-manager-panel routing-queue-panel">
        <div>
          <h2>Complaints Awaiting Admin Routing</h2>
          <p>
            Submissions received before area boundaries are configured appear here.
            Select an active manager to place each complaint in their work queue.
          </p>
        </div>
        {routingError && <p className="city-manager-error">{routingError}</p>}
        {routingComplaints.length === 0 ? (
          <p className="city-manager-empty">
            No complaints are waiting for administrator routing.
          </p>
        ) : (
          <div className="routing-queue-list">
            {routingComplaints.map((complaint) => (
              <article className="routing-queue-item" key={complaint.id}>
                <div className="routing-queue-details">
                  <strong>{complaint.title} · {complaint.code}</strong>
                  <span>{complaint.address}</span>
                  <span>
                    {[complaint.locality, complaint.city, complaint.state]
                      .filter(Boolean)
                      .join(", ") || "Location area not resolved"}
                  </span>
                  <span>
                    {complaint.latitude}, {complaint.longitude}
                    {complaint.area ? ` · ${complaint.area}` : ""}
                  </span>
                  {complaint.navigationUrl && (
                    <a href={complaint.navigationUrl} target="_blank" rel="noreferrer">
                      Open exact pin in Maps
                    </a>
                  )}
                </div>
                <div className="routing-queue-actions">
                  <select
                    value={routingSelections[complaint.id] || ""}
                    onChange={(event) =>
                      setRoutingSelections((current) => ({
                        ...current,
                        [complaint.id]: event.target.value,
                      }))
                    }
                    aria-label={`Manager for complaint ${complaint.code}`}
                  >
                    <option value="">Select manager</option>
                    {users
                      .filter(
                        (user) =>
                          user.role === "MANAGER" && user.status === "ACTIVE"
                      )
                      .map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={savingComplaintId === complaint.id}
                    onClick={() => handleRouteComplaint(complaint.id)}
                  >
                    {savingComplaintId === complaint.id ? "Routing..." : "Route"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              role: opt.key,
                              manager_id: opt.key === "WORKER" ? prev.manager_id : "",
                            }))
                          }
                        >
                          <ChipIcon size={13} strokeWidth={2.2} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.role === "WORKER" && (
                  <div className="admin-form-field full">
                    <label htmlFor="add-worker-manager">Manager team <em>*</em></label>
                    <select
                      id="add-worker-manager"
                      name="manager_id"
                      value={form.manager_id}
                      onChange={handleFormChange}
                      className={formErrors.manager_id ? "invalid" : ""}
                    >
                      <option value="">Select an active manager</option>
                      {users
                        .filter(
                          (user) => user.role === "MANAGER" && user.status === "ACTIVE"
                        )
                        .map((manager) => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name} ({manager.email})
                          </option>
                        ))}
                    </select>
                    {formErrors.manager_id && (
                      <span className="admin-field-error">{formErrors.manager_id}</span>
                    )}
                  </div>
                )}

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

            <button className="admin-modal-close" onClick={cancelDelete} disabled={deletingUser}>
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

            {loadingDeletionDependencies && (
              <p className="deletion-dependency-note">Checking active work and mappings...</p>
            )}
            {deletionDependencyError && (
              <p className="deletion-dependency-error">{deletionDependencyError}</p>
            )}
            {deletionDependencies && (
              <div className="deletion-dependency-list">
                {deletionDependencies.activeAssignments?.length > 0 && (
                  <>
                    <strong>This account is linked to active work:</strong>
                    {deletionDependencies.activeAssignments.map((assignment, index) => (
                      <div key={assignment._id || `${assignment.complaint_id?._id}-${index}`}>
                        {assignment.worker_id?.employee_code
                          ? `${assignment.worker_id.employee_code}: `
                          : ""}
                        {assignment.complaint_id?.complaint_code || "Complaint"} —{" "}
                        {assignment.complaint_id?.title || "Untitled complaint"} (
                        {assignment.status})
                      </div>
                    ))}
                  </>
                )}
                {deletionDependencies.managedWorkers > 0 && (
                  <div>Manages {deletionDependencies.managedWorkers} worker(s).</div>
                )}
                {deletionDependencies.mappedAreas?.length > 0 && (
                  <div>
                    Manager for: {deletionDependencies.mappedAreas.map((area) => area.name).join(", ")}.
                  </div>
                )}
                {!deletionDependencies.activeAssignments?.length &&
                  !deletionDependencies.managedWorkers &&
                  !deletionDependencies.mappedAreas?.length && (
                    <span>No active work or manager mappings found.</span>
                  )}
                {(deletionDependencies.activeAssignments?.length > 0 ||
                  deletionDependencies.managedWorkers > 0 ||
                  deletionDependencies.mappedAreas?.length > 0) && (
                  <span>Reassign or resolve these dependencies before deleting this account.</span>
                )}
              </div>
            )}

            <div className="admin-modal-actions">
              <button
                className="admin-modal-btn cancel"
                onClick={cancelDelete}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                className="admin-modal-btn confirm"
                onClick={confirmDelete}
                disabled={
                  loadingDeletionDependencies ||
                  Boolean(deletionDependencyError) ||
                  !deletionDependencies ||
                  Boolean(deletionDependencies.activeAssignments?.length) ||
                  Boolean(deletionDependencies.managedWorkers) ||
                  Boolean(deletionDependencies.mappedAreas?.length) ||
                  deletingUser
                }
              >
                <Trash2 size={14} strokeWidth={2} />
                {deletingUser ? "Removing..." : "Remove Account"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminManagement;