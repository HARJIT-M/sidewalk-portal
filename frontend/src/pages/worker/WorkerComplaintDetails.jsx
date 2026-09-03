import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStoredComplaints,
  saveStoredComplaints,
  getStoredProfile,
  getStoredNotifications,
  saveStoredNotifications,
} from "./workerData";
import "./WorkerComplaintDetails.css";

const WorkerComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [profile, setProfile] = useState(null);
  const [successAlert, setSuccessAlert] = useState("");

  // Work Update Form State
  const [workStatus, setWorkStatus] = useState("In Progress");
  const [workDescription, setWorkDescription] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [remarks, setRemarks] = useState("");
  const [completionImage, setCompletionImage] = useState(null);

  useEffect(() => {
    const allComplaints = getStoredComplaints();
    const found = allComplaints.find((c) => c.id === id) || allComplaints[0];
    if (found) {
      setComplaint(found);
      setWorkDescription(found.workDescription || "");
      setMaterialsUsed(found.materialsUsed || "");
      setRemarks(found.remarks || "");
      setCompletionImage(found.completionImage || null);
      if (found.status === "RESOLVED" || found.status === "COMPLETED") {
        setWorkStatus("Completed");
      } else if (found.status === "IN_PROGRESS") {
        setWorkStatus("In Progress");
      } else {
        setWorkStatus("Pending");
      }
    }
    setProfile(getStoredProfile());
  }, [id]);

  if (!complaint) {
    return (
      <div className="complaint-details-page">
        <div className="no-complaints">
          <p>Loading complaint details...</p>
        </div>
      </div>
    );
  }

  // Quick Action: Start Work
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
        ...(complaint.statusHistory || []),
        {
          status: "IN_PROGRESS",
          date: timestamp,
          note: `Work started on-site by ${profile?.name || "Worker"}.`,
        },
      ],
      repairHistory: [
        ...(complaint.repairHistory || []),
        {
          time: timestamp,
          action: "Safety barricades placed and repair work initiated.",
        },
      ],
    };

    updateComplaintInStore(updated);
    setComplaint(updated);
    setWorkStatus("In Progress");
    setSuccessAlert("Work status updated to In Progress!");
    setTimeout(() => setSuccessAlert(""), 4000);
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
  const handleSubmitUpdate = (e) => {
    e.preventDefault();

    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isCompleted = workStatus === "Completed";
    const mappedStatus = isCompleted ? "RESOLVED" : "IN_PROGRESS";

    const updated = {
      ...complaint,
      status: mappedStatus,
      workDescription: workDescription,
      materialsUsed: materialsUsed,
      remarks: remarks,
      completionImage: completionImage,
      statusHistory: [
        ...(complaint.statusHistory || []),
        {
          status: mappedStatus,
          date: timestamp,
          note: isCompleted
            ? `Repair marked Completed by ${profile?.name || "Worker"}. Awaiting Manager verification.`
            : `Work progress updated: ${workDescription.slice(0, 40) || "On-site progress logged."}`,
        },
      ],
      repairHistory: [
        ...(complaint.repairHistory || []),
        {
          time: timestamp,
          action: isCompleted
            ? "Repair completed, evidence uploaded, submitted for manager sign-off."
            : `Work updated: ${workDescription.slice(0, 50) || "Progress recorded."}`,
        },
      ],
    };

    updateComplaintInStore(updated);
    setComplaint(updated);

    // Notify
    if (isCompleted) {
      const currentNotifs = getStoredNotifications();
      saveStoredNotifications([
        {
          id: `NOTIF-${Date.now()}`,
          type: "STATUS_UPDATE",
          title: `Repair Completed: ${complaint.id}`,
          message: `You completed ${complaint.id}. Field manager review is queued.`,
          complaintId: complaint.id,
          time: "Just now",
          read: false,
          urgent: false,
        },
        ...currentNotifs,
      ]);
    }

    setSuccessAlert(
      isCompleted
        ? "Work successfully completed and submitted for Manager verification!"
        : "Work progress updated successfully!"
    );
    setTimeout(() => setSuccessAlert(""), 4000);
  };

  const updateComplaintInStore = (updatedObj) => {
    const all = getStoredComplaints();
    const mapped = all.map((c) => (c.id === updatedObj.id ? updatedObj : c));
    saveStoredComplaints(mapped);
  };

  const getStatusDisplay = (status) => {
    if (status === "ASSIGNED" || status === "PENDING") return "Pending";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED" || status === "COMPLETED") return "Completed";
    return status;
  };

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
        <div className="details-alert-box">
          <span>✅ {successAlert}</span>
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
              <span className={`priority ${complaint.priority?.toLowerCase()}`}>
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
              <p>{complaint.reportedDate}</p>
            </div>

            <div className="meta-field">
              <label>Assigned Date</label>
              <p>{complaint.assignedDate || "21 Aug 2026"}</p>
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
              <button className="primary-action-btn" onClick={handleStartWork}>
                🚀 Start Work Now
              </button>
            </div>
          )}
        </div>

        {/* RIGHT CARD: Work Execution & Update Form */}
        <div className="details-card">
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
              <button type="submit" className="primary-action-btn">
                {workStatus === "Completed"
                  ? "✓ Mark as Completed & Submit"
                  : "Submit Work Update"}
              </button>
            </div>
          </form>

          {/* Repair Timeline History */}
          <div className="history-section">
            <h3>Repair & Status History</h3>
            <div className="history-timeline">
              {complaint.statusHistory &&
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
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerComplaintDetails;
