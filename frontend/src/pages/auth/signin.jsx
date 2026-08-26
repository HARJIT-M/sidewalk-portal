import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    (async () => {
      try {
        await api.post("/auth/signup", { name: form.name, email: form.email, phone: form.phone, password: form.password });
        alert("Account created successfully! Please sign in.");
        navigate("/login");
      } catch (err) {
        alert(err.response?.data?.error || "Signup failed");
      }
    })();
  };

  return (
    <div className="auth-page">

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

          <h1>Join the team</h1>

          <p>
            Create an account to start managing footpath complaints,
            assigning repair work, and tracking your maintenance
            team's progress.
          </p>

          <ul className="auth-highlights">
            <li>
              <span className="highlight-dot"></span>
              Set up your worker roster in minutes
            </li>
            <li>
              <span className="highlight-dot"></span>
              Get a clear view of every open complaint
            </li>
            <li>
              <span className="highlight-dot"></span>
              Keep residents' issues moving to resolution
            </li>
          </ul>

        </div>

      </div>


      <div className="auth-form-side">

        <div className="auth-form-card">

          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group-row">

              <div className="form-group">
                <label>Password</label>

                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
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

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>

            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>

          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

        </div>

      </div>

    </div>
  );
};

export default Signup;