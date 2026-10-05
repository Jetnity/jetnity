'use client'

// components/trips/Planungsfortschritt.tsx
//
// Was jemand sieht, während ein Vorschlag entsteht.
//
// Die Sätze kommen aus `lib/reisevorschlag/fortschritt.ts` und wechseln nach
// verstrichener Zeit – nicht nach einem erfundenen Prozentwert und nicht nach
// Providerdaten, die es in dieser Phase nicht gibt.

import { PLANUNGSPHASEN, phasenindex } from '@/lib/reisevorschlag/fortschritt'
import { cn } from '@/lib/utils'

type PlanungsfortschrittProps = {
  laufzeitMs: number
}

export default function Planungsfortschritt({ laufzeitMs }: PlanungsfortschrittProps) {
  const aktuell = phasenindex(laufzeitMs)

  return (
    <div
      className="rounded-2xl border border-line-200 bg-surface-25 px-4 py-4 sm:px-5"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
        Jetnity arbeitet an deiner Reise
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-brand-900">
        {PLANUNGSPHASEN[aktuell].text}
      </p>
      <ol className="mt-4 grid gap-2">
        {PLANUNGSPHASEN.map((phase, stelle) => {
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
