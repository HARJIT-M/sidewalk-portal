import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getStoredComplaints,
  saveStoredComplaints,
  getStoredProfile,
  getStoredNotifications,
  saveStoredNotifications
} from "./workerData";
import "./WorkerComplaintDetails.css";

const WorkerComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [profile, setProfile] = useState(null);
  const [imageModal, setImageModal] = useState(null);

  // Work Update Form State
  const [workForm, setWorkForm] = useState({
    status: "IN_PROGRESS",
    workDescription: "",
    materialsUsed: "",
    remarks: "",
    completionImage: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [savedSuccessAlert, setSavedSuccessAlert] = useState("");

  useEffect(() => {
    const allComplaints = getStoredComplaints();
    const found = allComplaints.find((c) => c.id === id) || allComplaints[0];
    if (found) {
      setComplaint(found);
      setWorkForm({
        status: found.status === "ASSIGNED" ? "IN_PROGRESS" : found.status,
        workDescription: found.workDescription || "",
        materialsUsed: found.materialsUsed || "",
        remarks: found.remarks || "",
        completionImage: found.completionImage || null,
      });
      setPreviewImage(found.completionImage || null);
    }
    setProfile(getStoredProfile());
  }, [id]);

  if (!complaint) {
    return (
      <div className="worker-details-loading">
        <div className="spinner"></div>
        <p>Loading complaint details...</p>
      </div>
    );
  }

  // Action: Start Work
  const handleStartWork = () => {
    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updated = {
      ...complaint,
      status: "IN_PROGRESS",
      statusHistory: [
        ...complaint.statusHistory,
        {
          status: "IN_PROGRESS",
          date: timestamp,
          note: `Work initiated on-site by ${profile?.name || "Worker"}.`,
        },
      ],
      repairHistory: [
        ...complaint.repairHistory,
        {
          time: timestamp,
          action: "Safety barricade positioned and repair work started.",
        },
      ],
    };

    updateComplaintInStore(updated);
    setComplaint(updated);
    setSavedSuccessAlert("Task status updated to IN_PROGRESS. You can now log repair notes!");
    setTimeout(() => setSavedSuccessAlert(""), 4000);
  };

  // Image Upload simulation
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setWorkForm((prev) => ({ ...prev, completionImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample completion image presets for testing
  const handleUseSampleImage = () => {
    const sampleImg =
      "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80";
    setPreviewImage(sampleImg);
    setWorkForm((prev) => ({ ...prev, completionImage: sampleImg }));
  };

  // Save Progress Draft
  const handleSaveDraft = (e) => {
    e.preventDefault();
    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updated = {
      ...complaint,
      workDescription: workForm.workDescription,
      materialsUsed: workForm.materialsUsed,
      remarks: workForm.remarks,
      completionImage: workForm.completionImage,
      repairHistory: [
        ...complaint.repairHistory,
        {
          time: timestamp,
          action: `Work log updated: ${workForm.workDescription.slice(0, 50) || "Progress draft saved."}`,
        },
      ],
    };

    updateComplaintInStore(updated);
    setComplaint(updated);
    setSavedSuccessAlert("Work draft saved successfully!");
    setTimeout(() => setSavedSuccessAlert(""), 3500);
  };

  // Submit Completed Work
  const handleCompleteWork = (e) => {
    e.preventDefault();
    if (!workForm.workDescription.trim()) {
      alert("Please provide a brief Work Description before completing.");
      return;
    }

    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updated = {
      ...complaint,
      status: "RESOLVED",
      workDescription: workForm.workDescription,
      materialsUsed: workForm.materialsUsed,
      remarks: workForm.remarks,
      completionImage: workForm.completionImage || previewImage,
      statusHistory: [
        ...complaint.statusHistory,
        {
          status: "RESOLVED",
          date: timestamp,
          note: `Repair completed by ${profile?.name || "Ravi Kumar"}. Submitted for manager verification.`,
        },
      ],
      repairHistory: [
        ...complaint.repairHistory,
        {
          time: timestamp,
          action: "Completed repair, evidence photo uploaded, marked RESOLVED.",
        },
      ],
    };

    updateComplaintInStore(updated);
    setComplaint(updated);

    // Also add a notification
    const currentNotifs = getStoredNotifications();
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      type: "STATUS_UPDATE",
      title: `Work Completed: ${complaint.id}`,
      message: `You marked ${complaint.id} as RESOLVED. Field manager will verify.`,
      complaintId: complaint.id,
      time: "Just now",
      read: false,
      urgent: false,
    };
    saveStoredNotifications([newNotif, ...currentNotifs]);

    setSavedSuccessAlert("🎉 Congratulations! Work marked as RESOLVED and submitted for Manager verification.");
    setTimeout(() => setSavedSuccessAlert(""), 5000);
  };

  const updateComplaintInStore = (updatedObj) => {
    const all = getStoredComplaints();
    const mapped = all.map((c) => (c.id === updatedObj.id ? updatedObj : c));
    saveStoredComplaints(mapped);
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "priority-high";
      case "MEDIUM":
        return "priority-medium";
      case "LOW":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  const getStatusStepIndex = (status) => {
    switch (status?.toUpperCase()) {
      case "REPORTED":
        return 0;
      case "ASSIGNED":
      case "PENDING":
        return 1;
      case "IN_PROGRESS":
        return 2;
      case "RESOLVED":
      case "COMPLETED":
        return 3;
      case "CLOSED":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStepIndex(complaint.status);

  return (
    <div className="worker-details-page">
      {/* =========================================
          TOP BREADCRUMB & HEADER
      ========================================= */}
      <div className="details-nav-bar">
        <Link to="/worker/my-complaints" className="back-link">
          ← Back to My Assigned Complaints
        </Link>
        <span className="worker-id-badge">Worker: {profile?.name} ({profile?.id})</span>
      </div>

      {savedSuccessAlert && (
        <div className="details-success-banner">
          <span>{savedSuccessAlert}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="details-header-card">
        <div className="details-header-info">
          <div className="details-header-tags">
            <span className="complaint-id-tag">{complaint.id}</span>
            <span className={`priority-tag ${getPriorityClass(complaint.priority)}`}>
              {complaint.priority} PRIORITY
            </span>
            <span className={`status-pill ${complaint.status.toLowerCase()}`}>
              <span className="status-dot"></span>
              {complaint.status.replace("_", " ")}
            </span>
          </div>

          <h1>{complaint.issue}</h1>
          <p className="details-location-sub">
            📍 <strong>Location:</strong> {complaint.location}{" "}
            {complaint.landmark && <span>(Landmark: {complaint.landmark})</span>}
          </p>
        </div>

        <div className="details-quick-actions">
          {complaint.status === "ASSIGNED" && (
            <button className="btn-primary-action start" onClick={handleStartWork}>
              🚀 Start Work
            </button>
          )}

          {complaint.status === "IN_PROGRESS" && (
            <a href="#work-update-section" className="btn-primary-action update">
              🛠️ Update / Complete Work
            </a>
          )}

          {complaint.status === "RESOLVED" && (
            <div className="resolved-status-stamp">
              <span>✅ Resolved & Submitted</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          LIFECYCLE WORKFLOW STEPPER
      ========================================= */}
      <div className="stepper-card">
        <h3 className="stepper-title">Repair Lifecycle Workflow</h3>
        <div className="lifecycle-stepper">
          {[
            { label: "1. Reported", desc: complaint.reportedDate },
            { label: "2. Assigned", desc: complaint.assignedDate },
            { label: "3. In Progress", desc: complaint.status === "IN_PROGRESS" || currentStep >= 2 ? "Active Repair" : "Pending" },
            { label: "4. Resolved", desc: currentStep >= 3 ? "Work Completed" : "Awaiting Repair" },
            { label: "5. Closed", desc: "Manager Verification" },
          ].map((step, idx) => (
            <div
              key={step.label}
              className={`stepper-item ${
                idx < currentStep ? "completed" : idx === currentStep ? "current" : "future"
              }`}
            >
              <div className="stepper-node">
                {idx < currentStep ? "✓" : idx + 1}
              </div>
              <div className="stepper-text">
                <strong>{step.label}</strong>
                <span>{step.desc}</span>
              </div>
              {idx < 4 && <div className="stepper-line"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* =========================================
          TWO-COLUMN LAYOUT: ISSUE DETAILS & WORK SECTION
      ========================================= */}
      <div className="details-grid-layout">
        {/* LEFT COLUMN: Issue Info & Photos */}
        <div className="details-column-left">
          {/* Issue Overview Card */}
          <div className="info-card">
            <div className="card-header-bar">
              <h3>📋 Citizen Report Details</h3>
              <span className="card-sub-tag">Reported: {complaint.reportedDate}</span>
            </div>

            <div className="info-section">
              <label>Citizen Description:</label>
              <p className="description-box">{complaint.description}</p>
            </div>

            <div className="info-section">
              <label>Location & Landmark:</label>
              <div className="location-box">
                <p>📍 {complaint.location}</p>
                {complaint.landmark && (
                  <p className="landmark-sub">Landmark: {complaint.landmark}</p>
                )}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(complaint.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="map-link-btn"
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
            </div>

            {/* Reported Damage Photo */}
            <div className="info-section">
              <label>Reported Damage Photo (Citizen Evidence):</label>
              {complaint.reportedImage ? (
                <div
                  className="damage-photo-container"
                  onClick={() => setImageModal(complaint.reportedImage)}
                >
                  <img src={complaint.reportedImage} alt="Reported Damage" />
                  <span className="photo-overlay-tag">🔍 Click to Enlarge</span>
                </div>
              ) : (
                <div className="no-photo-placeholder">No photo attached with report.</div>
              )}
            </div>

            {/* Meta tags */}
            <div className="info-meta-row">
              <div className="meta-item">
                <span>Reporter ID</span>
                <strong>{complaint.reporterName || "Anonymous Citizen"}</strong>
              </div>
              <div className="meta-item">
                <span>Assigned Date</span>
                <strong>{complaint.assignedDate}</strong>
              </div>
              <div className="meta-item">
                <span>Est. Repair Time</span>
                <strong>{complaint.estimatedHours || "4 Hours"}</strong>
              </div>
            </div>
          </div>

          {/* Repair History / Timeline */}
          <div className="info-card">
            <div className="card-header-bar">
              <h3>📜 Repair & Status Audit Trail</h3>
            </div>

            <div className="timeline-container">
              {complaint.statusHistory && complaint.statusHistory.map((sh, index) => (
                <div key={index} className="timeline-entry">
                  <div className="timeline-bullet"></div>
                  <div className="timeline-content">
                    <div className="timeline-top">
                      <span className="timeline-status">{sh.status}</span>
                      <span className="timeline-time">{sh.date}</span>
                    </div>
                    <p className="timeline-note">{sh.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Work Update Section */}
        <div className="details-column-right" id="work-update-section">
          {/* STATE 1: If Assigned */}
          {complaint.status === "ASSIGNED" && (
            <div className="work-action-card assigned-state">
              <div className="action-state-icon">🚀</div>
              <h2>Ready to start this repair?</h2>
              <p>
                You are assigned to this task. Inspect the site, position safety cones, and click below to begin repair work.
              </p>
              <button className="btn-start-large" onClick={handleStartWork}>
                🚀 Start Repair Work Now
              </button>
            </div>
          )}

          {/* STATE 2: If In Progress */}
          {complaint.status === "IN_PROGRESS" && (
            <div className="work-action-card active-form-card">
              <div className="work-card-header">
                <div>
                  <span className="badge-active-work">WORK IN PROGRESS</span>
                  <h2>Update Work Status & Details</h2>
                  <p>Log materials used, describe repairs, and upload completion proof.</p>
                </div>
              </div>

              <form className="work-update-form" onSubmit={handleCompleteWork}>
                {/* Status Selector */}
                <div className="form-field-group">
                  <label>
                    Work Stage / Status <span className="req">*</span>
                  </label>
                  <select
                    value={workForm.status}
                    onChange={(e) => setWorkForm({ ...workForm, status: e.target.value })}
                  >
                    <option value="IN_PROGRESS">⚙️ In Progress (Active Repair)</option>
                    <option value="RESOLVED">✅ Repair Completed (Mark Resolved)</option>
                  </select>
                </div>

                {/* Work Description */}
                <div className="form-field-group">
                  <label>
                    Work Description <span className="req">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe repair actions performed (e.g. Replaced damaged tiles, compacted sand bed, leveled surface)..."
                    value={workForm.workDescription}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, workDescription: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Materials Used */}
                <div className="form-field-group">
                  <label>Materials Used</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Paver Blocks, 1 bag Portland cement, coarse gravel"
                    value={workForm.materialsUsed}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, materialsUsed: e.target.value })
                    }
                  />
                </div>

                {/* Upload Completion Photo */}
                <div className="form-field-group">
                  <label>Upload Completion Photo (Evidence of Repair)</label>
                  <div className="photo-upload-zone">
                    <input
                      type="file"
                      id="completion-file-input"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="completion-file-input" className="upload-trigger-btn">
                      📷 Choose Photo from Device
                    </label>
                    <button
                      type="button"
                      className="preset-sample-btn"
                      onClick={handleUseSampleImage}
                    >
                      Use Demo Completion Photo
                    </button>
                  </div>

                  {/* Image Preview */}
                  {previewImage && (
                    <div className="completion-preview-box">
                      <img src={previewImage} alt="Completion preview" />
                      <span className="preview-label">✅ Ready for submission</span>
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setPreviewImage(null);
                          setWorkForm((p) => ({ ...p, completionImage: null }));
                        }}
                      >
                        × Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Remarks & Notes */}
                <div className="form-field-group">
                  <label>Remarks & Observations</label>
                  <textarea
                    rows={2}
                    placeholder="Any observations, curing instructions, or follow-up notes..."
                    value={workForm.remarks}
                    onChange={(e) => setWorkForm({ ...workForm, remarks: e.target.value })}
                  />
                </div>

                {/* Submit buttons */}
                <div className="form-actions-row">
                  <button
                    type="button"
                    className="btn-draft-save"
                    onClick={handleSaveDraft}
                  >
                    💾 Save Draft
                  </button>

                  <button type="submit" className="btn-mark-completed">
                    ✅ Mark Work Completed & Submit
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STATE 3: If Resolved / Completed */}
          {(complaint.status === "RESOLVED" || complaint.status === "COMPLETED") && (
            <div className="work-action-card resolved-summary-card">
              <div className="resolved-banner-top">
                <div className="check-circle">✓</div>
                <div>
                  <h2>Repair Completed & Resolved</h2>
                  <p>Submitted for Field Manager Inspection & Quality Verification.</p>
                </div>
              </div>

              {/* Before & After Comparison */}
              <div className="before-after-grid">
                <div className="comparison-box">
                  <span className="comparison-tag before">BEFORE REPAIR</span>
                  {complaint.reportedImage ? (
                    <img src={complaint.reportedImage} alt="Before" />
                  ) : (
                    <div className="placeholder">No photo</div>
                  )}
                </div>

                <div className="comparison-box">
                  <span className="comparison-tag after">AFTER REPAIR</span>
                  {complaint.completionImage || previewImage ? (
                    <img src={complaint.completionImage || previewImage} alt="After" />
                  ) : (
                    <div className="placeholder">Photo attached</div>
                  )}
                </div>
              </div>

              {/* Log Summary */}
              <div className="resolved-summary-details">
                <div className="summary-row">
                  <strong>Work Description:</strong>
                  <p>{complaint.workDescription || "Repair completed and surface restored."}</p>
                </div>
                <div className="summary-row">
                  <strong>Materials Used:</strong>
                  <p>{complaint.materialsUsed || "Standard masonry paving blocks & mortar."}</p>
                </div>
                {complaint.remarks && (
                  <div className="summary-row">
                    <strong>Remarks:</strong>
                    <p>{complaint.remarks}</p>
                  </div>
                )}
              </div>

              <div className="resolved-footer-actions">
                <button
                  className="btn-reopen-edit"
                  onClick={() => {
                    setComplaint({ ...complaint, status: "IN_PROGRESS" });
                  }}
                >
                  ✏️ Edit Work Log / Add Extra Photos
                </button>
                <Link to="/worker/my-complaints" className="btn-back-queue">
                  Back to My Task Queue →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal for Zoom */}
      {imageModal && (
        <div className="image-zoom-overlay" onClick={() => setImageModal(null)}>
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom-btn" onClick={() => setImageModal(null)}>
              ×
            </button>
            <img src={imageModal} alt="Enlarged damage" />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerComplaintDetails;
