import { ungeplantePunkteLesen } from '@/lib/trips/arbeitsbereich'
import { unterkunftAbdeckung, type UnterkunftLuecke } from '@/lib/trips/naechte-abdeckung'
import { flugAbdeckung, type FlugAbschnitt } from '@/lib/trips/flug-abdeckung'
import { mobilitaetsAbdeckung, type Bewegungskante } from '@/lib/mobility/kanten'
import { tripZeitpruefung, type Zeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import { AUDIT_LIMITS, boundedSnapshot, lodgingBudget, snapshotProblem } from './limits'
import type { Trip, TripItem } from '@/types/trips'

export type AuditDomain = 'lodging' | 'time' | 'flights' | 'mobility'
type Source = 'unterkunftAbdeckung' | 'tripZeitpruefung' | 'flugAbdeckung' | 'mobilitaetsAbdeckung'
type State = 'known_gap' | 'proven_conflict' | 'possible_conflict' | 'not_evaluable' | 'unknown'
type Coverage = 'complete' | 'partial' | 'unavailable' | 'error' | 'not_run'
type Pair = Zeitpruefung['pairs'][number]
export type AuditItemDetails = Pick<TripItem, 'startsOn' | 'startsAt' | 'endsOn' | 'endsAt'> & {
  title: string | null
}
export type AuditFinding = {
  id: string
  domain: AuditDomain
  state: State
  title: string
  detail: string
  source: Source
  refs: { stageId?: string; itemIds?: string[]; dayIds?: string[]; sectionId?: string }
  items?: AuditItemDetails[]
  evidence: UnterkunftLuecke | Pair | { status: string; date?: string | null; reasons?: string[] }
}
export type AuditSection = {
  domain: AuditDomain
  source: Source
  coverage: Coverage
  detail: string
  reasons: string[]
}
export type TripAuditReport = {
  contractVersion: 'trip-audit/v1'
  claimScope: 'stored_plan_only'
  tripId: string | null
  evaluation: 'complete' | 'partial' | 'incomplete'
  sections: AuditSection[]
  findings: AuditFinding[]
  findingCount: number
  omittedFindings: number
  limits: typeof AUDIT_LIMITS
  limitReasons: string[]
  time: {
    contractVersion: Zeitpruefung['contractVersion']
    coverage: Zeitpruefung['coverage']
    pairCounts: Record<Pair['state'], number>
  } | null
  notChecked: readonly string[]
}

const DOMAINS: readonly [AuditDomain, Source][] = [
  ['lodging', 'unterkunftAbdeckung'], ['time', 'tripZeitpruefung'],
  ['flights', 'flugAbdeckung'], ['mobility', 'mobilitaetsAbdeckung'],
]
const NOT_CHECKED = [
  'Einreise, Visa, offizielle Anforderungen, Sicherheit und Gesundheit',
  'Wetter, externe Fahr- und Flugpläne, Pünktlichkeit und tatsächliche Durchführung',
  'Anbieter, Preise, Verfügbarkeit und tatsächliche Buchungs- oder Ticketbestätigung',
  'Zahlungen und Vertragsbedingungen',
] as const
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const id = (domain: AuditDomain, key: unknown) => JSON.stringify(['trip-audit/v1', domain, key])

/** Display only, from the validated bounded snapshot. Never use identity as a
 * missing name, infer a date from placement, or derive booking/timezone facts.
 */
export function storedItemDetails(item?: TripItem): AuditItemDetails {
  const title = item?.title?.trim()
  return {
    title: title && title !== item?.id ? title : null,
    startsOn: item?.startsOn ?? null, startsAt: item?.startsAt ?? null,
    endsOn: item?.endsOn ?? null, endsAt: item?.endsAt ?? null,
  }
}

/** Status mapping only; the caller supplies canonical determinations. In
 * particular covered_by_flight can never become a missing ground transfer.
 */
export function connectionFindingState(status: Bewegungskante['status'], determinable: boolean, date: string | null): State | null {
  if (!determinable || status === 'unknown') return 'unknown'
  if (status !== 'open') return null
  return date ? 'known_gap' : 'unknown'
}

/** Lossless pair evidence. No inference from times, labels or timezone guesses. */
export function temporalFinding(pair: Pair, days: string[]): AuditFinding | null {
  if (pair.state === 'no_proven_conflict') return null
  return {
    id: id('time', pair.eventIds), domain: 'time', state: pair.state,
    title: pair.state === 'proven_conflict' ? 'Belegter Konflikt im gespeicherten Plan'
      : pair.state === 'possible_conflict' ? 'Möglicher zeitlicher Konflikt' : 'Zeitlicher Vergleich nicht bewertbar',
    detail: pair.state === 'possible_conflict'
      ? 'Die gespeicherten Zeiten können sich überschneiden. Ein möglicher Konflikt ist nicht bewiesen.'
      : pair.state === 'proven_conflict' ? 'Die kanonische Zeitprüfung belegt eine Überschneidung dieser Planpunkte.'
        : 'Die gespeicherten Angaben reichen für diesen Vergleich nicht aus.',
    source: 'tripZeitpruefung', refs: { itemIds: [...pair.itemIds], dayIds: days }, evidence: pair,
  }
}

/** On-demand projection; no clock, I/O, persistence, mutation or revision cache.
 * An omitted/empty override has the SAME fallback semantics as the workspace.
 */
export function tripAuditV1(reise: Trip, ohneTag?: readonly TripItem[]): TripAuditReport {
  const report: TripAuditReport = {
    contractVersion: 'trip-audit/v1', claimScope: 'stored_plan_only', tripId: null,
    evaluation: 'incomplete', sections: [], findings: [], findingCount: 0, omittedFindings: 0,
    limits: { ...AUDIT_LIMITS }, limitReasons: [], time: null, notChecked: [...NOT_CHECKED],
  }
  function unavailable(reason: string): TripAuditReport {
    report.limitReasons.push(reason)
    report.sections = DOMAINS.map(([domain, source]) => ({ domain, source, coverage: 'not_run',
      detail: 'Dieser Reisebestand konnte nicht vollständig ausgewertet werden.', reasons: [reason] }))
    return report
  }
  let view: Trip
  try {
    const bound = boundedSnapshot(reise) ?? boundedSnapshot(ohneTag)
    if (bound) return unavailable(bound)
    const selected = ungeplantePunkteLesen(reise, ohneTag)
    // A projection, not a write to Trip. Every reader sees exactly the inventory
    // already chosen by the workspace, including the temporal adapter's own list.
    view = { ...reise, ohneTag: [...selected] }
    const problem = snapshotProblem(view, selected)
    if (problem) return unavailable(problem)
    report.tripId = view.id
  } catch {
    return unavailable('invalid_snapshot')
  }

  // One local view of the already bounded inventory, not another item registry.
  const items = [...view.days.flatMap(day => day.items), ...view.ohneTag]
  function add(finding: AuditFinding) {
    report.findingCount++
    if (report.findings.length < AUDIT_LIMITS.findings) report.findings.push({
      ...finding,
      // Enrich retained output only, in the exact existing reference order.
      items: finding.refs.itemIds?.map(itemId => storedItemDetails(items.find(item => item.id === itemId))),
    })
    else report.omittedFindings++
  }
  function section(domain: AuditDomain, source: Source, run: () => Omit<AuditSection, 'domain' | 'source'>) {
    try { report.sections.push({ domain, source, ...run() }) }
    catch {
      report.sections.push({ domain, source, coverage: 'error', detail: 'Dieser Bereich konnte nicht ausgewertet werden.', reasons: ['evaluation_error'] })
    }
  }

  section('lodging', 'unterkunftAbdeckung', () => {
    const budget = lodgingBudget(view)
    if (budget) {
      report.limitReasons.push(budget)
      return { coverage: 'not_run', detail: 'Der Umfang der Unterkunftszeiträume überschreitet die Auswertungsgrenze.', reasons: [budget] }
    }
    const result = unterkunftAbdeckung(view, view.ohneTag)
    const unknown = result.aufenthalte.filter(stay => stay.status === 'unknown'
      || (view.stages.length > 0 && !stay.item.stageId))
    const safeGaps = result.bekannt && unknown.length === 0
    for (const stay of [...unknown].sort((a, b) => compare(a.item.id, b.item.id))) add({
      id: id('lodging', ['stay', stay.item.id]), domain: 'lodging', state: 'unknown', source: 'unterkunftAbdeckung',
      title: 'Unterkunftszeitraum oder Zuordnung unbekannt',
      detail: 'Dieser Aufenthalt lässt keine vollständige Aussage über fehlende Unterkunftsnächte zu.',
      refs: { itemIds: [stay.item.id], ...(stay.item.stageId ? { stageId: stay.item.stageId } : {}) },
      evidence: { status: stay.status, reasons: ['incomplete_stay'] },
    })
    const uebergang = (gap: UnterkunftLuecke) => result.bekannt && gap.stageId == null && view.stages.length > 0
    const uebergangsNaechte = result.luecken.filter(uebergang).reduce((summe, gap) => summe + gap.naechte, 0)
    const zuordnungUnbekannt = view.stages.length > 1 && !result.bekannt
    const aussenHinweis = result.ausserhalb.length === 0
      ? ''
      : ` ${result.ausserhalb.length} ${result.ausserhalb.length === 1 ? 'Etappenintervall liegt' : 'Etappenintervalle liegen'} ausserhalb der Reise und ${result.ausserhalb.length === 1 ? 'zählt' : 'zählen'} nicht als zusätzliche Reisenächte.`
    if (safeGaps) for (const gap of result.luecken) {
      if (uebergang(gap)) {
        add({
          id: id('lodging', ['transition', gap.start, gap.end]), domain: 'lodging', state: 'unknown',
          title: 'Übergangsnacht ohne Unterkunftszuordnung',
          detail: `${gap.start} bis ${gap.end} · ${gap.naechte} ${gap.naechte === 1 ? 'Übernachtungsintervall' : 'Übernachtungsintervalle'} ausserhalb der Etappen. Das ist keine festgestellte Hotelpflicht und keine Buchung.`,
          source: 'unterkunftAbdeckung', refs: {}, evidence: { ...gap },
        })
        continue
      }
      add({
        id: id('lodging', [gap.stageId, gap.start, gap.end]), domain: 'lodging', state: 'known_gap',
        title: 'Geplante Unterkunftsnacht fehlt',
        detail: `${gap.stageName ?? 'Reise'}: ${gap.start} bis ${gap.end} · ${gap.naechte} Nächte ohne zugeordnete Unterkunft im Plan.`,
        source: 'unterkunftAbdeckung', refs: gap.stageId ? { stageId: gap.stageId } : {}, evidence: { ...gap },
      })
    }
    const lodgingComplete = safeGaps && uebergangsNaechte === 0 && !zuordnungUnbekannt
    return {
      coverage: lodgingComplete ? 'complete' : result.bekannt || zuordnungUnbekannt ? 'partial' : 'unavailable',
      detail: lodgingComplete
        ? `${result.naechteGesamt} geplante Nächte; ${result.naechteAusgewaehlt} mit ausgewählter Unterkunft; ${result.naechteGebucht} von dir als gebucht markiert. Keine externe Buchungsbestätigung geprüft.${aussenHinweis}`
        : safeGaps && uebergangsNaechte > 0
          ? `${result.naechteGesamt} Übernachtungsintervalle im Reisekalender; ${uebergangsNaechte} davon Übergang ohne Unterkunftszuordnung und ohne angenommene Hotelpflicht; ${result.naechteAusgewaehlt} mit ausgewählter Unterkunft; ${result.naechteGebucht} von dir als gebucht markiert. Keine externe Buchungsbestätigung geprüft.${aussenHinweis}`
          : zuordnungUnbekannt && result.kalenderNaechte !== null
            ? `${result.kalenderNaechte} Übernachtungsintervalle im Reisekalender sind bekannt. Welche Etappe sie besitzt, ist unbekannt. Es wird keine Hotelpflicht angenommen.`
            : 'Unterkunftsstand teilweise oder unbekannt. Fehlende Zeiträume oder Zuordnungen erlauben keine vollständige Nachtbilanz.',
      reasons: lodgingComplete ? [] : ['incomplete_lodging'],
    }
  })

  section('time', 'tripZeitpruefung', () => {
    const result = tripZeitpruefung(view, view.ohneTag)
    const pairCounts: Record<Pair['state'], number> = { proven_conflict: 0, possible_conflict: 0, not_evaluable: 0, no_proven_conflict: 0 }
    const days = new Map(result.events.map(event => [event.id, event.dayId]))
    for (const pair of result.pairs) {
      pairCounts[pair.state]++
      const dayIds = [...new Set(pair.eventIds.flatMap(eventId => days.get(eventId) ? [days.get(eventId)!] : []))].sort(compare)
      const finding = temporalFinding(pair, dayIds)
      if (finding) add(finding)
    }
    report.time = { contractVersion: result.contractVersion, coverage: { ...result.coverage, reasons: [...result.coverage.reasons] }, pairCounts }
    if (result.coverage.reasons.includes('work_limit')) report.limitReasons.push('temporal_work_limit')
    return { coverage: result.coverage.state,
      detail: `${result.coverage.evaluatedPairs} zeitliche Vergleiche bewertet; ${result.coverage.unevaluablePairs ?? 'unbekannt'} nicht bewertbar; ${result.coverage.unassessedEvents ?? 'unbekannt'} Ereignisse nicht erfasst. Kein Gesamturteil über die Reise.`,
      reasons: [...result.coverage.reasons] }
  })

  function connections(domain: 'flights' | 'mobility', source: Source, determinable: boolean,
    connections: readonly (FlugAbschnitt | Bewegungskante)[], unassigned: readonly TripItem[]): Omit<AuditSection, 'domain' | 'source'> {
    let unknown = !determinable || unassigned.length > 0
    let selected = 0
    let booked = 0
    for (const connection of [...connections].sort((a, b) => compare(a.id, b.id))) {
      const state = connectionFindingState(connection.status, determinable && unassigned.length === 0, connection.date)
      selected += Number(connection.status === 'selected')
      booked += Number(connection.status === 'booked')
      if (!state) continue
      if (state === 'unknown') unknown = true
      add({ id: id(domain, connection.id), domain, state, source,
        title: state === 'unknown' ? 'Verbindung nicht vollständig bewertbar'
          : domain === 'flights' ? 'Kein Flug für diesen Abschnitt im Plan' : 'Keine Verbindung für diesen Abschnitt im Plan',
        detail: `${connection.originName} → ${connection.destinationName} · ${connection.date ?? 'Datum unbekannt'}. Dies ist keine Aufforderung zu einer Buchung; die passende Reiseart bleibt deine Entscheidung.`,
        refs: { sectionId: connection.id }, evidence: { status: connection.status, date: connection.date } })
    }
    if (unassigned.length) add({ id: id(domain, 'unassigned'), domain, state: 'unknown', source,
      title: 'Planpunkte nicht eindeutig zugeordnet', detail: `${unassigned.length} gespeicherte Planpunkte lassen sich keinem Abschnitt eindeutig zuordnen.`,
      refs: { itemIds: unassigned.map(item => item.id).sort(compare) }, evidence: { status: 'unassigned' } })
    return { coverage: !determinable ? 'unavailable' : unknown ? 'partial' : 'complete',
      detail: `${selected} Abschnitte ausgewählt; ${booked} von dir als gebucht markiert. ${unknown ? 'Die Zuordnung ist nicht vollständig bewertbar. ' : ''}Keine externe Bestätigung geprüft.`,
      reasons: unknown ? ['incomplete_connections'] : [] }
  }
  section('flights', 'flugAbdeckung', () => {
    const result = flugAbdeckung(view, view.ohneTag)
    return connections('flights', 'flugAbdeckung', result.bestimmbar, result.abschnitte, result.unzugeordnet)
  })
  section('mobility', 'mobilitaetsAbdeckung', () => {
    const result = mobilitaetsAbdeckung(view, view.ohneTag)
    return connections('mobility', 'mobilitaetsAbdeckung', result.bestimmbar, result.kanten, result.unzugeordnet)
  })
  if (report.omittedFindings) report.limitReasons.push('output_limit')
  report.evaluation = report.limitReasons.length || report.sections.some(s => s.coverage === 'error' || s.coverage === 'not_run')
    ? 'incomplete' : report.sections.some(s => s.coverage !== 'complete') ? 'partial' : 'complete'
  // Fixed domain order above, lexical order within domain; no priority score.
  report.findings.sort((a, b) => DOMAINS.findIndex(d => d[0] === a.domain) - DOMAINS.findIndex(d => d[0] === b.domain) || compare(a.id, b.id))
  return report
}
