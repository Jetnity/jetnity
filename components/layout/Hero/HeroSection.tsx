'use client'

import HeroBackground from './HeroBackground'
import HeroMegaSearch from '@/components/search/HeroMegaSearch'

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[92vh] overflow-hidden flex items-center justify-center text-white">
      {/* Hintergrundbild (z.B. mit animierter Blende oder LQIP für smoothes Laden) */}
      <HeroBackground />

      {/* Abdunkelung & leichter Verlauf für Text-Lesbarkeit */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/80 z-10" />

      {/* Inhalt */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-5xl px-6 sm:px-10 py-16">
        {/* Titel */}
        <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-xl [text-shadow:_0_4px_32px_rgba(0,0,0,0.35)]">
          Entdecke die Welt – persönlich,<br className="hidden sm:block" />
          inspirierend, intelligent.
        </h1>
        {/* Untertitel */}
        <p className="mt-6 text-center text-lg sm:text-2xl md:text-2xl font-medium text-white/90 drop-shadow-md">
          Flüge, Hotels, Aktivitäten &amp; mehr – alles auf einer KI-gestützten Plattform.
        </p>
        {/* MegaSearch */}
        <div className="mt-12 w-full flex justify-center">
          <HeroMegaSearch />
        </div>
      </div>
    </section>
  )
}
