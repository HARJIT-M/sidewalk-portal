import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getWorkerComplaintDetails,
  startComplaintWork,
  submitWorkUpdate,
  getWorkerProfile,
} from "../../services/workerApi";
import "./WorkerComplaintDetails.css";

const WorkerComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [profile, setProfile] = useState(null);
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

  const loadDetails = async () => {
    try {
      setLoading(true);
      setErrorAlert("");
      const [res, profRes] = await Promise.allSettled([
        getWorkerComplaintDetails(id),
        getWorkerProfile(),
      ]);

      if (res.status === "fulfilled" && res.value.success) {
        const found = res.value.complaint;
        setComplaint(found);
        setWorkDescription(found.workDescription || "");
        setMaterialsUsed(found.materialsUsed || "");
        setRemarks(found.remarks || "");
        setCompletionImage(found.completionImage || null);
        if (found.status === "RESOLVED" || found.status === "COMPLETED" || found.status === "CLOSED") {
          setWorkStatus("Completed");
        } else if (found.status === "IN_PROGRESS") {
          setWorkStatus("In Progress");
        } else {
          setWorkStatus("Pending");
        }
      } else {
        setErrorAlert("Complaint details not found.");
      }

      if (profRes.status === "fulfilled" && profRes.value.success) {
        setProfile(profRes.value.profile);
      }
    } catch (err) {
      console.error("Error loading complaint details:", err);
      setErrorAlert("Failed to load complaint details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  // Quick Action: Start Work
  const handleStartWork = async () => {
    try {
      setSubmitting(true);
      setErrorAlert("");
      const res = await startComplaintWork(id);
      if (res.success) {
        setSuccessAlert("Work status updated to In Progress in MongoDB!");
        setWorkStatus("In Progress");
        await loadDetails();
        setTimeout(() => setSuccessAlert(""), 4000);
      }
    } catch (err) {
      console.error("Failed to start work:", err);
      setErrorAlert(err.response?.data?.message || "Failed to update work status.");
    } finally {
      setSubmitting(false);
    }
  };

  // Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  // Submit Work Update
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorAlert("");

      const payload = {
        status: workStatus,
        workDescription,
        materialsUsed,
        remarks,
        completionImage,
      };

      const res = await submitWorkUpdate(id, payload);
      if (res.success) {
        setSuccessAlert(
          workStatus === "Completed"
            ? "Work marked as Completed and submitted for Manager verification in MongoDB!"
            : "Work progress logged successfully to MongoDB!"
        );
        await loadDetails();
        setTimeout(() => setSuccessAlert(""), 4000);
      }
    } catch (err) {
      console.error("Failed to submit work update:", err);
      setErrorAlert(err.response?.data?.message || "Failed to submit work update.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = (status) => {
    if (status === "ASSIGNED" || status === "PENDING") return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "COMPLETED" || status === "CLOSED") return "Completed";
    return status || "Pending";
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
        <div className="details-alert-box" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>
          <span>✅ {successAlert}</span>
        </div>
      )}

      {errorAlert && (
        <div className="details-alert-box" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
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
            <h2>{complaint.issue}</h2>
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
            <div className="meta-field">
              <label>Location</label>
              <p>📍 {complaint.location}</p>
              {complaint.landmark && (
                <span className="landmark-hint">Landmark: {complaint.landmark}</span>
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
          </div>

          <div className="meta-field full-width">
            <label>Citizen Description</label>
            <div className="description-container">
              {complaint.description}
            </div>
          </div>

          <div className="meta-field full-width">
            <label>Reported Damage Photo (Citizen Evidence)</label>
            {complaint.reportedImage ? (
              <div className="photo-preview-wrap">
                <img src={complaint.reportedImage} alt="Reported damage" />
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
              >
                {submitting ? "Starting..." : "🚀 Start Work Now"}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT CARD: Work Execution & Update Form */}
        <div className="details-card" id="work-update-section">
          <div className="card-top-title">
            <h2>Update Work Status & Repair Log</h2>
          </div>

          <form onSubmit={handleSubmitUpdate} className="work-form-container">
            <div className="form-group">
              <label>Work Status</label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
              >
                <option value="In Progress">In Progress (Active Repair)</option>
                <option value="Completed">Completed (Submit for Verification)</option>
                <option value="Pending">Pending (Not Started)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Work Description *</label>
              <textarea
                rows={3}
                placeholder="Describe repairs performed (e.g., Replaced broken tiles, leveled base concrete)..."
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
              <label>Upload Completion Photo</label>
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
                    onClick={() => setCompletionImage(null)}
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
                  : "Submit Work Update"}
              </button>
            </div>
          </form>

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
