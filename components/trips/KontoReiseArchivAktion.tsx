'use client'

// components/trips/KontoReiseArchivAktion.tsx
//
// AP-4-Aktionen ausserhalb der Reisekarte. Die Karte bleibt ein Link; hier
// liegen keine verschachtelten interaktiven Elemente.

import { useMemo, useRef } from 'react'
import { Ellipsis } from 'lucide-react'

import { previousStatusAusReise } from '@/lib/account/reise-archiv'
import { useTripArchiveWorkflow, type ArchivSteuerung } from '@/components/trips/useTripArchiveWorkflow'
import { reiseArchivLebenszyklus } from '@/lib/trips/archiv-aktionen'
import { archivHinweis, type ArchivVorgang } from '@/lib/trips/trip-archive-workflow'
import type { TripSummary } from '@/types/trips'

function VorgangRueckmeldung({ vorgang }: { vorgang: ArchivVorgang }) {
  const hinweis = archivHinweis(vorgang)
  return (
    <div
      data-archiv-vorgang={vorgang.operationId}
      data-archiv-schreiben={vorgang.write}
      data-archiv-sehen={vorgang.observation}
      data-archiv-liste={vorgang.listenlieferung}
    >
      {hinweis.alarm ? (
        <p role="alert" className="mt-2 text-sm leading-6 text-red-700">
          {hinweis.schreiben}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-ink-700">{hinweis.schreiben}</p>
      )}
      <p className="text-sm leading-6 text-ink-700">{hinweis.sehen}</p>
    </div>
  )
}

export default function KontoReiseArchivAktion({
  reise,
  workflow,
}: {
  reise: TripSummary
  workflow?: ArchivSteuerung
}) {
  const menue = useRef<HTMLDetailsElement>(null)
  const lokalZeilen = useMemo(() => [reise], [reise])
  const lokal = useTripArchiveWorkflow(lokalZeilen, null, reiseArchivLebenszyklus)
  const steuerung = workflow ?? lokal
  const archiviert = reise.status === 'archived'
  const previous = previousStatusAusReise(reise)
  const vorgang = [...steuerung.vorgaenge].reverse().find((eintrag) => eintrag.tripId === reise.id)
  const laufend = vorgang?.write === 'pending'
  const rueckmeldung = vorgang ? <VorgangRueckmeldung vorgang={vorgang} /> : null

  if (archiviert && !previous) {
    return (
      <div>
        <p className="text-sm leading-6 text-ink-700">
          Diese Reise lässt sich nicht automatisch wiederherstellen, weil der frühere Status nicht belegt ist.
        </p>
        {rueckmeldung}
      </div>
    )
  }

  return (
    <div>
      <details
        ref={menue}
        name="reiseoptionen"
        className="absolute right-2 top-2 z-10 text-right"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.removeAttribute('open')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.currentTarget.removeAttribute('open')
            e.currentTarget.querySelector('summary')?.focus()
          }
        }}
      >
        <summary aria-label={`Optionen für ${reise.title}`} className="ml-auto grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-white/70 bg-white/95 text-brand-800 shadow-sm [&::-webkit-details-marker]:hidden"><Ellipsis className="h-5 w-5" aria-hidden="true" /></summary>
        <button
          type="button"
          data-reisen-aktion={archiviert ? 'wiederherstellen' : 'archivieren'}
          disabled={laufend}
          onClick={() => {
            menue.current?.removeAttribute('open')
            menue.current?.querySelector('summary')?.focus()
            steuerung.ausfuehren(reise, archiviert ? 'wiederherstellen' : 'archivieren')
          }}
          className="inline-flex mt-1 min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-600 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25 disabled:cursor-wait disabled:opacity-60"
        >
          {archiviert ? 'Wiederherstellen' : 'Archivieren'}
        </button>
      </details>
      {rueckmeldung ? <div className="px-4 pb-4">{rueckmeldung}</div> : null}
    </div>
  )
}
