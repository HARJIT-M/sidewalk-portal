import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Pin,
  Wrench,
  CheckCircle2,
  Search,
  MapPin,
  Users,
  Calendar,
  Flag,
  RefreshCw,
  Clock,
  X,
  AlertCircle,
  BadgeCheck,
  Package,
  FileText,
  MessageSquare,
  ExternalLink,
  Image as ImageIcon,
  Activity,
  Inbox,
} from "lucide-react";
import { getAllWorkTracking, verifyRepairWork } from "../../../services/managerApi";
import "./new_track.css";

const DEFAULT_NOTE = "Verified and signed off by Field Manager.";

// materials can arrive as an array or as free text (comma / semicolon / new-line separated)
const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : [item?.name, item?.quantity && `× ${item.quantity}`, item?.unit]
              .filter(Boolean)
              .join(" ")
      )
      .filter(Boolean);
  }
  return String(value)
    .split(/\r?\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const WorkTracking = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // ---- verify popup ----
  const [verifyWork, setVerifyWork] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState(DEFAULT_NOTE);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const loadWorkTracking = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getAllWorkTracking();
      if (res && res.success) {
        const list = res.repairs || res.works || [];
        setWorks(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading work tracking data:", err);
      setErrorMsg(err.message || "Failed to load work tracking records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkTracking();
  }, []);

  // ---- verify popup helpers ----
  const openVerify = (work) => {
    setVerifyWork(work);
    setVerificationNotes(DEFAULT_NOTE);
    setVerifyError("");
  };

  const closeVerify = () => {
    if (verifying) return;
    setVerifyWork(null);
    setVerifyError("");
  };

  // close the popup with the Escape key
  useEffect(() => {
    if (!verifyWork) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !verifying) {
        setVerifyWork(null);
        setVerifyError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [verifyWork, verifying]);

  const handleVerify = async () => {
    if (!verifyWork) return;
    const complaintId = verifyWork.mongoId || verifyWork.id;
    try {
      setVerifying(true);
      setVerifyError("");
      const res = await verifyRepairWork(complaintId, {
        verificationNotes: verificationNotes.trim() || DEFAULT_NOTE,
      });
      if (res && res.success) {
        setVerifyWork(null);
        setSuccessMsg("Repair verified and complaint closed successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
        await loadWorkTracking();
      }
    } catch (err) {
      setVerifyError(err.message || "Failed to verify repair work.");
    } finally {
      setVerifying(false);
    }
  };

  // Filter work
  const filteredWorks = works.filter((work) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (work.id && work.id.toLowerCase().includes(q)) ||
      (work.title && work.title.toLowerCase().includes(q)) ||
      (work.location && work.location.toLowerCase().includes(q)) ||
      (work.assignedWorkers &&
        work.assignedWorkers.some((worker) => worker.toLowerCase().includes(q)));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Completed" &&
        (work.status === "Completed" ||
          work.status === "Closed" ||
          work.rawStatus === "RESOLVED" ||
          work.rawStatus === "CLOSED")) ||
      (work.status && work.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const selectedWork =
    works.find((w) => w.id === selectedId) || filteredWorks[0] || null;

  // Counts
  const totalWorks = works.length;

  const assignedWorks = works.filter(
    (work) =>
      work.status === "Assigned" ||
      work.status === "ASSIGNED" ||
      work.status === "Pending" ||
      work.status === "PENDING"
  ).length;

  const inProgressWorks = works.filter(
    (work) =>
      work.status === "In Progress" || work.status === "IN_PROGRESS"
  ).length;

  const completedWorks = works.filter(
    (work) =>
      work.status === "Completed" ||
      work.status === "Closed" ||
      work.rawStatus === "RESOLVED" ||
      work.rawStatus === "CLOSED"
  ).length;

  const statusClass = (status) =>
    status ? status.toLowerCase().replace(/\s+/g, "-") : "pending";

  const statCards = [
    { label: "Total Works", value: totalWorks, icon: ClipboardList, tone: "total" },
    { label: "Assigned", value: assignedWorks, icon: Pin, tone: "assigned" },
    { label: "In Progress", value: inProgressWorks, icon: Wrench, tone: "progress" },
    { label: "Completed", value: completedWorks, icon: CheckCircle2, tone: "done" },
  ];

  const isClosedWork =
    selectedWork &&
    (selectedWork.status === "Closed" ||
      selectedWork.rawStatus === "CLOSED" ||
      selectedWork.isClosed);

  const needsVerification =
    selectedWork &&
    !isClosedWork &&
    (selectedWork.status === "Completed" ||
      selectedWork.rawStatus === "RESOLVED" ||
      selectedWork.progress === 100);

  // ---- data shown inside the verify popup ----
  const verifyBefore = verifyWork
    ? verifyWork.beforeImage || verifyWork.image_url || verifyWork.reportedImage || null
    : null;
  const verifyAfter = verifyWork
    ? verifyWork.afterImage || verifyWork.completionImage || null
    : null;
  const verifyMaterials = verifyWork ? toList(verifyWork.materialsUsed) : [];

  return (
    <div className="wt-page">

      {/* ================= HERO ================= */}
      <section className="wt-hero">
        <div className="wt-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="wt-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="wt-hero-text">
          <span className="wt-hero-tag">
            <Activity size={14} strokeWidth={2.4} /> Manager Console
          </span>
          <h1>Work Tracking</h1>
          <p>Monitor real-time task progress, on-site materials, and repair lifecycles</p>
        </div>

        <button
          className="wt-hero-btn"
          onClick={loadWorkTracking}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            strokeWidth={2.5}
            className={loading ? "wt-spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {successMsg && (
        <div className="wt-alert success" role="status">
          <CheckCircle2 size={18} strokeWidth={2.2} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="wt-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          {errorMsg}
        </div>
      )}

      {/* ================= STATISTICS ================= */}
      <section className="wt-stats">
        {statCards.map(({ label, value, icon: Icon, tone }, i) => (
          <div
            className={`wt-stat wt-stat-${tone}`}
            key={label}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="wt-stat-icon">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="wt-stat-text">
              <strong>{loading ? "..." : value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ================= MAIN SPLIT LAYOUT ================= */}
      <div className="wt-split">

        {/* LEFT COLUMN: LIST OF WORK */}
        <aside className="wt-list-panel">
          <div className="wt-search">
            <Search size={18} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search work ID, title, location, worker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="wt-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="wt-pills">
            {["All", "Assigned", "In Progress", "Completed"].map((status) => (
              <button
                type="button"
                key={status}
                className={`wt-pill ${statusFilter === status ? "active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="wt-list-scroll">
            {loading ? (
              <div className="wt-state">
                <div className="wt-loader" aria-hidden="true">
                  <i></i><i></i><i></i><i></i>
                </div>
                <p>Loading live repair operations...</p>
              </div>
            ) : filteredWorks.length === 0 ? (
              <div className="wt-state">
                <Inbox size={34} strokeWidth={1.8} />
                <p>No repair works found matching the criteria.</p>
              </div>
            ) : (
              filteredWorks.map((work) => {
                const isSelected = selectedWork && selectedWork.id === work.id;

                return (
                  <button
                    type="button"
                    key={work.id || work.mongoId}
                    className={`wt-item wt-item-${statusClass(work.status)} ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedId(work.id)}
                  >
                    <div className="wt-item-top">
                      <span className="wt-id">{work.id}</span>
                      <span className={`wt-status ${statusClass(work.status)}`}>
                        <span className="wt-dot"></span>
                        {work.status}
                      </span>
                    </div>

                    <h3>{work.title}</h3>

                    <div className="wt-line">
                      <MapPin size={14} strokeWidth={2.2} />
                      <span>{work.location}</span>
                    </div>

                    <div className="wt-line">
                      <Users size={14} strokeWidth={2.2} />
                      <span>
                        {work.assignedWorkers && work.assignedWorkers.length > 0
                          ? work.assignedWorkers.join(", ")
                          : "Unassigned"}
                      </span>
                    </div>

                    <div className="wt-item-progress">
                      <div className="wt-track">
                        <div
                          className="wt-track-fill"
                          style={{ width: `${work.progress || 0}%` }}
                        ></div>
                      </div>
                      <span>{work.progress || 0}%</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: WORK DETAILS & TIMELINE */}
        <section className="wt-detail">
          {selectedWork ? (
            <>
              <div className="wt-detail-head">
                <div className="wt-badges">
                  <span className="wt-id">{selectedWork.id}</span>
                  <span className={`wt-status ${statusClass(selectedWork.status)}`}>
                    <span className="wt-dot"></span>
                    {selectedWork.status}
                  </span>
                  <span
                    className={`wt-priority ${
                      selectedWork.priority ? selectedWork.priority.toLowerCase() : "medium"
                    }`}
                  >
                    <Flag size={12} strokeWidth={2.4} />
                    {selectedWork.priority || "Medium"} Priority
                  </span>
                </div>

                <h2>{selectedWork.title}</h2>
                <div className="wt-line wt-line-lg">
                  <MapPin size={16} strokeWidth={2.2} />
                  <span>{selectedWork.location}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="wt-progress-box">
                <div className="wt-progress-top">
                  <span>Current Repair Completion</span>
                  <strong>{selectedWork.progress || 0}%</strong>
                </div>
                <div className="wt-bar">
                  <div
                    className={`wt-bar-fill ${statusClass(selectedWork.status)}`}
                    style={{ width: `${selectedWork.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Verification / Closed Callout */}
              {isClosedWork ? (
                <div className="wt-closed-callout">
                  <div className="wt-closed-icon">
                    <CheckCircle2 size={24} strokeWidth={2.2} />
                  </div>
                  <div className="wt-closed-text">
                    <h4>Repair Verified &amp; Closed</h4>
                    <p>
                      This complaint has been verified and closed by field management.
                      {selectedWork.verifiedBy && ` Verified by ${selectedWork.verifiedBy}.`}
                    </p>
                  </div>
                </div>
              ) : needsVerification ? (
                <div className="wt-verify-callout">
                  <div className="wt-verify-icon">
                    <BadgeCheck size={24} strokeWidth={2.2} />
                  </div>
                  <div className="wt-verify-text">
                    <h4>Work Done &amp; Awaiting Verification</h4>
                    <p>
                      Maintenance crew marked the on-site repair as completed. Review the
                      before / after photos and materials, then sign off to close.
                    </p>
                  </div>
                  <button
                    className="wt-btn-green"
                    onClick={() => openVerify(selectedWork)}
                  >
                    Verify &amp; Close
                  </button>
                </div>
              ) : null}

              {/* Meta Grid */}
              <div className="wt-info-grid">
                <div className="wt-info">
                  <span>
                    <Calendar size={14} strokeWidth={2.2} /> Assigned Date
                  </span>
                  <strong>{selectedWork.assignedDate || "—"}</strong>
                </div>

                <div className="wt-info">
                  <span>
                    <Clock size={14} strokeWidth={2.2} /> Work Started
                  </span>
                  <strong>{selectedWork.startedDate || "—"}</strong>
                </div>
              </div>

              {/* Team Block */}
              <div className="wt-block">
                <h3>
                  <Users size={17} strokeWidth={2.2} /> Maintenance Team
                </h3>
                <div className="wt-team">
                  {selectedWork.assignedWorkers &&
                  selectedWork.assignedWorkers.length > 0 ? (
                    selectedWork.assignedWorkers.map((worker, idx) => (
                      <span key={idx}>{worker}</span>
                    ))
                  ) : (
                    <span className="none">None assigned</span>
                  )}
                </div>
              </div>

              {/* Latest Update Box */}
              <div className="wt-update">
                <div className="wt-update-icon">
                  <Wrench size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <span>Latest Field Observation</span>
                  <p>{selectedWork.lastUpdate || "No field notes logged yet."}</p>
                  <small>
                    Updated by {selectedWork.updatedBy || "System"}{" "}
                    {selectedWork.updatedAt && `• ${selectedWork.updatedAt}`}
                  </small>
                </div>
              </div>

              {/* Repair Documentation Photos (Before & After) */}
              {(selectedWork.beforeImage || selectedWork.afterImage) && (
                <div className="wt-block">
                  <h3>
                    <ImageIcon size={17} strokeWidth={2.2} /> On-Site Documentation Photos
                  </h3>
                  <div className="wt-compare">
                    <figure className="wt-shot">
                      <figcaption>
                        <i className="before"></i> Reported Condition (Before)
                      </figcaption>
                      {selectedWork.beforeImage ? (
                        <a href={selectedWork.beforeImage} target="_blank" rel="noreferrer" title="Open full size">
                          <img src={selectedWork.beforeImage} alt="Before repair" />
                          <span className="wt-shot-open">
                            <ExternalLink size={13} strokeWidth={2.4} /> Open
                          </span>
                        </a>
                      ) : (
                        <div className="wt-shot-empty">
                          <ImageIcon size={30} strokeWidth={1.7} />
                          <span>No before photo</span>
                        </div>
                      )}
                    </figure>

                    <figure className="wt-shot">
                      <figcaption>
                        <i className="after"></i> Completion Proof (After)
                      </figcaption>
                      {selectedWork.afterImage ? (
                        <a href={selectedWork.afterImage} target="_blank" rel="noreferrer" title="Open full size">
                          <img src={selectedWork.afterImage} alt="After repair" />
                          <span className="wt-shot-open">
                            <ExternalLink size={13} strokeWidth={2.4} /> Open
                          </span>
                        </a>
                      ) : (
                        <div className="wt-shot-empty">
                          <ImageIcon size={30} strokeWidth={1.7} />
                          <span>{selectedWork.progress === 100 ? "No completion photo uploaded" : "Awaiting repair completion"}</span>
                        </div>
                      )}
                    </figure>
                  </div>
                </div>
              )}

              {/* History Timeline */}
              <div className="wt-block">
                <h3>Execution Timeline &amp; Status Updates</h3>

                {!selectedWork.history || selectedWork.history.length === 0 ? (
                  <p className="wt-muted">No history events recorded yet.</p>
                ) : (
                  <div className="wt-history">
                    {selectedWork.history.map((item, index) => (
                      <div key={index} className="wt-history-item">
                        <div className="wt-history-line">
                          <div className="wt-history-dot"></div>
                        </div>
                        <div className="wt-history-card">
                          <div className="wt-history-top">
                            <strong>{item.worker || "Crew Member"}</strong>
                            <span>{item.date}</span>
                          </div>
                          <p>{item.message}</p>
                          <span className="wt-history-progress">
                            Progress reached: {item.progress}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="wt-detail-empty">
              <ClipboardList size={44} strokeWidth={1.7} />
              <h3>Select a Task</h3>
              <p>Choose an assigned work from the left panel to inspect real-time progress.</p>
            </div>
          )}
        </section>
      </div>


      {/* =================================================
          VERIFY & CLOSE POPUP
      ================================================= */}
      {verifyWork && (
        <div className="wt-overlay" onClick={closeVerify}>
          <div className="wt-modal" onClick={(e) => e.stopPropagation()}>

            <div className="wt-modal-head">
              <div>
                <span className="wt-modal-label">{verifyWork.id}</span>
                <h2>Verify Completed Repair</h2>
                <p>{verifyWork.title}</p>
              </div>
              <button
                className="wt-close"
                onClick={closeVerify}
                disabled={verifying}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="wt-modal-body">

              {/* quick facts */}
              <div className="wt-facts">
                <span>
                  <MapPin size={14} strokeWidth={2.2} />
                  {verifyWork.location}
                </span>
                <span>
                  <Users size={14} strokeWidth={2.2} />
                  {verifyWork.assignedWorkers && verifyWork.assignedWorkers.length > 0
                    ? verifyWork.assignedWorkers.join(", ")
                    : "Unassigned"}
                </span>
              </div>

              {/* before / after */}
              <div className="wt-compare">
                <figure className="wt-shot">
                  <figcaption>
                    <i className="before"></i> Before
                  </figcaption>
                  {verifyBefore ? (
                    <a href={verifyBefore} target="_blank" rel="noreferrer" title="Open full size">
                      <img src={verifyBefore} alt="Before repair" />
                      <span className="wt-shot-open">
                        <ExternalLink size={13} strokeWidth={2.4} /> Open
                      </span>
                    </a>
                  ) : (
                    <div className="wt-shot-empty">
                      <ImageIcon size={30} strokeWidth={1.7} />
                      <span>No before photo</span>
                    </div>
                  )}
                </figure>

                <figure className="wt-shot">
                  <figcaption>
                    <i className="after"></i> After
                  </figcaption>
                  {verifyAfter ? (
                    <a href={verifyAfter} target="_blank" rel="noreferrer" title="Open full size">
                      <img src={verifyAfter} alt="After repair" />
                      <span className="wt-shot-open">
                        <ExternalLink size={13} strokeWidth={2.4} /> Open
                      </span>
                    </a>
                  ) : (
                    <div className="wt-shot-empty">
                      <ImageIcon size={30} strokeWidth={1.7} />
                      <span>No completion photo uploaded</span>
                    </div>
                  )}
                </figure>
              </div>

              {/* work report */}
              <div className="wt-report">

                <div className="wt-report-card">
                  <h3>
                    <FileText size={16} strokeWidth={2.3} /> Work Description
                  </h3>
                  <p>{verifyWork.workDescription || "No work description provided by the crew."}</p>
                </div>

                <div className="wt-report-card">
                  <h3>
                    <Package size={16} strokeWidth={2.3} /> Materials Used
                  </h3>
                  {verifyMaterials.length > 0 ? (
                    <ul className="wt-materials">
                      {verifyMaterials.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No materials were recorded for this repair.</p>
                  )}
                </div>

                <div className="wt-report-card">
                  <h3>
                    <MessageSquare size={16} strokeWidth={2.3} /> Crew Remarks
                  </h3>
                  <p>{verifyWork.remarks || "No remarks added."}</p>
                </div>

              </div>

              {/* manager note */}
              <div className="wt-field">
                <label htmlFor="wt-verify-notes">Verification note</label>
                <textarea
                  id="wt-verify-notes"
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add a note for the complaint record"
                  disabled={verifying}
                />
              </div>

              {verifyError && (
                <div className="wt-alert error" role="alert">
                  <AlertCircle size={18} strokeWidth={2.2} />
                  {verifyError}
                </div>
              )}
            </div>

            <div className="wt-modal-footer">
              <button
                className="wt-cancel"
                onClick={closeVerify}
                disabled={verifying}
              >
                Cancel
              </button>
              <button
                className="wt-btn-green"
                onClick={handleVerify}
                disabled={verifying}
              >
                <BadgeCheck size={16} strokeWidth={2.3} />
                {verifying ? "Verifying..." : "Confirm & Close Complaint"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTracking;