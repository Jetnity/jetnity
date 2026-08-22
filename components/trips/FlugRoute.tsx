'use client'

// components/trips/FlugRoute.tsx
//
// Ruhige, progressive Route-Darstellung. Direktflug bleibt bewusst einfach.

import type { RouteAnzeige } from '@/lib/route/anzeige'
import type { RouteFacts, RouteSegment } from '@/lib/route/domain'
import { punktLesbar, routeAnzeigeAusFacts } from '@/lib/route/anzeige'
import { dauerLesbar } from '@/lib/flights/zeit'
import { cn } from '@/lib/utils'

export default function FlugRoute({
  facts,
  anzeige,
  klasse,
}: {
  facts?: RouteFacts | null
  anzeige?: RouteAnzeige | null
  klasse?: string
}) {
  const sichtbar = anzeige ?? (facts ? routeAnzeigeAusFacts(facts) : null)
  if (!sichtbar) return null
  const umstiege = facts?.connections ?? []
  const segmente = facts?.segments ?? []

  return (
    <div className={cn('min-w-0', klasse)}>
      <p className="text-base font-semibold tracking-[-0.02em] text-brand-800 break-words">
        <span className="sr-only">Route </span>
        {sichtbar.kompakt}
      </p>
      {sichtbar.sekundaer ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">{sichtbar.sekundaer}</p>
      ) : null}
      {sichtbar.flughafenwechsel ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">Flughafenwechsel erforderlich</p>
      ) : null}
      {!sichtbar.direkt && segmente.length > 0 ? (
        <details className="mt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15">
            Verbindung im Detail
          </summary>
          <ol className="mt-2 grid gap-2" aria-label="Flugsegmente">
            {segmente.map((segment, index) => (
              <li key={`${segment.origin.airportCode}-${segment.destination.airportCode}-${index}`}>
                <p className="text-sm font-medium text-brand-800">
                  Segment {index + 1}: {punktLesbar(segment.origin)} → {punktLesbar(segment.destination)}
                </p>
                <p className="text-xs leading-5 text-ink-800">{segmentZeit(segment)}</p>
                {umstiege[index] ? (
                  <p className="mt-1 text-xs leading-5 text-ink-800">
                    Umstieg
                    {umstiege[index]?.city || umstiege[index]?.airportCode
                      ? ` in ${umstiege[index]?.city || umstiege[index]?.airportCode}`
                      : ''}
                    {umstiege[index]?.durationMinutes !== null
                      ? ` · ${dauerLesbar(umstiege[index]!.durationMinutes!)}`
                      : ''}
                    {umstiege[index]?.airportChange ? ' · Flughafenwechsel' : ''}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  )
}

function segmentZeit(segment: RouteSegment): string {
  const start = [segment.departureDate, segment.departureTime].filter(Boolean).join(' ')
  const ende = [segment.arrivalDate, segment.arrivalTime].filter(Boolean).join(' ')
  if (start && ende) return `${start} → ${ende}`
  return start || ende || 'Zeiten unbekannt'
}
