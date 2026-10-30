// addcomplaint.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import userApi from "../../../services/userApi";
import MapPicker from "../../../components/MapPicker";
import "./addcomplaint.css";

const ISSUE_TYPES = [
  { value: "BROKEN_FOOTPATH", label: "Broken Footpath" },
  { value: "POTHOLE", label: "Pothole" },
  { value: "CRACK", label: "Footpath Crack" },
  { value: "BROKEN_SIDEWALK", label: "Damaged Sidewalk" },
  { value: "DAMAGED_PAVEMENT", label: "Uneven Surface" },
  { value: "OTHER", label: "Other" },
];

const MAX_IMAGES = 10;

const ReportComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issueType: "",
    address: "",
    landmark: "",
  });
  const [images, setImages] = useState([]);
  const [uploadMode, setUploadMode] = useState("upload");
  const [pin, setPinState] = useState(null);
  const [geocodedLocation, setGeocodedLocation] = useState(null);
  const [areaName, setAreaName] = useState("");
  const [areaStatus, setAreaStatus] = useState("idle");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef(null);
  const resolutionRef = useRef(0);
  const imagesRef = useRef([]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectIssueType = (value) => {
    setFormData((prev) => ({ ...prev, issueType: value }));
  };

  const revokePreview = (previewUrl) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = MAX_IMAGES - (imagesRef.current.length || images.length);
    const selectedFiles = files.slice(0, remainingSlots);

    if (selectedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const newImages = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    imagesRef.current = [...imagesRef.current, ...newImages];
    setImages(imagesRef.current);
    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed?.preview) revokePreview(removed.preview);
      const next = prev.filter((_, idx) => idx !== index);
      imagesRef.current = next;
      return next;
    });
  };

  const clearImagePreviews = () => {
    imagesRef.current.forEach((image) => revokePreview(image.preview));
    imagesRef.current = [];
    setImages([]);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      { headers: { "Accept-Language": "en" } }
    );
      const data = await response.json();
      const address = data?.address || {};
      return {
        address: data?.display_name || "",
        locality:
          address.neighbourhood ||
          address.suburb ||
          address.city_district ||
          address.village ||
          "",
        city:
          address.city ||
          address.town ||
          address.municipality ||
          address.county ||
          address.city_district ||
          "",
        state: address.state || "",
      };
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return null;
    }
  };

  const setPin = useCallback(
    async (lat, lng) => {
      const requestId = ++resolutionRef.current;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const nextPin = { lat, lng };
      setPinState(nextPin);
      setLocationStatus("success");
      setAreaStatus("detecting");
      setAreaName("");
      setGeocodedLocation(null);
      setFormData((prev) => ({ ...prev, address: "" }));

      const place = await reverseGeocode(lat, lng);
      if (requestId !== resolutionRef.current) return;
      setGeocodedLocation(place);
      if (place?.address) {
        setFormData((prev) => ({ ...prev, address: place.address }));
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const result = await userApi.resolveArea(lat, lng, {
            locality: place?.locality || "",
            city: place?.city || "",
            state: place?.state || "",
          });
          if (requestId !== resolutionRef.current) return;

          if (result?.success) {
            if (result.stateUnconfirmed) {
              setAreaStatus("state-unconfirmed");
              setAreaName("");
            } else if (result.requiresAdminRouting) {
              setAreaStatus("unconfigured");
              setAreaName(result.area?.name || "");
            } else {
              setAreaStatus("ok");
              setAreaName(result.area?.name || "");
            }
          } else {
            setAreaStatus("error");
            setAreaName("");
          }
        } catch (error) {
          if (requestId !== resolutionRef.current) return;
          const message = error.response?.data?.message || "";
          setAreaStatus(
            message.includes("only in Tamil Nadu")
              ? "state-restricted"
              : "error"
          );
          setAreaName("");
        }
      }, 400);
    },
    []
  );

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPin(lat, lng);
      },
      (error) => {
        setLocationStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location access was denied. Please enable permissions or enter the address manually.");
        } else {
          alert("Unable to fetch your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredFieldsFilled =
      formData.title.trim() &&
      formData.issueType &&
      formData.description.trim() &&
      formData.address.trim() &&
      pin;

    if (!requiredFieldsFilled) {
      alert("Please select an issue type and location, and fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description.trim());
      form.append("issue_type", formData.issueType);
      form.append("address", formData.address.trim());
      if (formData.landmark?.trim()) form.append("landmark", formData.landmark.trim());
      form.append("latitude", String(pin.lat));
      form.append("longitude", String(pin.lng));
      if (geocodedLocation?.locality) {
        form.append("locality", geocodedLocation.locality);
      }
      if (geocodedLocation?.city) {
        form.append("city", geocodedLocation.city);
      }
      if (geocodedLocation?.state) {
        form.append("state", geocodedLocation.state);
      }

      images.forEach((image) => form.append("images", image.file));

      const response = await userApi.submitComplaint(form);

      if (response.success) {
        alert(response.message || "Complaint submitted successfully!");
        setFormData({
          title: "",
          description: "",
          issueType: "",
          address: "",
          landmark: "",
        });
        setPinState(null);
        setGeocodedLocation(null);
        setAreaName("");
        setAreaStatus("idle");
        setLocationStatus("idle");
        clearImagePreviews();
      } else {
        alert(response.message || "Failed to submit complaint.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert(error.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      imagesRef.current.forEach((image) => revokePreview(image.preview));
    };
  }, []);

  const requiredFields = ["title", "issueType", "description", "address"];
  const filledCount = requiredFields.filter((field) => {
    if (field === "issueType") return Boolean(formData.issueType);
    return Boolean(formData[field]?.trim());
  }).length;
  const progressPercent = Math.round((filledCount / requiredFields.length) * 100);
  const isSubmitDisabled =
    isSubmitting ||
    !pin ||
    !formData.title.trim() ||
    !formData.issueType ||
    !formData.description.trim() ||
    !formData.address.trim();

  return (
    <div className="report-page">
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
              Help us improve pedestrian safety by reporting damaged footpaths and sidewalks.
            </p>
          </div>
        </div>

        <div className="report-progress">
          <div className="report-progress-track">
            <div className="report-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span>{progressPercent}% complete</span>
        </div>
      </div>

      <div className="report-layout">
        <form
          id="report-complaint-form"
          className="report-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-card">
            <div className="form-card-heading">
              <span className="form-card-icon">
                <FileText size={17} strokeWidth={2} />
              </span>
              <div>
                <h2>Complaint Details</h2>
                <p>Describe what&apos;s wrong and where it&apos;s happening</p>
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
                    className={`chip ${formData.issueType === item.value ? "active" : ""}`}
                    onClick={() => selectIssueType(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
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
              <MapPicker value={pin} onPinSet={setPin} areaStatus={areaStatus} areaName={areaName} />
            </div>

            <div className="form-group">
              <label>Address</label>
              <div className="location-input-row">
                <input
                  type="text"
                  name="address"
                  placeholder="Example: Gandhi Road, near bus stand"
                  value={formData.address}
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
                      <span className="location-spinner" />
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

              {locationStatus === "success" && pin && (
                <div className="coords-display">
                  <span className="coords-badge">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    Location captured
                  </span>
                  <span className="coords-text">
                    Lat: {pin.lat.toFixed(6)}, Lng: {pin.lng.toFixed(6)}
                  </span>
                  {geocodedLocation?.state && (
                    <span className="coords-text">
                      {[geocodedLocation.locality, geocodedLocation.city, geocodedLocation.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                </div>
              )}

              {locationStatus === "error" && (
                <div className="coords-error">
                  <AlertCircle size={14} strokeWidth={2.5} />
                  Couldn&apos;t fetch your location. You can still type the address manually.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Landmark (optional)</label>
              <input
                type="text"
                name="landmark"
                placeholder="Example: Near metro station gate, opposite park"
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>
          </div>

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
                className={`upload-toggle-option ${uploadMode === "upload" ? "active" : ""}`}
                onClick={() => setUploadMode("upload")}
              >
                <Upload size={14} strokeWidth={2.5} />
                Upload Photo
              </button>
              <button
                type="button"
                className={`upload-toggle-option ${uploadMode === "capture" ? "active" : ""}`}
                onClick={() => setUploadMode("capture")}
              >
                <Camera size={14} strokeWidth={2.5} />
                Capture Photo
              </button>
            </div>

            {uploadMode === "upload" ? (
              <label className="upload-area">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
                <div className="upload-icon">
                  <Upload size={20} strokeWidth={2.2} />
                </div>
                <h3>Click to upload images</h3>
                <p>PNG, JPG or JPEG · up to {MAX_IMAGES} photos</p>
              </label>
            ) : (
              <label className="upload-area">
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} />
                <div className="upload-icon camera-icon">
                  <Camera size={20} strokeWidth={2.2} />
                </div>
                <h3>Click to capture photo</h3>
                <p>Uses your device camera</p>
              </label>
            )}

            {images.length > 0 && (
              <div className="image-grid">
                {images.map((image, index) => (
                  <div className="image-preview" key={`${image.preview}-${index}`}>
                    <img src={image.preview} alt={`Uploaded ${index + 1}`} />
                    <button type="button" className="remove-image" onClick={() => removeImage(index)}>
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions mobile-only">
            <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={isSubmitDisabled}>
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </form>

        <aside className="report-sidebar">
          <div className="summary-card">
            <h3>Complaint Summary</h3>

            <div className="summary-row">
              <span>Title</span>
              <strong>{formData.title || "—"}</strong>
            </div>

            <div className="summary-row">
              <span>Issue Type</span>
              <strong>{ISSUE_TYPES.find((item) => item.value === formData.issueType)?.label || "—"}</strong>
            </div>

            <div className="summary-row">
              <span>Area</span>
              <strong className="truncate">{areaName || "—"}</strong>
            </div>

            <div className="summary-row">
              <span>Location</span>
              <strong className="truncate">{formData.address || "—"}</strong>
            </div>

            <div className="summary-row">
              <span>Photos</span>
              <strong>{images.length} attached</strong>
            </div>

            <div className="summary-divider" />

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" form="report-complaint-form" className="submit-button" disabled={isSubmitDisabled}>
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
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