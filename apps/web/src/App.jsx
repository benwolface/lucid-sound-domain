import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  apiJoinWaitlist,
  apiCheckReferrer,
  apiLookupRefCode,
  apiGetArchive,
  apiGetSettings,
  apiUpdateContactEmail,
  apiGetPrivateSettings,
  apiRsvpRespond,
  apiRsvpStatus,
} from "./lib/api";
import "./styles.css";

// ── Dev flag — skip the intro so the circle shows immediately ──
const DEV_SKIP_INTRO = false;

const PORTAL_TIME_ZONE = "America/Los_Angeles";
const PORTAL_START_LABEL = "7:00 PM";
const PORTAL_FINAL_ARRIVAL_LABEL = "7:45 PM";
const PORTAL_END_LABEL = "10:30 PM";
const PORTAL_DATE_PENDING_COPY = "next date opening soon";
const UPCOMING_DATE_PENDING_COPY = "more soon";
const PUBLIC_PORTAL_LOCATION = "location revealed after login";
const PUBLIC_CALENDAR_LOCATION = "Location revealed after login";
const PRIVATE_LOCATION_PENDING = "location shared with confirmed guests";
const CALENDAR_DESCRIPTION =
  "The next portal opens. Arrival details are shared with confirmed guests. lucidsounddomain.com";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DOMAIN_CORE_LINE =
  "a deep listening dance floor that asks for nothing except your presence";
const PORTAL_RITUALS = ["arrive unrushed", "listen fully", "move when moved"];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.(REDUCED_MOTION_QUERY).matches
  );
}

function scrollMotionOptions() {
  return { behavior: prefersReducedMotion() ? "auto" : "smooth" };
}

// ── Session persistence ──
const SESSION_KEY = "lsd_session";
const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const WELCOME_KEY = "lsd_welcome_shown";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { referralCode, ts } = JSON.parse(raw);
    if (Date.now() - ts > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { referralCode: referralCode ?? null };
  } catch {
    return null;
  }
}

function saveSession(referralCode) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ referralCode, ts: Date.now() }),
    );
  } catch {}
}

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
  const [screen, setScreen] = useState(() =>
    loadSession() ? "home" : "landing",
  );
  const [referralCode, setReferralCode] = useState(
    () => loadSession()?.referralCode ?? null,
  );
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [imHereEnabled, setImHereEnabled] = useState(false);
  const [nextPortalDate, setNextPortalDate] = useState(null);
  const [upcomingPortalDate, setUpcomingPortalDate] = useState(null);
  const [nextPortalGuest, setNextPortalGuest] = useState(null);
  const [upcomingPortalGuest, setUpcomingPortalGuest] = useState(null);
  const [artist1Name, setArtist1Name] = useState(null);
  const [artist1Bio, setArtist1Bio] = useState(null);
  const [artist2Name, setArtist2Name] = useState(null);
  const [artist2Bio, setArtist2Bio] = useState(null);
  const [artist1PhotoUrl, setArtist1PhotoUrl] = useState(null);
  const [artist2PhotoUrl, setArtist2PhotoUrl] = useState(null);
  const [privatePortalLocation, setPrivatePortalLocation] = useState(null);

  useEffect(() => {
    apiGetSettings()
      .then(
        ({
          imHereEnabled,
          nextPortalDate,
          upcomingPortalDate,
          nextPortalGuest,
          upcomingPortalGuest,
          artist1Name,
          artist1Bio,
          artist2Name,
          artist2Bio,
          artist1PhotoUrl,
          artist2PhotoUrl,
        }) => {
          setImHereEnabled(!!imHereEnabled);
          setNextPortalDate(nextPortalDate ?? null);
          setUpcomingPortalDate(upcomingPortalDate ?? null);
          setNextPortalGuest(nextPortalGuest ?? null);
          setUpcomingPortalGuest(upcomingPortalGuest ?? null);
          setArtist1Name(artist1Name ?? null);
          setArtist1Bio(artist1Bio ?? null);
          setArtist2Name(artist2Name ?? null);
          setArtist2Bio(artist2Bio ?? null);
          setArtist1PhotoUrl(artist1PhotoUrl ?? null);
          setArtist2PhotoUrl(artist2PhotoUrl ?? null);
        },
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!referralCode) {
      setPrivatePortalLocation(null);
      return;
    }
    apiGetPrivateSettings(referralCode)
      .then(({ portalLocation }) => {
        setPrivatePortalLocation(portalLocation || null);
      })
      .catch(() => {
        setPrivatePortalLocation(null);
      });
  }, [referralCode]);

  function handleHome(code, isNew = false) {
    const resolved = code ?? null;
    saveSession(resolved);
    setReferralCode(resolved);
    setScreen("home");
    if (isNew && !localStorage.getItem(WELCOME_KEY)) {
      localStorage.setItem(WELCOME_KEY, "1");
      setShowWelcomeModal(true);
    }
  }

  if (screen === "home")
    return (
      <>
        <Home
          referralCode={referralCode}
          nextPortalDate={nextPortalDate}
          upcomingPortalDate={upcomingPortalDate}
          nextPortalGuest={nextPortalGuest}
          upcomingPortalGuest={upcomingPortalGuest}
          artist1Name={artist1Name}
          artist1Bio={artist1Bio}
          artist2Name={artist2Name}
          artist2Bio={artist2Bio}
          artist1PhotoUrl={artist1PhotoUrl}
          artist2PhotoUrl={artist2PhotoUrl}
          privatePortalLocation={privatePortalLocation}
          onLoginRequested={() => setScreen("auth")}
        />
        {showWelcomeModal && (
          <WelcomeModal onClose={() => setShowWelcomeModal(false)} />
        )}
      </>
    );
  if (screen === "auth")
    return (
      <Landing
        mode="auth"
        onHome={handleHome}
        onDomainScreen={() => setScreen("domain")}
        onBackHome={() => setScreen("home")}
        imHereEnabled={false}
        nextPortalDate={nextPortalDate}
      />
    );
  if (screen === "domain")
    return <DomainScreen onBack={() => setScreen("landing")} />;
  return (
    <div className="app">
      <Landing
        mode="entry"
        onHome={handleHome}
        onDomainScreen={() => setScreen("domain")}
        imHereEnabled={false}
        nextPortalDate={nextPortalDate}
      />
    </div>
  );
}

function WelcomeModal({ onClose }) {
  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className="welcome-box" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-close" onClick={onClose} aria-label="close">
          ✕
        </button>
        <p>a confirmation email has been sent!</p>
        <p>(if you don't see it, it might be in promos)</p>
      </div>
    </div>
  );
}

const JOURNEY_SECTIONS = [
  { id: "home", label: "Regulation" },
  { id: "domain", label: "Arrival" },
  { id: "flow", label: "Program" },
  { id: "contact", label: "Selectors" },
  { id: "archive", label: "Archive" },
  { id: "contribute", label: "Participate" },
];

function Home({
  referralCode,
  nextPortalDate,
  upcomingPortalDate,
  nextPortalGuest,
  upcomingPortalGuest,
  artist1Name,
  artist1Bio,
  artist2Name,
  artist2Bio,
  artist1PhotoUrl,
  artist2PhotoUrl,
  privatePortalLocation,
  onLoginRequested,
}) {
  const isLoggedIn = !!referralCode;
  const visiblePortalLocation = isLoggedIn
    ? privatePortalLocation || PRIVATE_LOCATION_PENDING
    : PUBLIC_PORTAL_LOCATION;
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
    if (prefersReducedMotion()) {
      setBgReady(true);
      setContentReady(true);
      setNavReady(true);
      return;
    }

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
              child.style.transitionDelay = prefersReducedMotion()
                ? "0ms"
                : `${i * 110}ms`;
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
      ?.scrollIntoView(scrollMotionOptions());

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
      <button
        type="button"
        className={`home-auth-btn${isLoggedIn ? " is-logged-in" : ""}`}
        onClick={isLoggedIn ? undefined : onLoginRequested}
        aria-disabled={isLoggedIn}
      >
        {isLoggedIn ? "portal access" : "login"}
      </button>

      {/* ── First viewport ── */}
      <div
        className={`home-first-view${contentReady ? " is-entered" : ""}`}
        data-section="home"
      >
        <div className="home-center">
          <p className="home-regulation-title">( Regulation )</p>
          <p className="home-essence">{DOMAIN_CORE_LINE}</p>
          <div className="home-ritual-row" aria-label="Domain ritual">
            {PORTAL_RITUALS.map((ritual, index) => (
              <span key={ritual} className="home-ritual-item">
                {ritual}
                {index < PORTAL_RITUALS.length - 1 && (
                  <span className="home-ritual-divider" aria-hidden="true">
                    /
                  </span>
                )}
              </span>
            ))}
          </div>
          <p className="home-next-label">next portal opening on</p>
          <p className="home-next-date">
            {nextPortalDate
              ? fmtPortalDate(nextPortalDate)
              : PORTAL_DATE_PENDING_COPY}
          </p>
          <p className="home-next-time">
            {PORTAL_START_LABEL} – {PORTAL_END_LABEL}
          </p>
          {nextPortalGuest && (
            <p className="home-next-guest">w/{nextPortalGuest}</p>
          )}
          <p className="home-next-address">
            {visiblePortalLocation}
          </p>
          <CalendarButtons
            nextPortalDate={nextPortalDate}
            portalLocation={visiblePortalLocation}
            hasPrivateLocation={isLoggedIn && !!privatePortalLocation}
          />
          <p className="home-upcoming-title">Upcoming portals</p>
          <p className="home-upcoming-date">
            {upcomingPortalDate
              ? fmtPortalDate(upcomingPortalDate)
              : UPCOMING_DATE_PENDING_COPY}
          </p>
          {upcomingPortalGuest && (
            <p className="home-upcoming-guest">w/{upcomingPortalGuest}</p>
          )}
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
        {isLoggedIn && <RsvpBlock referralCode={referralCode} />}
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
                <h2 className="j-animate j-section-heading">Arrival</h2>
                <p className="j-animate j-domain-intro">
                  The Lucid Sound Domain is a deep listening dance floor that
                  asks for nothing except your presence.
                </p>
                <p className="j-animate j-domain-intro">
                  In return, it offers something rare: uninterrupted
                  listening.
                </p>
                <p className="j-animate j-domain-intro">
                  A place to slow down before moving again.
                </p>
                <p className="j-animate j-domain-disclaimer">
                  Please help protect the listening experience by
                  refraining from conversation and phone use during
                  Regulation (8:00-9:00 PM).
                </p>
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
            <h2 className="j-animate j-section-heading">Program</h2>
            <div className="j-animate j-attend-schedule">
              <p className="j-attend-slot">{PORTAL_START_LABEL} · Arrival</p>
              <p className="j-attend-note">
                Settle into the space, browse the library, and prepare to
                listen.
              </p>
              <p className="j-attend-slot">
                {PORTAL_FINAL_ARRIVAL_LABEL} · Final Arrival
              </p>
              <p className="j-attend-note">
                The listening room is sealed from 8:00-9:00 PM.
              </p>
              <p className="j-attend-slot">
                {artist1Name
                  ? `8:00 PM · Regulation w/ ${artist1Name}`
                  : "8:00 PM · Regulation"}
              </p>
              <p className="j-attend-note">Silent deep listening.</p>
              <p className="j-attend-slot">9:00 PM · Recess</p>
              <p className="j-attend-note">
                Tea, snacks, and time to nourish yourself. I recommend
                bringing dinner or eating beforehand.
              </p>
              <p className="j-attend-slot">
                {artist2Name
                  ? `9:30 PM · Sensory Ritual w/ ${artist2Name}`
                  : "9:30 PM · Sensory Ritual"}
              </p>
              <p className="j-attend-note">From stillness into movement.</p>
            </div>
          </section>

          {/* ── Selectors ── */}
          <section id="j-contact" className="j-section" data-section="contact">
            <h2 className="j-animate j-section-heading">Selectors</h2>
            <div className="j-animate j-artist-grid">
              <div className="j-artist-card">
                <div className="j-artist-photo-wrap">
                  {artist1PhotoUrl ? (
                    <img
                      src={artist1PhotoUrl}
                      alt={artist1Name || "Artist 1"}
                      className="j-artist-photo"
                    />
                  ) : (
                    <div className="j-artist-photo-placeholder" />
                  )}
                </div>
                <p
                  className={`j-artist-card-name${artist1Name ? "" : " j-artist-card-name--pending"}`}
                >
                  {artist1Name || "selector to be announced"}
                </p>
                <ArtistBio bio={artist1Bio} />
              </div>
              <div className="j-artist-card">
                <div className="j-artist-photo-wrap">
                  {artist2PhotoUrl ? (
                    <img
                      src={artist2PhotoUrl}
                      alt={artist2Name || "Artist 2"}
                      className="j-artist-photo"
                    />
                  ) : (
                    <div className="j-artist-photo-placeholder" />
                  )}
                </div>
                <p
                  className={`j-artist-card-name${artist2Name ? "" : " j-artist-card-name--pending"}`}
                >
                  {artist2Name || "selector to be announced"}
                </p>
                <ArtistBio bio={artist2Bio} />
              </div>
            </div>
          </section>

          {/* ── Archive ── */}
          <section id="j-archive" className="j-section" data-section="archive">
            <h2 className="j-animate j-section-heading">Archive</h2>
            <ArchiveSection />
          </section>

          {/* ── Participate ── */}
          <section
            id="j-contribute"
            className="j-section"
            data-section="contribute"
          >
            <h2 className="j-animate j-section-heading">Participate</h2>
            <p className="j-animate j-section-copy">
              The Lucid Sound Domain is built on the trust of the people who
              gather within it.
            </p>
            <p className="j-animate j-section-copy" style={{ marginTop: 20 }}>
              If you&apos;d like to participate in Lucid through sound, food,
              documentation, or in any other way, please reach out to me.
            </p>
            <p className="j-animate j-section-copy" style={{ marginTop: 20 }}>
              <a
                className="j-inline-link"
                href="mailto:portal@lucidsounddomain.com"
              >
                portal@lucidsounddomain.com
              </a>
            </p>
            <p className="j-animate j-section-copy" style={{ marginTop: 20 }}>
              Know someone who belongs within the Domain?
              <br />
              Share your unique invitation.
            </p>
            <InviteLinkButton
              referralCode={referralCode}
              onLoginRequested={onLoginRequested}
            />
            <SectionScrollHint
              nextId="j-outro"
              containerRef={pageRef}
              visible={active === "contribute"}
              alwaysShow
            />
          </section>
        </div>
      </div>
      <MobileTimeline active={active} pageRef={pageRef} navReady={navReady} />

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

function ArtistBio({ bio }) {
  if (!bio) return null;
  const paragraphs = bio
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="j-artist-card-bio">
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
      ))}
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
      ?.scrollIntoView(scrollMotionOptions());
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
              pageRef.current?.scrollTo({ top: 0, ...scrollMotionOptions() });
            } else {
              pageRef.current
                ?.querySelector(`#j-${s.id}`)
                ?.scrollIntoView(scrollMotionOptions());
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
              pageRef.current?.scrollTo({ top: 0, ...scrollMotionOptions() });
            } else {
              pageRef.current
                ?.querySelector(`#j-${s.id}`)
                ?.scrollIntoView(scrollMotionOptions());
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

// ── RSVP — only visible after someone has portal access ──
function RsvpBlock({ referralCode }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRsvpStatus(referralCode)
      .then(setState)
      .catch(() => {});
  }, [referralCode]);

  if (!state || !state.open) return null;

  async function respond(response) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiRsvpRespond({ referralCode, response });
      if (res.status === "full") {
        setState((s) => ({ ...s, full: true, copy: res.copy }));
      } else {
        setState((s) => ({
          ...s,
          full: res.full,
          copy: res.copy,
          myStatus: res.myStatus,
        }));
      }
    } catch (err) {
      setError(
        /404/.test(err?.message || "")
          ? "we can't find your entry — return through the portal and try again."
          : "something went wrong — try again.",
      );
    }
    setBusy(false);
  }

  const { full, copy, myStatus } = state;
  const attendClosed = full && myStatus !== "attending";

  return (
    <div className="rsvp-block">
      <p className="rsvp-capacity">Capacity is limited.</p>
      <p className="rsvp-copy">{copy || "Will you be attending?"}</p>
      <div className="rsvp-btns">
        <button
          type="button"
          className={`rsvp-btn${myStatus === "attending" ? " is-pressed" : ""}`}
          disabled={busy || attendClosed}
          onClick={() => respond("attending")}
        >
          Will attend
        </button>
        <button
          type="button"
          className={`rsvp-btn${myStatus === "not_attending" ? " is-pressed" : ""}`}
          disabled={busy}
          onClick={() => respond("not_attending")}
        >
          Will not attend
        </button>
      </div>
      {attendClosed &&
        (myStatus === "waitlist" ? (
          <p className="rsvp-state">
            you're on the list — we'll reach out if a space opens.
          </p>
        ) : (
          <button
            type="button"
            className="rsvp-btn rsvp-btn--waitlist"
            disabled={busy}
            onClick={() => respond("waitlist")}
          >
            join waitlist
          </button>
        ))}
      {error && <p className="rsvp-error">{error}</p>}
    </div>
  );
}

// ── Archive: time capsule ──

// Deterministic pseudo-random so the pile scatters the same way per photo
function scatterRand(i, salt) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function ArchiveSection() {
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reelIdx, setReelIdx] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  useEffect(() => {
    apiGetArchive()
      .then(({ photos, videos }) => {
        setPhotos(photos ?? []);
        setVideos(videos ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!zoomPhoto) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoomPhoto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomPhoto]);

  if (!photos.length && !videos.length) {
    return (
      <p className="j-animate j-archive-empty">
        the archive is still being written. return after the next portal.
      </p>
    );
  }

  return (
    <>
      {photos.length > 0 && (
        <>
          <p className="j-animate j-archive-hint">
            moments preserved from previous portals
          </p>
          <PolaroidPile photos={photos} onPhotoClick={setZoomPhoto} />
        </>
      )}
      {videos.length > 0 && (
        <>
          <p className="j-animate j-archive-hint j-archive-hint--reels">
            recovered reels — hold one up to the light
          </p>
          <div className="j-animate reel-shelf">
            {videos.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className="reel"
                onClick={() => setReelIdx(i)}
                aria-label={`play reel ${i + 1}`}
              >
                <ReelIcon />
                <span className="reel-label">
                  Regulation {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {reelIdx !== null && (
        <ProjectorOverlay
          videos={videos}
          idx={reelIdx}
          setIdx={setReelIdx}
          onClose={() => setReelIdx(null)}
        />
      )}
      {zoomPhoto && (
        <div className="polaroid-lightbox" onClick={() => setZoomPhoto(null)}>
          <div
            className="polaroid polaroid--zoom"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomPhoto.url}
              alt={zoomPhoto.caption || "archive photo"}
              draggable={false}
            />
            {zoomPhoto.caption && (
              <span className="polaroid-caption">{zoomPhoto.caption}</span>
            )}
          </div>
          <button
            type="button"
            className="projector-close"
            onClick={() => setZoomPhoto(null)}
            aria-label="put the photo back"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

function PolaroidPile({ photos, onPhotoClick }) {
  const wrapRef = useRef(null);
  // id -> { x, y (% of container), rot (deg) }
  const [pos, setPos] = useState({});
  // z-order: last id in the array sits on top
  const [order, setOrder] = useState([]);
  const dragRef = useRef(null);

  useEffect(() => {
    const next = {};
    photos.forEach((ph, i) => {
      next[ph.id] = {
        x: 4 + scatterRand(i, 1) * 62,
        y: 4 + scatterRand(i, 2) * 44,
        rot: -13 + scatterRand(i, 3) * 26,
      };
    });
    setPos(next);
    setOrder(photos.map((ph) => ph.id));
  }, [photos]);

  function onPointerDown(e, id) {
    const wrap = wrapRef.current;
    const p = pos[id];
    if (!wrap || !p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = wrap.getBoundingClientRect();
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: (p.x / 100) * rect.width,
      origY: (p.y / 100) * rect.height,
      rect,
      moved: 0,
    };
    setOrder((o) => [...o.filter((x) => x !== id), id]);
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d) return;
    d.moved = Math.max(
      d.moved,
      Math.hypot(e.clientX - d.startX, e.clientY - d.startY),
    );
    const nx = d.origX + (e.clientX - d.startX);
    const ny = d.origY + (e.clientY - d.startY);
    setPos((p) => ({
      ...p,
      [d.id]: {
        ...p[d.id],
        x: Math.max(-8, Math.min(80, (nx / d.rect.width) * 100)),
        y: Math.max(-4, Math.min(86, (ny / d.rect.height) * 100)),
      },
    }));
  }

  function onPointerUp() {
    const d = dragRef.current;
    dragRef.current = null;
    // Barely moved = a tap, not a drag — hold the photo up to look closer
    if (d && d.moved < 6 && onPhotoClick) {
      const ph = photos.find((x) => x.id === d.id);
      if (ph) onPhotoClick(ph);
    }
  }

  return (
    <div ref={wrapRef} className="j-animate polaroid-table">
      {photos.map((ph) => {
        const p = pos[ph.id];
        if (!p) return null;
        return (
          <div
            key={ph.id}
            className="polaroid"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `rotate(${p.rot}deg)`,
              zIndex: order.indexOf(ph.id) + 1,
            }}
            onPointerDown={(e) => onPointerDown(e, ph.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img src={ph.url} alt={ph.caption || "archive photo"} draggable={false} />
            {ph.caption && <span className="polaroid-caption">{ph.caption}</span>}
          </div>
        );
      })}
    </div>
  );
}

function ReelIcon() {
  const holes = [...Array(6)].map((_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return (
      <circle
        key={i}
        cx={50 + Math.cos(a) * 27}
        cy={50 + Math.sin(a) * 27}
        r="10"
        fill="#0a0a0a"
        stroke="#3d3d3d"
        strokeWidth="1.2"
      />
    );
  });
  const bolts = [...Array(6)].map((_, i) => {
    const a = ((i + 0.5) / 6) * Math.PI * 2 - Math.PI / 2;
    return (
      <circle
        key={i}
        cx={50 + Math.cos(a) * 43.5}
        cy={50 + Math.sin(a) * 43.5}
        r="1.7"
        fill="#0d0d0d"
        stroke="#4a4a4a"
        strokeWidth="0.6"
      />
    );
  });
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="reel-metal" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#3d3d3d" />
          <stop offset="55%" stopColor="#262626" />
          <stop offset="100%" stopColor="#161616" />
        </radialGradient>
      </defs>
      {/* Everything but the play glyph spins on hover */}
      <g className="reel-spinner">
        <circle cx="50" cy="50" r="48" fill="#101010" stroke="#4a4a4a" strokeWidth="2" />
        <circle cx="50" cy="50" r="44.5" fill="url(#reel-metal)" />
        {/* wound film between the flanges */}
        <circle cx="50" cy="50" r="27" fill="none" stroke="#121212" strokeWidth="21" opacity="0.55" />
        {holes}
        {bolts}
        <circle cx="50" cy="50" r="12.5" fill="#0a0a0a" stroke="#4a4a4a" strokeWidth="1.6" />
      </g>
      <polygon className="reel-play" points="46.5,43.5 46.5,56.5 58,50" fill="currentColor" />
    </svg>
  );
}

function ProjectorOverlay({ videos, idx, setIdx, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + videos.length) % videos.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % videos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videos.length, setIdx, onClose]);

  const v = videos[idx];
  if (!v) return null;

  return (
    <div className="projector-overlay" onClick={onClose}>
      <div className="projector-beam" />
      <div className="projector-stage" onClick={(e) => e.stopPropagation()}>
        <div className="filmstrip">
          <div className="filmstrip-holes" />
          {v.type === "youtube" ? (
            <iframe
              key={v.id}
              className="filmstrip-video filmstrip-iframe"
              src={`${v.url}?autoplay=1&rel=0`}
              title={`archive reel ${idx + 1}`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              key={v.id}
              className="filmstrip-video"
              src={v.url}
              autoPlay
              loop
              playsInline
              controls
              preload="metadata"
            />
          )}
          <div className="filmstrip-holes" />
        </div>
        <div className="projector-controls">
          <button
            type="button"
            className="projector-arrow"
            onClick={() => setIdx((i) => (i - 1 + videos.length) % videos.length)}
            aria-label="previous reel"
          >
            ‹
          </button>
          <span className="projector-counter">
            Regulation {String(idx + 1).padStart(2, "0")} /{" "}
            {String(videos.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="projector-arrow"
            onClick={() => setIdx((i) => (i + 1) % videos.length)}
            aria-label="next reel"
          >
            ›
          </button>
        </div>
      </div>
      <button
        type="button"
        className="projector-close"
        onClick={onClose}
        aria-label="close projector"
      >
        ✕
      </button>
    </div>
  );
}

function portalCalDates(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || "")) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = `${String(year).padStart(4, "0")}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
  return {
    start: `${date}T190000`,
    end: `${date}T223000`,
  };
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function CalendarButtons({
  nextPortalDate,
  portalLocation = PUBLIC_CALENDAR_LOCATION,
  hasPrivateLocation = false,
}) {
  const cal = portalCalDates(nextPortalDate);
  const location = hasPrivateLocation ? portalLocation : PUBLIC_CALENDAR_LOCATION;

  const ics = cal
    ? [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "PRODID:-//Lucid Sound Domain//EN",
        "BEGIN:VEVENT",
        `DTSTART;TZID=${PORTAL_TIME_ZONE}:${cal.start}`,
        `DTEND;TZID=${PORTAL_TIME_ZONE}:${cal.end}`,
        "SUMMARY:Lucid Sound Domain - Portal Opening",
        `DESCRIPTION:${escapeIcsText(CALENDAR_DESCRIPTION)}`,
        `LOCATION:${escapeIcsText(location)}`,
        "URL:https://lucidsounddomain.com",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")
    : null;

  const googleUrl = cal
    ? "https://calendar.google.com/calendar/render?" +
      new URLSearchParams({
        action: "TEMPLATE",
        text: "Lucid Sound Domain - Portal Opening",
        dates: `${cal.start}/${cal.end}`,
        details: CALENDAR_DESCRIPTION,
        location,
        ctz: PORTAL_TIME_ZONE,
      }).toString()
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

function InviteLinkButton({ referralCode, onLoginRequested }) {
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

  if (!referralCode) {
    return (
      <button
        type="button"
        className="j-animate j-invite-power"
        onClick={onLoginRequested}
        aria-label="Login for invite link"
      >
        <PowerIcon />
        <span>login for invite link</span>
      </button>
    );
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
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Start typing after fade-in settles
  useEffect(() => {
    if (!visible) return;
    if (prefersReducedMotion()) {
      setDisplayed(DOMAIN_MESSAGE);
      setShowCursor(false);
      return;
    }

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

function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function Landing({
  mode = "entry",
  onHome,
  onDomainScreen,
  onBackHome,
  imHereEnabled,
  nextPortalDate,
}) {
  const isAuthMode = mode === "auth";
  const [bg] = useState(
    () =>
      LANDING_BACKGROUNDS[
        Math.floor(Math.random() * LANDING_BACKGROUNDS.length)
      ],
  );

  // step: 'enter' | 'arrival' → ('name' → 'contact' → 'referral') | ('returning' → 'returning-email'?)
  const [step, setStep] = useState(() => (isAuthMode ? "arrival" : "enter"));
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [referrer, setReferrer] = useState("");
  const [returningName, setReturningName] = useState("");
  const [returningReferralCode, setReturningReferralCode] = useState(null);
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
        ? isEmailValid(contact)
        : step === "referral"
          ? referrer.trim().length > 0
          : step === "returning"
            ? returningName.trim().length > 0
            : step === "returning-email"
              ? isEmailValid(contact)
              : false;

  // ── Refs ──
  const skipIntroRef = useRef(null);
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
    if (!isEmailValid(contact)) return;
    if (inboundRefCode) {
      // Already know the referrer — submit directly
      triggerPower();
    } else {
      fadeToStep("referral");
    }
  }

  // ── Arrival choice: first arrival → name step ──
  function handleFirstArrival() {
    // Run skip now (pauses intro animations, nulls itself) so the parent
    // onClick bubble doesn't re-run it and undo our fade-out below.
    skipIntroRef.current?.();
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

  function handleEnterDomain() {
    skipIntroRef.current?.();
    handlePowerPress(null);
  }

  // ── Arrival choice: returning → check name in DB ──
  function handleArrivalReturning() {
    skipIntroRef.current?.();
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
    } else if (step === "returning-email") {
      setContact("");
      fadeToStep("returning");
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

      const { referralCode, status } = await apiJoinWaitlist({
        name,
        contact,
        referredBy: resolvedReferrer || undefined,
      });
      setIsPressing(false);
      handlePowerPress(referralCode, null, status === "joined");
    } catch {
      setIsPressing(false);
      handleRejection("referral");
    }
  }

  async function triggerReturning() {
    if (isPressing) return;
    setIsPressing(true);
    try {
      const { found, referralCode, hasEmail } = await apiCheckReferrer({
        name: returningName.trim(),
      });
      if (!found) {
        setIsPressing(false);
        handleRejection("returning");
        return;
      }
      if (!hasEmail) {
        setIsPressing(false);
        setReturningReferralCode(referralCode);
        fadeToStep("returning-email");
        return;
      }
      setIsPressing(false);
      handlePowerPress(referralCode);
    } catch {
      setIsPressing(false);
      handleRejection("returning");
    }
  }

  async function triggerReturningWithEmail() {
    if (isPressing) return;
    setIsPressing(true);
    try {
      await apiUpdateContactEmail({
        name: returningName.trim(),
        email: contact.trim(),
        referralCode: returningReferralCode,
      });
      setIsPressing(false);
      handlePowerPress(returningReferralCode, null, true);
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
    else if (step === "returning-email" && isEmailValid(contact))
      triggerReturningWithEmail();
  }

  // ── Power button: full shutdown sequence ──
  function handlePowerPress(referralCode, onComplete = null, isNew = false) {
    if (prefersReducedMotion()) {
      if (onComplete) onComplete();
      else onHome(referralCode, isNew);
      return;
    }

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
    setTimeout(() => (onComplete ? onComplete() : onHome(referralCode, isNew)), 5200);
  }

  // ── Intro animation ──
  useEffect(() => {
    if (DEV_SKIP_INTRO || prefersReducedMotion()) {
      if (bgSlideRef.current) bgSlideRef.current.style.opacity = "1";
      if (splashRef.current) splashRef.current.style.opacity = "0";
      if (welcomeRef.current) welcomeRef.current.style.opacity = "1";
      if (portalInfoRef.current) portalInfoRef.current.style.opacity = "1";
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
      const LOGO_SCALE = 0.2;
      const sat =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--sat"),
        ) || 0;
      const LOGO_TOP_PX = 4 + sat;
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

    skipIntroRef.current = () => {
      skipIntroRef.current = null;
      animations.forEach((a) => {
        try {
          a.pause();
        } catch (_) {}
      });
      clearTimeout(flickerStart);
      clearTimeout(logoTimeout);
      if (flickerTick) {
        clearInterval(flickerTick);
        flickerTick = null;
      }
      words.forEach((w) => {
        w.style.transition = "opacity 0.25s ease, filter 0.25s ease";
        w.style.opacity = "0";
        w.style.filter = "none";
        w.classList.remove("no-grid");
      });
      if (splashRef.current) {
        splashRef.current.style.transition = "opacity 0.25s ease";
        splashRef.current.style.opacity = "0";
        splashRef.current.style.transform = "";
      }
      if (slide) {
        slide.style.transition = "opacity 0.3s ease";
        slide.style.opacity = "1";
      }
      if (welcomeRef.current) {
        welcomeRef.current.style.transition = "opacity 0.35s ease 0.1s";
        welcomeRef.current.style.opacity = "1";
      }
      if (welcomeTextRef.current) {
        welcomeTextRef.current.style.transition =
          "opacity 0.35s ease 0.15s, transform 0.35s ease 0.15s";
        welcomeTextRef.current.style.opacity = "1";
        welcomeTextRef.current.style.transform = "translateY(0)";
      }
      if (inputWrapRef.current) {
        inputWrapRef.current.style.transition = "opacity 0.35s ease 0.2s";
        inputWrapRef.current.style.opacity = "1";
      }
      if (lineRef.current) {
        lineRef.current.style.transition = "transform 0.35s ease 0.2s";
        lineRef.current.style.transform = "scaleX(1)";
      }
    };

    return () => {
      skipIntroRef.current = null;
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
    <div
      className={`landing landing--${mode}${imHereEnabled ? " landing--has-here" : ""}`}
      onClick={() => skipIntroRef.current?.()}
      onTouchStart={() => skipIntroRef.current?.()}
    >
      {isAuthMode && onBackHome && (
        <button
          type="button"
          className="landing-back-home"
          onClick={(e) => {
            e.stopPropagation();
            onBackHome();
          }}
        >
          ← back
        </button>
      )}
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

      <div
        ref={splashRef}
        className="splash"
        onClick={() => skipIntroRef.current?.()}
      >
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
          <p className="landing-portal-essence">{DOMAIN_CORE_LINE}</p>
          <p className="landing-portal-label">next portal opening on</p>
          <p className="landing-portal-date">
            {nextPortalDate
              ? fmtPortalDate(nextPortalDate)
              : PORTAL_DATE_PENDING_COPY}
          </p>
          <p className="home-timing">
            {PORTAL_START_LABEL} – {PORTAL_END_LABEL}. Please arrive before{" "}
            {PORTAL_FINAL_ARRIVAL_LABEL}.
            <br />
            To protect the listening experience, there is no entry from
            8:00–9:00 PM.
          </p>
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
            ) : step === "contact" || step === "returning-email" ? (
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
          autoComplete="off"
        >
          {step === "enter" ? (
            <div className="arrival-choice arrival-choice--single">
              <button
                type="button"
                className="arrival-btn arrival-btn--enter"
                onClick={handleEnterDomain}
              >
                enter the domain
              </button>
            </div>
          ) : step === "arrival" ? (
            <div
              className={`arrival-choice${imHereEnabled ? " arrival-choice--has-here" : ""}`}
            >
              <button
                type="button"
                className="arrival-btn"
                onClick={handleFirstArrival}
              >
                i'm new
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
                  onClick={() => {
                    skipIntroRef.current?.();
                    handlePowerPress(null, onDomainScreen);
                  }}
                >
                  i'm here
                </button>
              )}
            </div>
          ) : (
            <>
              <input
                className="waitlist-input"
                type={
                  step === "contact" || step === "returning-email"
                    ? "email"
                    : "text"
                }
                autoComplete={
                  step === "contact" || step === "returning-email"
                    ? "email"
                    : "off"
                }
                placeholder={
                  step === "name" || step === "returning"
                    ? "your name"
                    : step === "contact" || step === "returning-email"
                      ? "email address"
                      : "name..."
                }
                value={
                  step === "name"
                    ? name
                    : step === "contact" || step === "returning-email"
                      ? contact
                      : step === "returning"
                        ? returningName
                        : referrer
                }
                onChange={(e) =>
                  step === "name"
                    ? setName(e.target.value)
                    : step === "contact" || step === "returning-email"
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
                      : step === "returning-email"
                        ? (e) => {
                            e.preventDefault();
                            triggerReturningWithEmail();
                          }
                        : undefined
                }
                className={`submit-btn${showSubmit ? " visible" : ""}${step === "referral" || step === "returning" || step === "returning-email" ? " submit-btn--power" : ""}${isPressing ? " is-pressing" : ""}`}
              >
                {step === "referral" ||
                step === "returning" ||
                step === "returning-email" ? (
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
