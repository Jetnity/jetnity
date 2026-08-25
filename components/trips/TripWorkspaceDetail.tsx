'use client'

import type { RefObject } from 'react'
import { ArrowLeft } from 'lucide-react'

import { ARBEITSBEREICH_BEZEICHNUNG } from '@/lib/trips/arbeitsbereich'
import { ART_BEZEICHNUNG, betragLesbar } from '@/lib/trips/bezeichnungen'
import {
  DETAIL_LAGE_TEXT,
  DETAIL_SUCHE_BEZEICHNUNG,
  type GapDetailAbleitung,
  type ItemDetailAbleitung,
  type WorkspaceDetailAuswahl,
} from '@/lib/trips/detail'
import { cn } from '@/lib/utils'

export default function TripWorkspaceDetail({
  auswahl,
  gap,
  item,
  kompakt,
  onSchliessen,
  onSuche,
  fokusRef,
}: {
  auswahl: WorkspaceDetailAuswahl
  gap: GapDetailAbleitung | null
  item: ItemDetailAbleitung | null
  kompakt: boolean
  onSchliessen: () => void
  onSuche: () => void
  fokusRef: RefObject<HTMLButtonElement | null>
}) {
  const offen = auswahl.art !== 'keine'
  const sucheOffen = offen && auswahl.sucheOffen
  const sucheAnbietbar = gap?.sucheAnbietbar || item?.sucheAnbietbar
  const sucheDomain = gap?.domain ?? item?.domain
  const titel =
    auswahl.art === 'item'
      ? (item?.title ?? 'Punkt')
      : gap
        ? ARBEITSBEREICH_BEZEICHNUNG[gap.domain]
        : 'Detail'

  return (
    <section
      aria-label="Reisedetail"
      data-workspace-detail={auswahl.art}
      data-detail-domain={gap?.domain ?? item?.domain ?? undefined}
      data-detail-item={item?.itemId}
      data-detail-suche={sucheOffen ? 'ein' : 'aus'}
      data-gap-lage={gap?.lage}
      data-gap-pflicht={gap ? (gap.istPflichtLuecke ? 'ja' : 'nein') : undefined}
      data-item-kind={item?.kind}
      data-item-ungeplant={item ? (item.ungeplant ? 'ja' : 'nein') : undefined}
      className={cn(
        'min-w-0 rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_18px_60px_rgba(15,46,42,0.06)]',
        kompakt ? 'mt-4' : 'mt-5',
      )}
    >
      <button
        ref={fokusRef}
        type="button"
        onClick={onSchliessen}
        className="inline-flex min-h-11 scroll-mt-32 items-center gap-2 rounded-full px-2 text-sm font-semibold text-brand-800 transition hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Zurück zur Reise
      </button>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
        {auswahl.art === 'item' ? 'Punkt' : 'Lücke'}
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 break-words hyphens-auto">
        {titel}
      </h2>

      {gap && (
        <div className="mt-3 grid min-w-0 gap-2">
          <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{gap.text}</p>
          <p className="text-xs leading-5 text-ink-700">
            Lage: {DETAIL_LAGE_TEXT[gap.lage]}
            {gap.istPflichtLuecke ? '' : ' · keine Pflichtlücke'}
            {gap.coveredByFlight ? ' · über Flug abgedeckt' : ''}
          </p>
          <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{gap.naechsterSchritt}</p>
        </div>
      )}

      {item && (
        <div className="mt-3 grid min-w-0 gap-2">
          <p className="text-xs leading-5 text-ink-700">{ART_BEZEICHNUNG[item.kind]}</p>
          {item.ungeplant ? (
            <p className="text-sm leading-6 text-ink-800">Noch nicht eingeplant. Es wird kein Tag oder keine Etappe erfunden.</p>
          ) : null}
          {item.startsAt ? <p className="text-sm text-ink-800">{item.startsAt}</p> : null}
          {item.note ? (
            <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{item.note}</p>
          ) : null}
          {item.kind !== 'note' ? (
            <p className="text-xs leading-5 text-ink-700">{item.bookingStatusText}</p>
          ) : null}
          {item.priceAmount !== null && item.priceCurrency ? (
            <p className="text-sm font-semibold text-brand-700">
              {betragLesbar(item.priceAmount, item.priceCurrency)}
              {item.kind === 'flight' ? ' · zum Auswahlzeitpunkt' : ''}
            </p>
          ) : null}
          <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{item.trustText}</p>
        </div>
      )}

      {sucheAnbietbar && sucheDomain && !sucheOffen ? (
        <button
          type="button"
          onClick={onSuche}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {DETAIL_SUCHE_BEZEICHNUNG[sucheDomain]}
        </button>
      ) : null}

    </section>
  )
}
