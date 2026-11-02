'use client'

import { useState } from 'react'
import { ArrowRight, Check, Clock3, Compass, Plane, Route } from 'lucide-react'

import type { HOMEPAGE_PRODUKTFENSTER } from '@/lib/seo/final-homepage'

const SYMBOLE = [Plane, Route, Compass]

/** Isolated, illustrative presentation. Never reads or writes a real trip. */
export function HomeReiseBeispiel({ beispiel }: { beispiel: typeof HOMEPAGE_PRODUKTFENSTER }) {
  const [schritt, setSchritt] = useState(0)
  const stand = beispiel.schritte[schritt]!
  return (
    <article id="reisebeispiel" className="scroll-mt-28 rounded-[28px] border border-line-200 bg-white shadow-sm sm:rounded-[32px]" aria-label={`${beispiel.kennzeichnung}: ${beispiel.titel}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[27px] bg-brand-800 px-5 py-4 text-white sm:rounded-t-[31px] sm:px-7">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold"><Route className="h-5 w-5 shrink-0 text-citrus-400" aria-hidden="true" /><span className="min-w-0">Deine Reise im Zusammenhang</span></span>
        <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium">{beispiel.kennzeichnung}</span>
      </div>
      <div className="p-5 sm:p-7">
        <h3 className="text-xl font-semibold tracking-[-0.035em] sm:text-2xl">{beispiel.titel}</h3>
        <p className="mt-1 text-sm text-ink-800">{beispiel.meta}</p>
        <div role="group" aria-label="Reisebeispiel durchspielen" className="mt-6 grid gap-2 sm:grid-cols-3">
          {beispiel.schritte.map((punkt, index) => (
            <button
              key={punkt.name}
              type="button"
              aria-pressed={schritt === index}
              aria-controls="reisebeispiel-inhalt"
              onClick={() => setSchritt(index)}
              className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-semibold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 ${schritt === index ? 'bg-brand-800 text-white' : 'bg-surface-100 text-brand-800 hover:bg-surface-200'}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${schritt === index ? 'bg-citrus-400 text-brand-800' : 'bg-white text-brand-600'}`}>{index + 1}</span>
              <span className="min-w-0">{punkt.name}</span>
            </button>
          ))}
        </div>
        <div id="reisebeispiel-inhalt" className="mt-6" aria-live="polite" aria-atomic="true">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
            {schritt === 2 ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />}
            <span className="min-w-0">{stand.status}</span>
          </div>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.025em]">{stand.titel}</h4>
          <p className="mt-2 text-sm leading-6 text-ink-800">{stand.text}</p>
          <ol className="mt-5 divide-y divide-line-200">
            {stand.punkte.map((punkt, index) => {
              const Symbol = SYMBOLE[index]!
              return (
                <li key={index} className="flex items-start gap-3 py-4">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-brand-600"><Symbol className="h-4 w-4" aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-800">{punkt.zeit}</p>
                    <p className="mt-1 text-sm font-semibold">{punkt.titel}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-800">{punkt.text}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 rounded-2xl bg-surface-100 p-4 text-sm font-medium leading-6">{stand.naechsterSchritt}</p>
        </div>
        <button type="button" onClick={() => setSchritt((wert) => (wert + 1) % beispiel.schritte.length)} className="mt-5 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">
          <span className="min-w-0">{schritt === 0 ? 'Flugänderung ansehen' : schritt === 1 ? 'Angepassten Plan ansehen' : 'Beispiel erneut ansehen'}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
