import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Camera,
  Users,
  Wrench,
  Search,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Bell,
  BarChart3,
  ClipboardCheck,
  BadgeCheck,
} from "lucide-react";
import "./landingpage.css";

/* ---------- website name (change here and it updates everywhere) ---------- */
const SITE_NAME = "Paadhai";
const TAGLINE = "Digital Footpath Inspection & Repair Portal";

const STAGES = [
  {
    title: "Report",
    text: "Citizens log damage with a photo and an automatic GPS pin.",
    icon: Camera,
  },
  {
    title: "Inspect",
    text: "Inspectors visit the site and rate its condition on a digital checklist.",
    icon: Search,
  },
  {
    title: "Assign",
    text: "Managers prioritise the job and assign it to the right repair crew.",
    icon: Users,
  },
  {
    title: "Repair",
    text: "Crews fix the footpath and upload photo proof from the site.",
    icon: Wrench,
  },
  {
    title: "Verify",
    text: "The work is checked, closed and logged — and the citizen is informed.",
    icon: BadgeCheck,
  },
];

const ROLES = [
  {
    icon: Users,
    title: "Citizens",
    tag: "Report & track",
    points: [
      "Report damage with a photo and auto location",
      "Follow every complaint from report to repair",
      "Get notified when the work is done",
    ],
  },
  {
    icon: Wrench,
    title: "Inspectors & Crews",
    tag: "Inspect & repair",
    points: [
      "A clear task queue with site photos",
      "Digital inspection checklist for every site",
      "Upload proof once the repair is complete",
    ],
  },
  {
    icon: BarChart3,
    title: "Managers & Admins",
    tag: "Plan & oversee",
    points: [
      "Ward-wise view of all open issues",
      "Prioritise jobs and assign crews",
      "Manage accounts and access in one place",
    ],
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Pinpoint accuracy",
    text: "Every report is mapped to the exact spot, so crews and inspectors never waste a trip guessing.",
    variant: "dark span2",
  },
  {
    icon: Bell,
    title: "Instant updates",
    text: "Get notified when your complaint is assigned, started and completed.",
    variant: "",
  },
  {
    icon: ClipboardCheck,
    title: "Digital inspections",
    text: "Structured checklists replace paper forms and guesswork.",
    variant: "",
  },
  {
    icon: ShieldCheck,
    title: "Accountable by design",
    text: "Every status change is logged and timestamped.",
    variant: "",
  },
  {
    icon: BarChart3,
    title: "City-wide visibility",
    text: "Officers see every open issue on one board.",
    variant: "",
  },
  {
    icon: Clock,
    title: "Faster resolution",
    text: "Digital routing cuts the time between a report and a repaired footpath, because nothing waits on paperwork.",
    variant: "accent span2",
  },
];

const ISSUE_TYPES = [
  "Cracked tiles",
  "Potholes",
  "Broken kerbs",
  "Missing slabs",
  "Waterlogging",
  "Uneven surface",
  "Damaged ramps",
  "Exposed edges",
  "Encroachment",
];

// lit windows in the background buildings: [x, y]
const WINDOWS = [
  [34, 150], [58, 150], [34, 180], [58, 180],
  [114, 110], [138, 110], [114, 140], [138, 140], [114, 170],
  [184, 170], [216, 170], [184, 200], [216, 200],
  [276, 130], [300, 130], [276, 160], [300, 160], [276, 190],
  [350, 180], [380, 180], [350, 210],
];

const TICKER = ["Inspect it", "Report it", "Assign it", "Repair it", "Verify it", "Walk safe"];

const PROMISES = [
  {
    icon: MapPin,
    title: "GPS-tagged reports",
    text: "The exact location is captured automatically with every complaint.",
  },
  {
    icon: Camera,
    title: "Photo evidence",
    text: "Photos back every report and every completed repair.",
  },
  {
    icon: ShieldCheck,
    title: "Complete history",
    text: "Each status change is logged with a timestamp.",
  },
  {
    icon: Users,
    title: "Role-based access",
    text: "Citizens, crews, managers and admins each see what they need.",
  },
];

/* ---------- hooks / helpers ---------- */

// Fires once when the element scrolls into view
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
};

// Wrapper that fades/slides its children in on scroll
const Reveal = ({ children, className = "", delay = 0 }) => {
  const [ref, inView] = useInView(0.08);
  return (
    <div
      ref={ref}
      className={`reveal ${className} ${inView ? "in" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Splits a line into words that animate in one after another
const words = (text, startDelay = 0.2, accent = false) =>
  text.split(" ").map((w, i) => (
    <span
      key={`${text}-${i}`}
      className={`word${accent ? " accent" : ""}`}
      style={{ animationDelay: `${startDelay + i * 0.12}s` }}
    >
      {w}
    </span>
  ));

/* ---------- animated hero scene ---------- */

/*
  One short story, on a loop:
  he walks in -> notices the cracked tile -> stops -> raises his phone -> SNAP (flash)
  -> studies the photo for 2 to 5 seconds -> pockets the phone -> walks on.

  The current phase is added to the <svg> as a class (p-enter, p-notice, ...) and
  landingpage.css poses everything from that class. Change the numbers below to tune it.
*/
const START_X = -40;      // off-screen on the left
const STOP_X = 286;       // where he stops, a few steps before the crack
const END_X = 500;        // off-screen on the right
const WALK_SPEED = 60;    // pixels per second
const ENTER_MS = Math.round(((STOP_X - START_X) / WALK_SPEED) * 1000);
const LEAVE_MS = Math.round(((END_X - STOP_X) / WALK_SPEED) * 1000);
const LOOK_MIN_MS = 2000; // he studies the phone for a random time between these two,
const LOOK_MAX_MS = 5000; // picked again on every loop

const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

const SEQUENCE = [
  { name: "reset", ms: 150 },                                           // jump back off-screen
  { name: "enter", ms: ENTER_MS },                                      // walks in
  { name: "notice", ms: 1000 },                                         // "!" pops up, head turns to the crack
  { name: "raise", ms: 700 },                                           // lifts the phone
  { name: "snap", ms: 500 },                                            // flash
  { name: "look", ms: () => randomBetween(LOOK_MIN_MS, LOOK_MAX_MS) },  // studies the photo
  { name: "lower", ms: 650 },                                           // pockets the phone
  { name: "leave", ms: LEAVE_MS },                                      // walks on
];

// which footer step lights up in each phase
const STEP_FOR_PHASE = { notice: 1, raise: 1, snap: 1, look: 2, still: 2, lower: 3, leave: 3 };

const FootpathScene = () => {
  const [phase, setPhase] = useState("reset");

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // for people who asked for less motion: show the finished moment as a still picture
    if (reduceMotion) {
      setPhase("still");
      return undefined;
    }

    let timer;
    let i = 0;
    let firstLap = true;

    const step = () => {
      const s = SEQUENCE[i];
      setPhase(s.name);

      let ms = typeof s.ms === "function" ? s.ms() : s.ms;
      if (s.name === "reset" && firstLap) {
        ms = 1300; // the very first time, wait for the card to finish fading in
        firstLap = false;
      }

      timer = setTimeout(() => {
        i = (i + 1) % SEQUENCE.length;
        step();
      }, ms);
    };

    step();
    return () => clearTimeout(timer);
  }, []);

  // where the walker is, and how fast he gets there
  const x = phase === "reset" ? START_X : phase === "leave" ? END_X : STOP_X;
  const transition =
    phase === "reset"
      ? "none"
      : `transform ${phase === "leave" ? LEAVE_MS : ENTER_MS}ms linear`;

  const activeStep = STEP_FOR_PHASE[phase] || 0;
  const phaseClass = phase === "still" ? "p-look is-still" : `p-${phase}`;

  return (
    <div className="scene-card" aria-hidden="true">

      <svg className={`scene ${phaseClass}`} viewBox="0 0 460 360" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d2b4f" />
            <stop offset="1" stopColor="#3d4d80" />
          </linearGradient>
          <linearGradient id="pathG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3e4cc" />
            <stop offset="1" stopColor="#e2cdab" />
          </linearGradient>
          <pattern
            id="hazard"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <rect width="14" height="28" fill="#ffb703" />
            <rect x="14" width="14" height="28" fill="#101a33" />
          </pattern>
          <radialGradient id="flashG">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#fff3c4" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd166" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowG">
            <stop offset="0" stopColor="#9fd0ff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#9fd0ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="460" height="360" fill="url(#skyG)" />

        {/* sun */}
        <circle className="sun-glow" cx="372" cy="66" r="44" fill="#ffb703" />
        <circle cx="372" cy="66" r="28" fill="#ffb703" />

        {/* buildings */}
        <g fill="#16224a">
          <rect x="20" y="130" width="70" height="150" />
          <rect x="100" y="90" width="60" height="190" />
          <rect x="170" y="150" width="80" height="130" />
          <rect x="262" y="110" width="64" height="170" />
          <rect x="336" y="160" width="90" height="120" />
        </g>

        {/* windows */}
        <g fill="#ffb703">
          {WINDOWS.map(([wx, wy], i) => (
            <rect
              className="win"
              key={i}
              x={wx}
              y={wy}
              width="10"
              height="13"
              rx="2"
              style={{ animationDelay: `${(i * 0.43) % 4}s` }}
            />
          ))}
        </g>

        {/* street lamp */}
        <circle className="lamp-glow" cx="61" cy="182" r="30" fill="#ff6b1a" />
        <rect x="58" y="176" width="6" height="100" fill="#0b1226" />
        <rect x="46" y="170" width="32" height="8" rx="4" fill="#0b1226" />

        {/* footpath */}
        <rect x="0" y="275" width="460" height="65" fill="url(#pathG)" />
        <path
          d="M46 275V340 M92 275V340 M138 275V340 M184 275V340 M230 275V340 M276 275V340 M322 275V340 M368 275V340 M414 275V340 M0 307H460"
          stroke="#cdb48f"
          strokeWidth="1.5"
        />
        <rect x="0" y="340" width="460" height="20" fill="url(#hazard)" />

        {/* the damaged tile: broken patch, crack, pebbles, and the map pin the citizen drops on it */}
        <g transform="translate(33 0)">
          <path
            d="M284 281 L296 279 L306 289 L302 303 L309 316 L300 331 L288 336 L283 322 L289 308 L282 294Z"
            fill="#d3b98f"
          />
          <path
            className="crack"
            d="M292 277 L299 291 L289 301 L301 313 L294 327 L302 340"
            fill="none"
            stroke="#3b2f22"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="281" cy="333" r="2.4" fill="#cdb48f" />
          <circle cx="311" cy="326" r="2" fill="#cdb48f" />
          <circle cx="307" cy="337" r="1.6" fill="#cdb48f" />

          {/* warning ring while he is noticing the damage */}
          <ellipse
            className="crack-alert"
            cx="296"
            cy="309"
            rx="24"
            ry="30"
            fill="none"
            stroke="#ff6b1a"
            strokeWidth="3"
            strokeDasharray="6 5"
          />

          <ellipse className="pin-ring" cx="298" cy="292" rx="30" ry="8" fill="none" stroke="#ff6b1a" strokeWidth="3" />
          <g className="pin">
            <path
              d="M298 238c-12 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-8-20-20-20z"
              fill="#ff6b1a"
            />
            <circle cx="298" cy="258" r="7" fill="#fff" />
          </g>
        </g>

        {/* traffic cone */}
        <polygon points="226,336 248,336 241,304 233,304" fill="#ff6b1a" />
        <rect x="230" y="318" width="14" height="5" fill="#fff" />
        <rect x="222" y="335" width="30" height="5" rx="2" fill="#101a33" />

        {/* the pedestrian: walks in, notices the crack, takes a photo, studies it, walks on */}
        <g className="walker" style={{ transform: `translate(${x}px, 336px)`, transition }}>
          <g className="walker-body">
            <rect className="leg a" x="-4" y="-24" width="7" height="24" rx="3.5" fill="#101a33" />
            <rect className="leg b" x="-3" y="-24" width="7" height="24" rx="3.5" fill="#2a3a6b" />
            <rect x="-10" y="-56" width="20" height="34" rx="9" fill="#ff6b1a" />
            <rect className="arm" x="-3" y="-52" width="6" height="22" rx="3" fill="#e5530a" />

            <g className="head">
              <circle cx="0" cy="-66" r="9" fill="#f3c9a2" />
              <path d="M-9 -68a9 9 0 0 1 18 0z" fill="#101a33" />
              <circle cx="4.6" cy="-65" r="1.3" fill="#101a33" />
            </g>

            {/* phone: hidden in the pocket until he raises it */}
            <g className="phone">
              <circle className="phone-glow" r="22" fill="url(#glowG)" />
              <g transform="scale(1.5)">
                <rect x="-5.5" y="-9.5" width="11" height="19" rx="3" fill="#0b1226" stroke="#7d8cc0" strokeWidth="0.8" />
                <rect className="screen" x="-4.3" y="-7.6" width="8.6" height="15.2" rx="1.8" />
                {/* the photo he just took */}
                <g className="shot">
                  <rect x="-4.3" y="-5" width="8.6" height="9" fill="#e2cdab" />
                  <path
                    d="M-1.2 -5 L0.5 -1.8 L-1 0 L0.8 4"
                    fill="none"
                    stroke="#3b2f22"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                {/* "sent" tick */}
                <g className="tick">
                  <circle cx="2.2" cy="5" r="2.3" fill="#22c55e" />
                  <path d="M1.2 5 L2 5.8 L3.3 4.2" fill="none" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>
            </g>

            {/* camera flash from the phone */}
            <g transform="translate(26 -70)">
              <circle className="flash-burst" r="26" fill="url(#flashG)" />
              <path
                className="flash-star"
                d="M0 -20 L3.5 -4 L20 0 L3.5 4 L0 20 L-3.5 4 L-20 0 L-3.5 -4Z"
                fill="#fff"
              />
            </g>

            {/* "!" bubble when he notices the damage */}
            <g transform="translate(8 -96)">
              <g className="alert">
                <circle r="9" fill="#ffb703" />
                <path d="M-3.5 7 L0 13 L3.5 7Z" fill="#ffb703" />
                <rect x="-1.2" y="-5.5" width="2.4" height="6.5" rx="1.2" fill="#101a33" />
                <circle cy="4" r="1.4" fill="#101a33" />
              </g>
            </g>
          </g>
        </g>

        {/* white flash over the whole scene at the moment of the photo */}
        <rect className="scene-flash" width="460" height="360" fill="#fffbe8" />
      </svg>

      <div className={`scene-foot${activeStep ? " has-active" : ""}`}>
        <span className={`scene-step${activeStep === 1 ? " active" : ""}`}><b>1</b> Spot it</span>
        <i></i>
        <span className={`scene-step${activeStep === 2 ? " active" : ""}`}><b>2</b> Pin it</span>
        <i></i>
        <span className={`scene-step${activeStep === 3 ? " active" : ""}`}><b>3</b> Fix it</span>
      </div>

    </div>
  );
};

/* ---------- page ---------- */

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef(null);
  const heroMediaRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 20);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      }
      if (heroMediaRef.current && y < 900) {
        heroMediaRef.current.style.transform = `translateY(${y * 0.22}px)`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tickerItems = [...TICKER, ...TICKER, ...TICKER, ...TICKER];
  const brandLetter = SITE_NAME.charAt(0);

  return (
    <div className="landing-page">

      <div className="scroll-progress" ref={progressRef}></div>

      {/* ============================
          NAV
      ============================ */}

      <header className={scrolled ? "landing-nav scrolled" : "landing-nav"}>
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-brand-icon">{brandLetter}</div>
            <span>{SITE_NAME}</span>
          </div>

          <nav className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#roles">Who it's for</a>
            <a href="#features">Features</a>
            <a href="#impact">Get started</a>
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

        <div className="hero-media" ref={heroMediaRef}>
          <img
            src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80"
            alt="A city street with a footpath"
          />
          <div className="hero-media-overlay"></div>
        </div>

        <div className="hero-blob blob-a"></div>
        <div className="hero-blob blob-b"></div>

        <div className="hero-inner">

          <div className="hero-copy">

            <span className="hero-eyebrow">
              <span className="eyebrow-dot"></span>
              {TAGLINE}
            </span>

            <h1>
              {words("Safer footpaths start", 0.25)}
              <br />
              {words("with", 0.75)}{" "}
              {words("smart inspection.", 1.0, true)}
            </h1>

            <p>
              {SITE_NAME} connects citizens, inspectors and repair crews on one
              platform — so every damaged footpath is reported, inspected,
              repaired and verified, with a clear record at each step.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="btn-primary">
                Report a footpath issue
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link to="/login" className="btn-ghost">
                I'm an inspector / worker
              </Link>
            </div>

          </div>

          {/* Animated footpath scene (component defined above) */}
          <FootpathScene />

        </div>

      </section>


      {/* Promise tiles — sit outside the hero so they are never clipped */}
      <div className="promise-wrap">
        {PROMISES.map((p, i) => {
          const Icon = p.icon;
          return (
            <Reveal className="promise-reveal" delay={i * 120} key={p.title}>
              <div className="promise">
                <div className="promise-icon">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>


      {/* ============================
          TICKER TAPE
      ============================ */}

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {tickerItems.map((t, i) => (
            <span className="ticker-item" key={i}>
              {t}
              <i className="ticker-diamond"></i>
            </span>
          ))}
        </div>
      </div>


      {/* ============================
          HOW IT WORKS — lifecycle timeline
      ============================ */}

      <section className="how-section" id="how-it-works">

        <Reveal className="section-heading">
          <span className="eyebrow">How it works</span>
          <h2>The life of a footpath complaint, in five stages</h2>
        </Reveal>

        <Reveal className="timeline">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div className="stage" style={{ "--i": i }} key={stage.title}>
                <div className="stage-node">
                  <Icon size={24} strokeWidth={2} />
                  <span className="stage-num">{i + 1}</span>
                </div>
                <div className="stage-body">
                  <h3>{stage.title}</h3>
                  <p>{stage.text}</p>
                </div>
              </div>
            );
          })}
        </Reveal>

      </section>


      {/* ============================
          ROLES — who it's for
      ============================ */}

      <section className="roles-section" id="roles">

        <Reveal className="section-heading">
          <span className="eyebrow">Who it's for</span>
          <h2>One portal, built for everyone who keeps footpaths safe</h2>
        </Reveal>

        <div className="roles-grid">
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            return (
              <Reveal className="role-wrap" delay={i * 150} key={role.title}>
                <div className="role-panel">
                  <div className="role-top">
                    <div className="role-icon">
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <span className="role-tag">{role.tag}</span>
                  </div>
                  <h3>{role.title}</h3>
                  <ul>
                    {role.points.map((p) => (
                      <li key={p}>
                        <CheckCircle2 size={16} strokeWidth={2.4} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

      </section>


      {/* ============================
          WHAT YOU CAN REPORT
      ============================ */}

      <section className="issues-section">

        <Reveal className="section-heading">
          <span className="eyebrow">What you can report</span>
          <h2>If it makes a footpath unsafe, we track it</h2>
        </Reveal>

        <Reveal className="issue-chips">
          {ISSUE_TYPES.map((t, i) => (
            <span className="issue-chip" style={{ "--i": i }} key={t}>
              <i></i>
              {t}
            </span>
          ))}
        </Reveal>

      </section>


      {/* ============================
          FEATURES — bento grid
      ============================ */}

      <section className="features-section" id="features">

        <Reveal className="section-heading">
          <span className="eyebrow">Why {SITE_NAME}</span>
          <h2>Everything needed to inspect, repair and keep a record</h2>
        </Reveal>

        <div className="bento">

          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal className={`bento-wrap ${f.variant}`} delay={(i % 3) * 110} key={f.title}>
                <div className="bento-card">
                  {f.variant.includes("span2") && (
                    <Icon className="bento-watermark" size={150} strokeWidth={1.2} />
                  )}
                  <div className="bento-icon">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </Reveal>
            );
          })}

        </div>

      </section>


      {/* ============================
          CTA
      ============================ */}

      <section className="cta-section" id="impact">

        <span className="cta-orb o1"></span>
        <span className="cta-orb o2"></span>
        <span className="cta-orb o3"></span>

        <Reveal className="cta-inner">

          <h2>Your street is one report away from getting fixed.</h2>
          <p>
            Join residents, inspectors and crews making Coimbatore safer to
            walk in — one footpath at a time.
          </p>

          <div className="hero-actions center">
            <Link to="/signup" className="btn-primary light">
              Get started — it's free
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

        </Reveal>

      </section>


      {/* ============================
          FOOTER
      ============================ */}

      <footer className="landing-footer">

        <div className="hazard-strip"></div>

        <div className="footer-inner">

          <div className="footer-brand">
            <div className="nav-brand">
              <div className="nav-brand-icon">{brandLetter}</div>
              <span>{SITE_NAME}</span>
            </div>
            <small>{TAGLINE}</small>
          </div>

          <p>© 2026 {SITE_NAME} · Coimbatore Municipal Corporation</p>

        </div>

      </footer>

    </div>
  );
};

export default LandingPage;