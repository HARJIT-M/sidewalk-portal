import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  MapPinned,
  Timer,
  MapPin,
  Loader2,
  AlertCircle,
  ArrowRight,
  Mail,
  Lock,
  UserRound,
  Phone,
} from "lucide-react";
import "./signin.css";
import { signupUser } from "../../services/authApi";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [shakeKey, setShakeKey] = useState(0); // changing this replays the shake animation
  const [success, setSuccess] = useState(false);

  // after a successful signup, wait for the loader to finish and then go to login
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setShakeKey((k) => k + 1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      showError("Please fill all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await signupUser(form);
      setSuccess(true);
    } catch (err) {
      console.error("Signup failed:", err);
      showError(
        err.message ||
          "Could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-page">

      {/* ================= LEFT: ORANGE SHOWCASE ================= */}

      <section className="su-hero">

        {/* animated decoration */}
        <div className="su-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="su-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
        </div>

        <div className="su-brand">
          <div className="su-brand-icon">P</div>
          <div>
            <b>Paadhai</b>
            <span>Footpath Repair Portal</span>
          </div>
        </div>

        <div className="su-hero-body">
          <h1>
            Join Paadhai.
            <br />
            <span className="su-hl">Fix your street.</span>
          </h1>
          <p>
            Create an account to report damaged footpaths and follow every
            repair from report to done.
          </p>

          {/* road with a pin that drops, and a ring that ripples */}
          <div className="su-road" aria-hidden="true">
            <div className="su-road-dash"></div>
            <div className="su-pin"><MapPin size={34} strokeWidth={2.2} /></div>
            <div className="su-ripple"></div>
          </div>
        </div>

        <ul className="su-points">
          <li><ShieldCheck size={17} strokeWidth={2.2} /> Data kept secure</li>
          <li><MapPinned size={17} strokeWidth={2.2} /> Live issue tracking</li>
          <li><Timer size={17} strokeWidth={2.2} /> Fast repair updates</li>
        </ul>

      </section>


      {/* ================= RIGHT: FORM ================= */}

      <section className="su-panel">
        <div className="su-box">

          {success ? (
            <div className="su-success" role="status" aria-live="polite">
              <div className="su-check" aria-hidden="true">
                <svg viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="23" />
                  <path d="M15 27 l7 7 l15 -16" />
                </svg>
              </div>

              <h2>Account created successfully</h2>
              <p>
                Welcome to Paadhai, {form.name.trim().split(" ")[0]}. Taking
                you to the login page...
              </p>

              {/* footpath loader: slabs get laid one after another */}
              <div className="su-path" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i>
              </div>

              <Link to="/login" className="su-skip">
                Go to login now
              </Link>
            </div>
          ) : (
          <>

          <div className="su-head">
            <h2>Create your account</h2>
            <p>It takes less than a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="su-form" noValidate>

            {errorMsg && (
              <div className="su-error" key={shakeKey} role="alert">
                <AlertCircle size={16} strokeWidth={2.2} />
                <span>{errorMsg}</span>
              </div>
            )}

            <label className="su-field">
              <UserRound size={18} strokeWidth={2} className="su-field-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </label>

            <label className="su-field">
              <Mail size={18} strokeWidth={2} className="su-field-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </label>

            <label className="su-field">
              <Phone size={18} strokeWidth={2} className="su-field-icon" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </label>

            <label className="su-field">
              <Lock size={18} strokeWidth={2} className="su-field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="su-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </label>

            <label className="su-field">
              <Lock size={18} strokeWidth={2} className="su-field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>

            <button type="submit" className="su-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={19} strokeWidth={2.4} className="su-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={19} strokeWidth={2.4} className="su-arrow" />
                </>
              )}
            </button>
          </form>

          <p className="su-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          </>
          )}

        </div>
      </section>

    </div>
  );
};

export default Signup;