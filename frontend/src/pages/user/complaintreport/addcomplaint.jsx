// addcomplaint.jsx
import React, { useState } from "react";
import {
  FileText,
  MapPin,
  Image as ImageIcon,
  Upload,
  Camera,
  X,
  CheckCircle2,
  Navigation,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import "./addcomplaint.css";

const ISSUE_TYPES = [
  { value: "Broken Footpath", label: "Broken Footpath" },
  { value: "Pothole", label: "Pothole" },
  { value: "Crack", label: "Footpath Crack" },
  { value: "Damaged Sidewalk", label: "Damaged Sidewalk" },
  { value: "Uneven Surface", label: "Uneven Surface" },
  { value: "Other", label: "Other" },
];

const ReportComplaint = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issueType: "",
    location: "",
    area: "",
  });

  const [images, setImages] = useState([]);
  const [uploadMode, setUploadMode] = useState("upload"); // "upload" | "capture"

  const [coords, setCoords] = useState(null); // { lat, lng }
  const [locationStatus, setLocationStatus] = useState("idle");
  // idle | loading | success | error

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const selectIssueType = (value) => {
    setFormData((prev) => ({ ...prev, issueType: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    const newImages = files.map((file) => ({
      file: file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoords({ lat, lng });
        setLocationStatus("success");

        // Try reverse geocoding to fill the location text field.
        // Uses OpenStreetMap's free Nominatim API — no key required.
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          const data = await res.json();

          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              location: data.display_name,
            }));
          }

          // Pull the most relevant "area" / neighbourhood level from
          // the structured address, falling back gracefully.
          const addr = data?.address || {};
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.town ||
            addr.city_district ||
            addr.county ||
            addr.city ||
            "";

          if (area) {
            setFormData((prev) => ({
              ...prev,
              area,
            }));
          }
        } catch (err) {
          // Reverse geocoding failed — coordinates are still captured,
          // so the complaint remains valid, just without an auto-filled address.
          console.error("Reverse geocoding failed:", err);
        }
      },
      (error) => {
        setLocationStatus("error");

        if (error.code === error.PERMISSION_DENIED) {
          alert(
            "Location access was denied. Please enable location permissions or enter the address manually."
          );
        } else {
          alert("Unable to fetch your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Complaint:", { ...formData, coordinates: coords });
    console.log("Images:", images);

    alert("Complaint submitted successfully!");
  };

  // ------- progress calculation (purely visual) -------
  const requiredFields = ["title", "issueType", "description", "location", "area"];
  const filledCount = requiredFields.filter((key) => formData[key]).length;
  const progressPercent = Math.round(
    (filledCount / requiredFields.length) * 100
  );

  return (
    <div className="report-page">

      {/* ============================
          HEADER
      ============================ */}

      <div className="report-header">
        <div className="report-header-inner">
          <div className="report-header-icon">
            <FileText size={26} strokeWidth={2} />
          </div>

          <div>
            <span className="report-header-badge">
              <Sparkles size={12} strokeWidth={2.5} /> New Complaint
            </span>
            <h1>Report a Footpath Issue</h1>
            <p>
              Help us improve pedestrian safety by reporting damaged
              footpaths and sidewalks.
            </p>
          </div>
        </div>

        <div className="report-progress">
          <div className="report-progress-track">
            <div
              className="report-progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span>{progressPercent}% complete</span>
        </div>
      </div>


      <div className="report-layout">

        {/* ============================
            FORM
        ============================ */}

        <form
          id="report-complaint-form"
          className="report-form"
          onSubmit={handleSubmit}
        >

          {/* Complaint Details */}
          <div className="form-card">
            <div className="form-card-heading">
              <span className="form-card-icon">
                <FileText size={17} strokeWidth={2} />
              </span>
              <div>
                <h2>Complaint Details</h2>
                <p>Describe what's wrong and where it's happening</p>
              </div>
            </div>

            <div className="form-group">
              <label>Complaint Title</label>
              <input
                type="text"
                name="title"
                placeholder="Example: Broken footpath near bus stand"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Issue Type</label>

              <div className="chip-group">
                {ISSUE_TYPES.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={`chip ${
                      formData.issueType === item.value ? "active" : ""
                    }`}
                    onClick={() => selectIssueType(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* hidden select keeps native form semantics / required validation */}
              <select
                name="issueType"
                className="chip-native-select"
                value={formData.issueType}
                onChange={handleChange}
                required
                tabIndex={-1}
                aria-hidden="true"
              >
                <option value="">Select issue type</option>
                {ISSUE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Describe the problem in detail..."
                rows="5"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>


          {/* Location */}
          <div className="form-card">
            <div className="form-card-heading">
              <span className="form-card-icon location-icon">
                <MapPin size={17} strokeWidth={2} />
              </span>
              <div>
                <h2>Location</h2>
                <p>Pinpoint where the issue is located</p>
              </div>
            </div>

            <div className="form-group">
              <label>Address / Landmark</label>

              <div className="location-input-row">
                <input
                  type="text"
                  name="location"
                  placeholder="Example: Gandhi Road, near bus stand"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="share-location-btn"
                  onClick={handleShareLocation}
                  disabled={locationStatus === "loading"}
                >
                  {locationStatus === "loading" ? (
                    <>
                      <span className="location-spinner"></span>
                      Locating...
                    </>
                  ) : (
                    <>
                      <Navigation size={14} strokeWidth={2.5} />
                      Share Location
                    </>
                  )}
                </button>
              </div>

              {locationStatus === "success" && coords && (
                <div className="coords-display">
                  <span className="coords-badge">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    Location captured
                  </span>
                  <span className="coords-text">
                    Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                  </span>
                </div>
              )}

              {locationStatus === "error" && (
                <div className="coords-error">
                  <AlertCircle size={14} strokeWidth={2.5} />
                  Couldn't fetch your location. You can still type the
                  address manually.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                Area
                {formData.area && (
                  <span className="auto-filled-tag">Auto-filled</span>
                )}
              </label>

              <input
                type="text"
                name="area"
                placeholder="Example: Gandhipuram, RS Puram..."
                value={formData.area}
                onChange={handleChange}
                required
              />
            </div>
          </div>


          {/* Image Upload */}
          <div className="form-card">
            <div className="form-card-heading">
              <span className="form-card-icon photo-icon">
                <ImageIcon size={17} strokeWidth={2} />
              </span>
              <div>
                <h2>Upload Images</h2>
                <p>Photos help our team assess the issue faster</p>
              </div>
            </div>

            <div className="upload-toggle">
              <button
                type="button"
                className={`upload-toggle-option ${
                  uploadMode === "upload" ? "active" : ""
                }`}
                onClick={() => setUploadMode("upload")}
              >
                <Upload size={14} strokeWidth={2.5} />
                Upload Photo
              </button>

              <button
                type="button"
                className={`upload-toggle-option ${
                  uploadMode === "capture" ? "active" : ""
                }`}
                onClick={() => setUploadMode("capture")}
              >
                <Camera size={14} strokeWidth={2.5} />
                Capture Photo
              </button>
            </div>

            {uploadMode === "upload" ? (
              <label className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />

                <div className="upload-icon">
                  <Upload size={20} strokeWidth={2.2} />
                </div>

                <h3>Click to upload images</h3>
                <p>PNG, JPG or JPEG · up to 10 photos</p>
              </label>
            ) : (
              <label className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                />

                <div className="upload-icon camera-icon">
                  <Camera size={20} strokeWidth={2.2} />
                </div>

                <h3>Click to capture photo</h3>
                <p>Uses your device camera</p>
              </label>
            )}

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="image-grid">
                {images.map((image, index) => (
                  <div className="image-preview" key={index}>
                    <img src={image.preview} alt={`Uploaded ${index + 1}`} />

                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit (mobile inline actions, hidden on desktop where sidebar handles it) */}
          <div className="form-actions mobile-only">
            <button type="button" className="cancel-button">
              Cancel
            </button>

            <button type="submit" className="submit-button">
              Submit Complaint
            </button>
          </div>

        </form>


        {/* ============================
            SIDEBAR
        ============================ */}

        <aside className="report-sidebar">

          <div className="summary-card">
            <h3>Complaint Summary</h3>

            <div className="summary-row">
              <span>Title</span>
              <strong>{formData.title || "—"}</strong>
            </div>

            <div className="summary-row">
              <span>Issue Type</span>
              <strong>{formData.issueType || "—"}</strong>
            </div>

            <div className="summary-row">
              <span>Location</span>
              <strong className="truncate">
                {formData.location || "—"}
              </strong>
            </div>

            <div className="summary-row">
              <span>Photos</span>
              <strong>{images.length} attached</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="form-actions">
              <button type="button" className="cancel-button">
                Cancel
              </button>

              <button
                type="submit"
                form="report-complaint-form"
                className="submit-button"
                onClick={handleSubmit}
              >
                Submit Complaint
              </button>
            </div>
          </div>

          <div className="tips-card">
            <h3>Tips for a great report</h3>

            <ul>
              <li>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                Use clear, well-lit photos of the damage
              </li>
              <li>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                Share your live location for accurate mapping
              </li>
              <li>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                Mention nearby landmarks in the description
              </li>
            </ul>
          </div>

        </aside>

      </div>

    </div>
  );
};

export default ReportComplaint;