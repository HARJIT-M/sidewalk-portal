import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Users,
  ClipboardCheck,
} from "lucide-react";
import "./signin.css";
import axios from "axios"
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

  const handleSubmit = async(e) => {
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
    try{
      const res = await axios.post("http://localhost:5000/sigin",{
        form
      })
    }
    // Temporary — replace with real account creation
    alert("Account created successfully!");
    navigate("/login");
  };

  return (
    <div className="auth-page">

      {/* Decorative background */}
      <div className="auth-bg-blob blob-one"></div>
      <div className="auth-bg-blob blob-two"></div>
      <div className="auth-bg-blob blob-three"></div>

      <div className="auth-shell signup-shell">

        {/* ================= BRAND ================= */}

        <div className="auth-brand-center">
          <div className="auth-brand-icon">F</div>
          <div>
            <h2>Footpath</h2>
            <span>Repair Portal</span>
          </div>
        </div>


        {/* ================= CARD ================= */}

        <div className="auth-card">

          <div className="auth-card-head">
            <div className="auth-card-icon">
              <UserPlus size={20} strokeWidth={2} />
            </div>
            <h1>Join the team</h1>
            <p>Create an account to start managing footpath repairs</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="float-group">
              <input
                type="text"
                name="name"
                placeholder=" "
                value={form.name}
                onChange={handleChange}
              />
              <label>Full Name</label>
            </div>

            <div className="float-group">
              <input
                type="email"
                name="email"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
              />
              <label>Email Address</label>
            </div>

            <div className="float-group">
              <input
                type="text"
                name="phone"
                placeholder=" "
                value={form.phone}
                onChange={handleChange}
              />
              <label>Phone Number</label>
            </div>

            <div className="form-group-row">

              <div className="float-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder=" "
                  value={form.password}
                  onChange={handleChange}
                />
                <label>Password</label>

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>

              <div className="float-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder=" "
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <label>Confirm Password</label>
              </div>

            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>

          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

        </div>


        {/* ================= TRUST STRIP ================= */}

        <div className="trust-strip">

          <div className="trust-item">
            <ShieldCheck size={16} strokeWidth={2} />
            <span>Data kept secure</span>
          </div>

          <div className="trust-item">
            <Users size={16} strokeWidth={2} />
            <span>Manage your team</span>
          </div>

          <div className="trust-item">
            <ClipboardCheck size={16} strokeWidth={2} />
            <span>Track every complaint</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Signup;