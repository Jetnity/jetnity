import { ArrowRight, Fingerprint, Route, Scale } from 'lucide-react'

import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_UNTERSCHIEDE } from '@/lib/seo/final-homepage'

const SYMBOLE = [Route, Fingerprint, Scale]

export function HomeUnterschied() {
  return (
    <section id="warum-jetnity" className="mx-auto max-w-[1450px] scroll-mt-28 px-5 pb-10 sm:px-8 sm:pb-16" aria-labelledby="unterschied-titel">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Für die Details, die den Unterschied machen</p>
        <h2 id="unterschied-titel" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">{HOMEPAGE_UEBERSCHRIFTEN.unterschied}</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {HOMEPAGE_UNTERSCHIEDE.map((punkt, index) => {
          const Symbol = SYMBOLE[index]!
          return (
            <article key={punkt.thema} className={`flex min-w-0 flex-col rounded-[28px] p-6 sm:p-8 ${index === 1 ? 'bg-brand-800 text-white' : 'border border-line-200 bg-white text-brand-800'}`}>
              <Symbol className={`h-7 w-7 ${index === 1 ? 'text-citrus-400' : 'text-brand-600'}`} aria-hidden="true" />
              <p className={`mt-6 text-xs font-semibold uppercase tracking-[0.12em] ${index === 1 ? 'text-ink-300' : 'text-brand-600'}`}>{punkt.thema}</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-balance">{punkt.titel}</h3>
              <p className={`mb-7 mt-4 text-sm leading-7 ${index === 1 ? 'text-ink-300' : 'text-ink-800'}`}>{punkt.text}</p>
              <div className={`mt-auto border-t pt-5 ${index === 1 ? 'border-white/20' : 'border-line-200'}`}>
                <p className="text-sm font-semibold leading-6">{punkt.beispiel}</p>
                <div className="mt-3 flex items-start gap-2">
                  <ArrowRight className={`mt-1 h-4 w-4 shrink-0 ${index === 1 ? 'text-citrus-400' : 'text-brand-600'}`} aria-hidden="true" />
                  <p className={`min-w-0 text-sm leading-6 ${index === 1 ? 'text-ink-300' : 'text-ink-800'}`}>{punkt.ergebnis}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
