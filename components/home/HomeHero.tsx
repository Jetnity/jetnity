import Image from 'next/image'
import { Check, MapPin } from 'lucide-react'

import StartzielForm from '@/components/places/StartzielForm'
import { FINAL_HOMEPAGE_DEFINITION, FINAL_HOMEPAGE_H1 } from '@/lib/seo/final-homepage'
import { BILDNACHWEISE_ID, STARTSEITENBILD } from '@/lib/seo/startseitenbild'

const ZUSAGEN = ['Flug, Unterkunft und Tage in einem Plan', 'Einreise für jede reisende Person im Blick', 'Buchungen bestätigst du selbst']

export function HomeHero() {
  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-5" aria-labelledby="start-titel">
      <div className="hs-hero mx-auto max-w-[1450px]">
        <div className="hs-hero-bild">
          <Image
            src={STARTSEITENBILD.pfad}
            alt={STARTSEITENBILD.alt}
            fill
            priority
            sizes="(min-width: 1536px) 1450px, 100vw"
            className="object-cover object-[60%_50%] lg:object-center"
          />
        </div>
        <div className="hs-hero-verlauf" aria-hidden="true" />
        <div className="min-w-0 px-5 pb-[8.5rem] pt-8 sm:px-10 sm:pb-[8.5rem] sm:pt-14 lg:min-h-[640px] lg:px-16 lg:pb-24 lg:pt-20">
          <div className="max-w-[52rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-citrus-400">
              Eine Reise. Ein Zusammenhang.
            </p>
            <h1
              id="start-titel"
              className="mt-4 hyphens-manual text-[min(2.125rem,9.2vw)] font-semibold leading-[1.06] tracking-[-0.045em] text-balance text-white [overflow-wrap:normal] sm:text-5xl lg:text-[3.75rem]"
            >
              {FINAL_HOMEPAGE_H1}
            </h1>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-6 text-white/90 sm:mt-5 sm:text-base sm:leading-7">{FINAL_HOMEPAGE_DEFINITION}</p>
            <div className="hs-suchkarte">
              <StartzielForm />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/90 sm:mt-4">Ohne Konto starten. Du siehst deinen Entwurf, bevor etwas gespeichert wird.</p>
            <ul className="hs-chips">
              {ZUSAGEN.map((text) => (
                <li key={text} className="hs-chip">
                  <span className="hs-chip-haken">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="hs-ort">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">{STARTSEITENBILD.ort}</span>
            <a href={`#${BILDNACHWEISE_ID}`}>Bildnachweis</a>
          </p>
        </div>
      </div>
    </section>
  )
}
