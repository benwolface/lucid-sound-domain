import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import "./styles.css";

// ── Dev flag — skip the intro so the circle shows immediately ──
const DEV_SKIP_INTRO = false;

// Landing only uses the two atmospheric shots
const LANDING_BACKGROUNDS = [
  { url: "/bg-1-sky.jpg", position: "center 60%", size: "cover" },
  { url: "/bg-2-disco.jpg", position: "center center", size: "cover" },
];

// Home gets all three, including the red one
const HOME_BACKGROUNDS = [
  { url: "/bg-1-sky.jpg", position: "center 60%", size: "cover" },
  { url: "/bg-2-disco.jpg", position: "center center", size: "cover" },
  { url: "/bg-3-red.jpg", position: "center center", size: "cover" },
];

export default function App() {
  const [screen, setScreen] = useState("landing");
  if (screen === "home") return <Home />;
  return (
    <div className="app">
      <Landing onHome={() => setScreen("home")} />
    </div>
  );
}

const JOURNEY_SECTIONS = [
  { id: 'domain',     label: 'Understand'  },
  { id: 'flow',       label: 'Attend'      },
  { id: 'invitation', label: 'Invitation'  },
  { id: 'contact',    label: 'Contribute'  },
]

function Home() {
  const [bg] = useState(
    () => HOME_BACKGROUNDS[Math.floor(Math.random() * HOME_BACKGROUNDS.length)],
  )
  const [active, setActive] = useState('domain')
  const [logoVisible, setLogoVisible] = useState(true)
  const pageRef      = useRef(null)
  const intersecting = useRef(new Set())

  // Section activation + anime.js stagger
  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    const sections = el.querySelectorAll('.j-section')
    const ob = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        const id = e.target.dataset.section
        setActive(id)
        const kids = Array.from(e.target.querySelectorAll('.j-animate'))
        kids.forEach((child, i) => {
          child.style.opacity = '0'
          child.style.transform = 'translateY(28px)'
          const s = { op: 0, ty: 28 }
          animate(s, {
            op: 1, ty: 0,
            duration: 800, delay: i * 110, ease: 'out(3)',
            onRender: () => {
              child.style.opacity = s.op
              child.style.transform = `translateY(${s.ty}px)`
            },
          })
        })
      })
    }, { root: el, threshold: 0.35 })
    sections.forEach(s => ob.observe(s))
    return () => ob.disconnect()
  }, [])

  // Logo visibility — hide when between sections
  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    const targets = [
      el.querySelector('.home-first-view'),
      ...el.querySelectorAll('.j-section'),
    ].filter(Boolean)

    const ob = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) intersecting.current.add(e.target)
        else                  intersecting.current.delete(e.target)
      })
      setLogoVisible(intersecting.current.size > 0)
    }, { root: el, threshold: 0.05 })

    targets.forEach(t => ob.observe(t))
    return () => ob.disconnect()
  }, [])

  const scrollToJourney = () =>
    pageRef.current
      ?.querySelector('#j-domain')
      ?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div ref={pageRef} className="home-page">
      {/* Background fixed behind all scroll content */}
      <div className="home-bg" style={{
        backgroundImage:    `url(${bg.url})`,
        backgroundPosition: bg.position,
        backgroundSize:     bg.size,
      }} />
      <div className="home-veil" />

      {/* ── Fixed logo — visible when in a section, hidden between ── */}
      <div className={`home-logo${logoVisible ? ' is-visible' : ''}`}>
        <span className="home-logo-word">LUCID</span>
        <span className="home-logo-word">SOUND</span>
        <span className="home-logo-word">DOMAIN</span>
      </div>

      {/* ── First viewport ── */}
      <div className="home-first-view">
        <div className="home-center">
          <p className="home-next-label">next portal opening on</p>
          <p className="home-next-date">Wednesday, April 22nd, 2026</p>
          <CalendarButtons />
        </div>
        <ScrollHint onClick={scrollToJourney} />
      </div>

      {/* ── Journey ── */}
      <div className="journey-layout">
        {/* Sticky timeline sidebar */}
        <div className="j-timeline-wrap">
          <JourneyTimeline active={active} />
        </div>

        {/* Sections */}
        <div className="journey-sections">

          {/* ── The Domain ── */}
          <section id="j-domain" className="j-section" data-section="domain">
            <div className="j-domain-layout">
              <div className="j-domain-text">
                <h2 className="j-animate j-section-heading">Understand</h2>
                <p className="j-animate j-domain-intro">
                  The Lucid Sound Domain is an intimate, deep listening dance floor
                  that requires nothing from you except your presence.
                </p>
                <div className="j-animate j-space-list">
                  <span className="j-space-lead">This is</span>
                  <ul>
                    <li>a space to rest</li>
                    <li>a space to recieve</li>
                    <li>a space to restore</li>
                    <li>a space to reconnect</li>
                    <li>a space to <span className="j-green">REGULATE</span></li>
                    <li>and release</li>
                  </ul>
                </div>
              </div>
              <div className="j-animate j-domain-image-wrap">
                <ZoomableImage
                  src="/soundsystem-boundary.jpg"
                  alt="Lucid Sound Domain sound system"
                  href="https://www.instagram.com/p/DV1a4kwjU8B/"
                />
              </div>
            </div>
            <SectionScrollHint nextId="j-flow" containerRef={pageRef} />
          </section>

          {/* ── Flow ── */}
          <section id="j-flow" className="j-section" data-section="flow">
            <h2 className="j-animate j-section-heading">Attend</h2>
            <p className="j-animate j-section-placeholder">— coming soon —</p>
            <SectionScrollHint nextId="j-invitation" containerRef={pageRef} />
          </section>

          {/* ── Invitation ── */}
          <section id="j-invitation" className="j-section" data-section="invitation">
            <h2 className="j-animate j-section-heading">Invitation</h2>
            <p className="j-animate j-section-placeholder">— coming soon —</p>
            <SectionScrollHint nextId="j-contact" containerRef={pageRef} />
          </section>

          {/* ── Contact ── */}
          <section id="j-contact" className="j-section" data-section="contact">
            <h2 className="j-animate j-section-heading">Contribute</h2>
            <p className="j-animate j-section-placeholder">— coming soon —</p>
          </section>

        </div>
      </div>
    </div>
  )
}

// ── Wide arc at the bottom of the first view ──
function ScrollHint({ onClick }) {
  return (
    <button className="scroll-hint" onClick={onClick} aria-label="Scroll to explore">
      <span className="scroll-hint-arc" />
      <span className="scroll-hint-chevron">
        <svg viewBox="0 0 24 12" fill="none">
          <polyline points="2,1 12,10 22,1"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  )
}

// ── Scroll hint at the bottom of each journey section ──
function SectionScrollHint({ nextId, containerRef }) {
  const handleClick = () => {
    containerRef.current
      ?.querySelector(`#${nextId}`)
      ?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <button className="section-scroll-hint" onClick={handleClick} aria-label="Next section">
      <svg viewBox="0 0 24 12" fill="none" className="section-chevron">
        <polyline points="2,1 12,10 22,1"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ── Zoomable image lightbox ──
function ZoomableImage({ src, alt, href }) {
  const [open, setOpen]     = useState(false)
  const [scale, setScale]   = useState(1)
  const [pos, setPos]       = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const last     = useRef({ x: 0, y: 0 })
  const imgRef   = useRef(null)

  // Reset when closed
  useEffect(() => {
    if (!open) { setScale(1); setPos({ x: 0, y: 0 }) }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const onWheel = e => {
    e.preventDefault()
    setScale(s => Math.min(6, Math.max(1, s - e.deltaY * 0.004)))
  }

  const onMouseDown = e => {
    if (scale <= 1) return
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = e => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setPos(p => ({ x: p.x + dx, y: p.y + dy }))
  }
  const onMouseUp = () => { dragging.current = false }

  return (
    <>
      <img
        src={src} alt={alt}
        className="j-domain-img"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <div
            className="lightbox-inner"
            onClick={e => e.stopPropagation()}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <img
              ref={imgRef}
              src={src} alt={alt}
              className="lightbox-img"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                cursor: scale > 1 ? 'grab' : 'zoom-in',
              }}
              draggable={false}
            />
            <div className="lightbox-actions">
              <a
                href={href} target="_blank" rel="noopener noreferrer"
                className="lightbox-ig-link"
                onClick={e => e.stopPropagation()}
              >
                view on instagram
              </a>
              <button className="lightbox-close" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Vertical timeline sidebar ──
function JourneyTimeline({ active }) {
  const activeIdx = JOURNEY_SECTIONS.findIndex(s => s.id === active)
  const fillPct   = activeIdx <= 0 ? 0 : (activeIdx / (JOURNEY_SECTIONS.length - 1)) * 100

  return (
    <nav className="j-timeline">
      {/* Track + fill line */}
      <span className="j-track">
        <span className="j-track-fill" style={{ height: `${fillPct}%` }} />
      </span>

      {JOURNEY_SECTIONS.map((s, i) => (
        <a key={s.id}
           href={`#j-${s.id}`}
           className={`j-node${s.id === active ? ' is-active' : ''}${i < activeIdx ? ' is-past' : ''}`}
        >
          <span className="j-node-dot">
            <span className="j-node-ring" />
          </span>
          <span className="j-node-label">{s.label}</span>
        </a>
      ))}
    </nav>
  )
}

const PORTAL_ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Lucid Sound Domain//EN",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20260422",
  "DTEND;VALUE=DATE:20260423",
  "SUMMARY:Lucid Sound Domain — Portal Opening",
  "DESCRIPTION:The next portal opens. lucidsounddomain.com",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const GOOGLE_CAL_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=Lucid+Sound+Domain+%E2%80%94+Portal+Opening" +
  "&dates=20260422%2F20260423" +
  "&details=The+next+portal+opens.+lucidsounddomain.com";

function CalendarButtons() {
  const icsHref =
    "data:text/calendar;charset=utf-8," + encodeURIComponent(PORTAL_ICS);

  return (
    <div className="cal-btns">
      <a
        href={GOOGLE_CAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="cal-btn"
      >
        <GoogleCalIcon />
        add to google calendar
      </a>
      <a
        href={icsHref}
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function AppleCalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <text x="12" y="19" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="system-ui">
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

function isContactReady(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 || value.includes(".com");
}

function Landing({ onHome }) {
  const [bg] = useState(
    () =>
      LANDING_BACKGROUNDS[
        Math.floor(Math.random() * LANDING_BACKGROUNDS.length)
      ],
  );

  // step: 'contact' → 'referral' → 'done'
  const [step, setStep] = useState("contact");
  const [contact, setContact] = useState("");
  const [referrer, setReferrer] = useState("");

  const showSubmit =
    step === "contact" ? isContactReady(contact) : referrer.trim().length > 0;

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

  // ── Submit: contact step → save to DB, transition to referral ──
  async function handleContactSubmit() {
    if (!isContactReady(contact)) return;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
    } catch {
      /* silent */
    }

    // Fade out "who are you?", update text, float back in
    const whoEl = whoTextRef.current;
    if (whoEl) {
      whoEl.style.transition = "opacity 0.35s ease, transform 0.35s ease";
      whoEl.style.opacity = "0";
      whoEl.style.transform = "translateY(-10px)";
      setTimeout(() => {
        setStep("referral");
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
      setStep("referral");
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (step === "contact") handleContactSubmit();
  }

  // ── Power button: full shutdown sequence ──
  function handlePowerPress() {
    // 1 — fade out everything except the circle
    const fadeEls = [
      bgSlideRef.current,
      splashRef.current,
      diskRef.current,
      ringRef.current,
      inputWrapRef.current,
      whoTextRef.current,
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

    // 6 — navigate to home once fully white
    setTimeout(() => onHome(), 4800);
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
      if (lineRef.current) lineRef.current.style.width = "280px";
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
      const LOGO_SCALE = 0.28,
        LOGO_TOP_PX = 32;
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
        const wto = { opacity: 1, ty: 0 };
        animations.push(
          animate(wto, {
            opacity: 0,
            ty: -10,
            duration: 700,
            delay: 13200,
            ease: "in(2)",
            onRender: () => {
              wtEl.style.opacity = wto.opacity;
              wtEl.style.transform = `translateY(${wto.ty}px)`;
            },
          }),
        );
      }

      const wqEl = whoTextRef.current;
      if (wqEl) {
        const wq = { opacity: 0, ty: 12 };
        animations.push(
          animate(wq, {
            opacity: 1,
            ty: 0,
            duration: 900,
            delay: 14100,
            ease: "out(2)",
            onRender: () => {
              wqEl.style.opacity = wq.opacity;
              wqEl.style.transform = `translateY(${wq.ty}px)`;
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
        const ln = { w: 0 };
        animations.push(
          animate(ln, {
            w: 280,
            duration: 1600,
            delay: 14200,
            ease: "out(1.5)",
            onRender: () => {
              lineEl.style.width = `${ln.w}px`;
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
      if (lineRef.current) lineRef.current.style.width = "0";
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
        <div ref={diskRef} className="accretion-disk" />
        <div ref={ringRef} className="welcome-ring" />
        <div className="welcome-circle">
          <div ref={innerWhiteRef} className="circle-inner-white" />
          <span ref={welcomeTextRef} className="circle-text">
            welcome
          </span>
          <span
            ref={whoTextRef}
            className={`circle-text${step !== "contact" ? " circle-text--sm" : ""}`}
          >
            {step === "contact"
              ? "who are you?"
              : (
                <>
                  who invited you in to
                  <br />
                  <span className="circle-text-line">the domain?</span>
                </>
              )}
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
          <input
            className="waitlist-input"
            type="text"
            placeholder={
              step === "contact" ? "phone number or email" : "name..."
            }
            value={step === "contact" ? contact : referrer}
            onChange={(e) =>
              step === "contact"
                ? setContact(e.target.value)
                : setReferrer(e.target.value)
            }
          />
          <div ref={lineRef} className="welcome-line" />
          <button
            type={step === "referral" ? "button" : "submit"}
            onClick={step === "referral" ? handlePowerPress : undefined}
            className={`submit-btn${showSubmit ? " visible" : ""}${step === "referral" ? " submit-btn--power" : ""}`}
          >
            {step === "referral" ? <PowerIcon /> : "enter"}
          </button>
        </form>
      </div>
      <div ref={flashOverlayRef} className="flash-overlay" />
    </div>
  );
}
