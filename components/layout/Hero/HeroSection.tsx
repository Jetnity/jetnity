// components/layout/Hero/HeroSection.tsx
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import HeroBackground from './HeroBackground'
import HeroSearchWrapper from './HeroSearchWrapper'
import InspirationPanel from '@/components/search/InspirationPanel'
import MiniTripSlider from '@/components/trips/MiniTripSlider'

export default function HeroSection() {
  return (
    <>
      <section
        role="banner"
        aria-label="Reise-Suche und Empfehlungen"
        className={cn(
          'relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden text-white'
        )}
      >
        {/* Hintergrundbild / -video */}
        <HeroBackground />

        {/* Abdunkelung & Verlauf */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-black/60 to-black/80" />

        {/* Inhalt */}
        <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 py-16 sm:px-10">
          {/* Headline */}
          <h1
            className={cn(
              'text-center font-extrabold leading-tight tracking-tight',
              'drop-shadow-xl [text-shadow:_0_4px_32px_rgba(0,0,0,0.35)]',
              'text-[clamp(28px,5vw,56px)]'
            )}
          >
            Entdecke die Welt – persönlich,
            <br className="hidden sm:block" />
            inspirierend, intelligent.
          </h1>

          {/* Untertitel */}
          <p className="mt-6 text-center text-lg font-medium text-white/90 sm:text-2xl">
            Flüge, Hotels, Aktivitäten &amp; mehr – alles auf einer <strong>smarten Plattform</strong>.
          </p>

          {/* CTA-Zeile */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/search"
              className="btn-premium inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0c1930] shadow transition hover:brightness-95"
            >
              Jetzt entdecken
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
            >
              So funktioniert’s
            </Link>
          </div>

          {/* MegaSearch */}
          <div id="content" className="mt-12 flex w-full justify-center">
            <HeroSearchWrapper initialTab="flight" />
          </div>
        </div>

        {/* Sanfter Bodenverlauf, damit die nachfolgenden Sektionen andocken */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-b from-transparent to-black/70" />
      </section>

      {/* Inspirationen – leicht in den Hero „gezogen“ */}
      <div className="relative z-30 -mt-6 sm:-mt-8">
        <InspirationPanel />
      </div>

      {/* Mini-Reiseideen Slider */}
      <div className="relative z-30 -mt-2">
        <MiniTripSlider />
      </div>
    </>
  )
}
