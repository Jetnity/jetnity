import { ArrowDown, Plane } from 'lucide-react'
import Link from 'next/link'

import { HomeReiseBeispiel } from './HomeReiseBeispiel'
import { HOMEPAGE_PRODUKTFENSTER, HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

export function HomeProduktfenster() {
  return (
    <section id="reisebegleitung" className="mx-auto max-w-[1450px] scroll-mt-28 px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="produktfenster-titel">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
        <div className="min-w-0 lg:pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Ein Begleiter, der vorausdenkt</p>
          <h2 id="produktfenster-titel" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
            {HOMEPAGE_UEBERSCHRIFTEN.produktfenster}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-800">
            Jetnity erkennt Flugänderungen und Ausfälle, prüft die Folgen für deine weiteren Reiseabschnitte und passt deinen Reiseplan automatisch an.
          </p>
          <p className="mt-3 max-w-xl text-base leading-7 text-ink-800">
            Du erfährst, was betroffen ist, welche Alternative zu dir passt und was als Nächstes wichtig ist.
          </p>
          <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-brand-600">
            <Plane className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Eine Änderung. Die ganze Reise im Blick.</span>
          </div>
          <Link href="#reisebeispiel" className="mt-4 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg text-sm font-semibold underline decoration-brand-800/30 underline-offset-4 [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25">
            <span className="min-w-0">Spiele das Beispiel durch</span>
            <ArrowDown className="h-4 w-4 shrink-0 lg:-rotate-90" aria-hidden="true" />
          </Link>
        </div>
        <div className="min-w-0">
          <HomeReiseBeispiel beispiel={HOMEPAGE_PRODUKTFENSTER} />
          <p className="mt-4 px-1 text-sm leading-6 text-ink-800">
            Dein Plan bleibt aktuell. Neue Buchungen, kostenpflichtige Umbuchungen und Stornierungen bestätigst du selbst.
          </p>
        </div>
      </div>
    </section>
  )
}
