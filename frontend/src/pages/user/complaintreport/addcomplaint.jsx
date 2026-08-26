import React, { useState } from "react";
import "./addcomplaint.css";

const ReportComplaint = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issueType: "",
    location: "",
    area: "",
  });

  const [images, setImages] = useState([]);
  const [uploadMode, setUploadMode] = useState("upload");

  const [coords, setCoords] = useState(null); 
  const [locationStatus, setLocationStatus] = useState("idle");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

    (async () => {
      try {
        const payload = {
          title: formData.title,
          description: formData.description,
          issueType: formData.issueType,
          location: formData.location,
          area: formData.area,
          latitude: coords?.lat,
          longitude: coords?.lng,
        };

        // send to backend
        const api = (await import("../../../services/api")).default;
        await api.post("/complaints", payload);
        alert("Complaint submitted successfully!");
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || "Failed to submit complaint");
      }
    })();
  };

  return (
    <div className="report-page">
      {/* Header */}
      <div className="report-header">
        <div>
          <span className="report-header-badge">New Complaint</span>
          <h1>Report a Footpath Issue</h1>
          <p>
            Help us improve pedestrian safety by reporting damaged
            footpaths and sidewalks.
          </p>
        </div>
      </div>

      <form className="report-form" onSubmit={handleSubmit}>
        {/* Complaint Details */}
        <div className="form-card">
          <div className="form-card-heading">
            <span className="form-card-icon">📝</span>
            <h2>Complaint Details</h2>
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
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              required
            >
              <option value="">Select issue type</option>
              <option value="BROKEN_FOOTPATH">Broken Footpath</option>
              <option value="POTHOLE">Pothole</option>
              <option value="CRACK">Footpath Crack</option>
              <option value="DAMAGED_PAVEMENT ">Damaged Sidewalk</option>
              <option value="OBSTRUCTION">Uneven Surface</option>
              <option value="OTHER">Other</option>
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

          <div className="form-group">
            <label>Location</label>

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
                  <>📍 Share Location</>
                )}
              </button>
            </div>

            {locationStatus === "success" && coords && (
              <div className="coords-display">
                <span className="coords-badge">
                  ✓ Location captured
                </span>
                <span className="coords-text">
                  Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                </span>
              </div>
            )}

            {locationStatus === "error" && (
              <div className="coords-error">
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
            <span className="form-card-icon">🖼️</span>
            <h2>Upload Images</h2>
          </div>

          <p className="upload-description">
            Upload photos showing the damaged footpath or sidewalk. You
            can upload multiple images.
          </p>

          <div className="upload-toggle">
            <button
              type="button"
              className={`upload-toggle-option ${
                uploadMode === "upload" ? "active" : ""
              }`}
              onClick={() => setUploadMode("upload")}
            >
              Upload Photo
            </button>

            <button
              type="button"
              className={`upload-toggle-option ${
                uploadMode === "capture" ? "active" : ""
              }`}
              onClick={() => setUploadMode("capture")}
            >
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

              <div className="upload-icon">↑</div>

              <h3>Click to upload images</h3>
              <p>PNG, JPG or JPEG</p>
            </label>
          ) : (
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
              />

              <div className="upload-icon camera-icon">📷</div>

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
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="button" className="cancel-button">
            Cancel
          </button>

          <button type="submit" className="submit-button">
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportComplaint;