import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

import { HomeBegleitung } from '@/components/home/HomeBegleitung'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeInspiration } from '@/components/home/HomeInspiration'
import { HomeProduktfenster } from '@/components/home/HomeProduktfenster'
import { HomeUnterschied } from '@/components/home/HomeUnterschied'
import { HomeVertrauen } from '@/components/home/HomeVertrauen'
import { HomeWerkzeuge } from '@/components/home/HomeWerkzeuge'
import GastCreateLink from '@/components/trips/GastCreateLink'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { zielHref } from '@/lib/places/auswahl'
import {
  finalHomepageJsonLd,
  finalHomepageMetadaten,
  HOMEPAGE_UEBERSCHRIFTEN,
} from '@/lib/seo/final-homepage'
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'

const homepageMeta = finalHomepageMetadaten(kanonischeUrl('/'))

export const metadata: Metadata = {
  title: homepageMeta.title,
  description: homepageMeta.description,
  alternates: { canonical: homepageMeta.canonical },
  openGraph: {
    ...homepageMeta.openGraph,
    url: kanonischeUrl('/'),
    images: [
      {
        url: '/images/hero-bali.png',
        width: 1536,
        height: 1024,
        alt: 'Reisterrassen und Palmen, Stimmungsbild der Jetnity-Startseite',
      },
    ],
  },
  twitter: {
    ...homepageMeta.twitter,
    images: ['/images/hero-bali.png'],
  },
}

const inspirationsziele = INSPIRATION_ZIELE.map((ziel) => ({
  name: ziel.name,
  country: ziel.country,
  image: ziel.image,
  href: zielHref({ id: ziel.placeId, name: ziel.name }, ziel.idea) ?? '/planen',
}))

export default function HomePage() {
  return (
    <main className="break-words bg-surface-75 pb-[env(safe-area-inset-bottom)] text-brand-800 [&_.sr-only]:whitespace-normal">
      <HomeHero />
      <HomeWerkzeuge />
      <HomeProduktfenster />
      <HomeBegleitung />
      <HomeUnterschied />
      <HomeInspiration ziele={inspirationsziele} />
      <HomeVertrauen />
      <section className="px-3 pb-16 pt-4 sm:px-5 sm:pb-24 sm:pt-8" aria-labelledby="abschluss-titel">
        <div className="mx-auto max-w-[1450px] rounded-[28px] bg-brand-800 px-5 py-10 text-white sm:rounded-[36px] sm:px-12 sm:py-14">
          <h2
            id="abschluss-titel"
            className="max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
          >
            {HOMEPAGE_UEBERSCHRIFTEN.abschluss}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-ink-300">
            Bestätige ein Ziel und beginne deinen eigenen Entwurf. Jetnity entscheidet die Reise nicht
            für dich.
          </p>
          <GastCreateLink
            createHref="/planen"
            createLabel="Reise starten"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-citrus-400 px-6 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Reise starten
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </GastCreateLink>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalHomepageJsonLd({ url: kanonischeUrl('/') })).replace(/</g, '\\u003c'),
        }}
      />
    </main>
  )
}
