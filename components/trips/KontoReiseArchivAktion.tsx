'use client'

// components/trips/KontoReiseArchivAktion.tsx
//
// AP-4-Aktionen ausserhalb der Reisekarte. Die Karte bleibt ein Link; hier
// liegen keine verschachtelten interaktiven Elemente.

import { useMemo } from 'react'

import { previousStatusAusReise } from '@/lib/account/reise-archiv'
import { useTripArchiveWorkflow, type ArchivSteuerung } from '@/components/trips/useTripArchiveWorkflow'
import { reiseArchivLebenszyklus } from '@/lib/trips/archiv-aktionen'
import { archivHinweis } from '@/lib/trips/trip-archive-workflow'
import type { TripSummary } from '@/types/trips'

export default function KontoReiseArchivAktion({
  reise,
  workflow,
}: {
  reise: TripSummary
  workflow?: ArchivSteuerung
}) {
  const lokalZeilen = useMemo(() => [reise], [reise])
  const lokal = useTripArchiveWorkflow(lokalZeilen, null, reiseArchivLebenszyklus)
  const steuerung = workflow ?? lokal
  const archiviert = reise.status === 'archived'
  const previous = previousStatusAusReise(reise)
  const vorgang = [...steuerung.vorgaenge].reverse().find((eintrag) => eintrag.tripId === reise.id)
  const laufend = vorgang?.write === 'pending'
  const hinweis = vorgang ? archivHinweis(vorgang) : null

  if (archiviert && !previous) {
    return (
      <p className="text-sm leading-6 text-ink-700">
        Diese Reise lässt sich nicht automatisch wiederherstellen, weil der frühere Status nicht belegt ist.
      </p>
    )
  }

  return (
    <div>
      <button
        type="button"
        data-reisen-aktion={archiviert ? 'wiederherstellen' : 'archivieren'}
        disabled={laufend}
        onClick={() => steuerung.ausfuehren(reise, archiviert ? 'wiederherstellen' : 'archivieren')}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-600 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25 disabled:cursor-wait disabled:opacity-60"
      >
        {archiviert ? 'Wiederherstellen' : 'Archivieren'}
      </button>
      {hinweis && vorgang ? (
        <div data-archiv-vorgang={vorgang.operationId} data-archiv-schreiben={vorgang.write} data-archiv-sehen={vorgang.observation}>
          {hinweis.alarm ? (
            <p role="alert" className="mt-2 text-sm leading-6 text-red-700">
              {hinweis.schreiben}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-ink-700">{hinweis.schreiben}</p>
          )}
          <p className="text-sm leading-6 text-ink-700">{hinweis.sehen}</p>
        </div>
      ) : null}
    </div>
  )
}
