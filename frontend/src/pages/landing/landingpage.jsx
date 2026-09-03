import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Camera,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Bell,
  BarChart3,
  Footprints,
} from "lucide-react";
import "./landingpage.css";

const STEPS = [
  {
    n: "01",
    title: "Spot the damage",
    text: "See a broken tile, pothole, or crumbling edge on your street? Open the app right there.",
    icon: Footprints,
  },
  {
    n: "02",
    title: "Snap & pin it",
    text: "Take a photo, and we'll capture your exact GPS location automatically — no typing addresses.",
    icon: Camera,
  },
  {
    n: "03",
    title: "Track the fix",
    text: "Watch it move from reported to assigned to repaired, with live updates from the crew on site.",
    icon: CheckCircle2,
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Pinpoint accuracy",
    text: "Every report is mapped to the exact spot, so crews never waste a trip guessing.",
  },
  {
    icon: Bell,
    title: "Real-time updates",
    text: "Get notified the moment your complaint is assigned, started, and completed.",
  },
  {
    icon: Users,
    title: "Built for crews",
    text: "Workers get a queue, photos, and a route — not a stack of paper forms.",
  },
  {
    icon: BarChart3,
    title: "City-wide visibility",
    text: "Ward officers see every open issue and repair time on one live board.",
  },
  {
    icon: ShieldCheck,
    title: "Accountable by design",
    text: "Every status change is logged and timestamped — nothing gets lost quietly.",
  },
  {
    icon: Clock,
    title: "Faster resolution",
    text: "Average repair time dropped from 19 days to 6 since routing went digital.",
  },
];

const LandingPage = () => {
  return (
    <div className="landing-page">

      {/* ============================
          NAV
      ============================ */}

      <header className="landing-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-brand-icon">F</div>
            <span>Footpath</span>
          </div>

          <nav className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#impact">Impact</a>
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="nav-login">Sign in</Link>
            <Link to="/signup" className="nav-cta">Report an issue</Link>
          </div>
        </div>
      </header>


      {/* ============================
          HERO
      ============================ */}

      <section className="hero">

        <div className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80"
            alt="A city street with a footpath in need of repair"
          />
          <div className="hero-media-overlay"></div>
        </div>

        <div className="hero-inner">

          <span className="hero-eyebrow">Coimbatore Civic Infrastructure</span>

          <h1>
            Every broken footpath
            <br />
            has a fix. <span>Report it.</span>
          </h1>

          <p>
            A faster way for citizens to flag damaged footpaths and for
            maintenance crews to repair them — from photo to pothole-free,
            tracked end to end.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn-primary">
              Report a footpath issue
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link to="/login" className="btn-ghost">
              I'm a maintenance worker
            </Link>
          </div>

        </div>

        {/* Floating stat card — signature element */}
        <div className="hero-stat-card">

          <div className="hero-stat-card-header">
            <span className="live-dot"></span>
            Live across the city
          </div>

          <div className="hero-stat-row">
            <div>
              <strong>2,480</strong>
              <span>Issues reported</span>
            </div>
            <div>
              <strong>2,110</strong>
              <span>Repaired</span>
            </div>
            <div>
              <strong>6 days</strong>
              <span>Avg. resolution</span>
            </div>
          </div>

        </div>

      </section>


      {/* ============================
          HOW IT WORKS
      ============================ */}

      <section className="how-section" id="how-it-works">

        <div className="section-heading">
          <span className="eyebrow">How it works</span>
          <h2>From crack to complete, in three steps</h2>
        </div>

        <div className="steps-row">

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div className="step-card" key={step.n}>

                <div className="step-number">{step.n}</div>

                <div className="step-icon">
                  <Icon size={20} strokeWidth={2} />
                </div>

                <h3>{step.title}</h3>
                <p>{step.text}</p>

                {i < STEPS.length - 1 && <div className="step-connector"></div>}

              </div>
            );
          })}

        </div>

      </section>


      {/* ============================
          GALLERY / PROOF
      ============================ */}

      <section className="gallery-section">

        <div className="gallery-grid">

          <div className="gallery-item large">
            <img
              src="https://images.unsplash.com/photo-1517999349371-c43520457b23?auto=format&fit=crop&w=900&q=80"
              alt="Workers repairing a pothole"
            />
            <div className="gallery-caption">
              <span>Before → After</span>
              Gandhipuram footpath, repaired in 3 days
            </div>
          </div>

          <div className="gallery-item">
            <img
              src="https://images.unsplash.com/photo-1590644365607-1c5a1c2c8a2a?auto=format&fit=crop&w=700&q=80"
              alt="Broken tiles on a footpath"
            />
          </div>

          <div className="gallery-item">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=700&q=80"
              alt="Newly repaired footpath tiles"
            />
          </div>

        </div>

      </section>


      {/* ============================
          FEATURES
      ============================ */}

      <section className="features-section" id="features">

        <div className="section-heading">
          <span className="eyebrow">Why it works</span>
          <h2>One system, three sides of the same problem</h2>
        </div>

        <div className="features-grid">

          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}

        </div>

      </section>


      {/* ============================
          IMPACT / CTA
      ============================ */}

      <section className="cta-section" id="impact">

        <div className="cta-inner">

          <h2>Your street is one report away from getting fixed.</h2>
          <p>
            Join thousands of residents making Coimbatore safer to walk in —
            one footpath at a time.
          </p>

          <div className="hero-actions center">
            <Link to="/signup" className="btn-primary light">
              Get started — it's free
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

        </div>

      </section>


      {/* ============================
          FOOTER
      ============================ */}

      <footer className="landing-footer">

        <div className="footer-inner">

          <div className="nav-brand">
            <div className="nav-brand-icon">F</div>
            <span>Footpath</span>
          </div>

          <p>© 2026 Footpath Repair Portal · Coimbatore Municipal Corporation</p>

        </div>

      </footer>

    </div>
  );
};

export default LandingPage;