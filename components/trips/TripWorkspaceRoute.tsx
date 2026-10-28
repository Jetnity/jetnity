'use client'

import {
  KANTE_MEHRDEUTIG,
  KANTE_NICHT_VERFUEGBAR,
  KANTE_UNLESBAR,
  type KanteAufloesung,
  type RouteZeile,
} from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import { cn } from '@/lib/utils'
import type { TripDay } from '@/types/trips'

const fokusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 motion-reduce:transition-none'

const chipDatum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

export function RouteListe({
  zeilen,
  ausgewaehlterTagId,
  aufloesung,
  onLauf,
  onKante,
}: {
  zeilen: readonly RouteZeile[]
  ausgewaehlterTagId: string
  aufloesung: KanteAufloesung
  onLauf: (tagId: string) => void
  onKante?: (kanteId: string, tagId: string) => void
}) {
  return (
    <div data-u1c-route className="mt-3 grid min-w-0 gap-2">
      <div>
        <h2 className="text-base font-semibold text-brand-800">Deine Route</h2>
        <p className="text-xs text-ink-700">Geplanter Ablauf</p>
      </div>
      <ol className="grid min-w-0 gap-2">
        {zeilen.map((zeile) => {
          if (zeile.art === 'kante') {
            const gewaehlt = aufloesung.art === 'eindeutig' && aufloesung.occurrenceKey === zeile.occurrenceKey
            const inhalt = (
              <>
                <span className="block text-sm font-semibold">{zeile.titel}</span>
                <span className={cn('mt-0.5 block text-xs', gewaehlt ? 'text-white/80' : 'text-ink-700')}>
                  {zeile.mehrdeutig ? KANTE_MEHRDEUTIG : 'Benachbarter Abschnitt'}
                </span>
              </>
            )
            return (
              <li key={zeile.occurrenceKey} className="min-w-0 pl-3">
                {zeile.waehlbar && onKante ? (
                  <button
                    type="button"
                    data-u1c-kante={zeile.occurrenceKey}
                    data-u1c-kante-id={zeile.kanteId}
                    aria-pressed={gewaehlt}
                    onClick={() => {
                      const tagId = zeile.tagIds.includes(ausgewaehlterTagId) ? ausgewaehlterTagId : zeile.rueckTagId
                      if (tagId) onKante(zeile.kanteId, tagId)
                    }}
                    className={cn(
                      'flex min-h-11 w-full min-w-0 flex-col justify-center rounded-2xl border px-3 py-2 text-left',
                      fokusRing,
                      gewaehlt ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-200 bg-white text-ink-900',
                    )}
                  >
                    {inhalt}
                  </button>
                ) : (
                  <div
                    data-u1c-kante={zeile.occurrenceKey}
                    data-u1c-kante-id={zeile.kanteId}
                    data-u1c-kante-gesperrt={zeile.mehrdeutig ? 'mehrdeutig' : 'nein'}
                    className="flex min-h-11 w-full min-w-0 flex-col justify-center rounded-2xl border border-line-200 bg-surface-50 px-3 py-2 text-ink-800"
                  >
                    {inhalt}
                  </div>
                )}
              </li>
            )
          }
          const gewaehlt = aufloesung.art !== 'eindeutig' && zeile.tagIds.includes(ausgewaehlterTagId)
          const ersterTag = zeile.tagIds[0] ?? ''
          return (
            <li key={zeile.schluessel} className="min-w-0">
              <button
                type="button"
                data-u1c-lauf={zeile.schluessel}
                data-u1c-tage={zeile.tagIds.join(' ')}
                data-timeline-etappe={zeile.stageId ?? 'ohne'}
                data-plan-lauf={zeile.lesart}
                aria-pressed={gewaehlt}
                disabled={!ersterTag}
                onClick={() => {
                  const ziel = zeile.tagIds.includes(ausgewaehlterTagId) ? ausgewaehlterTagId : ersterTag
                  if (ziel) onLauf(ziel)
                }}
                className={cn(
                  'flex min-h-11 w-full min-w-0 flex-col justify-center rounded-2xl border px-3 py-2 text-left',
                  fokusRing,
                  gewaehlt ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-200 bg-white text-ink-900',
                )}
              >
                <strong data-plan-lauf-name className="block hyphens-auto break-words text-sm font-semibold [overflow-wrap:anywhere]">
                  {zeile.name}
                </strong>
                {zeile.land ? (
                  <span className={cn('mt-0.5 block text-xs', gewaehlt ? 'text-white/80' : 'text-ink-700')}>{zeile.land}</span>
                ) : null}
                {zeile.geplanteTage ? (
                  <span className={cn('mt-0.5 block text-xs [overflow-wrap:anywhere]', gewaehlt ? 'text-white/80' : 'text-ink-700')}>
                    {zeile.geplanteTage}
                  </span>
                ) : null}
                {zeile.gespeicherterZeitraum ? (
                  <span className={cn('mt-0.5 block text-xs [overflow-wrap:anywhere]', gewaehlt ? 'text-white/80' : 'text-ink-700')}>
                    {zeile.gespeicherterZeitraum}
                  </span>
                ) : null}
                {zeile.untertitel ? (
                  <span className={cn('mt-0.5 block text-xs [overflow-wrap:anywhere]', gewaehlt ? 'text-white/80' : 'text-ink-700')}>
                    {zeile.untertitel}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function Tageswahl({
  tage,
  gewaehltId,
  onWaehlen,
}: {
  tage: readonly TripDay[]
  gewaehltId: string
  onWaehlen: (tagId: string) => void
}) {
  if (tage.length === 0) return null
  return (
    <div data-u1c-tage className="mt-3 flex min-w-0 flex-wrap gap-2" aria-label="Tag in diesem Aufenthalt">
      {tage.map((eintrag) => {
        const gewaehlt = eintrag.id === gewaehltId
        const titel = eintrag.title ?? `Tag ${eintrag.dayIndex}`
        const datum = eintrag.dayDate ? chipDatum.format(alsDatum(eintrag.dayDate)) : 'ohne Datum'
        return (
          <button
            key={eintrag.id}
            type="button"
            aria-current={gewaehlt ? 'date' : undefined}
            aria-label={`${titel}, ${datum}`}
            data-timeline-tag={eintrag.id}
            onClick={() => onWaehlen(eintrag.id)}
            className={cn(
              'inline-flex min-h-11 min-w-11 flex-col justify-center rounded-2xl border px-3 py-2 text-left',
              fokusRing,
              gewaehlt ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-200 bg-white text-ink-900',
            )}
          >
            <strong className="block text-sm font-semibold">{titel}</strong>
            <span className={cn('mt-0.5 block text-xs', gewaehlt ? 'text-white/80' : 'text-ink-700')}>{datum}</span>
          </button>
        )
      })}
    </div>
  )
}

export function KanteHinweis({
  art,
}: {
  art: 'mehrdeutig' | 'nicht-verfuegbar' | 'unlesbar'
}) {
  const text = art === 'mehrdeutig' ? KANTE_MEHRDEUTIG : art === 'unlesbar' ? KANTE_UNLESBAR : KANTE_NICHT_VERFUEGBAR
  return (
    <p data-u1c-kante-hinweis={art} className="text-sm leading-6 text-ink-800">
      {text}
    </p>
  )
}

export function KanteDetail({
  zeile,
  onAlleVerbindungen,
}: {
  zeile: Extract<RouteZeile, { art: 'kante' }>
  onAlleVerbindungen?: () => void
}) {
  return (
    <div data-u1c-kante-detail={zeile.occurrenceKey} className="mt-4 min-w-0 rounded-[20px] border border-line-200 bg-surface-50 p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Verbindung</p>
      <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 [overflow-wrap:anywhere]">{zeile.titel}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-800">{zeile.datumText}</p>
      <p className="mt-1 text-sm leading-6 text-ink-800">{zeile.dauerText}</p>
      <p className="mt-1 text-sm leading-6 text-ink-800">{zeile.planText}</p>
      {onAlleVerbindungen ? (
        <div className="mt-4">
          <button
            type="button"
            data-u1c-alle-verbindungen
            onClick={onAlleVerbindungen}
            className={cn('inline-flex min-h-11 items-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white', fokusRing)}
          >
            Alle Verbindungen öffnen
          </button>
          <p className="mt-2 text-xs leading-5 text-ink-700">
            Öffnet die vorhandenen Verbindungen. Der gewählte Abschnitt wird nicht übernommen. Es startet keine Suche.
          </p>
        </div>
      ) : null}
    </div>
  )
}
