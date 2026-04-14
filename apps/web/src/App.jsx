import { useEffect, useRef } from "react";
import { createTimeline } from "animejs";

export default function App() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ensure we still render the final diagram for reduced motion.
    if (reduceMotion) {
      const all = root.querySelectorAll(
        ".lsd-top-arc,.lsd-power-line,.lsd-edge,.lsd-circle circle,.lsd-spoke"
      );
      all.forEach((el) => {
        el.style.strokeDashoffset = "0";
      });
      root.querySelectorAll(".lsd-driver").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      });
      return;
    }

    // Initial states (avoid any flash before timeline starts).
    root.querySelectorAll(".lsd-top-arc").forEach((el) => {
      el.style.strokeDasharray = "100";
      el.style.strokeDashoffset = "100";
    });
    root.querySelectorAll(".lsd-power-line").forEach((el) => {
      el.style.strokeDasharray = "90";
      el.style.strokeDashoffset = "90";
    });
    root.querySelectorAll(".lsd-edge,.lsd-spoke").forEach((el) => {
      el.style.strokeDasharray = "200";
      el.style.strokeDashoffset = "200";
    });
    root.querySelectorAll(".lsd-circle--2 > circle,.lsd-circle--3 > circle").forEach((el) => {
      el.style.strokeDasharray = "690";
      el.style.strokeDashoffset = "690";
    });
    root.querySelectorAll(".lsd-driver").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "scale(0.985)";
    });

    const tl = createTimeline({ autoplay: true });

    // 1) Top circle: draw from top, split left/right, meet bottom.
    tl.add(root.querySelectorAll(".lsd-top-arc"), {
      strokeDashoffset: [100, 0],
      duration: 1200,
      ease: "outExpo"
    });

    // 2) Power line draws bottom -> up to its current height.
    tl.add(
      root.querySelectorAll(".lsd-power-line"),
      {
        strokeDashoffset: [90, 0],
        duration: 600,
        ease: "outQuad"
      },
      "+=80"
    );

    // 3) Power press: pushed in/out pulse.
    tl.add(
      root.querySelectorAll(".lsd-power"),
      {
        scaleY: [1, 0.75, 1.08, 1],
        duration: 560,
        ease: "inOutQuad"
      },
      "+=70"
    );

    // 4) Two diagonals extend simultaneously.
    tl.add(
      root.querySelectorAll(".lsd-edge--1,.lsd-edge--2"),
      {
        strokeDashoffset: [200, 0],
        duration: 900,
        ease: "outQuad"
      },
      "+=40"
    );

    // Bottom-left circle + driver.
    tl.add(
      root.querySelectorAll(".lsd-circle--2 > circle"),
      {
        strokeDashoffset: [690, 0],
        duration: 1400,
        ease: "outExpo"
      },
      "+=180"
    ).add(
      root.querySelectorAll(".lsd-driver--2"),
      {
        opacity: [0, 1],
        scale: [0.985, 1],
        duration: 700,
        ease: "outQuad"
      },
      "-=700"
    );

    // Bottom-right circle + driver.
    tl.add(
      root.querySelectorAll(".lsd-circle--3 > circle"),
      {
        strokeDashoffset: [690, 0],
        duration: 1400,
        ease: "outExpo"
      },
      "+=120"
    ).add(
      root.querySelectorAll(".lsd-driver--3"),
      {
        opacity: [0, 1],
        scale: [0.985, 1],
        duration: 700,
        ease: "outQuad"
      },
      "-=700"
    );

    // Bottom connector.
    tl.add(
      root.querySelectorAll(".lsd-edge--3"),
      {
        strokeDashoffset: [200, 0],
        duration: 900,
        ease: "outQuad"
      },
      "+=120"
    );

    return () => {
      tl?.revert?.();
    };
  }, []);

  return (
    <div ref={rootRef} className="lsd-root">
      <svg
        className="lsd-diagram"
        viewBox="0 0 800 600"
        role="img"
        aria-label="Creative, Social, and Scientific realms connected by a sound system"
      >
        <defs>
          <linearGradient id="lsd-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FEF4A" />
            <stop offset="100%" stopColor="#8FEF4A" />
          </linearGradient>

          {/* Clip the driver fills to the two bottom circles */}
          <clipPath id="clip-social">
            <circle cx="250" cy="410" r="110" />
          </clipPath>
          <clipPath id="clip-scientific">
            <circle cx="550" cy="410" r="110" />
          </clipPath>

          {/* Driver materials (subtle, mostly dark so the green strokes pop) */}
          <radialGradient id="driver-cone" cx="45%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.92)" />
          </radialGradient>
          <radialGradient id="driver-dome" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
            <stop offset="40%" stopColor="rgba(0,0,0,0.70)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.98)" />
          </radialGradient>
        </defs>

        {/* guides: three circle positions in a triangle */}
        {/* top / Creative */}
        <g className="lsd-circle lsd-circle--1">
          {/* Top circle draws from top, splitting left/right, meeting bottom */}
          <path
            className="lsd-top-arc lsd-top-arc--left"
            pathLength="100"
            d="M 400 60 A 110 110 0 0 0 400 280"
          />
          <path
            className="lsd-top-arc lsd-top-arc--right"
            pathLength="100"
            d="M 400 60 A 110 110 0 0 1 400 280"
          />
          {/* "power" line inside the top circle */}
          <g className="lsd-power" aria-hidden="true">
            <line className="lsd-power-line" x1="400" y1="280" x2="400" y2="215" />
          </g>
          <text x="400" y="120" className="lsd-circle-title">
            Creative Realm
          </text>
          <text x="400" y="145" className="lsd-circle-label">
            DJ · Producer · Visual Artist · Dancer · MC · Curator
          </text>
        </g>

        {/* bottom-left / Social */}
        <g className="lsd-circle lsd-circle--2">
          <g className="lsd-driver lsd-driver--2" clipPath="url(#clip-social)">
            {/* outer gasket */}
            <circle className="lsd-driver-gasket" cx="250" cy="410" r="104" />
            <circle className="lsd-driver-gasket" cx="250" cy="410" r="98" />

            {/* cone + surround */}
            <circle className="lsd-driver-surround" cx="250" cy="410" r="84" />
            <circle className="lsd-driver-cone" cx="250" cy="410" r="72" />

            {/* inner rings */}
            <circle className="lsd-driver-ring" cx="250" cy="410" r="58" />
            <circle className="lsd-driver-ring" cx="250" cy="410" r="46" />
            <circle className="lsd-driver-ring" cx="250" cy="410" r="34" />

            {/* dust cap */}
            <circle className="lsd-driver-dome" cx="250" cy="410" r="22" />

            {/* specular sweep */}
            <ellipse className="lsd-driver-sheen" cx="230" cy="385" rx="70" ry="26" />
          </g>
          <circle cx="250" cy="410" r="110" />
          <text x="250" y="360" className="lsd-circle-title">
            Social Realm
          </text>
          <text x="250" y="385" className="lsd-circle-label">
            Audience · Promoter · Safety · City · Public
          </text>
        </g>

        {/* bottom-right / Scientific */}
        <g className="lsd-circle lsd-circle--3">
          <g className="lsd-driver lsd-driver--3" clipPath="url(#clip-scientific)">
            {/* outer gasket */}
            <circle className="lsd-driver-gasket" cx="550" cy="410" r="104" />
            <circle className="lsd-driver-gasket" cx="550" cy="410" r="98" />

            {/* cone + surround */}
            <circle className="lsd-driver-surround" cx="550" cy="410" r="84" />
            <circle className="lsd-driver-cone" cx="550" cy="410" r="72" />

            {/* inner rings */}
            <circle className="lsd-driver-ring" cx="550" cy="410" r="58" />
            <circle className="lsd-driver-ring" cx="550" cy="410" r="46" />
            <circle className="lsd-driver-ring" cx="550" cy="410" r="34" />

            {/* dust cap */}
            <circle className="lsd-driver-dome" cx="550" cy="410" r="22" />

            {/* specular sweep */}
            <ellipse className="lsd-driver-sheen" cx="530" cy="385" rx="70" ry="26" />
          </g>
          <circle cx="550" cy="410" r="110" />
          <text x="550" y="360" className="lsd-circle-title">
            Scientific Realm
          </text>
          <text x="550" y="385" className="lsd-circle-label">
            Engineer · Technician · Woodworker · Electrician
          </text>
        </g>

        {/* connecting triangle edges */}
        <g className="lsd-connections">
          {/* Creative -> Social */}
          <line
            className="lsd-edge lsd-edge--1"
            x1="342"
            y1="263"
            x2="308"
            y2="317"
          />
          {/* Creative -> Scientific */}
          <line
            className="lsd-edge lsd-edge--2"
            x1="458"
            y1="263"
            x2="492"
            y2="317"
          />
          {/* Social -> Scientific */}
          <line
            className="lsd-edge lsd-edge--3"
            x1="360"
            y1="410"
            x2="440"
            y2="410"
          />
        </g>

        {/* central sound system node */}
        <g className="lsd-sound">
          {/* small spokes to each realm */}
          <line
            className="lsd-spoke lsd-spoke--1"
            x1="400"
            y1="280"
            x2="400"
            y2="230"
          />
        </g>
      </svg>
    </div>
  );
}

