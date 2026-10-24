import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  HardHat,
  Building2,
  UserRound,
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
} from "lucide-react";
import "./login.css";
import { loginUser } from "../../services/authApi";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [shakeKey, setShakeKey] = useState(0); // changing this replays the shake animation

  const showError = (msg) => {
    setErrorMsg(msg);
    setShakeKey((k) => k + 1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const doLogin = async (email, password) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await loginUser({ email, password });
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      console.log("Login successful:", data.user?.role);
      if (data.user?.role === "WORKER" || email.toLowerCase().includes("ravi") || email.toLowerCase().includes("worker")) {
        navigate("/worker/dashboard");
      } else if (data.user?.role === "CITIZEN" || email.toLowerCase().includes("citizen")) {
        navigate("/user/dashboard");
      } else if (data.user?.role === "MANAGER") {
        navigate("/dashboard");
      } else if (data.user?.role === "ADMIN") {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Login attempt failed:", err);
      showError(err.message || "Sign in failed. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      showError("Please enter your email and password.");
      return;
    }
    await doLogin(form.email, form.password);
  };

  const handleQuickLogin = async (role) => {
    if (role === "worker") {
      setForm({ email: "ravi@gmail.com", password: "password123" });
      await doLogin("ravi@gmail.com", "password123");
    } else if (role === "user") {
      setForm({ email: "karthik.raja@example.com", password: "password123" });
      await doLogin("karthik.raja@example.com", "password123");
    } else {
      setForm({ email: "mohan@gmail.com", password: "password123" });
      await doLogin("mohan@gmail.com", "password123");
    }
  };

  return (
    <div className="lg-page">

      {/* ================= LEFT: ORANGE SHOWCASE ================= */}

      <section className="lg-hero">

        {/* animated decoration */}
        <div className="lg-rings" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div className="lg-slabs" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
        </div>

        <div className="lg-brand">
          <div className="lg-brand-icon">P</div>
          <div>
            <b>Paadhai</b>
            <span>Footpath Repair Portal</span>
          </div>
        </div>

        <div className="lg-hero-body">
          <h1>
            Broken footpath?
            <br />
            <span className="lg-hl">Pin it. We fix it.</span>
          </h1>
          <p>
            Report damaged sidewalks in seconds and follow the repair from
            report to done.
          </p>

          {/* road with a pin that drops, and a ring that ripples */}
          <div className="lg-road" aria-hidden="true">
            <div className="lg-road-dash"></div>
            <div className="lg-pin"><MapPin size={34} strokeWidth={2.2} /></div>
            <div className="lg-ripple"></div>
          </div>
        </div>

        <ul className="lg-points">
          <li><ShieldCheck size={17} strokeWidth={2.2} /> Secure sign-in</li>
          <li><MapPinned size={17} strokeWidth={2.2} /> Live issue tracking</li>
          <li><Timer size={17} strokeWidth={2.2} /> Fast repair updates</li>
        </ul>

      </section>


      {/* ================= RIGHT: FORM ================= */}

      <section className="lg-panel">
        <div className="lg-box">

          <div className="lg-head">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          

          <form onSubmit={handleSubmit} className="lg-form" noValidate>

            {errorMsg && (
              <div className="lg-error" key={shakeKey} role="alert">
                <AlertCircle size={16} strokeWidth={2.2} />
                <span>{errorMsg}</span>
              </div>
            )}

            <label className="lg-field">
              <Mail size={18} strokeWidth={2} className="lg-field-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </label>

            <label className="lg-field">
              <Lock size={18} strokeWidth={2} className="lg-field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lg-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </label>

            <button type="submit" className="lg-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={19} strokeWidth={2.4} className="lg-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} strokeWidth={2.4} className="lg-arrow" />
                </>
              )}
            </button>
          </form>

          <p className="lg-switch">
            New to Paadhai? <Link to="/signup">Create an account</Link>
          </p>

        </div>
      </section>

    </div>
  );
};

export default Login;