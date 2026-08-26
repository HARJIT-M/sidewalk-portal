import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
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
    (async () => {
      try {
        const res = await api.post("/auth/login", { email: form.email, password: form.password });
        const { token, user } = res.data;
        if (token) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }
        navigate("/dashboard");
      } catch (err) {
        alert(err.response?.data?.error || "Login failed");
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

          <h1>Welcome back</h1>

          <p>
            Sign in to manage complaints, track repair progress,
            and coordinate your maintenance team — all in one place.
          </p>

          <ul className="auth-highlights">
            <li>
              <span className="highlight-dot"></span>
              Track footpath complaints in real time
            </li>
            <li>
              <span className="highlight-dot"></span>
              Assign and monitor maintenance teams
            </li>
            <li>
              <span className="highlight-dot"></span>
              Keep every repair update in one timeline
            </li>
          </ul>

        </div>

      </div>


      <div className="auth-form-side">

        <div className="auth-form-card">

          <h2 className="auth-title">Sign in to your account</h2>
          <p className="auth-subtitle">
            Enter your details below to continue
          </p>

          <form onSubmit={handleSubmit} className="auth-form">

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
            Don't have an account?{" "}
            <Link to="/signup">Create one</Link>
          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;