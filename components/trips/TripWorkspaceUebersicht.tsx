'use client'

import type { ComponentType, ReactNode, RefObject } from 'react'
import { ArrowRightLeft, BedDouble, Plane, Sparkles } from 'lucide-react'

import {
  ARBEITSBEREICH_BEZEICHNUNG,
  type Arbeitsbereich,
  type BereichStatus,
} from '@/lib/trips/arbeitsbereich'
import { INTERESSE_BEZEICHNUNG, TEMPO_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

const SYMBOL: Record<BereichStatus['bereich'], ComponentType<{ className?: string }>> = {
  fluege: Plane,
  unterkunft: BedDouble,
  aktivitaeten: Sparkles,
  mobilitaet: ArrowRightLeft,
}

export default function TripWorkspaceUebersicht({
  reise,
  status,
  aenderungOffen,
  onBereich,
  onAenderung,
  aenderungKnopfRef,
  plan,
  aenderungFeld,
  vorbereitung,
}: {
  reise: Trip
  status: readonly BereichStatus[]
  aenderungOffen: boolean
  onBereich: (bereich: Arbeitsbereich) => void
  onAenderung: () => void
  aenderungKnopfRef: RefObject<HTMLButtonElement | null>
  plan?: ReactNode
  aenderungFeld?: ReactNode
  vorbereitung?: ReactNode
}) {
  return (
    <section aria-label="Reiseübersicht" className="mt-5 grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Übersicht</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800">
          Deine Reise auf einen Blick
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-800">
          Was schon festliegt, und wo du als Nächstes weitermachst.
        </p>
      </div>

      <ul className="grid gap-2">
        {status.map((eintrag) => {
          const Symbol = SYMBOL[eintrag.bereich]
          const offen = eintrag.anzahl === 0
          return (
            <li key={eintrag.bereich}>
              <button
                type="button"
                onClick={() => onBereich(eintrag.bereich)}
                className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-line-200 bg-white px-3 py-3 text-left transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    offen ? 'bg-surface-25 text-ink-800' : 'bg-surface-100 text-brand-700',
                  )}
                >
                  <Symbol className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-semibold text-brand-800">
                    {ARBEITSBEREICH_BEZEICHNUNG[eintrag.bereich]}
                  </strong>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-800">{eintrag.text}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {plan}

      {vorbereitung}

      <div className="flex flex-col gap-3 rounded-2xl border border-line-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm leading-6 text-ink-800">
          Zeitraum, Etappen oder Tempo in eigenen Worten anpassen.
        </p>
        <button
          ref={aenderungKnopfRef}
          type="button"
          aria-expanded={aenderungOffen}
          aria-controls="reise-aenderung"
          onClick={onAenderung}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {aenderungOffen ? 'Änderung schliessen' : 'Reise ändern'}
        </button>
      </div>

      {aenderungFeld}

      <section className="rounded-2xl border border-line-200 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Reiseprofil</p>
        <p className="mt-2 text-sm leading-6 text-ink-800">
          {TEMPO_BEZEICHNUNG[reise.pace].titel}
          {reise.interests.length
            ? ` · ${reise.interests.map((wert) => INTERESSE_BEZEICHNUNG[wert]).join(', ')}`
            : ''}
        </p>
        {reise.travelWish && (
          <p className="mt-2 text-xs leading-5 text-ink-800">„{reise.travelWish}“</p>
        )}
      </section>
    </section>
  )
}
