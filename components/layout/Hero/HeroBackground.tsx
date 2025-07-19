'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function HeroBackground() {
  const [loaded, setLoaded] = useState(false)

  // Optionaler Parallax-Effekt
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const hero = document.getElementById('hero-bg')
      if (hero) {
        hero.style.transform = `translateY(${scrollY * 0.2}px)`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      id="hero-bg"
      className={`absolute inset-0 -z-10 transition-opacity duration-1000 ease-out ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Image
        src="/images/hero-bali.png"
        alt="Bali Sonnenuntergang in Ubud"
        fill
        className="object-cover w-full h-full"
        priority
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 bg-black/40 z-0" />
    </div>
  )
}
