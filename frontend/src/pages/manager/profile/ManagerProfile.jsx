import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import {
  getManagerLocationOptions,
  getManagerProfile,
  updateManagerLocation,
} from "../../../services/managerApi";
import "./ManagerProfile.css";

const ManagerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [areas, setAreas] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [profileResult, areaResult] = await Promise.all([
        getManagerProfile(),
        getManagerLocationOptions(),
      ]);

      if (!profileResult?.success || !profileResult.profile) {
        throw new Error(profileResult?.message || "Unable to load manager profile.");
      }
      if (!areaResult?.success) {
        throw new Error(areaResult?.message || "Unable to load service areas.");
      }

      setProfile(profileResult.profile);
      setAreas(Array.isArray(areaResult.areas) ? areaResult.areas : []);
      setLocationId(profileResult.profile.location?.id || "");
    } catch (loadError) {
      console.error("Failed to load manager profile:", loadError);
      setError(loadError.message || "Unable to load manager profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadProfile, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  const handleSaveLocation = async (event) => {
    event.preventDefault();
    if (!locationId) {
      setError("Select a service area before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const result = await updateManagerLocation(locationId);
      if (!result?.success || !result.location) {
        throw new Error(result?.message || "Unable to update service area.");
      }

      const updatedLocation = result.location;
      setProfile((current) => ({
        ...current,
        location: updatedLocation,
        city:
          updatedLocation.type === "CITY"
            ? updatedLocation.name
            : current.city,
        zone:
          updatedLocation.type === "CITY"
            ? ""
            : updatedLocation.name,
      }));
      setSuccess(result.message || "Service area updated.");
    } catch (saveError) {
      console.error("Failed to update manager service area:", saveError);
      setError(saveError.message || "Unable to update service area.");
    } finally {
      setSaving(false);
    }
  };

  const selectedArea = areas.find((area) => area.id === locationId);
  const stats = profile?.stats || {};

  const statCards = [
    { label: "Active workers", value: stats.activeWorkers ?? 0, icon: UsersRound, tone: "workers" },
    { label: "Assigned complaints", value: stats.totalComplaints ?? 0, icon: Building2, tone: "complaints" },
    { label: "Active repairs", value: stats.activeRepairs ?? 0, icon: Wrench, tone: "repairs" },
  ];

  if (loading && !profile) {
    return (
      <main className="mp-page">
        <div className="mp-loading">
          <div className="mp-loader" aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </div>
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mp-page">

      {/* =========================
          HERO
      ========================= */}
      <header className="mp-hero">
        <div className="mp-hero-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="mp-hero-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>

        <div className="mp-hero-text">
          <span className="mp-hero-tag">
            <UserRound size={14} strokeWidth={2.4} /> Manager Portal
          </span>
          <h1>My Profile</h1>
          <p>Review your account details and manage your service area.</p>
        </div>

        <div className="mp-hero-chip">
          <div className="mp-hero-avatar">
            {profile?.name?.trim()?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div>
            <h3>{profile?.name || "Manager"}</h3>
            <span>{profile?.location?.name || "No service area"}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="mp-alert error" role="alert">
          <AlertCircle size={18} strokeWidth={2.2} />
          {error}
        </div>
      )}
      {success && (
        <div className="mp-alert success" role="status">
          <Check size={18} strokeWidth={2.4} />
          {success}
        </div>
      )}

      <div className="mp-layout">

        {/* =========================
            IDENTITY CARD
        ========================= */}
        <section className="mp-card mp-identity">
          <div className="mp-identity-top">
            <div className="mp-avatar">
              {profile?.name?.trim()?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <h2>{profile?.name || "Manager"}</h2>
            <span className="mp-role">
              <BadgeCheck size={14} strokeWidth={2.4} />
              {profile?.role || "MANAGER"}
            </span>
          </div>

          <div className="mp-details">
            <div className="mp-detail">
              <div className="mp-detail-icon">
                <Mail size={17} strokeWidth={2.2} />
              </div>
              <div>
                <span>Email address</span>
                <strong>{profile?.email || "Not provided"}</strong>
              </div>
            </div>

            <div className="mp-detail">
              <div className="mp-detail-icon">
                <Phone size={17} strokeWidth={2.2} />
              </div>
              <div>
                <span>Phone number</span>
                <strong>{profile?.phone || "Not provided"}</strong>
              </div>
            </div>

            <div className="mp-detail">
              <div className="mp-detail-icon">
                <MapPin size={17} strokeWidth={2.2} />
              </div>
              <div>
                <span>Current service area</span>
                <strong>
                  {profile?.location?.name || "No service area assigned"}
                </strong>
                {profile?.location?.type && (
                  <small>{profile.location.type.toLowerCase()}</small>
                )}
              </div>
            </div>

            <div className="mp-detail">
              <div className="mp-detail-icon">
                <CalendarDays size={17} strokeWidth={2.2} />
              </div>
              <div>
                <span>Account status</span>
                <strong className="mp-active">
                  <i></i>
                  {profile?.status || "Active"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div className="mp-right">

          {/* =========================
              TEAM OVERVIEW
          ========================= */}
          <section className="mp-card mp-section">
            <div className="mp-section-head">
              <div className="mp-section-icon">
                <BriefcaseBusiness size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2>Team overview</h2>
                <p>Your current operational workload</p>
              </div>
            </div>

            <div className="mp-stats">
              {statCards.map(({ label, value, icon: Icon, tone }) => (
                <div className={`mp-stat mp-stat-${tone}`} key={label}>
                  <div className="mp-stat-icon">
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* =========================
              SERVICE AREA
          ========================= */}
          <section className="mp-card mp-section">
            <div className="mp-section-head">
              <div className="mp-section-icon">
                <MapPin size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2>Service area</h2>
                <p>Choose the area you are responsible for managing.</p>
              </div>
            </div>

            <form className="mp-form" onSubmit={handleSaveLocation}>
              <label htmlFor="manager-service-area">Operational location</label>
              <select
                id="manager-service-area"
                value={locationId}
                onChange={(event) => {
                  setLocationId(event.target.value);
                  setSuccess("");
                }}
                disabled={saving || areas.length === 0}
              >
                <option value="" disabled>
                  {areas.length
                    ? "Select your service area"
                    : "No available service areas"}
                </option>
                {areas.map((area) => (
                  <option value={area.id} key={area.id}>
                    {area.name} · {area.type.toLowerCase()}
                    {area.parent ? ` · ${area.parent}` : ""}
                  </option>
                ))}
              </select>

              {selectedArea && (
                <span className="mp-hint">
                  {selectedArea.state}
                  {selectedArea.parent ? ` · ${selectedArea.parent}` : ""}
                </span>
              )}

              <div className="mp-notice">
                <Info size={17} strokeWidth={2.2} />
                <p>
                  Changing your service area affects future complaint routing.
                  Complaints already assigned to you will remain in your list.
                </p>
              </div>

              <button
                className="mp-save"
                type="submit"
                disabled={
                  saving ||
                  !locationId ||
                  locationId === profile?.location?.id
                }
              >
                {saving ? (
                  <LoaderCircle size={17} className="mp-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving area..." : "Save service area"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ManagerProfile;