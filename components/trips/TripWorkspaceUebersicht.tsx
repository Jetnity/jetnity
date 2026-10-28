'use client'

import type { ComponentType, RefObject } from 'react'
import { ArrowRightLeft, BedDouble, ChevronRight, Compass, PenLine, Plane, Sparkles } from 'lucide-react'

import { useKopfDichte } from '@/lib/trips/ux-u1a3-header-density-1-client'
import { ARBEITSBEREICH_BEZEICHNUNG } from '@/lib/trips/arbeitsbereich'
import type { DetailDomain } from '@/lib/trips/detail'
import { INTERESSE_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { AttentionAbleitung, AttentionAktion } from '@/lib/trips/attention'
import {
  workspacePraeferenzHatInhalt,
  workspacePraeferenzSicht,
} from '@/lib/trips/workspace-praeferenzen'
import type { DestinationEssentialsAbleitung } from '@/lib/trips/destination-essentials'
import type { UebersichtAbleitung } from '@/lib/trips/uebersicht'
import { cn } from '@/lib/utils'
import type { Trip, TripItem } from '@/types/trips'
import TripAuditV1Panel from '@/components/trips/TripAuditV1Panel'
import TripWorkspaceDestinationEssentials from '@/components/trips/TripWorkspaceDestinationEssentials'
import TripWorkspaceJetztWichtig from '@/components/trips/TripWorkspaceJetztWichtig'

const SYMBOL: Record<UebersichtAbleitung['abdeckungen'][number]['bereich'], ComponentType<{ className?: string }>> = {
  fluege: Plane,
  unterkunft: BedDouble,
  aktivitaeten: Sparkles,
  mobilitaet: ArrowRightLeft,
}

export function TripWorkspaceAktionen({
  aenderungOffen,
  begleiterOffen,
  begleiterVorhanden,
  onAenderung,
  onBegleiter,
  aenderungKnopfRef,
  begleiterKnopfRef,
}: {
  aenderungOffen: boolean
  begleiterOffen: boolean
  /** Ohne Assistant-Fläche gibt es auch keinen Knopf dafür. */
  begleiterVorhanden: boolean
  onAenderung: () => void
  onBegleiter: () => void
  aenderungKnopfRef: RefObject<HTMLButtonElement | null>
  begleiterKnopfRef: RefObject<HTMLButtonElement | null>
}) {
  const dichte = useKopfDichte()

  return (
    <div
      data-workspace-aktionen
      data-u1a3-bereit={dichte.bereit ? '1' : '0'}
      data-u1a3-dichte={dichte.zeile ? 'zeile' : 'gestapelt'}
      className={cn('mt-2 min-w-0 max-w-full lg:flex lg:items-center lg:gap-3', dichte.gross && 'lg:block')}
    >
      <div className={cn('grid min-w-0 gap-2', begleiterVorhanden && 'sm:grid-cols-2', !dichte.gross && 'lg:shrink-0')}>
        <button
          ref={aenderungKnopfRef}
          type="button"
          aria-expanded={aenderungOffen}
          aria-controls="reise-aenderung"
          onClick={onAenderung}
          className={cn(
            'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
            dichte.gross ? 'w-full' : 'w-full lg:w-auto',
          )}
        >
          <PenLine className="h-4 w-4 shrink-0" aria-hidden="true" />
          {aenderungOffen ? 'Änderung schliessen' : 'Reise ändern'}
        </button>
        {begleiterVorhanden ? (
          <button
            ref={begleiterKnopfRef}
            type="button"
            aria-expanded={begleiterOffen}
            aria-controls="reisebegleiter"
            onClick={onBegleiter}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-800 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
              dichte.gross ? 'w-full' : 'w-full lg:w-auto',
            )}
          >
            <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
            {begleiterOffen ? 'Reisebegleiter schliessen' : 'Reisebegleiter fragen'}
          </button>
        ) : null}
      </div>
      <p className={cn('text-xs leading-4 text-ink-700', dichte.gross ? 'mt-1' : 'mt-1 lg:mt-0 lg:min-w-0 lg:flex-1')}>
        Grunddaten, Zeitraum und Etappen direkt oder in eigenen Worten anpassen.
        {begleiterVorhanden
          ? ' Eine Frage zu dieser Reise stellen. Der Reisebegleiter antwortet als Vorschlag und ändert nichts.'
          : null}
      </p>
    </div>
  )
}

export default function TripWorkspaceUebersicht({
  reise,
  ungeplantePunkte,
  uebersicht,
  attention,
  destinationEssentials,
  onLuecke,
  onAttention,
}: {
  reise: Trip
  ungeplantePunkte?: readonly TripItem[]
  uebersicht: UebersichtAbleitung
  attention: AttentionAbleitung
  destinationEssentials: DestinationEssentialsAbleitung
  onLuecke: (domain: DetailDomain) => void
  onAttention: (aktion: AttentionAktion) => void
}) {
  const praeferenzen = workspacePraeferenzSicht(reise)

  return (
    <section aria-label="Reiseübersicht" className="mt-2 grid min-w-0 max-w-full gap-2">
      <header className="min-w-0 max-w-full">
        <h2
          id="workspace-uebersicht-titel"
          tabIndex={-1}
          data-workspace-modus-heading
          className="break-words text-xl font-semibold tracking-[-0.03em] text-brand-800 outline-none [overflow-wrap:anywhere]"
        >
          Deine Reise auf einen Blick
        </h2>
        <p className="mt-1 max-w-2xl break-words text-sm leading-5 text-ink-800">
          {uebersicht.fortschrittText}
          <span className="text-ink-600"> · </span>
          {uebersicht.planText}
        </p>
      </header>

      <TripWorkspaceJetztWichtig attention={attention} onAktion={onAttention} />

      <TripAuditV1Panel key={reise.id} reise={reise} ungeplantePunkte={ungeplantePunkte} />

      <TripWorkspaceDestinationEssentials essentials={destinationEssentials} />

      <section aria-label="Bereiche dieser Reise" data-workspace-trip-parts className="min-w-0 overflow-hidden rounded-[24px] border border-line-200 bg-white">
        <p className="border-b border-line-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
          Bereiche dieser Reise
        </p>
        <ul className="grid gap-px bg-line-100 sm:grid-cols-2">
          {uebersicht.abdeckungen.map((eintrag) => {
            const Symbol = SYMBOL[eintrag.bereich]
            return (
              <li key={eintrag.bereich} className="min-w-0 bg-white">
                <button
                  type="button"
                  aria-label={ARBEITSBEREICH_BEZEICHNUNG[eintrag.bereich]}
                  onClick={() => onLuecke(eintrag.bereich)}
                  className="flex min-h-11 w-full items-center gap-3 bg-white px-3 py-3 text-left hover:bg-surface-50 focus:outline-none focus:ring-4 focus:ring-brand-600/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-50 text-brand-800">
                    <Symbol className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold text-brand-800">
                      {ARBEITSBEREICH_BEZEICHNUNG[eintrag.bereich]}
                    </strong>
                    <span className="mt-0.5 block text-xs leading-5 text-ink-800">{eintrag.text}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {workspacePraeferenzHatInhalt(praeferenzen) ? (
        <div className="grid gap-3">
          {praeferenzen.reisewunsch ? (
            <section className="rounded-2xl border border-line-100 bg-surface-0 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600">
                Reisewunsch
              </p>
              <p className="mt-1.5 text-xs leading-5 text-ink-700">„{praeferenzen.reisewunsch}“</p>
            </section>
          ) : null}
          {praeferenzen.interessen.length > 0 ? (
            <section className="rounded-2xl border border-line-100 bg-surface-0 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600">
                Interessen
              </p>
              <p className="mt-1.5 text-xs leading-5 text-ink-700">
                {praeferenzen.interessen.map((wert) => INTERESSE_BEZEICHNUNG[wert]).join(', ')}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
