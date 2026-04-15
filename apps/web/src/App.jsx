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

    words.forEach(word => {
      word.style.opacity = '0'
      word.style.filter = 'blur(6px)'
      word.style.transform = 'translateY(0px)'
    })

    // ── Phase 1: Entrance — float in to full brightness, top-down ──
    // Each word reaches opacity 1, blur 0 = fully visible, crisp white
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
            word.style.filter = `blur(${s.blur}px)`
          }
        })
      )
    })

    // ── Phase 2: Hold 2s at full visibility, then glitch cut bottom-up ──
    // DOMAIN finishes at 1500 + 2600 = 4100ms → hold 2000ms → glitch at 6100ms
    const glitchAt = 6100
    ;[2, 1, 0].forEach((wi, j) => {
      const word = words[wi]
      const s = { opacity: 1 }
      animations.push(
        animate(s, {
          opacity: 0,
          duration: 70,
          delay: glitchAt + j * 110,
          ease: 'linear',
          onRender: () => { word.style.opacity = s.opacity }
        })
      )
    })

    // ── Phase 3: Smoke pulse — always present, never in sync ──
    const smokeDefs = [
      { delay: 6500, dur: 4400, minO: 0.08, maxO: 0.42, minB: 1.5, maxB: 5.5, ty: -5 },
      { delay: 6700, dur: 5900, minO: 0.06, maxO: 0.38, minB: 2.0, maxB: 6.5, ty: -8 },
      { delay: 6600, dur: 3800, minO: 0.10, maxO: 0.44, minB: 1.0, maxB: 4.5, ty: -4 },
    ]

    words.forEach((word, i) => {
      const { delay, dur, minO, maxO, minB, maxB, ty } = smokeDefs[i]
      const s = { opacity: minO, blur: maxB, ty: 0 }
      animations.push(
        animate(s, {
          opacity: maxO,
          blur: minB,
          ty,
          duration: dur,
          delay,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
          onRender: () => {
            word.style.opacity = s.opacity
            word.style.filter = `blur(${s.blur}px)`
            word.style.transform = `translateY(${s.ty}px)`
          }
        })
      )
    })

    return () => {
      words.forEach(word => {
        word.style.opacity = '0'
        word.style.filter = 'blur(6px)'
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
