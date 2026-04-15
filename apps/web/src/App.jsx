import { useEffect, useState } from 'react'
import { animate } from 'animejs'
import './styles.css'

const BACKGROUNDS = [
  { url: '/bg-1-sky.jpg',   position: 'center bottom', size: 'cover'   },
  { url: '/bg-2-disco.jpg', position: 'center center', size: 'cover'   },
  { url: '/bg-3-red.jpg',   position: 'center center', size: 'contain' },
]

export default function App() {
  return (
    <div className="app">
      <Landing />
    </div>
  )
}

function Landing() {
  // Pick one background randomly on mount — stays fixed until next page load
  const [bg] = useState(
    () => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
  )

  useEffect(() => {
    const words = [...document.querySelectorAll('.splash-word')]
    const animations = []
    let flickerStart = null
    let flickerTick  = null

    words.forEach(word => {
      word.style.opacity = '0'
      word.style.filter  = 'blur(6px)'
      word.style.transform = 'translateY(0px)'
    })

    // ── Phase 1: Entrance — float in to full brightness, top-down ──
    words.forEach((word, i) => {
      const s = { opacity: 0, blur: 6 }
      animations.push(
        animate(s, {
          opacity: 1,
          blur: 0,
          duration: 2600,
          delay: i * 750,
          ease: 'out(2)',
          onRender: () => {
            word.style.opacity = s.opacity
            word.style.filter  = `blur(${s.blur}px)`
          }
        })
      )
    })

    // ── Phase 2: 2s hold → chaotic strobe → hard cut ──
    // DOMAIN finishes at 4100ms + 2000ms hold = glitch at 6100ms
    flickerStart = setTimeout(() => {
      const FLICKER_MS = 550  // total chaos window
      const born = performance.now()

      flickerTick = setInterval(() => {
        // Each letter independently flips to 0 or 1 every frame — pure chaos
        words.forEach(word => {
          word.style.opacity = Math.random() > 0.5 ? '1' : '0'
        })

        if (performance.now() - born >= FLICKER_MS) {
          clearInterval(flickerTick)
          flickerTick = null
          // Hard cut — everything dark
          words.forEach(word => { word.style.opacity = '0' })
        }
      }, 20) // ~50 flips per second
    }, 6100)

    // ── Phase 3: Smoke pulse — always present, never in sync ──
    // Each word fades in gently from 0 first, then settles into its loop.
    // inOut(4) lingers at both extremes and eases through the middle slowly
    // — much smoother than inOut(2).
    const smokeDefs = [
      { fadeDelay: 6800, loopDelay: 7200, dur: 4400, minO: 0.10, maxO: 0.62, minB: 1.5, maxB: 5.5, ty: -5 },
      { fadeDelay: 7000, loopDelay: 7400, dur: 5900, minO: 0.08, maxO: 0.58, minB: 2.0, maxB: 6.5, ty: -8 },
      { fadeDelay: 6900, loopDelay: 7300, dur: 3800, minO: 0.12, maxO: 0.65, minB: 1.0, maxB: 4.5, ty: -4 },
    ]

    words.forEach((word, i) => {
      const { fadeDelay, loopDelay, dur, minO, maxO, minB, maxB, ty } = smokeDefs[i]

      // Soft entry: 0 → minO over 400ms so the word melts in after the hard cut
      const entry = { opacity: 0, blur: maxB }
      animations.push(
        animate(entry, {
          opacity: minO,
          blur: maxB * 0.8,
          duration: 400,
          delay: fadeDelay,
          ease: 'out(2)',
          onRender: () => {
            word.style.opacity = entry.opacity
            word.style.filter  = `blur(${entry.blur}px)`
          }
        })
      )

      // Oscillating smoke loop: minO ↔ maxO, inOut(4) = slow at extremes
      const s = { opacity: minO, blur: maxB * 0.8, ty: 0 }
      animations.push(
        animate(s, {
          opacity: maxO,
          blur: minB,
          ty,
          duration: dur,
          delay: loopDelay,
          loop: true,
          alternate: true,
          ease: 'inOut(4)',
          onRender: () => {
            word.style.opacity   = s.opacity
            word.style.filter    = `blur(${s.blur}px)`
            word.style.transform = `translateY(${s.ty}px)`
          }
        })
      )
    })

    return () => {
      clearTimeout(flickerStart)
      if (flickerTick) clearInterval(flickerTick)
      words.forEach(word => {
        word.style.opacity   = '0'
        word.style.filter    = 'blur(6px)'
        word.style.transform = 'translateY(0px)'
      })
      animations.forEach(a => a.revert())
    }
  }, [])

  return (
    <div className="landing">
      <div
        className="bg-slide"
        style={{
          backgroundImage: `url(${bg.url})`,
          backgroundPosition: bg.position,
          backgroundSize: bg.size,
        }}
      />
      <div className="bg-veil" />
      <div className="splash">
        <span className="splash-word">LUCID</span>
        <span className="splash-word">SOUND</span>
        <span className="splash-word">DOMAIN</span>
      </div>
    </div>
  )
}
