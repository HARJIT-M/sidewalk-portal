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
  AlertCircle,
  Eye,
  EyeOff,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Navigation,
  ExternalLink,
  MapPin,
  Inbox,
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

const PAGE_SIZE_OPTIONS = [5, 10, 20];

// builds the numbered buttons for the pager: 1 … 4 5 6 … 12
const getPageItems = (total, current) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("...");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < total - 1) items.push("...");
  items.push(total);
  return items;
};

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

  // ---- pagination ----
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  // close popups with the Escape key
  useEffect(() => {
    if (!showAddModal && !pendingDelete) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showAddModal && !submitting) setShowAddModal(false);
      if (pendingDelete && !deletingUser) {
        deletionCheckRef.current += 1;
        setPendingDelete(null);
        setDeletionDependencies(null);
        setDeletionDependencyError("");
        setLoadingDeletionDependencies(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddModal, pendingDelete, submitting, deletingUser]);

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
      const res = await createUser(payload);
      // API returns the newly created user (without password)
      setUsers((currentUsers) => [res.data, ...currentUsers]);
      setShowAddModal(false);
      setPage(1);
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to create user";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="am-page am-center">
        <div className="am-loader" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>
        <p>Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="am-page am-center">
        <div className="am-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          Error: {error}
        </div>
      </div>
    );
  }


  // ================= FILTER USERS =================
  const filteredUsers = users.filter((user) => {
    const nameMatch = user?.name?.toLowerCase().includes(search.toLowerCase());
    const emailMatch = user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ================= PAGINATION =================
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  const showingFrom = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const showingTo = startIndex + paginatedUsers.length;

  const roleFilters = [
    { key: "ALL", label: "All Accounts", count: users.length },
    { key: "CITIZEN", label: "Citizens", count: users.filter((u) => u.role === "CITIZEN").length },
    { key: "WORKER", label: "Workers", count: users.filter((u) => u.role === "WORKER").length },
    { key: "MANAGER", label: "Managers", count: users.filter((u) => u.role === "MANAGER").length },
  ];

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  const activeManagers = users.filter(
    (user) => user.role === "MANAGER" && user.status === "ACTIVE"
  );

  const summaryCards = [
    { label: "Citizens", value: users.filter((u) => u.role === "CITIZEN").length, icon: Users, tone: "indigo" },
    { label: "Workers", value: users.filter((u) => u.role === "WORKER").length, icon: Wrench, tone: "green" },
    { label: "Managers", value: users.filter((u) => u.role === "MANAGER").length, icon: UserCog, tone: "amber" },
  ];

  const hasDependencies =
    deletionDependencies &&
    (deletionDependencies.activeAssignments?.length > 0 ||
      deletionDependencies.managedWorkers > 0 ||
      deletionDependencies.mappedAreas?.length > 0);

  return (
    <div className="am-page">

      {/* ================= HERO ================= */}
      <section className="am-hero">
        <div className="am-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="am-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="am-hero-text">
          <span className="am-hero-tag">
            <ShieldCheck size={14} strokeWidth={2.4} /> User Administration
          </span>
          <h1>Account Management</h1>
          <p>Manage citizens, workers and managers across the portal</p>
        </div>

        <div className="am-admin">
          <div className="am-admin-avatar">A</div>
          <div>
            <h3>Administrator</h3>
            <span>{users.length} accounts · Full access</span>
          </div>
        </div>
      </section>


      {/* ================= SUMMARY ================= */}
      <section className="am-stats">
        {summaryCards.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`am-stat tone-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="am-stat-icon">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="am-stat-text">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}

        <div
          className="am-stat tone-violet"
          style={{ animationDelay: "0.34s" }}
        >
          <div className="am-stat-icon">
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <div className="am-stat-text">
            <strong>
              {activeCount} <em>/ {users.length}</em>
            </strong>
            <span>Active Accounts</span>
          </div>
        </div>
      </section>


      {/* ================= CITY / AREA MANAGER MAPPING ================= */}
      <section className="am-panel">
        <div className="am-panel-head">
          <div className="am-panel-icon">
            <Layers size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2>City / Area Manager Mapping</h2>
            <p>
              Search public place data to build a district-to-city-to-locality hierarchy, then assign
              managers to the specific areas they serve.
            </p>
          </div>
        </div>

        {mappingError && (
          <div className="am-alert error" role="alert">
            <AlertCircle size={18} strokeWidth={2.2} />
            {mappingError}
          </div>
        )}

        <form className="am-area-form" onSubmit={handleCreateArea}>
          <div className="am-field am-place-field">
            <label htmlFor="area-place-search">Search Tamil Nadu locations</label>
            <div className="am-input-icon">
              <Search size={16} strokeWidth={2.2} />
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
            </div>
            {newAreaName && (
              <span className="am-selected-area">Selected: {newAreaName}</span>
            )}
            {searchingPlaces && <span className="am-note">Searching places...</span>}
            {placeSearchError && <span className="am-note error">{placeSearchError}</span>}
            {placeSearchResults.length > 0 && (
              <div className="am-place-results">
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

          <div className="am-field">
            <label htmlFor="area-level">Area level</label>
            <select
              id="area-level"
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
          </div>

          <div className="am-field">
            <label htmlFor="area-parent">Parent district / city</label>
            <select
              id="area-parent"
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
          </div>

          <button
            className="am-btn-main am-area-submit"
            type="submit"
            disabled={creatingArea || !newAreaName}
          >
            {creatingArea ? "Adding..." : "Add area"}
          </button>
        </form>

        <p className="am-hint">
          Add a district first, then select it as the parent to search its cities. Add a city next
          to search its localities. Workers remain on their manager&apos;s team.
        </p>

        {cityMappings.length === 0 ? (
          <p className="am-empty">
            No cities or localities are configured yet. Add one above to create manager routing.
          </p>
        ) : (
          <div className="am-table-wrap">
            <table className="am-table am-table-compact">
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
                    <td className="am-strong">{area.name}</td>
                    <td>
                      <span className="am-level">{area.type}</span>
                    </td>
                    <td>{area.parent || "—"}</td>
                    <td>
                      <select
                        className="am-inline-select"
                        value={area.manager?.id || ""}
                        disabled={savingCityId === area.id}
                        onChange={(event) =>
                          handleCityManagerChange(area, event.target.value)
                        }
                        aria-label={`Manager for ${area.name}`}
                      >
                        <option value="">Use parent area's manager</option>
                        {activeManagers.map((manager) => (
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


      {/* ================= ROUTING QUEUE ================= */}
      <section className="am-panel">
        <div className="am-panel-head">
          <div className="am-panel-icon">
            <Navigation size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2>Complaints Awaiting Admin Routing</h2>
            <p>
              Submissions received before area boundaries are configured appear here.
              Select an active manager to place each complaint in their work queue.
            </p>
          </div>
        </div>

        {routingError && (
          <div className="am-alert error" role="alert">
            <AlertCircle size={18} strokeWidth={2.2} />
            {routingError}
          </div>
        )}

        {routingComplaints.length === 0 ? (
          <p className="am-empty">
            No complaints are waiting for administrator routing.
          </p>
        ) : (
          <div className="am-routing">
            {routingComplaints.map((complaint) => (
              <article className="am-route-item" key={complaint.id}>
                <div className="am-route-details">
                  <strong>
                    {complaint.title}
                    <span className="am-route-code">{complaint.code}</span>
                  </strong>
                  <span>
                    <MapPin size={13} strokeWidth={2.2} />
                    {complaint.address}
                  </span>
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
                      <ExternalLink size={12} strokeWidth={2.4} />
                    </a>
                  )}
                </div>

                <div className="am-route-actions">
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
                    {activeManagers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="am-btn-main"
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


      {/* ================= ACCOUNTS PANEL ================= */}
      <section className="am-panel am-accounts">

        {/* ---- toolbar ---- */}
        <div className="am-toolbar">
          <div className="am-search">
            <Search size={18} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="am-search-clear"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="am-filters">
            <SlidersHorizontal size={15} strokeWidth={2.2} className="am-filters-icon" />
            {roleFilters.map((filter) => (
              <button
                key={filter.key}
                className={roleFilter === filter.key ? "am-filter active" : "am-filter"}
                onClick={() => {
                  setRoleFilter(filter.key);
                  setPage(1);
                }}
              >
                {filter.label}
                <span>{filter.count}</span>
              </button>
            ))}
          </div>

          <button className="am-btn-main am-add" onClick={openAddModal}>
            <UserPlus size={16} strokeWidth={2.3} />
            Add User
          </button>
        </div>


        {/* ---- table ---- */}
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="am-th-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const roleMeta = ROLE_STYLE[user.role] || { tone: "grey", icon: Users };
                  const RoleIcon = roleMeta.icon;

                  return (
                    <tr key={user._id}>

                      {/* ACCOUNT */}
                      <td>
                        <div className="am-user">
                          <div className={`am-user-avatar tone-${roleMeta.tone}`}>
                            {user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <strong>{user.name}</strong>
                            <span>ID #{String(user._id).substring(0, 6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td>
                        <span className="am-email">{user.email}</span>
                      </td>

                      {/* ROLE */}
                      <td>
                        <span className={`am-role tone-${roleMeta.tone}`}>
                          <RoleIcon size={12} strokeWidth={2.3} />
                          {user.role || "UNKNOWN"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span className={`am-status ${user?.status?.toLowerCase() || "unknown"}`}>
                          <span className="am-dot"></span>
                          {user.status || "UNKNOWN"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="am-actions">
                          <button
                            className={
                              user.status === "ACTIVE"
                                ? "am-action revoke"
                                : "am-action activate"
                            }
                            onClick={() => handleStatusChange(user._id, user.status)}
                            title={
                              user.status === "ACTIVE"
                                ? "Revoke login access"
                                : "Restore login access"
                            }
                          >
                            {user.status === "ACTIVE" ? (
                              <ShieldOff size={14} strokeWidth={2.2} />
                            ) : (
                              <UserCheck size={14} strokeWidth={2.2} />
                            )}
                            {user.status === "ACTIVE" ? "Revoke" : "Activate"}
                          </button>

                          <button
                            className="am-action delete"
                            onClick={() => requestDelete(user)}
                            title="Remove account"
                            aria-label={`Remove ${user.name}`}
                          >
                            <Trash2 size={14} strokeWidth={2.2} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="am-no-users">
                      <UserX size={34} strokeWidth={1.7} />
                      <strong>No accounts found</strong>
                      <span>Try adjusting your search or filter.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* ---- pagination ---- */}
        <div className="am-pager">
          <div className="am-pager-info">
            Showing <strong>{showingFrom}–{showingTo}</strong> of{" "}
            <strong>{filteredUsers.length}</strong>
            {filteredUsers.length !== users.length && (
              <> (filtered from {users.length})</>
            )}{" "}
            accounts
          </div>

          <div className="am-pager-controls">
            <label className="am-pager-size">
              Rows
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <nav className="am-pages" aria-label="Pagination">
              <button
                className="am-page-btn"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              {getPageItems(totalPages, currentPage).map((item, index) =>
                item === "..." ? (
                  <span className="am-page-dots" key={`dots-${index}`}>
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    className={item === currentPage ? "am-page-btn active" : "am-page-btn"}
                    onClick={() => setPage(item)}
                    aria-current={item === currentPage ? "page" : undefined}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                className="am-page-btn"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </nav>
          </div>
        </div>

      </section>


      {/* ================= ADD USER MODAL ================= */}
      {showAddModal && (
        <div className="am-overlay" onClick={closeAddModal}>
          <div className="am-modal am-modal-wide" onClick={(e) => e.stopPropagation()}>

            <div className="am-modal-head">
              <div>
                <span className="am-modal-label">NEW ACCOUNT</span>
                <h2>Add New Account</h2>
                <p>Create a new account and assign its role and access status.</p>
              </div>
              <button
                className="am-close"
                onClick={closeAddModal}
                type="button"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form className="am-form" onSubmit={handleAddUser} noValidate>

              <div className="am-form-grid">

                <div className="am-field am-full">
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
                  {formErrors.name && <span className="am-field-error">{formErrors.name}</span>}
                </div>

                <div className="am-field am-full">
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
                  {formErrors.email && <span className="am-field-error">{formErrors.email}</span>}
                </div>

                <div className="am-field am-full">
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
                  {formErrors.phone && <span className="am-field-error">{formErrors.phone}</span>}
                </div>

                <div className="am-field am-full">
                  <label htmlFor="add-password">Password <em>*</em></label>
                  <div className="am-password">
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
                      className="am-password-toggle"
                      onClick={() => setShowPassword((s) => !s)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <span className="am-field-error">{formErrors.password}</span>
                  )}
                </div>

                <div className="am-field am-full">
                  <label>Role</label>
                  <div className="am-role-chips" role="radiogroup" aria-label="Role">
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
                          className={`am-chip tone-${meta.tone}${selected ? " selected" : ""}`}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              role: opt.key,
                              manager_id: opt.key === "WORKER" ? prev.manager_id : "",
                            }))
                          }
                        >
                          <ChipIcon size={14} strokeWidth={2.3} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.role === "WORKER" && (
                  <div className="am-field am-full">
                    <label htmlFor="add-worker-manager">Manager team <em>*</em></label>
                    <select
                      id="add-worker-manager"
                      name="manager_id"
                      value={form.manager_id}
                      onChange={handleFormChange}
                      className={formErrors.manager_id ? "invalid" : ""}
                    >
                      <option value="">Select an active manager</option>
                      {activeManagers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name} ({manager.email})
                        </option>
                      ))}
                    </select>
                    {formErrors.manager_id && (
                      <span className="am-field-error">{formErrors.manager_id}</span>
                    )}
                  </div>
                )}

              </div>

              {submitError && (
                <div className="am-alert error" role="alert">
                  <AlertCircle size={18} strokeWidth={2.2} />
                  {submitError}
                </div>
              )}

              <div className="am-modal-footer">
                <button
                  type="button"
                  className="am-cancel"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="am-btn-main" disabled={submitting}>
                  <UserPlus size={15} strokeWidth={2.3} />
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {pendingDelete && (
        <div className="am-overlay" onClick={cancelDelete}>
          <div className="am-modal am-modal-danger" onClick={(e) => e.stopPropagation()}>

            <button
              className="am-close am-close-dark"
              onClick={cancelDelete}
              disabled={deletingUser}
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="am-danger-icon">
              <AlertTriangle size={26} strokeWidth={2.3} />
            </div>

            <h2>Remove this account?</h2>
            <p>
              You're about to permanently remove <strong>{pendingDelete.name}</strong>{" "}
              ({pendingDelete.email}) from the portal. This action can't be undone.
            </p>

            {loadingDeletionDependencies && (
              <p className="am-dep-note">Checking active work and mappings...</p>
            )}
            {deletionDependencyError && (
              <p className="am-dep-error">{deletionDependencyError}</p>
            )}
            {deletionDependencies && (
              <div className="am-dep-list">
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
                {!hasDependencies && (
                  <span>No active work or manager mappings found.</span>
                )}
                {hasDependencies && (
                  <span>Reassign or resolve these dependencies before deleting this account.</span>
                )}
              </div>
            )}

            <div className="am-modal-footer am-modal-footer-center">
              <button
                className="am-cancel"
                onClick={cancelDelete}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                className="am-danger"
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
                <Trash2 size={15} strokeWidth={2.3} />
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