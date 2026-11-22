import { ArrowRight, Fingerprint, Route, Scale } from 'lucide-react'

import { HomeWerkzeuge } from './HomeWerkzeuge'
import { MiniKosten, MiniPass, MiniRoute } from './HomeMiniUi'
import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_UNTERSCHIEDE } from '@/lib/seo/final-homepage'

const SYMBOLE = [Route, Fingerprint, Scale]
const ILLUSTRATIONEN = [MiniRoute, MiniPass, MiniKosten]

/** Asymmetrisches Raster: breit/schmal in der ersten Reihe, schmal/breit in der zweiten. */
const KARTEN = [
  { zelle: 'md:col-span-2 lg:col-span-7', flaeche: 'hs-karte', breit: true },
  { zelle: 'lg:col-span-5', flaeche: 'hs-karte hs-karte-dunkel', breit: false },
  { zelle: 'lg:col-span-5', flaeche: 'hs-karte hs-karte-mint', breit: false },
] as const

export function HomeUnterschied() {
  return (
    <section id="warum-jetnity" className="mx-auto max-w-[1450px] scroll-mt-28 px-5 pb-10 sm:px-8 sm:pb-16" aria-labelledby="unterschied-titel">
      <div className="mb-8 max-w-3xl sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Für die Details, die den Unterschied machen</p>
        <h2 id="unterschied-titel" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">{HOMEPAGE_UEBERSCHRIFTEN.unterschied}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        {HOMEPAGE_UNTERSCHIEDE.map((punkt, index) => {
          const Symbol = SYMBOLE[index]!
          const Illustration = ILLUSTRATIONEN[index]!
          const karte = KARTEN[index]!
          const dunkel = index === 1
          return (
            <article
              key={punkt.thema}
              className={`${karte.flaeche} ${karte.zelle} flex flex-col p-5 sm:p-8 ${karte.breit ? 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:items-stretch md:gap-8' : ''} ${dunkel ? 'text-white' : 'text-brand-800'}`}
            >
              {karte.breit ? null : <Illustration />}
              <div className="flex min-w-0 flex-col">
                <Symbol className={`h-7 w-7 ${dunkel ? 'text-citrus-400' : 'text-brand-600'}`} aria-hidden="true" />
                <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.12em] ${dunkel ? 'text-white/80' : 'text-brand-600'}`}>{punkt.thema}</p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-balance sm:text-[1.75rem]">{punkt.titel}</h3>
                <p className={`mb-6 mt-4 max-w-prose text-sm leading-7 ${dunkel ? 'text-white/90' : 'text-ink-800'}`}>{punkt.text}</p>
                <div className={`mt-auto border-t pt-5 ${dunkel ? 'border-white/20' : 'border-line-200'}`}>
                  <p className="text-sm font-semibold leading-6">{punkt.beispiel}</p>
                  <div className="mt-3 flex items-start gap-2">
                    <ArrowRight className={`mt-1 h-4 w-4 shrink-0 ${dunkel ? 'text-citrus-400' : 'text-brand-600'}`} aria-hidden="true" />
                    <p className={`min-w-0 max-w-prose text-sm leading-6 ${dunkel ? 'text-white/90' : 'text-ink-800'}`}>{punkt.ergebnis}</p>
                  </div>
                </div>
              </div>
              {karte.breit ? <Illustration /> : null}
            </article>
          )
        })}
        <HomeWerkzeuge />
      </div>
    </section>
  )
}
