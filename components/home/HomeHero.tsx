import Image from 'next/image'
import { Check, MapPin } from 'lucide-react'

import StartzielForm from '@/components/places/StartzielForm'
import { FINAL_HOMEPAGE_DEFINITION, FINAL_HOMEPAGE_H1 } from '@/lib/seo/final-homepage'

export function HomeHero() {
  return (
    <section
      className="px-3 pt-3 sm:px-5 sm:pt-5"
      aria-labelledby="start-titel"
    >
      <div className="mx-auto grid max-w-[1450px] items-stretch rounded-[28px] bg-brand-800 text-white lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:rounded-[36px]">
        <div className="min-w-0 px-5 py-7 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-citrus-400">
            Dein Reiseplaner. Dein Reisebegleiter.
          </p>
          <h1
            id="start-titel"
            className="mt-4 max-w-3xl hyphens-manual text-[min(2rem,8.8vw)] font-semibold leading-[1.08] tracking-[-0.04em] text-balance text-white [overflow-wrap:normal] sm:text-5xl lg:text-[3.5rem]"
          >
            {FINAL_HOMEPAGE_H1}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-300">{FINAL_HOMEPAGE_DEFINITION}</p>
          <StartzielForm />
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm leading-6 text-ink-300">
            {['Ohne Konto starten', 'Dein Plan, dein Tempo'].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-citrus-400" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-[190px] overflow-hidden rounded-b-[28px] sm:min-h-[260px] lg:min-h-full lg:rounded-b-none lg:rounded-r-[36px]">
          <Image
            src="/images/hero-bali.png"
            alt="Palmen und Reisterrassen auf Bali im warmen Licht des Sonnenuntergangs"
            fill
            priority
            sizes="(min-width: 1536px) 616px, (min-width: 1024px) 42vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
          <p className="absolute bottom-5 left-5 flex items-center gap-2 text-sm font-medium text-white sm:bottom-7 sm:left-7">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Bali, Indonesien
          </p>
        </div>
      </div>
    </section>
  )
}
