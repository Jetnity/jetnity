'use client'

// components/trips/Aenderungsfortschritt.tsx
//
// Was jemand sieht, während eine Änderung entsteht.
//
// Dieselben Regeln wie beim Reisevorschlag: zeitgesteuerte Sätze, keine
// Prozente, keine Providerdaten.

import { AENDERUNGSPHASEN, aenderungsphasenindex } from '@/lib/reiseaenderung/fortschritt'
import { cn } from '@/lib/utils'

type AenderungsfortschrittProps = {
  laufzeitMs: number
}

export default function Aenderungsfortschritt({ laufzeitMs }: AenderungsfortschrittProps) {
  const aktuell = aenderungsphasenindex(laufzeitMs)

  return (
    <div
      className="rounded-2xl border border-line-200 bg-surface-25 px-4 py-4 sm:px-5"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
        Jetnity arbeitet an deiner Änderung
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-brand-900">
        {AENDERUNGSPHASEN[aktuell].text}
      </p>
      <ol className="mt-4 grid gap-2">
        {AENDERUNGSPHASEN.map((phase, stelle) => {
          const zustand = stelle < aktuell ? 'erledigt' : stelle === aktuell ? 'jetzt' : 'offen'
          return (
            <li key={phase.abMs} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  zustand === 'jetzt' && 'bg-citrus-400',
                  zustand === 'erledigt' && 'bg-brand-600',
                  zustand === 'offen' && 'bg-line-300',
                )}
              />
              <span
                className={cn(
                  'text-sm leading-6',
                  zustand === 'jetzt' && 'font-medium text-brand-900',
                  zustand === 'erledigt' && 'text-ink-800',
                  zustand === 'offen' && 'text-ink-700',
                )}
              >
                {phase.text.replace(/ …$/, '')}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
