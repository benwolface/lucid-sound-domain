import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  apiJoinWaitlist,
  apiCheckReferrer,
  apiLookupRefCode,
  apiGetSettings,
} from "./lib/api";
import "./styles.css";

// ── Dev flag — skip the intro so the circle shows immediately ──
const DEV_SKIP_INTRO = false;

// Landing only uses the two atmospheric shots
const LANDING_BACKGROUNDS = [
  { url: "/bg-1-sky.jpg", position: "center center", size: "cover" },
  { url: "/bg-2-disco.jpg", position: "center center", size: "cover" },
];

// Home gets all three, including the red one
const HOME_BACKGROUNDS = [
  { url: "/bg-1-sky.jpg", position: "center center", size: "cover" },
  { url: "/bg-2-disco.jpg", position: "center center", size: "cover" },
  { url: "/bg-3-red.jpg", position: "center center", size: "cover" },
];

function fmtPortalDate(isoDate) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [referralCode, setReferralCode] = useState(null);
  const [imHereEnabled, setImHereEnabled] = useState(false);
  const [nextPortalDate, setNextPortalDate] = useState(null);
  const [upcomingPortalDate, setUpcomingPortalDate] = useState(null);

  useEffect(() => {
    apiGetSettings()
      .then(({ imHereEnabled, nextPortalDate, upcomingPortalDate }) => {
        setImHereEnabled(!!imHereEnabled);
        setNextPortalDate(nextPortalDate ?? null);
        setUpcomingPortalDate(upcomingPortalDate ?? null);
      })
      .catch(() => {});
  }, []);

  if (screen === "home")
    return (
      <Home
        referralCode={referralCode}
        nextPortalDate={nextPortalDate}
        upcomingPortalDate={upcomingPortalDate}
      />
    );
  if (screen === "domain")
    return <DomainScreen onBack={() => setScreen("landing")} />;
  return (
    <div className="app">
      <Landing
        onHome={(code) => {
          setReferralCode(code ?? null);
          setScreen("home");
        }}
        onDomainScreen={() => setScreen("domain")}
        imHereEnabled={imHereEnabled}
        nextPortalDate={nextPortalDate}
      />
    </div>
  );
}

const JOURNEY_SECTIONS = [
  { id: "home", label: "Regulation" },
  { id: "domain", label: "Understand" },
  { id: "flow", label: "Attend" },
  { id: "invitation", label: "Invitation" },
  { id: "contact", label: "Contribute" },
];

function Home({ referralCode, nextPortalDate, upcomingPortalDate }) {
  const [bg] = useState(
    () => HOME_BACKGROUNDS[Math.floor(Math.random() * HOME_BACKGROUNDS.length)],
  );
  const [active, setActive] = useState("home");
  const [logoVisible, setLogoVisible] = useState(true);
  const [heroHintVisible, setHeroHintVisible] = useState(true);
  const [bgReady, setBgReady] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [navReady, setNavReady] = useState(false);
  const pageRef = useRef(null);
  const intersecting = useRef(new Set());
  const activeRef = useRef("home");
  const logoVisibleRef = useRef(true);
  const heroHintVisibleRef = useRef(true);

  // Entrance sequence: bg → content → nav bar
  useEffect(() => {
    const t1 = setTimeout(() => setBgReady(true), 80);
    const t2 = setTimeout(() => setContentReady(true), 1400);
    const t3 = setTimeout(() => setNavReady(true), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Section activation + one-time reveal
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const sections = el.querySelectorAll("[data-section]");
    const revealed = new Set();
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = e.target.dataset.section;

          // Always update active for timeline + chevron visibility
          if (id && activeRef.current !== id) {
            activeRef.current = id;
            setActive(id);
          }

          // One-time animation reveal
          if (!revealed.has(e.target)) {
            revealed.add(e.target);
            const kids = Array.from(e.target.querySelectorAll(".j-animate"));
            kids.forEach((child, i) => {
              child.style.transitionDelay = `${i * 110}ms`;
            });
            e.target.classList.add("is-visible");
          }
        });
      },
      { root: el, threshold: 0.35 },
    );
    sections.forEach((s) => ob.observe(s));
    return () => ob.disconnect();
  }, []);

  // Logo visibility — hide when between sections
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const firstView = el.querySelector(".home-first-view");
    const targets = [firstView, ...el.querySelectorAll(".j-section")].filter(
      Boolean,
    );

    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) intersecting.current.add(e.target);
          else intersecting.current.delete(e.target);
        });
        const nextLogoVisible = intersecting.current.size > 0;
        const firstViewVisible = firstView
          ? intersecting.current.has(firstView)
          : false;

        if (logoVisibleRef.current !== nextLogoVisible) {
          logoVisibleRef.current = nextLogoVisible;
          setLogoVisible(nextLogoVisible);
        }

        if (heroHintVisibleRef.current !== firstViewVisible) {
          heroHintVisibleRef.current = firstViewVisible;
          setHeroHintVisible(firstViewVisible);
        }
      },
      { root: el, threshold: 0.05 },
    );

    targets.forEach((t) => ob.observe(t));
    return () => ob.disconnect();
  }, []);

  const scrollToJourney = () =>
    pageRef.current
      ?.querySelector("#j-domain")
      ?.scrollIntoView({ behavior: "smooth" });

  return (
    <div ref={pageRef} className="home-page">
      {/* Background fixed behind all scroll content */}
      <div
        className={`home-bg${bgReady ? " is-entered" : ""}`}
        style={{
          backgroundImage: `url(${bg.url})`,
          backgroundPosition: bg.position,
          backgroundSize: bg.size,
        }}
      />
      <div className={`home-veil${bgReady ? " is-entered" : ""}`} />

      {/* ── Fixed logo — visible when in a section, hidden between ── */}
      <div className={`home-logo${logoVisible ? " is-visible" : ""}`}>
        <span className="home-logo-word">LUCID</span>
        <span className="home-logo-word">SOUND</span>
        <span className="home-logo-word">DOMAIN</span>
      </div>

      {/* ── First viewport ── */}
      <div
        className={`home-first-view${contentReady ? " is-entered" : ""}`}
        data-section="home"
      >
        <div className="home-center">
          <p className="home-regulation-title">( Regulation )</p>
          <p className="home-next-label">next portal opening on</p>
          <p className="home-next-date">
            {nextPortalDate ? fmtPortalDate(nextPortalDate) : "date TBD"}
          </p>
          <p className="home-next-address">
            1340 Turk St Apt 418 · San Francisco CA
          </p>
          <CalendarButtons nextPortalDate={nextPortalDate} />
          <p className="home-upcoming-title">Upcoming portals</p>
          <p className="home-upcoming-date">
            {upcomingPortalDate ? fmtPortalDate(upcomingPortalDate) : "date TBD"}
          </p>
          <a
            href="https://www.instagram.com/lucidsounddomain/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-ig-link"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle
                cx="17.5"
                cy="6.5"
                r="0.6"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </a>
        </div>
        <ScrollHint onClick={scrollToJourney} visible={heroHintVisible} />
      </div>

      {/* ── Journey ── */}
      <div className="journey-layout">
        {/* Sticky timeline sidebar */}
        <div className="j-timeline-wrap">
          <JourneyTimeline active={active} pageRef={pageRef} />
        </div>

        {/* Sections */}
        <div className="journey-sections">
          {/* ── The Domain ── */}
          <section id="j-domain" className="j-section" data-section="domain">
            <div className="j-domain-cols">
              {/* Left: all text */}
              <div className="j-domain-text">
                <h2 className="j-animate j-section-heading">Understand</h2>
                <p className="j-animate j-domain-intro">
                  The Lucid Sound Domain is an intimate, deep listening dance
                  floor that requires nothing from you except your presence.
                  This is:
                </p>
                <div className="j-animate j-space-list">
                  <ul>
                    <li>a space to receive</li>
                    <li>a space to restore</li>
                    <li>a space to reconnect</li>
                    <li>
                      a space to <span className="j-green">Regulate</span>
                    </li>
                    <li>and release</li>
                  </ul>
                </div>
              </div>

              {/* Right: big image */}
              <div className="j-animate j-domain-image-wrap">
                <ZoomableImage
                  src="/soundsystem-boundary.jpg"
                  alt="Lucid Sound Domain sound system"
                  href="https://www.instagram.com/p/DV1a4kwjU8B/"
                />
                <a
                  href="https://www.instagram.com/p/DV1a4kwjU8B/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="j-image-caption-link"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="j-ig-icon"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="0.6"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                  the soundsystem as a boundary object ↗
                </a>
              </div>
            </div>
          </section>

          {/* ── Flow ── */}
          <section id="j-flow" className="j-section" data-section="flow">
            <h2 className="j-animate j-section-heading">Attend</h2>
            <div className="j-animate j-attend-schedule">
              <p className="j-attend-slot">7:00p - Arrival + Settle</p>
              <p className="j-attend-slot">
                8:00p - Regulation (Deep Listening Session)
              </p>
              <p className="j-attend-note">
                during this part, we ask that the room be silent for full
                immersion. you&apos;re welcome to step into a room or the roof
                to chat, smoke, or use your phone
              </p>
              <p className="j-attend-slot">
                9:00 - 9:30p - Transition Time (Ambient)
              </p>
              <p className="j-attend-slot">
                9:30 - 10:30p - Low-end Ritual (Movement)
              </p>
              <p className="j-attend-note">dance release express</p>
            </div>
          </section>

          {/* ── Invitation ── */}
          <section
            id="j-invitation"
            className="j-section"
            data-section="invitation"
          >
            <h2 className="j-animate j-section-heading">Invitation</h2>
            <p className="j-animate j-section-copy">
              if you&apos;d like to bring a friend into the domain for the next
              portal, click here for your unique invite link
            </p>
            <InviteLinkButton referralCode={referralCode} />
          </section>

          {/* ── Contact ── */}
          <section id="j-contact" className="j-section" data-section="contact">
            <h2 className="j-animate j-section-heading">Contribute</h2>
            <p className="j-animate j-section-copy">
              if you&apos;d like to contribute to the co-creation of Regulation
              through sound, visualization, food, drink or any other way, please
              reach out at{" "}
              <a className="j-inline-link" href="sms:9805059936">
                (980)-505-9936
              </a>
              .
            </p>
            <SectionScrollHint
              nextId="j-outro"
              containerRef={pageRef}
              visible={active === "contact"}
              alwaysShow
            />
          </section>
        </div>
        <MobileTimeline active={active} pageRef={pageRef} navReady={navReady} />
      </div>

      {/* ── Artist statement + footer — snaps as its own final screen ── */}
      <div id="j-outro" className="j-outro">
        <div className="j-artist-statement-wrap" aria-label="Artist statement">
          <img
            src="/artist-statement.jpg"
            alt="Artist statement"
            className="j-artist-statement-image"
          />
          <p className="j-image-subcaption j-artist-subcaption">
            questions to consider within the domain
          </p>
        </div>
        <footer className="home-fixed-footer">
          <a
            href="https://www.instagram.com/lucidsounddomain/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-ig"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 16, height: 16 }}
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle
                cx="17.5"
                cy="6.5"
                r="0.6"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </a>
          <p className="home-footer-tagline">remain present</p>
          <p className="home-footer-copy">Lucid Sound Domain &copy; 2026</p>
        </footer>
      </div>
    </div>
  );
}

// ── Wide arc at the bottom of the first view ──
function ScrollHint({ onClick, visible }) {
  return (
    <button
      className={`scroll-hint${visible ? " is-visible" : ""}`}
      onClick={onClick}
      aria-label="Scroll to explore"
    >
      <span className="scroll-hint-chevron">
        <svg viewBox="0 0 24 12" fill="none">
          <polyline
            points="2,1 12,10 22,1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

// ── Scroll hint at the bottom of each journey section ──
function SectionScrollHint({ nextId, containerRef, visible, alwaysShow }) {
  const handleClick = () => {
    containerRef.current
      ?.querySelector(`#${nextId}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <button
      className={`section-scroll-hint${visible ? " is-visible" : ""}${alwaysShow ? " always-show" : ""}`}
      onClick={handleClick}
      aria-label="Next section"
    >
      <svg viewBox="0 0 24 12" fill="none" className="section-chevron">
        <polyline
          points="2,1 12,10 22,1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ── Zoomable image lightbox ──
function ZoomableImage({ src, alt, href }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onWheel = (e) => {
    e.preventDefault();
    setScale((s) => Math.min(6, Math.max(1, s - e.deltaY * 0.004)));
  };

  const onMouseDown = (e) => {
    if (scale <= 1) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onMouseUp = () => {
    dragging.current = false;
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="j-domain-img"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <div
            className="lightbox-inner"
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className="lightbox-img"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                cursor: scale > 1 ? "grab" : "zoom-in",
              }}
              draggable={false}
            />
            <div className="lightbox-actions">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="lightbox-ig-link"
                onClick={(e) => e.stopPropagation()}
              >
                view on instagram
              </a>
              <button className="lightbox-close" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Vertical timeline sidebar ──
function JourneyTimeline({ active, pageRef }) {
  const activeIdx = JOURNEY_SECTIONS.findIndex((s) => s.id === active);
  const fillPct =
    activeIdx <= 0 ? 0 : (activeIdx / (JOURNEY_SECTIONS.length - 1)) * 100;

  return (
    <nav className="j-timeline">
      {/* Track + fill line */}
      <span className="j-track">
        <span className="j-track-fill" style={{ height: `${fillPct}%` }} />
      </span>

      {JOURNEY_SECTIONS.map((s, i) => (
        <a
          key={s.id}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (s.id === "home") {
              pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              pageRef.current
                ?.querySelector(`#j-${s.id}`)
                ?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className={`j-node${s.id === active ? " is-active" : ""}${i < activeIdx ? " is-past" : ""}`}
        >
          <span className="j-node-dot">
            <span className="j-node-ring" />
          </span>
          <span className="j-node-label">{s.label}</span>
        </a>
      ))}
    </nav>
  );
}

// ── Horizontal bottom timeline for mobile ──
function MobileTimeline({ active, pageRef, navReady }) {
  const activeIdx = JOURNEY_SECTIONS.findIndex((s) => s.id === active);
  const fillPct =
    activeIdx <= 0 ? 0 : (activeIdx / (JOURNEY_SECTIONS.length - 1)) * 100;

  return (
    <nav className={`j-timeline-mobile${navReady ? " is-entered" : ""}`}>
      <span className="j-track-h">
        <span className="j-track-h-fill" style={{ width: `${fillPct}%` }} />
      </span>
      {JOURNEY_SECTIONS.map((s, i) => (
        <a
          key={s.id}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (s.id === "home") {
              pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              pageRef.current
                ?.querySelector(`#j-${s.id}`)
                ?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className={`j-mnode${s.id === active ? " is-active" : ""}${i < activeIdx ? " is-past" : ""}`}
        >
          <span className="j-mnode-label">{s.label}</span>
          <span className="j-mnode-dot">
            <span className="j-mnode-ring" />
          </span>
        </a>
      ))}
    </nav>
  );
}

function portalCalDates(isoDate) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  // Event: 7pm–10:30pm PDT (UTC-7) = next calendar day 02:00–05:30 UTC
  const start = new Date(Date.UTC(year, month - 1, day + 1, 2, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day + 1, 5, 30, 0));
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return { start: fmt(start), end: fmt(end) };
}

function CalendarButtons({ nextPortalDate }) {
  const cal = portalCalDates(nextPortalDate);

  const ics = cal
    ? [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Lucid Sound Domain//EN",
        "BEGIN:VEVENT",
        `DTSTART:${cal.start}`,
        `DTEND:${cal.end}`,
        "SUMMARY:Lucid Sound Domain — Portal Opening",
        "DESCRIPTION:The next portal opens. lucidsounddomain.com",
        "LOCATION:1340 Turk St Apt 418\\, San Francisco\\, CA 94115",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")
    : null;

  const googleUrl = cal
    ? "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=Lucid+Sound+Domain+%E2%80%94+Portal+Opening" +
      `&dates=${cal.start}%2F${cal.end}` +
      "&details=The+next+portal+opens.+lucidsounddomain.com" +
      "&location=1340+Turk+St+Apt+418%2C+San+Francisco%2C+CA+94115"
    : null;

  if (!cal) return null;

  return (
    <div className="cal-btns">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="cal-btn"
      >
        <GoogleCalIcon />
        add to google calendar
      </a>
      <a
        href={"data:text/calendar;charset=utf-8," + encodeURIComponent(ics)}
        download="lucid-sound-domain-portal.ics"
        className="cal-btn"
      >
        <AppleCalIcon />
        add to apple calendar
      </a>
    </div>
  );
}

function GoogleCalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppleCalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      py=""
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="19"
        textAnchor="middle"
        fontSize="7"
        fill="currentColor"
        fontFamily="system-ui"
      >
        22
      </text>
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function InviteLinkButton({ referralCode }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = referralCode
    ? `https://lucidsounddomain.com/?ref=${referralCode}`
    : "https://lucidsounddomain.com";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={`j-animate j-invite-power${copied ? " is-copied" : ""}`}
      onClick={handleCopy}
      aria-label="Copy invite link"
    >
      <PowerIcon />
      <span>{copied ? "link copied" : "copy invite link"}</span>
    </button>
  );
}

const DOMAIN_MESSAGE =
  "hello.....can you hear me through the portal......is anyone there...........if you can, im leaving instructions on how to find me. when you arrive text or call (408) 409-4482 or +1 (408) 821-2952 to enter.";

function DomainScreen({ onBack }) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Start typing after fade-in settles
  useEffect(() => {
    if (!visible) return;

    function typeNext() {
      if (indexRef.current >= DOMAIN_MESSAGE.length) {
        // Done — blink cursor a few times then hide it
        setTimeout(() => setShowCursor(false), 2800);
        return;
      }

      const char = DOMAIN_MESSAGE[indexRef.current];
      indexRef.current += 1;
      setDisplayed(DOMAIN_MESSAGE.slice(0, indexRef.current));

      // Variable delay: slower on dots/spaces for dramatic pauses, faster on regular chars
      const prev = DOMAIN_MESSAGE[indexRef.current - 2];
      let delay = 42 + Math.random() * 35; // base ~42-77ms
      if (char === ".") delay = 320 + Math.random() * 180;
      else if (char === " " && prev === ".")
        delay = 600 + Math.random() * 400; // long pause after dot runs
      else if (char === " ") delay = 60 + Math.random() * 35;
      else if (char === ",") delay = 180 + Math.random() * 80;

      timeoutRef.current = setTimeout(typeNext, delay);
    }

    const startDelay = setTimeout(typeNext, 900);
    return () => {
      clearTimeout(startDelay);
      clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  return (
    <div className={`domain-screen${visible ? " is-visible" : ""}`}>
      <div className="domain-screen-glow" />
      <div className="domain-screen-content">
        <p className="domain-screen-text">
          {displayed}
          {showCursor && <span className="domain-cursor">|</span>}
        </p>
      </div>
      <button className="domain-screen-back" onClick={onBack}>
        ← back
      </button>
    </div>
  );
}

function isContactReady(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 || value.includes(".com");
}

function Landing({ onHome, onDomainScreen, imHereEnabled, nextPortalDate }) {
  const [bg] = useState(
    () =>
      LANDING_BACKGROUNDS[
        Math.floor(Math.random() * LANDING_BACKGROUNDS.length)
      ],
  );

  // step: 'arrival' → ('name' → 'contact' → 'referral') | ('returning')
  const [step, setStep] = useState("arrival");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [referrer, setReferrer] = useState("");
  const [returningName, setReturningName] = useState("");
  // ref code from ?ref= URL param — skips the referral step if present
  const [inboundRefCode, setInboundRefCode] = useState(null);
  const [inboundRefName, setInboundRefName] = useState(null);

  // Read ?ref= on mount and look up who owns it
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code) return;
    apiLookupRefCode(code)
      .then(({ found, name: refName }) => {
        if (found) {
          setInboundRefCode(code);
          setInboundRefName(refName);
        }
      })
      .catch(() => {});
  }, []);

  const showSubmit =
    step === "name"
      ? name.trim().length > 0
      : step === "contact"
        ? isContactReady(contact)
        : step === "referral"
          ? referrer.trim().length > 0
          : step === "returning"
            ? returningName.trim().length > 0
            : false;

  // ── Refs ──
  const bgSlideRef = useRef(null);
  const splashRef = useRef(null);
  const welcomeRef = useRef(null);
  const welcomeTextRef = useRef(null);
  const whoTextRef = useRef(null);
  const diskRef = useRef(null);
  const ringRef = useRef(null);
  const inputWrapRef = useRef(null);
  const lineRef = useRef(null);
  const innerWhiteRef = useRef(null);
  const domainTextRef = useRef(null);
  const initiatedTextRef = useRef(null);
  const flashOverlayRef = useRef(null);
  const portalInfoRef = useRef(null);

  // ── Fade the circle text to a new step ──
  function fadeToStep(nextStep) {
    const whoEl = whoTextRef.current;
    if (whoEl) {
      whoEl.style.transition = "opacity 0.35s ease, transform 0.35s ease";
      whoEl.style.opacity = "0";
      whoEl.style.transform = "translateY(-10px)";
      setTimeout(() => {
        setStep(nextStep);
        if (whoEl) {
          whoEl.style.transform = "translateY(10px)";
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              whoEl.style.opacity = "1";
              whoEl.style.transform = "translateY(0)";
            }),
          );
        }
      }, 380);
    } else {
      setStep(nextStep);
    }
  }

  // ── Submit: name step → go to contact ──
  function handleNameSubmit() {
    if (!name.trim()) return;
    fadeToStep("contact");
  }

  // ── Submit: contact step → skip referral if we have an inbound ref code ──
  function handleContactSubmit() {
    if (!isContactReady(contact)) return;
    if (inboundRefCode) {
      // Already know the referrer — submit directly
      triggerPower();
    } else {
      fadeToStep("referral");
    }
  }

  // ── Arrival choice: first arrival → name step ──
  function handleFirstArrival() {
    const wtEl = welcomeTextRef.current;
    if (wtEl) {
      wtEl.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      wtEl.style.opacity = "0";
      wtEl.style.transform = "translateY(-10px)";
    }
    setStep("name");
    const wqEl = whoTextRef.current;
    if (wqEl) {
      wqEl.style.opacity = "0";
      wqEl.style.transform = "translateY(12px)";
      setTimeout(() => {
        if (wqEl) {
          wqEl.style.transition = "opacity 0.5s ease, transform 0.5s ease";
          wqEl.style.opacity = "1";
          wqEl.style.transform = "translateY(0)";
        }
      }, 350);
    }
    setTimeout(() => {
      const lineEl = lineRef.current;
      if (lineEl) {
        lineEl.style.transform = "scaleX(0)";
        const ln = { sx: 0 };
        animate(ln, {
          sx: 1,
          duration: 800,
          ease: "out(1.5)",
          onRender: () => {
            lineEl.style.transform = `scaleX(${ln.sx})`;
          },
        });
      }
    }, 100);
  }

  // ── Arrival choice: returning → check name in DB ──
  function handleArrivalReturning() {
    const wtEl = welcomeTextRef.current;
    if (wtEl) {
      wtEl.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      wtEl.style.opacity = "0";
      wtEl.style.transform = "translateY(-10px)";
    }
    setStep("returning");
    const wqEl = whoTextRef.current;
    if (wqEl) {
      wqEl.style.opacity = "0";
      wqEl.style.transform = "translateY(12px)";
      setTimeout(() => {
        if (wqEl) {
          wqEl.style.transition = "opacity 0.5s ease, transform 0.5s ease";
          wqEl.style.opacity = "1";
          wqEl.style.transform = "translateY(0)";
        }
      }, 350);
    }
    setTimeout(() => {
      const lineEl = lineRef.current;
      if (lineEl) {
        lineEl.style.transform = "scaleX(0)";
        const ln = { sx: 0 };
        animate(ln, {
          sx: 1,
          duration: 800,
          ease: "out(1.5)",
          onRender: () => {
            lineEl.style.transform = `scaleX(${ln.sx})`;
          },
        });
      }
    }, 100);
  }

  const [isPressing, setIsPressing] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);

  // ── Back: return to previous step ──
  function handleBack() {
    setRejectionMode(false);
    if (step === "name" || step === "returning") {
      // Restore "welcome" in the circle and go back to arrival buttons
      const wqEl = whoTextRef.current;
      if (wqEl) {
        wqEl.style.transition = "opacity 0.35s ease, transform 0.35s ease";
        wqEl.style.opacity = "0";
        wqEl.style.transform = "translateY(-10px)";
      }
      const wtEl = welcomeTextRef.current;
      setTimeout(() => {
        setStep("arrival");
        if (wtEl) {
          wtEl.style.opacity = "0";
          wtEl.style.transform = "translateY(10px)";
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              wtEl.style.transition = "opacity 0.5s ease, transform 0.5s ease";
              wtEl.style.opacity = "1";
              wtEl.style.transform = "translateY(0)";
            }),
          );
        }
      }, 350);
    } else if (step === "contact") {
      fadeToStep("name");
    } else if (step === "referral") {
      fadeToStep("contact");
    }
  }

  function handleRejection(type = "referral") {
    const whoEl = whoTextRef.current;
    if (!whoEl) return;
    const fade = (out, cb) => {
      whoEl.style.transition = "opacity 0.35s ease, transform 0.35s ease";
      whoEl.style.opacity = "0";
      whoEl.style.transform = `translateY(${out ? -10 : -10}px)`;
      setTimeout(() => {
        cb();
        whoEl.style.transform = "translateY(10px)";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            whoEl.style.opacity = "1";
            whoEl.style.transform = "translateY(0)";
          }),
        );
      }, 380);
    };
    fade(true, () => {
      setRejectionMode(type);
      setReferrer("");
      setReturningName("");
      setTimeout(() => {
        fade(true, () => {
          setRejectionMode(false);
        });
      }, 2800);
    });
  }

  async function triggerPower() {
    if (isPressing) return;
    setIsPressing(true);
    try {
      let resolvedReferrer = referrer.trim();

      // If we came in via ?ref= link, skip the name check and use the code directly
      if (inboundRefCode) {
        resolvedReferrer = inboundRefName || "";
      } else {
        const { found } = await apiCheckReferrer({ name: resolvedReferrer });
        if (!found) {
          setIsPressing(false);
          handleRejection("referral");
          return;
        }
      }

      const { referralCode } = await apiJoinWaitlist({
        name,
        contact,
        referredBy: resolvedReferrer || undefined,
      });
      setIsPressing(false);
      handlePowerPress(referralCode);
    } catch {
      setIsPressing(false);
      handleRejection("referral");
    }
  }

  async function triggerReturning() {
    if (isPressing) return;
    setIsPressing(true);
    try {
      const { found, referralCode } = await apiCheckReferrer({
        name: returningName.trim(),
      });
      if (!found) {
        setIsPressing(false);
        handleRejection("returning");
        return;
      }
      setIsPressing(false);
      handlePowerPress(referralCode);
    } catch {
      setIsPressing(false);
      handleRejection("returning");
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (step === "name") handleNameSubmit();
    else if (step === "contact") handleContactSubmit();
    else if (step === "referral" && referrer.trim().length > 0) triggerPower();
    else if (step === "returning" && returningName.trim().length > 0)
      triggerReturning();
  }

  // ── Power button: full shutdown sequence ──
  function handlePowerPress(referralCode, onComplete = null) {
    // 1 — fade out everything except the circle
    const fadeEls = [
      bgSlideRef.current,
      splashRef.current,
      diskRef.current,
      ringRef.current,
      inputWrapRef.current,
      whoTextRef.current,
      portalInfoRef.current,
    ].filter(Boolean);

    fadeEls.forEach((el) => {
      const s = { o: parseFloat(el.style.opacity || "1") };
      animate(s, {
        o: 0,
        duration: 900,
        ease: "out(2)",
        onRender: () => {
          el.style.opacity = s.o;
        },
      });
    });

    // 2 — white blooms inside the circle
    const inner = innerWhiteRef.current;
    if (inner) {
      const s = { o: 0 };
      animate(s, {
        o: 1,
        duration: 1600,
        delay: 800,
        ease: "out(3)",
        onRender: () => {
          inner.style.opacity = s.o;
        },
      });
    }

    // 3 — "domain" floats in below circle (~2s after white is full)
    const domEl = domainTextRef.current;
    if (domEl) {
      const s = { o: 0, ty: 14 };
      animate(s, {
        o: 1,
        ty: 0,
        duration: 700,
        delay: 2600,
        ease: "out(2)",
        onRender: () => {
          domEl.style.opacity = s.o;
          domEl.style.transform = `translateY(${s.ty}px)`;
        },
      });
    }

    // 4 — "initiated" floats in just after
    const initEl = initiatedTextRef.current;
    if (initEl) {
      const s = { o: 0, ty: 14 };
      animate(s, {
        o: 1,
        ty: 0,
        duration: 700,
        delay: 3200,
        ease: "out(2)",
        onRender: () => {
          initEl.style.opacity = s.o;
          initEl.style.transform = `translateY(${s.ty}px)`;
        },
      });
    }

    // 5 — flash the whole screen white
    const flashEl = flashOverlayRef.current;
    if (flashEl) {
      const s = { o: 0 };
      animate(s, {
        o: 1,
        duration: 500,
        delay: 4200,
        ease: "in(2)",
        onRender: () => {
          flashEl.style.opacity = s.o;
        },
      });
    }

    // 6 — navigate after holding white for 0.5s
    setTimeout(() => (onComplete ? onComplete() : onHome(referralCode)), 5200);
  }

  // ── Intro animation ──
  useEffect(() => {
    if (DEV_SKIP_INTRO) {
      if (bgSlideRef.current) bgSlideRef.current.style.opacity = "1";
      if (splashRef.current) splashRef.current.style.opacity = "0";
      if (welcomeRef.current) welcomeRef.current.style.opacity = "1";
      if (whoTextRef.current) {
        whoTextRef.current.style.opacity = "1";
        whoTextRef.current.style.transform = "translateY(0)";
      }
      if (inputWrapRef.current) inputWrapRef.current.style.opacity = "1";
      if (lineRef.current) lineRef.current.style.transform = "scaleX(1)";
      return;
    }

    const words = [...document.querySelectorAll(".splash-word")];
    const animations = [];
    let flickerStart = null;
    let flickerTick = null;
    let logoTimeout = null;

    if (bgSlideRef.current) bgSlideRef.current.style.opacity = "0";
    if (welcomeRef.current) welcomeRef.current.style.opacity = "0";

    words.forEach((word) => {
      word.style.opacity = "0";
      word.style.filter = "blur(6px)";
      word.style.transform = "translateY(0px)";
    });

    // Phase 1: Entrance
    words.forEach((word, i) => {
      const s = { opacity: 0, blur: 6 };
      animations.push(
        animate(s, {
          opacity: 1,
          blur: 0,
          duration: 2600,
          delay: i * 750,
          ease: "out(2)",
          onRender: () => {
            word.style.opacity = s.opacity;
            word.style.filter = `blur(${s.blur}px)`;
          },
        }),
      );
    });

    // Phase 2: Strobe
    flickerStart = setTimeout(() => {
      words.forEach((word) => word.classList.add("no-grid"));
      const born = performance.now();
      flickerTick = setInterval(() => {
        words.forEach((word) => {
          word.style.opacity = Math.random() > 0.5 ? "1" : "0";
        });
        if (performance.now() - born >= 550) {
          clearInterval(flickerTick);
          flickerTick = null;
          words.forEach((word) => {
            word.style.opacity = "0";
          });
        }
      }, 20);
    }, 6100);

    // Phase 3: Smoke
    const smokeDefs = [
      {
        fadeDelay: 6800,
        loopDelay: 7200,
        dur: 4400,
        minO: 0.1,
        maxO: 0.62,
        minB: 1.5,
        maxB: 5.5,
        ty: -5,
      },
      {
        fadeDelay: 7000,
        loopDelay: 7400,
        dur: 5900,
        minO: 0.08,
        maxO: 0.58,
        minB: 2.0,
        maxB: 6.5,
        ty: -8,
      },
      {
        fadeDelay: 6900,
        loopDelay: 7300,
        dur: 3800,
        minO: 0.12,
        maxO: 0.65,
        minB: 1.0,
        maxB: 4.5,
        ty: -4,
      },
    ];
    words.forEach((word, i) => {
      const { fadeDelay, loopDelay, dur, minO, maxO, minB, maxB, ty } =
        smokeDefs[i];
      const entry = { opacity: 0, blur: maxB };
      animations.push(
        animate(entry, {
          opacity: minO,
          blur: maxB * 0.8,
          duration: 400,
          delay: fadeDelay,
          ease: "out(2)",
          onRender: () => {
            word.style.opacity = entry.opacity;
            word.style.filter = `blur(${entry.blur}px)`;
          },
        }),
      );
      const s = { opacity: minO, blur: maxB * 0.8, ty: 0 };
      animations.push(
        animate(s, {
          opacity: maxO,
          blur: minB,
          ty,
          duration: dur,
          delay: loopDelay,
          loop: true,
          alternate: true,
          ease: "inOut(4)",
          onRender: () => {
            word.style.opacity = s.opacity;
            word.style.filter = `blur(${s.blur}px)`;
            word.style.transform = `translateY(${s.ty}px)`;
          },
        }),
      );
    });

    // Photo reveal
    const slide = bgSlideRef.current;
    if (slide) {
      const sp = { opacity: 0 };
      animations.push(
        animate(sp, {
          opacity: 1,
          duration: 4000,
          delay: 6800,
          ease: "out(2)",
          onRender: () => {
            slide.style.opacity = sp.opacity;
          },
        }),
      );
    }

    // Logo to top
    logoTimeout = setTimeout(() => {
      const splashEl = splashRef.current;
      if (!splashEl) return;
      const LOGO_SCALE = 0.28;
      const sat = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--sat")
      ) || 0;
      const LOGO_TOP_PX = 32 + sat;
      const rect = splashEl.getBoundingClientRect();
      const targetTY =
        LOGO_TOP_PX +
        (rect.height * LOGO_SCALE) / 2 -
        (rect.top + rect.height / 2);
      const sl = { scale: 1, ty: 0 };
      animations.push(
        animate(sl, {
          scale: LOGO_SCALE,
          ty: targetTY,
          duration: 1400,
          ease: "inOut(3)",
          onRender: () => {
            splashEl.style.transform = `translateY(${sl.ty}px) scale(${sl.scale})`;
          },
        }),
      );
    }, 9000);

    // Welcome circle
    const welcomeWrap = welcomeRef.current;
    if (welcomeWrap) {
      const ww = { opacity: 0 };
      animations.push(
        animate(ww, {
          opacity: 1,
          duration: 1000,
          delay: 10600,
          ease: "out(2)",
          onRender: () => {
            welcomeWrap.style.opacity = ww.opacity;
          },
        }),
      );

      const wtEl = welcomeTextRef.current;
      if (wtEl) {
        const wt = { opacity: 0, ty: 12 };
        animations.push(
          animate(wt, {
            opacity: 1,
            ty: 0,
            duration: 900,
            delay: 11000,
            ease: "out(2)",
            onRender: () => {
              wtEl.style.opacity = wt.opacity;
              wtEl.style.transform = `translateY(${wt.ty}px)`;
            },
          }),
        );
      }

      const inputWrapEl = inputWrapRef.current;
      if (inputWrapEl) {
        const iw = { opacity: 0 };
        animations.push(
          animate(iw, {
            opacity: 1,
            duration: 700,
            delay: 14200,
            ease: "out(2)",
            onRender: () => {
              inputWrapEl.style.opacity = iw.opacity;
            },
          }),
        );
      }

      const lineEl = lineRef.current;
      if (lineEl) {
        const ln = { sx: 0 };
        animations.push(
          animate(ln, {
            sx: 1,
            duration: 1600,
            delay: 14200,
            ease: "out(1.5)",
            onRender: () => {
              lineEl.style.transform = `scaleX(${ln.sx})`;
            },
          }),
        );
      }
    }

    return () => {
      clearTimeout(flickerStart);
      clearTimeout(logoTimeout);
      if (flickerTick) clearInterval(flickerTick);
      words.forEach((word) => {
        word.style.opacity = "0";
        word.style.filter = "blur(6px)";
        word.style.transform = "translateY(0px)";
        word.classList.remove("no-grid");
      });
      if (splashRef.current) splashRef.current.style.transform = "";
      if (welcomeRef.current) welcomeRef.current.style.opacity = "0";
      if (welcomeTextRef.current) {
        welcomeTextRef.current.style.opacity = "0";
        welcomeTextRef.current.style.transform = "";
      }
      if (whoTextRef.current) {
        whoTextRef.current.style.opacity = "0";
        whoTextRef.current.style.transform = "";
      }
      if (inputWrapRef.current) inputWrapRef.current.style.opacity = "0";
      if (lineRef.current) lineRef.current.style.transform = "scaleX(0)";
      if (slide) slide.style.opacity = "0";
      animations.forEach((a) => a.revert());
    };
  }, []);

  return (
    <div className="landing">
      <div
        ref={bgSlideRef}
        className="bg-slide"
        style={{
          backgroundImage: `url(${bg.url})`,
          backgroundPosition: bg.position,
          backgroundSize: bg.size,
        }}
      />
      <div className="bg-veil" />

      <div ref={splashRef} className="splash">
        <span className="splash-word" data-word="LUCID">
          LUCID
        </span>
        <span className="splash-word" data-word="SOUND">
          SOUND
        </span>
        <span className="splash-word" data-word="DOMAIN">
          DOMAIN
        </span>
      </div>

      <div ref={welcomeRef} className="welcome-wrap">
        <div ref={portalInfoRef} className="landing-portal-info">
          <p className="landing-portal-title">( Regulation )</p>
          <p className="landing-portal-label">next portal opening on</p>
          <p className="landing-portal-date">{nextPortalDate ? fmtPortalDate(nextPortalDate) : "date TBD"}</p>
        </div>
        <div ref={diskRef} className="accretion-disk" />
        <div ref={ringRef} className="welcome-ring" />
        <div className="welcome-circle">
          <div ref={innerWhiteRef} className="circle-inner-white" />
          <span ref={welcomeTextRef} className="circle-text">
            welcome
          </span>
          <span ref={whoTextRef} className="circle-text">
            {rejectionMode === "returning" ? (
              "you're in the right place. we're just having trouble finding you"
            ) : rejectionMode ? (
              "this is the right place. that's not the right person"
            ) : step === "name" || step === "returning" ? (
              "who are you?"
            ) : step === "contact" ? (
              "how do we reach you?"
            ) : step === "referral" ? (
              <>
                who brought you to
                <br />
                the domain?
              </>
            ) : null}
          </span>
        </div>

        <div className="domain-initiated-wrap">
          <span ref={domainTextRef} className="domain-text">
            domain
          </span>
          <span ref={initiatedTextRef} className="initiated-text">
            initiated
          </span>
        </div>

        <form
          ref={inputWrapRef}
          className="waitlist-input-wrap"
          onSubmit={handleSubmit}
        >
          {step === "arrival" ? (
            <div className="arrival-choice">
              <button
                type="button"
                className="arrival-btn"
                onClick={handleFirstArrival}
              >
                first arrival
              </button>
              <button
                type="button"
                className="arrival-btn"
                onClick={handleArrivalReturning}
              >
                returning
              </button>
              {imHereEnabled && (
                <button
                  type="button"
                  className="arrival-btn arrival-btn--here"
                  onClick={() => handlePowerPress(null, onDomainScreen)}
                >
                  i'm here
                </button>
              )}
            </div>
          ) : (
            <>
              <input
                className="waitlist-input"
                type={step === "contact" ? "tel" : "text"}
                placeholder={
                  step === "name" || step === "returning"
                    ? "your name"
                    : step === "contact"
                      ? "phone number"
                      : "name..."
                }
                value={
                  step === "name"
                    ? name
                    : step === "contact"
                      ? contact
                      : step === "returning"
                        ? returningName
                        : referrer
                }
                onChange={(e) =>
                  step === "name"
                    ? setName(e.target.value)
                    : step === "contact"
                      ? setContact(e.target.value)
                      : step === "returning"
                        ? setReturningName(e.target.value)
                        : setReferrer(e.target.value)
                }
              />
              <div ref={lineRef} className="welcome-line" />
              <button type="button" className="back-btn" onClick={handleBack}>
                ← back
              </button>
              <button
                type="submit"
                onClick={
                  step === "referral"
                    ? (e) => {
                        e.preventDefault();
                        triggerPower();
                      }
                    : step === "returning"
                      ? (e) => {
                          e.preventDefault();
                          triggerReturning();
                        }
                      : undefined
                }
                className={`submit-btn${showSubmit ? " visible" : ""}${step === "referral" || step === "returning" ? " submit-btn--power" : ""}${isPressing ? " is-pressing" : ""}`}
              >
                {step === "referral" || step === "returning" ? (
                  <PowerIcon />
                ) : (
                  "enter"
                )}
              </button>
            </>
          )}
        </form>
      </div>
      <div ref={flashOverlayRef} className="flash-overlay" />
    </div>
  );
}
