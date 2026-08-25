'use client'

import type { ComponentType, ReactNode, RefObject } from 'react'
import { ArrowRightLeft, BedDouble, Plane, Sparkles } from 'lucide-react'

import {
  ARBEITSBEREICH_BEZEICHNUNG,
  type Arbeitsbereich,
} from '@/lib/trips/arbeitsbereich'
import { INTERESSE_BEZEICHNUNG, TEMPO_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { AbdeckungLage, UebersichtAbleitung } from '@/lib/trips/uebersicht'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

const SYMBOL: Record<UebersichtAbleitung['abdeckungen'][number]['bereich'], ComponentType<{ className?: string }>> = {
  fluege: Plane,
  unterkunft: BedDouble,
  aktivitaeten: Sparkles,
  mobilitaet: ArrowRightLeft,
}

const LAGE_FARBE: Record<AbdeckungLage, string> = {
  offen: 'bg-surface-25 text-ink-800',
  teilweise: 'bg-surface-100 text-ink-800',
  belegt: 'bg-surface-100 text-brand-700',
  unbestimmt: 'bg-surface-50 text-ink-800',
}

export default function TripWorkspaceUebersicht({
  reise,
  uebersicht,
  aenderungOffen,
  onBereich,
  onAenderung,
  aenderungKnopfRef,
  plan,
  aenderungFeld,
  vorbereitung,
  sicherheit,
  reisezeit,
}: {
  reise: Trip
  uebersicht: UebersichtAbleitung
  aenderungOffen: boolean
  onBereich: (bereich: Arbeitsbereich) => void
  onAenderung: () => void
  aenderungKnopfRef: RefObject<HTMLButtonElement | null>
  plan?: ReactNode
  aenderungFeld?: ReactNode
  vorbereitung?: ReactNode
  sicherheit?: ReactNode
  reisezeit?: ReactNode
}) {
  return (
    <section aria-label="Reiseübersicht" className="mt-5 grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Übersicht</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800">
          Deine Reise auf einen Blick
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-800">{uebersicht.fortschrittText}</p>
        <p className="mt-1 text-xs leading-5 text-ink-700">{uebersicht.planText}</p>
      </div>

      <ul className="grid gap-2">
        {uebersicht.abdeckungen.map((eintrag) => {
          const Symbol = SYMBOL[eintrag.bereich]
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
                    LAGE_FARBE[eintrag.lage],
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

      {sicherheit}

      {reisezeit}

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

      <section className="rounded-2xl border border-line-100 bg-surface-0 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600">Tempo & Interessen</p>
        <p className="mt-1.5 text-xs leading-5 text-ink-700">
          {TEMPO_BEZEICHNUNG[reise.pace].titel}
          {reise.interests.length
            ? ` · ${reise.interests.map((wert) => INTERESSE_BEZEICHNUNG[wert]).join(', ')}`
            : ''}
        </p>
        {reise.travelWish && (
          <p className="mt-1.5 text-xs leading-5 text-ink-700">„{reise.travelWish}“</p>
        )}
      </section>
    </section>
  )
}
