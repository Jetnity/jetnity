'use client'

// components/trips/FlugKarte.tsx
//
// Eine Flugoption: Airline, Route, Zeiten, Dauer, Stopps, Preis, Jetnity-Gründe.

import { Clock3, Plane } from 'lucide-react'

import type { FlugOptionSichtbar } from '@/lib/flights/client-sicht'
import { stoppKurztext } from '@/lib/flights/uebernahme'
import { dauerLesbar } from '@/lib/flights/zeit'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { cn } from '@/lib/utils'

const MARKE: Record<string, string> = {
  jetnity: 'Jetnity empfiehlt',
  cheapest: 'Günstigste',
  fastest: 'Schnellste',
}

function beinRoute(option: FlugOptionSichtbar, index: number) {
  const bein = option.legs[index]
  const start = bein?.segments[0]
  const ende = bein?.segments[bein.segments.length - 1]
  if (!start || !ende) return null
  return { start, ende, bein }
}

export default function FlugKarte({
  option,
  laeuft,
  onUebernehmen,
}: {
  option: FlugOptionSichtbar
  laeuft: boolean
  onUebernehmen: () => void
}) {
  return (
    <article className="rounded-2xl border border-line-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {option.labels.map((marke) => (
          <span
            key={marke}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
              marke === 'jetnity'
                ? 'bg-citrus-400 text-brand-900'
                : 'bg-surface-100 text-brand-800',
            )}
          >
            {MARKE[marke]}
          </span>
        ))}
        <span className="text-xs text-ink-700">{option.airlineName}</span>
      </div>

      <div className="mt-4 grid gap-4">
        {option.legs.map((_, index) => {
          const gelesen = beinRoute(option, index)
          if (!gelesen) return null
          return (
            <div key={`${option.id}-${index}`} className="min-w-0">
              {option.legs.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">
                  {index === 0 ? 'Hinflug' : index === 1 ? 'Rückflug' : `Teil ${index + 1}`}
                </p>
              )}
              <div className="mt-1 flex min-w-0 items-baseline justify-between gap-3">
                <strong className="text-lg font-semibold tracking-[-0.03em] text-brand-800">
                  {gelesen.start.departureTime}
                  <span className="mx-1 text-sm font-medium text-ink-700">
                    {gelesen.start.origin}
                  </span>
                </strong>
                <span className="shrink-0 text-xs text-ink-700">
                  {dauerLesbar(gelesen.bein.durationMinutes)} · {stoppKurztext({ ...option, stops: gelesen.bein.stops })}
                </span>
                <strong className="text-lg font-semibold tracking-[-0.03em] text-brand-800">
                  {gelesen.ende.arrivalTime}
                  <span className="ml-1 text-sm font-medium text-ink-700">{gelesen.ende.destination}</span>
                </strong>
              </div>
              <p className="mt-1 text-xs text-ink-700">
                {gelesen.start.departureDate}
                {gelesen.ende.arrivalDate !== gelesen.start.departureDate
                  ? ` → ${gelesen.ende.arrivalDate}`
                  : ''}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line-100 pt-4">
        <div>
          <p className="text-xs text-ink-700">Preis zum Auswahlzeitpunkt</p>
          <p className="text-lg font-semibold text-brand-800">
            {betragLesbar(option.priceAmount, option.priceCurrency)}
          </p>
        </div>
        <button
          type="button"
          onClick={onUebernehmen}
          disabled={laeuft}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
        >
          <Plane className="h-4 w-4" />
          In die Reise
        </button>
      </div>

      {option.reasons.length > 0 && (
        <ul className="mt-4 grid gap-1.5 rounded-2xl bg-surface-25 px-3 py-3">
          {option.reasons.map((grund) => (
            <li key={grund} className="flex items-start gap-2 text-xs leading-5 text-ink-800">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              {grund}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
