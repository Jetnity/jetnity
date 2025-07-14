'use client'

import HeroBackground from './HeroBackground'
import HeroSearchTabs from './HeroSearchTabs'

export default function HeroSection() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Hintergrundbild (CoPilot-generiert) */}
      <HeroBackground />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Entdecke die Welt – persönlich, inspirierend, intelligent.
        </h1>
        <p className="text-lg mb-6">
          Flüge, Hotels, Aktivitäten & mehr – alles auf einer KI-gestützten Plattform.
        </p>

        <HeroSearchTabs />
      </div>
    </section>
  )
}
