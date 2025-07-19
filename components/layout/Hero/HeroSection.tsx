'use client'

import HeroBackground from './HeroBackground'
import HeroSearch from './HeroSearch'

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[90vh] overflow-hidden flex items-center justify-center text-white">
      {/* Hintergrundbild */}
      <HeroBackground />

      {/* Dunkler Overlay für bessere Lesbarkeit */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 z-10" />

      {/* Inhalt */}
      <div className="relative z-20 text-center max-w-4xl px-6 sm:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight drop-shadow-md">
          Entdecke die Welt – persönlich,<br /> inspirierend, intelligent.
        </h1>
        <p className="mt-4 text-lg sm:text-xl md:text-2xl font-medium text-white/90 drop-shadow-sm">
          Flüge, Hotels, Aktivitäten & mehr – alles auf einer KI-gestützten Plattform.
        </p>

        {/* Suchbox */}
        <div className="mt-10">
          <HeroSearch />
        </div>
      </div>
    </section>
  )
}
