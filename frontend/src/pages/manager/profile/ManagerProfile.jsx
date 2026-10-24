import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
  UsersRound,
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

  if (loading && !profile) {
    return (
      <main className="manager-profile-page">
        <div className="manager-profile-loading">
          <LoaderCircle size={22} className="manager-profile-spinner" />
          <span>Loading your profile…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="manager-profile-page">
      <header className="manager-profile-heading">
        <div>
          <span className="manager-profile-eyebrow">MANAGER PORTAL</span>
          <h1>My Profile</h1>
          <p>Review your account details and manage your service area.</p>
        </div>
        <div className="manager-profile-heading-icon">
          <UserRound size={25} />
        </div>
      </header>

      {error && (
        <div className="manager-profile-alert error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="manager-profile-alert success" role="status">
          <Check size={17} />
          {success}
        </div>
      )}

      <div className="manager-profile-layout">
        <section className="manager-profile-card manager-identity-card">
          <div className="manager-profile-cover" />
          <div className="manager-profile-identity">
            <div className="manager-profile-avatar">
              {profile?.name?.trim()?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div>
              <h2>{profile?.name || "Manager"}</h2>
              <span className="manager-profile-role">
                <BadgeCheck size={14} />
                {profile?.role || "MANAGER"}
              </span>
            </div>
          </div>

          <div className="manager-profile-account-details">
            <div className="manager-profile-detail">
              <Mail size={17} />
              <div>
                <span>Email address</span>
                <strong>{profile?.email || "Not provided"}</strong>
              </div>
            </div>
            <div className="manager-profile-detail">
              <Phone size={17} />
              <div>
                <span>Phone number</span>
                <strong>{profile?.phone || "Not provided"}</strong>
              </div>
            </div>
            <div className="manager-profile-detail">
              <MapPin size={17} />
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
            <div className="manager-profile-detail">
              <CalendarDays size={17} />
              <div>
                <span>Account status</span>
                <strong className="manager-profile-active">
                  {profile?.status || "Active"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div className="manager-profile-right">
          <section className="manager-profile-card manager-profile-stats">
            <div className="manager-profile-section-heading">
              <div className="manager-profile-section-icon">
                <BriefcaseBusiness size={18} />
              </div>
              <div>
                <h2>Team overview</h2>
                <p>Your current operational workload</p>
              </div>
            </div>
            <div className="manager-profile-stat-grid">
              <div>
                <UsersRound size={18} />
                <strong>{stats.activeWorkers ?? 0}</strong>
                <span>Active workers</span>
              </div>
              <div>
                <Building2 size={18} />
                <strong>{stats.totalComplaints ?? 0}</strong>
                <span>Assigned complaints</span>
              </div>
              <div>
                <MapPin size={18} />
                <strong>{stats.activeRepairs ?? 0}</strong>
                <span>Active repairs</span>
              </div>
            </div>
          </section>

          <section className="manager-profile-card manager-location-card">
            <div className="manager-profile-section-heading">
              <div className="manager-profile-section-icon location">
                <MapPin size={18} />
              </div>
              <div>
                <h2>Service area</h2>
                <p>Choose the area you are responsible for managing.</p>
              </div>
            </div>

            <form onSubmit={handleSaveLocation}>
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
                <span className="manager-location-hint">
                  {selectedArea.state}
                  {selectedArea.parent ? ` · ${selectedArea.parent}` : ""}
                </span>
              )}

              <div className="manager-location-notice">
                <MapPin size={16} />
                <p>
                  Changing your service area affects future complaint routing.
                  Complaints already assigned to you will remain in your list.
                </p>
              </div>

              <button
                className="manager-location-save"
                type="submit"
                disabled={
                  saving ||
                  !locationId ||
                  locationId === profile?.location?.id
                }
              >
                {saving ? (
                  <LoaderCircle size={17} className="manager-profile-spinner" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving area…" : "Save service area"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ManagerProfile;
