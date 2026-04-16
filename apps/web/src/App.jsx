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

function Home() {
  const [bg] = useState(
    () => HOME_BACKGROUNDS[Math.floor(Math.random() * HOME_BACKGROUNDS.length)],
  );
  return (
    <div className="home-screen">
      <div
        className="home-bg"
        style={{
          backgroundImage: `url(${bg.url})`,
          backgroundPosition: bg.position,
          backgroundSize: bg.size,
        }}
      />
      <div className="home-veil" />

      <div className="home-logo">
        <span className="home-logo-word">LUCID</span>
        <span className="home-logo-word">SOUND</span>
        <span className="home-logo-word">DOMAIN</span>
      </div>

      <div className="home-center">
        <p className="home-next-label">next portal opening on</p>
        <p className="home-next-date">Wednesday, April 22nd, 2026</p>
        <CalendarView />
      </div>
    </div>
  );
}

// April 2026 — 1st lands on a Wednesday
function CalendarView() {
  const weeks = [
    [null, null, null, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, null, null],
  ];
  return (
    <div className="cal-wrap">
      <div className="cal-month">April 2026</div>
      <div className="cal-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="cal-dname">
            {d}
          </span>
        ))}
        {weeks.flat().map((day, i) => (
          <span
            key={`d${i}`}
            className={`cal-day${day === 22 ? " cal-day--on" : ""}${!day ? " cal-day--blank" : ""}`}
          >
            {day ?? ""}
          </span>
        ))}
      </div>
    </div>
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
