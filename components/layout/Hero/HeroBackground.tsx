// components/layout/Hero/HeroBackground.tsx
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function HeroBackground() {
  const [loaded, setLoaded] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Parallax (rAF-throttled, respektiert Reduced Motion)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) return

    let rafId = 0
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY * 0.2
        el.style.transform = `translate3d(0, ${y}px, 0)`
        rafId = 0
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 z-0 transition-opacity duration-700 ease-out will-change-transform ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <Image
        src="/images/hero-bali.png"
        alt="Bali Sonnenuntergang in Ubud"
        fill
        priority
        sizes="100vw"
        className="object-cover w-full h-full pointer-events-none select-none"
        onLoad={(e) => {
          // stellt sicher, dass das Bild wirklich gerendert ist
          if ((e.currentTarget as HTMLImageElement).naturalWidth > 0) setLoaded(true)
        }}
        draggable={false}
      />
      {/* leichte Grundabdunkelung */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  )
}
