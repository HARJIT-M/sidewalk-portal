import { useCallback, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getWorkerComplaintDetails,
  startComplaintWork,
  submitWorkUpdate,
} from "../../services/workerApi";
import "./WorkerComplaintDetails.css";

const WorkerComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successAlert, setSuccessAlert] = useState("");
  const [errorAlert, setErrorAlert] = useState("");

  // Work Update Form State
  const [workStatus, setWorkStatus] = useState("In Progress");
  const [workDescription, setWorkDescription] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [remarks, setRemarks] = useState("");
  const [completionImage, setCompletionImage] = useState(null);

  const getStatusDisplay = (status) => {
    if (!status) return "Pending";
    const s = status.toUpperCase();
    if (s === "ASSIGNED" || s === "PENDING") return "Pending";
    if (s === "IN_PROGRESS" || s === "IN PROGRESS") return "In Progress";
    if (s === "RESOLVED" || s === "COMPLETED" || s === "CLOSED") return "Completed";
    return status;
  };

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setErrorAlert("");
      const res = await getWorkerComplaintDetails(id);
      if (!res?.success || !res.complaint) {
        throw new Error(res?.message || "Complaint details not found.");
      }
      const found = res.complaint;
      setComplaint(found);
      setWorkDescription(found.workDescription || "");
      setMaterialsUsed(found.materialsUsed || "");
      setRemarks(found.remarks || "");

      // Completion image fallback
      const compImg =
        found.completionImage ||
        found.afterImage ||
        (Array.isArray(found.images) &&
          found.images.find((img) => img.type === "AFTER")?.url) ||
        null;
      setCompletionImage(compImg);

      const normalizedStatus = (found.status || "").toUpperCase();
      if (
        normalizedStatus === "RESOLVED" ||
        normalizedStatus === "COMPLETED" ||
        normalizedStatus === "CLOSED"
      ) {
        setWorkStatus("Completed");
      } else if (
        normalizedStatus === "IN_PROGRESS" ||
        normalizedStatus === "IN PROGRESS"
      ) {
        setWorkStatus("In Progress");
      } else {
        setWorkStatus("Pending");
      }
    } catch (err) {
      console.error("Error loading complaint details:", err);
      setErrorAlert(
        err.response?.data?.message ||
          err.message ||
          "Failed to load complaint details from server."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDetails, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDetails]);

  // Quick Action: Start Work
  const handleStartWork = async () => {
    try {
      setSubmitting(true);
      setErrorAlert("");
      const res = await startComplaintWork(id, {
        description: "Repair started on-site.",
      });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to start repair work.");
      }
      setSuccessAlert(res.message || "Repair work started on-site.");
      setWorkStatus("In Progress");
      await loadDetails();
      setTimeout(() => setSuccessAlert(""), 4000);
    } catch (err) {
      console.error("Failed to start work:", err);
      setErrorAlert(
        err.response?.data?.message ||
          err.message ||
          "Failed to update work status."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorAlert("Selected file is larger than 10MB. Please choose a smaller photo.");
        return;
      }
      setErrorAlert("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDemoPhoto = () => {
    const demoUrl =
      "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=900&q=80";
    setCompletionImage(demoUrl);
  };

  const handleRemoveImage = () => {
    setCompletionImage(null);
    const fileInput = document.getElementById("worker-photo-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Submit Work Update
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!workDescription.trim()) {
      setErrorAlert("Please enter a description of the work performed.");
      return;
    }

    if (workStatus === "Completed" && !completionImage) {
      setErrorAlert(
        "Please attach a completion photo (or click 'Use Demo Photo') as proof of repair before completing."
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorAlert("");

      const payload = {
        status: workStatus,
        workDescription: workDescription.trim(),
        materialsUsed: materialsUsed.trim(),
        remarks: remarks.trim(),
        completionImage,
      };

      const res = await submitWorkUpdate(id, payload);
      if (res?.success) {
        setSuccessAlert(
          workStatus === "Completed"
            ? "Work marked as Completed and submitted for Manager verification!"
            : "Work progress logged successfully!"
        );
        await loadDetails();
        setTimeout(() => setSuccessAlert(""), 4000);
      } else {
        throw new Error(res?.message || "Failed to submit work update.");
      }
    } catch (err) {
      console.error("Failed to submit work update:", err);
      setErrorAlert(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit work update."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !complaint) {
    return (
      <div className="complaint-details-page">
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
          <h2>Loading complaint details from MongoDB...</h2>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="complaint-details-page">
        <div className="no-complaints">
          <h3>Complaint Not Found</h3>
          <p>Could not load the requested complaint details.</p>
          <button
            className="primary-action-btn"
            onClick={() => navigate("/worker/my-complaints")}
            style={{ marginTop: "16px" }}
          >
            ← Back to Complaints
          </button>
        </div>
      </div>
    );
  }

  const currentDisplayStatus = getStatusDisplay(complaint.status);
  const isResolved = currentDisplayStatus === "Completed";
  const citizenPhoto =
    complaint.reportedImage ||
    complaint.image ||
    (Array.isArray(complaint.images) &&
      complaint.images.find((img) => img.type === "BEFORE")?.url) ||
    (Array.isArray(complaint.images) && complaint.images[0]?.url) ||
    null;

  return (
    <div className="complaint-details-page">
      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="page-header">
        <div>
          <h1>Complaint Details — {complaint.id}</h1>
          <p>View reported issue details, update repair notes, and log materials</p>
        </div>

        <button
          className="header-back-btn"
          onClick={() => navigate("/worker/my-complaints")}
        >
          ← Back to Complaints
        </button>
      </div>

      {successAlert && (
        <div
          className="details-alert-box"
          style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}
        >
          <span>✅ {successAlert}</span>
        </div>
      )}

      {errorAlert && (
        <div
          className="details-alert-box"
          style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}
        >
          <span>⚠️ {errorAlert}</span>
        </div>
      )}

      {/* =========================
          DETAILS GRID LAYOUT
      ========================= */}
      <div className="details-main-grid">
        {/* LEFT CARD: Citizen Report Overview */}
        <div className="details-card">
          <div className="card-top-title">
            <h2>{complaint.issue || complaint.title || "Footpath Repair"}</h2>
            <div className="card-badge-row">
              <span className={`priority ${(complaint.priority || "MEDIUM").toLowerCase()}`}>
                {complaint.priority}
              </span>
              <span
                className={`status ${currentDisplayStatus
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {currentDisplayStatus}
              </span>
            </div>
          </div>

          <div className="meta-field-group">
            <div className="meta-field full-width">
              <label>Location</label>
              <p>📍 {complaint.location}</p>
              {(complaint.locality || complaint.city) && (
                <span className="landmark-hint">
                  {[complaint.locality, complaint.city, complaint.state]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              {complaint.landmark && (
                <span className="landmark-hint">Landmark: {complaint.landmark}</span>
              )}
              {Number.isFinite(complaint.latitude) && Number.isFinite(complaint.longitude) && (
                <div style={{ marginTop: "8px" }}>
                  <span className="landmark-hint" style={{ display: "block", marginBottom: "6px" }}>
                    Coordinates: {complaint.latitude}, {complaint.longitude}
                  </span>
                  <a
                    href={
                      complaint.navigationUrl ||
                      `https://www.google.com/maps/dir/?api=1&destination=${complaint.latitude},${complaint.longitude}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="primary-action-btn"
                    style={{ padding: "8px 14px", fontSize: "13px" }}
                  >
                    📍 Open exact location in Maps
                  </a>
                </div>
              )}
            </div>

            <div className="meta-field">
              <label>Reported Date</label>
              <p>{complaint.reportedDate || "N/A"}</p>
            </div>

            <div className="meta-field">
              <label>Assigned Date</label>
              <p>{complaint.assignedDate || "Assigned"}</p>
            </div>

            <div className="meta-field full-width">
              <label>Scheduled Work Window</label>
              <p>
                {complaint.scheduledStartAt
                  ? new Date(complaint.scheduledStartAt).toLocaleDateString()
                  : "Not scheduled"}
                {complaint.scheduledEndAt &&
                  ` – ${new Date(complaint.scheduledEndAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          <div className="meta-field full-width">
            <label>Citizen Description</label>
            <div className="description-container">
              {complaint.description || "No description provided."}
            </div>
          </div>

          <div className="meta-field full-width">
            <label>Reported Damage Photo (Citizen Evidence)</label>
            {citizenPhoto ? (
              <div className="photo-preview-wrap">
                <img src={citizenPhoto} alt="Reported damage" />
              </div>
            ) : (
              <div className="no-photo-box">No photo attached by citizen</div>
            )}
          </div>

          {/* If Pending, Quick Action Button */}
          {currentDisplayStatus === "Pending" && (
            <div className="quick-start-box">
              <p>You have been assigned this task. Start repair on-site:</p>
              <button
                className="primary-action-btn"
                onClick={handleStartWork}
                disabled={submitting}
                style={{ width: "auto", padding: "10px 18px" }}
              >
                {submitting ? "Starting..." : "🚀 Start Work Now"}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT CARD: Work Execution & Update Form */}
        <div className="details-card" id="work-update-section">
          <div className="card-top-title">
            <h2>
              {isResolved
                ? "Repair Log & Completion Details"
                : "Update Work Status & Repair Log"}
            </h2>
            {isResolved && (
              <span className="status completed">Verified Complete</span>
            )}
          </div>

          {isResolved ? (
            <div className="completed-summary-box">
              <div className="resolved-banner">
                <span>
                  {complaint.status === "CLOSED"
                    ? "🎉 This repair has been verified and closed by the Field Manager. Work is complete."
                    : "✅ This repair has been marked as Completed and submitted for Manager verification."}
                </span>
              </div>

              <div className="completed-details-card">
                <div className="completed-field">
                  <span className="field-lbl">Current Lifecycle Status</span>
                  <div style={{ marginTop: "4px" }}>
                    <span className="status completed">
                      {complaint.status === "CLOSED" ? "Closed & Verified" : "Completed / In Review"}
                    </span>
                  </div>
                </div>

                <div className="completed-field">
                  <span className="field-lbl">Work Performed</span>
                  <p className="field-val-text">
                    {complaint.workDescription || workDescription || "Repair completed on-site."}
                  </p>
                </div>

                <div className="completed-field">
                  <span className="field-lbl">Materials Used</span>
                  <p className="field-val-text">
                    {complaint.materialsUsed || materialsUsed || "No materials specified."}
                  </p>
                </div>

                {(complaint.remarks || remarks) && (
                  <div className="completed-field">
                    <span className="field-lbl">Worker Remarks</span>
                    <p className="field-val-text">{complaint.remarks || remarks}</p>
                  </div>
                )}

                {completionImage && (
                  <div className="completed-field">
                    <span className="field-lbl">Submitted Completion Proof Photo</span>
                    <div className="submitted-proof-shot">
                      <img
                        src={completionImage}
                        alt="Completion proof"
                        className="submitted-proof-img"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitUpdate} className="work-form-container">
              <div className="form-group">
                <label>Work Status</label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                >
                  <option value="In Progress">In Progress (Active On-Site Repair)</option>
                  <option value="Completed">Completed (Submit for Verification)</option>
                  <option value="Pending">Pending (Not Started / On Hold)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Work Description *</label>
                <textarea
                  rows={3}
                  placeholder="Describe repairs performed (e.g., Replaced broken paver blocks, leveled mortar base, cleared debris)..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Materials Used</label>
                <input
                  type="text"
                  placeholder="e.g. 15 Paver Blocks, 1 bag cement, sand mix"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Completion Photo {workStatus === "Completed" && <span style={{ color: "#dc2626" }}>*</span>}</label>
                <div className="photo-upload-row">
                  <input
                    type="file"
                    id="worker-photo-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="worker-photo-upload" className="file-upload-btn">
                    📷 Choose File
                  </label>
                  <button
                    type="button"
                    className="demo-photo-btn"
                    onClick={handleUseDemoPhoto}
                  >
                    Use Demo Photo
                  </button>
                </div>

                {completionImage && (
                  <div className="uploaded-photo-preview">
                    <img src={completionImage} alt="Completion preview" />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={handleRemoveImage}
                    >
                      × Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Remarks & Observations</label>
                <textarea
                  rows={2}
                  placeholder="Any special remarks or follow-up notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="form-btn-row">
                <button
                  type="submit"
                  className="primary-action-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving to MongoDB..."
                    : workStatus === "Completed"
                    ? "✓ Mark as Completed & Submit"
                    : "Save Progress Update"}
                </button>
              </div>
            </form>
          )}

          {/* Repair Timeline History */}
          <div className="history-section">
            <h3>Repair & Status History (MongoDB)</h3>
            <div className="history-timeline">
              {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
                complaint.statusHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-dot"></div>
                    <div className="history-content">
                      <div className="history-header">
                        <strong>{item.status}</strong>
                        <span>{item.date}</span>
                      </div>
                      <p>{item.note}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "13px" }}>
                  No timeline history logged yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerComplaintDetails;
