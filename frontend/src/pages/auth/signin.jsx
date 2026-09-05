
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Users,
  ClipboardCheck,
} from "lucide-react";
import "./signin.css";

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
  // SIGNUP - BACKEND
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check required fields
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill all required fields.");
      return;
    }

    // Check password match
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Send signup request to backend
      const response = await axios.post(
        "http://localhost:8000/api/auth/signup",
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }
      );

      const { token, user } = response.data;

      // Clear old login information
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Store newly created account
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(response.data.message);

      // Go to login page
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);

      alert(
        error.response?.data?.message ||
          "Account creation failed. Please try again."
      );
    } finally {
      setLoading(false);
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

      <div className="auth-shell signup-shell">

        {/* ==============================
            BRAND
        ============================== */}

        <div className="auth-brand-center">

          <div className="auth-brand-icon">
            F
          </div>

          <div>
            <h2>Footpath</h2>
            <span>Repair Portal</span>
          </div>

        </div>

        {/* ==============================
            SIGNUP CARD
        ============================== */}

        <div className="auth-card">

          <div className="auth-card-head">

            <div className="auth-card-icon">
              <UserPlus
                size={20}
                strokeWidth={2}
              />
            </div>

            <h1>Join the team</h1>

            <p>
              Create an account to start managing footpath repairs
            </p>

          </div>

          {/* ==============================
              SIGNUP FORM
          ============================== */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* FULL NAME */}

            <div className="float-group">

              <input
                type="text"
                name="name"
                placeholder=" "
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />

              <label>Full Name</label>

            </div>

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

            {/* PHONE */}

            <div className="float-group">

              <input
                type="tel"
                name="phone"
                placeholder=" "
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />

              <label>Phone Number</label>

            </div>

            {/* PASSWORD ROW */}

            <div className="form-group-row">

              {/* PASSWORD */}

              <div className="float-group">

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder=" "
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
                      size={16}
                      strokeWidth={2}
                    />
                  ) : (
                    <Eye
                      size={16}
                      strokeWidth={2}
                    />
                  )}
                </button>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="float-group">

                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder=" "
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <label>Confirm Password</label>

              </div>

            </div>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* LOGIN LINK */}

          <p className="auth-switch">

            Already have an account?{" "}

            <Link to="/login">
              Sign in
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

            <span>
              Data kept secure
            </span>

          </div>

          <div className="trust-item">

            <Users
              size={16}
              strokeWidth={2}
            />

            <span>
              Manage your team
            </span>

          </div>

          <div className="trust-item">

            <ClipboardCheck
              size={16}
              strokeWidth={2}
            />

            <span>
              Track every complaint
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Signup;