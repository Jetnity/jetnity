'use client'

import { useState } from 'react'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import type { Trip, TripItem } from '@/types/trips'

const fokus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'
const statusText = {
  not_run: 'Noch kein zeitlicher Vergleich nötig.',
  complete: 'Die vergleichbaren Termine wurden geprüft.',
  partial: 'Die Zeitprüfung ist teilweise möglich.',
  unavailable: 'Ein verlässlicher Zeitvergleich ist noch nicht möglich.',
  error: 'Die Zeitprüfung konnte nicht vollständig ausgeführt werden.',
}
const grundText = {
  missing_date: 'Einzelnen Terminen fehlt ein ausdrücklich gespeichertes Datum. Die Zuordnung zum Tag ergänzt es nicht.',
  missing_start: 'Eine Anfangszeit fehlt.',
  missing_end: 'Eine Endzeit fehlt. Der nächste Termin ersetzt sie nicht.',
  missing_clock_context: 'Ein gemeinsam belegter Zeitbezug fehlt. Gleiche Uhrzeiten oder derselbe Reisetag reichen dafür nicht.',
  missing_timezone: 'Es liegen nur lokale Uhrzeiten vor. Zeitzone und mögliche Zeitumstellungen sind nicht geklärt.',
  ambiguous_local_time: 'Mehrere belegte Zeitvarianten sind möglich.',
  invalid_local_time: 'Ein Datum oder eine Uhrzeit ist ungültig.',
  conflicting_evidence: 'Zeitangaben widersprechen sich oder können nicht zuverlässig gelesen werden.',
  stale_evidence: 'Die zugrunde liegenden Zeitangaben sind nicht mehr aktuell.',
  incomplete_snapshot: 'Das vorliegende Inventar oder die Zuordnung ist unvollständig.',
  unsupported_role: 'Notizen gelten nicht automatisch als feste Termine.',
  unknown_placement: 'Punkte ohne Tageszuordnung wurden ebenfalls berücksichtigt.',
  duplicate_identity: 'Widersprüchliche Kennungen verhindern einen eindeutigen Abgleich.',
  evaluation_error: 'Die Auswertung ist fehlgeschlagen.',
  work_limit: 'Die Reise überschreitet den Umfang dieser Prüfung. Nicht geprüfte Vergleiche bleiben offen.',
  date_mismatch: 'Ein gespeichertes Termindatum weicht vom angezeigten Reisetag ab. Geprüft wird das gespeicherte Datum.',
  estimate_only: 'Die Zeitangaben beruhen auf einer Schätzung.',
}

export default function TripTimelineZeitpruefung({ reise, ohneTag, tagId, onPunktOeffnen, gesperrt = false }: {
  reise: Trip
  ohneTag: readonly TripItem[]
  tagId: string
  onPunktOeffnen?: (id: string) => void
  gesperrt?: boolean
}) {
  // Synchronous current-props projection: even same-revision clock edits invalidate the result.
  const review = tripZeitpruefung(reise, ohneTag)
  const [limit, setLimit] = useState(3)
  const day = reise.days.find(d => d.id === tagId)
  const relevant = review.events.filter(event => event.dayId === tagId || (day?.dayDate &&
    (event.start.date === day.dayDate || event.end.date === day.dayDate
      || (event.start.resolution.kind === 'civil_only' && event.end.resolution.kind === 'civil_only'
        && event.start.resolution.contextRef === event.end.resolution.contextRef
        && event.start.date && event.end.date && event.start.date < day.dayDate && day.dayDate < event.end.date))))
  const ids = new Set(relevant.map(event => event.id))
  const pairs = review.pairs.filter(pair => pair.eventIds.some(id => ids.has(id)))
  const findings = pairs.filter(pair => pair.state === 'proven_conflict' || pair.state === 'possible_conflict')
  const checked = pairs.filter(pair => pair.state !== 'not_evaluable').length
  const disjoint = pairs.filter(pair => pair.state === 'no_proven_conflict').length
  const fixed = relevant.filter(event => ['occupied_interval', 'start_only', 'end_only', 'milestone'].includes(event.role))
  const items = new Map([...reise.days.flatMap(d => d.items), ...reise.ohneTag, ...ohneTag].map(item => [item.id, item]))
  const conflicts = new Set(review.events.filter(e => e.reasons.some(r => r === 'duplicate_identity' || r === 'incomplete_snapshot')).map(e => e.itemId))
  const targets = [...new Set([...relevant.map(e => e.itemId), ...findings.flatMap(p => p.itemIds)])]
  const open = (id: string) => {
    // Resolve original IDs against this render's current graph; no stored finding/action cache.
    if (!gesperrt && items.has(id) && !conflicts.has(id)) onPunktOeffnen?.(id)
  }
  const link = (id: string) => {
    const item = items.get(id)
    if (!item) return null
    return onPunktOeffnen && !conflicts.has(id) ? (
      <button key={id} type="button" data-zeitpruefung-punkt={id} disabled={gesperrt}
        onClick={() => open(id)} className={`min-h-11 max-w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-brand-800 underline underline-offset-4 [overflow-wrap:anywhere] disabled:opacity-50 ${fokus}`}>
        {item.title} öffnen
      </button>
    ) : <span key={id} className="block py-2 [overflow-wrap:anywhere]">{item.title} · nicht eindeutig verfügbar</span>
  }

  return (
    <section aria-label="Zeitprüfung" data-zeitpruefung data-zeitpruefung-status={review.coverage.state}
      className="mt-4 min-w-0 max-w-full rounded-2xl border border-line-200 bg-white p-3 text-sm leading-6 text-ink-900">
      <p className="font-semibold text-brand-800">Zeitprüfung</p>
      <p data-zeitpruefung-zusammenfassung aria-live="polite">
        {review.coverage.state === 'error' ? 'Für diesen Tag liegt kein verlässliches Prüfergebnis vor.'
          : fixed.length === 0 ? 'Noch keine festen Termine für diesen Tag.'
          : findings.length > 0 ? `${findings.length} mögliche oder belegte Überschneidung${findings.length === 1 ? '' : 'en'} im Plan.`
            : 'Für diesen Tag ist keine Überschneidung belegt.'}
        {' '}{statusText[review.coverage.state]}
      </p>
      <details className="mt-1 min-w-0">
        <summary className={`min-h-11 cursor-pointer rounded-lg py-2 font-medium text-brand-800 ${fokus}`}>Prüfumfang und Details</summary>
        <p data-zeitpruefung-umfang>
          Gesamte Reise einschließlich nicht eingeplanter Punkte: {review.coverage.evaluatedPairs} von {review.coverage.eligiblePairs ?? 'unbekannt vielen'} Vergleichen auswertbar.
          {review.coverage.unevaluablePairs !== null ? ` ${review.coverage.unevaluablePairs} nicht auswertbar oder noch ungeprüft.` : ''}
          {' '}{review.coverage.unassessedEvents ?? 'Unbekannt viele'} Punkte zeitlich nicht vollständig bestimmbar.
        </p>
        <p className="mt-2">Für diesen Tag: {checked} von {pairs.length} berücksichtigten Vergleichen auswertbar.
          {' '}Das ist keine Aussage über freie Zeit, Wege oder die tatsächliche Teilnahme.</p>
        {disjoint > 0 ? <p className="mt-2">Keine zeitliche Überschneidung für {disjoint} vollständig geprüfte Terminpaare.</p> : null}
        {findings.length > 0 ? (
          <div className="mt-3">
            <ul className="space-y-3">
              {findings.slice(0, limit).map(pair => (
                <li key={JSON.stringify(pair.eventIds)} className="min-w-0 border-t border-line-200 pt-3">
                  <p className="font-medium text-brand-800">{pair.state === 'proven_conflict'
                    ? 'Diese Termine überschneiden sich laut deinem Plan.' : 'Mögliche Überschneidung im Plan.'}</p>
                  {pair.state === 'possible_conflict' ? <p>{pair.reasons.map(reason => grundText[reason]).join(' ')}</p> : null}
                  {pair.overlapMinutes !== null ? <p>{pair.overlapMinutes} Minuten laut den gespeicherten Zeiten.</p> : null}
                  <div className="flex min-w-0 flex-wrap gap-x-2">{[...new Set(pair.itemIds)].map(link)}</div>
                </li>
              ))}
            </ul>
            {findings.length > limit ? <button type="button" onClick={() => setLimit(n => n + 10)}
              className={`mt-2 min-h-11 rounded-lg py-2 text-left font-medium text-brand-800 ${fokus}`}>
              Weitere Hinweise anzeigen ({findings.length - limit})
            </button> : null}
          </div>
        ) : null}
        {review.coverage.reasons.length > 0 ? (
          <div className="mt-3 border-t border-line-200 pt-3">
            <p className="font-medium text-brand-800">Was für die Prüfung noch fehlt</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">{review.coverage.reasons.map(reason => <li key={reason}>{grundText[reason]}</li>)}</ul>
          </div>
        ) : null}
        <p className="mt-3">Hotelaufenthalte und Mietwagenzeiten belegen nicht deinen ganzen Tagesablauf. Flexible Punkte und Notizen bleiben ohne erfundene Dauer.</p>
        {targets.length > 0 ? <details className="mt-2">
          <summary className={`min-h-11 cursor-pointer rounded-lg py-2 font-medium text-brand-800 ${fokus}`}>Berücksichtigte Punkte dieses Tags ({targets.length})</summary>
          <ul>{targets.map(id => <li key={id} className="min-w-0">{link(id)}</li>)}</ul>
        </details> : null}
      </details>
    </section>
  )
}
