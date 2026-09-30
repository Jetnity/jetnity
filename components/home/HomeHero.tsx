import Image from 'next/image'

import StartzielForm from '@/components/places/StartzielForm'
import { FINAL_HOMEPAGE_DEFINITION, FINAL_HOMEPAGE_H1 } from '@/lib/seo/final-homepage'

export function HomeHero() {
  return (
    <section className="px-3 pt-3 sm:px-5" aria-labelledby="start-titel">
      <div className="mx-auto grid max-w-[1450px] items-stretch rounded-[28px] bg-brand-800 text-white shadow-[0_24px_70px_rgba(15,46,42,0.16)] lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:rounded-[36px]">
        <div className="min-w-0 px-5 py-6 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <p className="hyphens-manual text-[min(0.75rem,3.4vw)] font-semibold uppercase tracking-[0.12em] text-citrus-400 sm:text-xs sm:tracking-[0.18em]">
            Eine Reise. Ein Zusammenhang.
          </p>
          <h1
            id="start-titel"
            className="mt-3 max-w-3xl hyphens-manual text-[min(2rem,8.8vw)] font-semibold leading-[1.08] tracking-[-0.04em] text-balance text-white sm:text-5xl sm:tracking-[-0.045em] lg:text-[3.5rem]"
          >
            {FINAL_HOMEPAGE_H1}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-ink-300">{FINAL_HOMEPAGE_DEFINITION}</p>
          <StartzielForm />
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-400">
            Ohne Konto beginnen. Ein Ziel zählt erst, wenn du es aus der Ortsliste bestätigst.
          </p>
        </div>
        <div className="relative hidden min-h-full lg:block">
          <Image
            src="/images/hero-bali.png"
            alt="Reisterrassen und Palmen, Stimmungsbild der Jetnity-Startseite"
            fill
            sizes="(min-width: 1024px) 42vw, 0px"
            className="object-cover lg:rounded-r-[36px]"
          />
        </div>
      </div>
    </section>
  )
}
