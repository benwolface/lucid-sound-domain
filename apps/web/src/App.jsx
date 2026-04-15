import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import './styles.css'

const BACKGROUNDS = [
  { url: '/bg-1-sky.jpg',   position: 'center bottom', size: 'cover'   },
  { url: '/bg-2-disco.jpg', position: 'center center', size: 'cover'   },
  { url: '/bg-3-red.jpg',   position: 'center center', size: 'cover'   },
]

export default function App() {
  return (
    <div className="app">
      <Landing />
    </div>
  )
}

function Landing() {
  const [bg] = useState(
    () => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
  )
  const bgSlideRef  = useRef(null)
  const splashRef   = useRef(null)
  const welcomeRef  = useRef(null)

  useEffect(() => {
    const words = [...document.querySelectorAll('.splash-word')]
    const animations = []
    let flickerStart = null
    let flickerTick  = null
    let logoTimeout  = null

    // Start hidden
    if (bgSlideRef.current) bgSlideRef.current.style.opacity = '0'
    if (welcomeRef.current) welcomeRef.current.style.opacity = '0'

    words.forEach(word => {
      word.style.opacity   = '0'
      word.style.filter    = 'blur(6px)'
      word.style.transform = 'translateY(0px)'
    })

    // ── Phase 1: Entrance ──
    words.forEach((word, i) => {
      const s = { opacity: 0, blur: 6 }
      animations.push(
        animate(s, {
          opacity: 1, blur: 0,
          duration: 2600, delay: i * 750, ease: 'out(2)',
          onRender: () => {
            word.style.opacity = s.opacity
            word.style.filter  = `blur(${s.blur}px)`
          }
        })
      )
    })

    // ── Phase 2: Hold → strobe → hard cut ──
    flickerStart = setTimeout(() => {
      const FLICKER_MS = 550
      const born = performance.now()
      flickerTick = setInterval(() => {
        words.forEach(word => {
          word.style.opacity = Math.random() > 0.5 ? '1' : '0'
        })
        if (performance.now() - born >= FLICKER_MS) {
          clearInterval(flickerTick)
          flickerTick = null
          words.forEach(word => { word.style.opacity = '0' })
        }
      }, 20)
    }, 6100)

    // ── Phase 3: Smoke pulse ──
    const smokeDefs = [
      { fadeDelay: 6800, loopDelay: 7200, dur: 4400, minO: 0.10, maxO: 0.62, minB: 1.5, maxB: 5.5, ty: -5 },
      { fadeDelay: 7000, loopDelay: 7400, dur: 5900, minO: 0.08, maxO: 0.58, minB: 2.0, maxB: 6.5, ty: -8 },
      { fadeDelay: 6900, loopDelay: 7300, dur: 3800, minO: 0.12, maxO: 0.65, minB: 1.0, maxB: 4.5, ty: -4 },
    ]

    words.forEach((word, i) => {
      const { fadeDelay, loopDelay, dur, minO, maxO, minB, maxB, ty } = smokeDefs[i]

      const entry = { opacity: 0, blur: maxB }
      animations.push(
        animate(entry, {
          opacity: minO, blur: maxB * 0.8,
          duration: 400, delay: fadeDelay, ease: 'out(2)',
          onRender: () => {
            word.style.opacity = entry.opacity
            word.style.filter  = `blur(${entry.blur}px)`
          }
        })
      )

      const s = { opacity: minO, blur: maxB * 0.8, ty: 0 }
      animations.push(
        animate(s, {
          opacity: maxO, blur: minB, ty,
          duration: dur, delay: loopDelay,
          loop: true, alternate: true, ease: 'inOut(4)',
          onRender: () => {
            word.style.opacity   = s.opacity
            word.style.filter    = `blur(${s.blur}px)`
            word.style.transform = `translateY(${s.ty}px)`
          }
        })
      )
    })

    // ── Photo reveal ──
    const slide = bgSlideRef.current
    if (slide) {
      const sp = { opacity: 0 }
      animations.push(
        animate(sp, {
          opacity: 1,
          duration: 4000, delay: 6800, ease: 'out(2)',
          onRender: () => { slide.style.opacity = sp.opacity }
        })
      )
    }

    // ── Logo transition (photo done at 6800 + 4000 = 10800ms) ──
    const LOGO_SCALE  = 0.28
    const LOGO_TOP_PX = 32

    logoTimeout = setTimeout(() => {
      const splashEl = splashRef.current
      if (!splashEl) return

      const rect = splashEl.getBoundingClientRect()
      const currentCenterY = rect.top + rect.height / 2
      const targetCenterY  = LOGO_TOP_PX + (rect.height * LOGO_SCALE) / 2
      const targetTY = targetCenterY - currentCenterY

      const sl = { scale: 1, ty: 0 }
      animations.push(
        animate(sl, {
          scale: LOGO_SCALE, ty: targetTY,
          duration: 1400, ease: 'inOut(3)',
          onRender: () => {
            splashEl.style.transform = `translateY(${sl.ty}px) scale(${sl.scale})`
          }
        })
      )
    }, 10800)

    // ── Welcome circle: fade in after logo settles (10800 + 1400 = 12200ms) ──
    const welcomeWrap = welcomeRef.current
    if (welcomeWrap) {
      const ww = { opacity: 0 }
      animations.push(
        animate(ww, {
          opacity: 1,
          duration: 1000, delay: 12400, ease: 'out(2)',
          onRender: () => { welcomeWrap.style.opacity = ww.opacity }
        })
      )

      // ── "welcome" write-on: sweep clip rect left→right after circle appears ──
      const clipRect = welcomeWrap.querySelector('.write-rect')
      if (clipRect) {
        const SVG_W = 220
        const wr = { w: 0 }
        animations.push(
          animate(wr, {
            w: SVG_W,
            duration: 2400, delay: 13200, ease: 'out(1.2)',
            onRender: () => { clipRect.setAttribute('width', wr.w) }
          })
        )
      }
    }

    return () => {
      clearTimeout(flickerStart)
      clearTimeout(logoTimeout)
      if (flickerTick) clearInterval(flickerTick)
      words.forEach(word => {
        word.style.opacity   = '0'
        word.style.filter    = 'blur(6px)'
        word.style.transform = 'translateY(0px)'
      })
      if (splashRef.current)  splashRef.current.style.transform  = ''
      if (welcomeRef.current) welcomeRef.current.style.opacity   = '0'
      if (slide) slide.style.opacity = '0'
      animations.forEach(a => a.revert())
    }
  }, [])

  return (
    <div className="landing">
      <div
        ref={bgSlideRef}
        className="bg-slide"
        style={{
          backgroundImage:    `url(${bg.url})`,
          backgroundPosition: bg.position,
          backgroundSize:     bg.size,
        }}
      />
      <div className="bg-veil" />

      <div ref={splashRef} className="splash">
        <span className="splash-word">LUCID</span>
        <span className="splash-word">SOUND</span>
        <span className="splash-word">DOMAIN</span>
      </div>

      {/* Welcome circle — appears after logo settles */}
      <div ref={welcomeRef} className="welcome-wrap">
        <div className="welcome-ring" />
        <div className="welcome-circle">
          <svg
            className="welcome-svg"
            viewBox="0 0 220 60"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="write-clip">
                <rect className="write-rect" x="0" y="0" width="0" height="60" />
              </clipPath>
            </defs>
            <text
              x="110"
              y="38"
              textAnchor="middle"
              fontFamily="Excrallik, cursive"
              fontSize="34"
              fill="white"
              clipPath="url(#write-clip)"
            >
              welcome
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}
