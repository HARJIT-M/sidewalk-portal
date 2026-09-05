import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  HardHat,
  Building2,
  UserRound,
  Eye,
  EyeOff,
  ShieldCheck,
  MapPinned,
  Timer,
} from "lucide-react";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==============================
  // HANDLE INPUT CHANGES
  // ==============================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // REAL LOGIN - BACKEND
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    if (!form.email || !form.password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // Send login request to backend
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        {
          email: form.email,
          password: form.password,
        }
      );

      const { token, user } = response.data;

      // Clear any old login data first
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // ==============================
      // STORE LOGIN INFORMATION
      // ==============================

      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }

      // ==============================
      // REDIRECT BASED ON USER ROLE
      // ==============================

      if (user.role === "WORKER") {
        navigate("/worker/dashboard");
      } else if (user.role === "CITIZEN") {
        navigate("/user/dashboard");
      } else if (user.role === "MANAGER") {
        navigate("/dashboard");
      } else {
        alert("Unknown user role.");
      }
    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // QUICK LOGIN
  // DEMO / SAMPLE PAGE VIEWING ONLY
  // ==============================

  const handleQuickLogin = (role) => {
    if (role === "worker") {
      setForm({
        email: "ravi@gmail.com",
        password: "password123",
      });

      // Directly open sample Worker Dashboard
      navigate("/worker/dashboard");
    } else if (role === "user") {
      setForm({
        email: "citizen@example.com",
        password: "password123",
      });

      // Directly open sample Citizen Dashboard
      navigate("/user/dashboard");
    } else {
      setForm({
        email: "manager@smartfootpath.gov",
        password: "password123",
      });

      // Directly open sample Manager Dashboard
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-page">

      {/* ==============================
          DECORATIVE BACKGROUND
      ============================== */}

      <div className="auth-bg-blob blob-one"></div>
      <div className="auth-bg-blob blob-two"></div>
      <div className="auth-bg-blob blob-three"></div>

      <div className="auth-shell">

        {/* ==============================
            BRAND
        ============================== */}

        <div className="auth-brand-center">
          <div className="auth-brand-icon">F</div>

          <div>
            <h2>Footpath</h2>
            <span>Repair Portal</span>
          </div>
        </div>

        {/* ==============================
            LOGIN CARD
        ============================== */}

        <div className="auth-card">

          <div className="auth-card-head">
            <h1>Welcome back</h1>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {/* ==============================
              QUICK LOGIN / SAMPLE PAGES
          ============================== */}

          <div className="role-switch">

            {/* WORKER */}
            <button
              type="button"
              className="role-option worker"
              onClick={() => handleQuickLogin("worker")}
            >
              <HardHat size={18} strokeWidth={2} />
              <span>Worker</span>
            </button>

            {/* MANAGER */}
            <button
              type="button"
              className="role-option manager"
              onClick={() => handleQuickLogin("manager")}
            >
              <Building2 size={18} strokeWidth={2} />
              <span>Manager</span>
            </button>

            {/* CITIZEN */}
            <button
              type="button"
              className="role-option citizen"
              onClick={() => handleQuickLogin("user")}
            >
              <UserRound size={18} strokeWidth={2} />
              <span>Citizen</span>
            </button>

          </div>

          <div className="auth-divider">
            <span>or sign in manually</span>
          </div>

          {/* ==============================
              LOGIN FORM
          ============================== */}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* EMAIL */}
            <div className="float-group">

              <input
                type="email"
                name="email"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />

              <label>Email Address</label>

            </div>

            {/* PASSWORD */}
            <div className="float-group">

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder=" "
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

              <label>Password</label>

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff
                    size={17}
                    strokeWidth={2}
                  />
                ) : (
                  <Eye
                    size={17}
                    strokeWidth={2}
                  />
                )}
              </button>

            </div>

            {/* REMEMBER + FORGOT PASSWORD */}
            <div className="form-row">

              <label className="remember-check">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) =>
                    setRemember(e.target.checked)
                  }
                />

                Remember me

              </label>

              <Link
                to="/forgot-password"
                className="auth-link"
              >
                Forgot password?
              </Link>

            </div>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          {/* SIGNUP LINK */}
          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/signup">
              Create one
            </Link>
          </p>

        </div>

        {/* ==============================
            TRUST STRIP
        ============================== */}

        <div className="trust-strip">

          <div className="trust-item">
            <ShieldCheck
              size={16}
              strokeWidth={2}
            />
            <span>Secure sign-in</span>
          </div>

          <div className="trust-item">
            <MapPinned
              size={16}
              strokeWidth={2}
            />
            <span>Live issue tracking</span>
          </div>

          <div className="trust-item">
            <Timer
              size={16}
              strokeWidth={2}
            />
            <span>Fast repair updates</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;