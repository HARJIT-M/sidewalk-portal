import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please enter your email and password.");
      return;
    }

    const emailLower = form.email.toLowerCase();
    // Route by role based on email or credentials
    if (emailLower.includes("ravi") || emailLower.includes("worker") || emailLower.includes("wrk")) {
      navigate("/worker/dashboard");
    } else if (emailLower.includes("user") || emailLower.includes("citizen")) {
      navigate("/user-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleQuickLogin = (role) => {
    if (role === "worker") {
      setForm({ email: "ravi@gmail.com", password: "password123" });
      navigate("/worker/dashboard");
    } else if (role === "user") {
      setForm({ email: "citizen@example.com", password: "password123" });
      navigate("/user-dashboard");
    } else {
      setForm({ email: "manager@smartfootpath.gov", password: "password123" });
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-page">
      {/* ================= LEFT PANEL ================= */}
      <div className="auth-side">
        <div className="auth-side-circle circle-one"></div>
        <div className="auth-side-circle circle-two"></div>

        <div className="auth-side-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">F</div>
            <div>
              <h2>Footpath</h2>
              <span>Repair Portal</span>
            </div>
          </div>

          <h1>Welcome back</h1>
          <p>
            Sign in to manage complaints, execute on-site repairs, and track infrastructure progress in real time.
          </p>

          <ul className="auth-highlights">
            <li>
              <span className="highlight-dot"></span>
              Task-focused field interface for Maintenance Staff
            </li>
            <li>
              <span className="highlight-dot"></span>
              Live repair updates, photo evidence & material logs
            </li>
            <li>
              <span className="highlight-dot"></span>
              End-to-end status tracking from report to verification
            </li>
          </ul>
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2 className="auth-title">Sign in to your account</h2>
          <p className="auth-subtitle">
            Enter your details below or choose a role to test
          </p>

          {/* Quick Role Switcher for Testing */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "20px",
              background: "#f1f5f9",
              padding: "4px",
              borderRadius: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => handleQuickLogin("worker")}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                borderRadius: "8px",
                background: "#0284c7",
                color: "white",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              👷 Worker Portal
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("manager")}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "white",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              🏢 Manager
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("user")}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                borderRadius: "8px",
                background: "#16a34a",
                color: "white",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              👤 Citizen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="ravi@gmail.com (Worker) or manager@..."
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="remember-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>

              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="auth-submit-btn">
              Sign In
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;