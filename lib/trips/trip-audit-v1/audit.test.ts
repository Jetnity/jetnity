import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TripAuditV1Panel, { TripAuditFinding } from '@/components/trips/TripAuditV1Panel'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { ungeplantePunkteLesen } from '@/lib/trips/arbeitsbereich'
import { tripZeitpruefung, zeitereignissePruefen, type Zeitereignis } from '@/lib/trips/trip-timeline-temporal-review-1'
import { connectionFindingState, storedItemDetails, temporalFinding, tripAuditV1 } from './audit'
import { AUDIT_LIMITS, boundedSnapshot } from './limits'
import type { Trip, TripItem } from '@/types/trips'

function item(id: string, changes: Partial<TripItem> = {}): TripItem {
  return { ...beispielreise().days[0].items[0], id, title: id, kind: 'transfer',
    startsOn: '2026-09-12', endsOn: '2026-09-12', startsAt: '10:00', endsAt: '11:00',
    provider: null, externalRef: null, bookingUrl: null, priceAmount: null, priceCurrency: null,
    mobilityEvidence: 'user', originPlaceId: 'airport:ZRH', destinationPlaceId: 'airport:ZRH', ...changes }
}
function trip(items: TripItem[] = []): Trip {
  const result = beispielreise()
  result.days = [{ ...result.days[0], items }]
  return result
}
function freeze(value: object) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child)
  Object.freeze(value)
}

test('T01: multi-stage lodging gaps are exact canonical intervals, never an external booking claim', () => {
  const input = trip([item('stay', { kind: 'stay', startsOn: '2026-09-12', endsOn: '2026-09-13' })])
  const canonical = unterkunftAbdeckung(input)
  const report = tripAuditV1(input)
  const hotelGaps = canonical.luecken.filter(gap => gap.stageId != null)
  const transitions = canonical.luecken.filter(gap => gap.stageId == null)
  assert.equal(canonical.bekannt, true)
  assert.equal(canonical.naechteGesamt, 4)
  assert.equal(transitions.length, 1)
  assert.equal(transitions[0]?.start, '2026-09-14')
  assert.equal(transitions[0]?.end, '2026-09-15')
  assert.deepEqual(report.findings.filter(f => f.domain === 'lodging' && f.state === 'known_gap').map(f => f.evidence), hotelGaps)
  assert.deepEqual(report.findings.filter(f => f.domain === 'lodging' && f.state === 'unknown').map(f => f.evidence), transitions)
  assert(report.findings.filter(f => f.domain === 'lodging' && f.state === 'known_gap').every(f => f.source === 'unterkunftAbdeckung'))
  assert.equal(report.sections[0].coverage, 'partial')
  assert.match(report.sections[0].detail, /Übergang ohne Unterkunftszuordnung und ohne angenommene Hotelpflicht/)
  assert.match(report.sections[0].detail, /1 mit ausgewählter Unterkunft; 0 von dir als gebucht markiert/)
  assert.doesNotMatch(report.findings.find(f => f.state === 'unknown' && f.domain === 'lodging')?.title ?? '', /Hotelpflicht|Geplante Unterkunftsnacht fehlt/)
})

test('T02: connected overlapping items use tripZeitpruefung possible conflicts verbatim', () => {
  const input = trip([item('a'), item('b', { startsAt: '10:30', endsAt: '11:30' }), item('c', { startsAt: '10:45', endsAt: '11:45' })])
  const canonical = tripZeitpruefung(input)
  assert.equal(canonical.pairs.length, 3)
  assert(canonical.pairs.every(pair => pair.state === 'possible_conflict'))
  const report = tripAuditV1(input)
  assert.deepEqual(report.findings.filter(f => f.domain === 'time').map(f => f.evidence), canonical.pairs)
  assert.deepEqual(report.time?.coverage, canonical.coverage)
  assert(report.findings.every(f => f.state !== 'proven_conflict'))
})

test('T02/T03: proven/no_proven mapping uses the existing mathematical kernel; not a live Trip adapter capability', () => {
  function event(id: string, start: string, end: string): Zeitereignis {
    function boundary(time: string): Zeitereignis['start'] {
      return { date: '2026-09-12', time, sourceRef: `synthetic:${id}:${time}`, truthClass: 'stored_user',
        resolution: { kind: 'instant_candidates', candidates: [{ epochMinute: Date.parse(`2026-09-12T${time}:00Z`) / 60000, offsetMinutes: 0, choices: {} }] } }
    }
    return { id, tripId: 'synthetic', itemId: id, dayId: 'day-1', role: 'occupied_interval',
      start: boundary(start), end: boundary(end), reasons: [], subevent: null }
  }
  const proven = zeitereignissePruefen([event('a', '10:00', '11:00'), event('b', '10:30', '11:30')], 'complete').pairs[0]
  assert.equal(proven.state, 'proven_conflict')
  assert.deepEqual(temporalFinding(proven, ['day-1'])?.evidence, proven)
  assert.equal(temporalFinding(proven, ['day-1'])?.state, 'proven_conflict')
  const provenFinding = temporalFinding(proven, ['day-1'])!
  const provenHtml = renderToStaticMarkup(createElement(TripAuditFinding, { finding: {
    ...provenFinding, items: [storedItemDetails(item('a', { title: 'Museumsbesuch' })), storedItemDetails(item('b', { title: 'Stadtführung' }))],
  } }))
  assert.match(provenHtml, /Belegter Konflikt/)
  assert.match(provenHtml, /Museumsbesuch/)
  assert.match(provenHtml, /Stadtführung/)
  assert.doesNotMatch(provenHtml, /Möglicher Konflikt/)
  const separate = zeitereignissePruefen([event('a', '10:00', '11:00'), event('b', '12:00', '13:00')], 'complete').pairs[0]
  assert.equal(separate.state, 'no_proven_conflict')
  assert.equal(temporalFinding(separate, ['day-1']), null)
})

test('T03: missing clock/timezone, date mismatch and incomplete time stay partial/not evaluable', () => {
  for (const changes of [
    { kind: 'activity' as const }, { startsAt: null }, { endsOn: null },
    { startsOn: '2026-09-13' }, { originPlaceId: null, destinationPlaceId: null },
  ]) {
    const input = trip([item('a'), item('b', changes)])
    const canonical = tripZeitpruefung(input)
    const report = tripAuditV1(input)
    assert.deepEqual(report.time?.coverage, canonical.coverage)
    assert.equal(report.evaluation, 'partial')
    assert(report.findings.every(f => f.state !== 'proven_conflict'))
    assert.equal(report.time?.pairCounts.no_proven_conflict, 0)
    assert(report.findings.some(f => f.domain === 'time' && f.state === 'not_evaluable'))
  }
})

test('T04: unknown stay dates or assignment suppress definitive gaps and zero-night claims', () => {
  for (const changes of [{ startsOn: null }, { endsOn: null }, { stageId: null }]) {
    const input = trip([item('stay', { kind: 'stay', ...changes })])
    const report = tripAuditV1(input)
    assert.equal(report.sections[0].coverage, 'partial')
    assert(report.findings.some(f => f.domain === 'lodging' && f.state === 'unknown'))
    assert(!report.findings.some(f => f.domain === 'lodging' && f.state === 'known_gap'))
    assert.doesNotMatch(report.sections[0].detail, /0.*Nächte|bestätigt gebucht/)
  }
  const incomplete = trip()
  incomplete.stages[1].departureDate = null
  const incompleteReport = tripAuditV1(incomplete)
  assert.equal(incompleteReport.sections[0].coverage, 'partial')
  assert.match(incompleteReport.sections[0].detail, /Welche Etappe sie besitzt, ist unbekannt/)
  assert.match(incompleteReport.sections[0].detail, /keine Hotelpflicht/)
  assert.doesNotMatch(incompleteReport.sections[0].detail, /Übergang/)
  assert(!incompleteReport.findings.some(f => f.domain === 'lodging' && f.state === 'known_gap'))
  assert(!incompleteReport.findings.some(f => f.domain === 'lodging' && /Übergang/.test(f.title)))

  const undated = trip()
  for (const stage of undated.stages) {
    stage.arrivalDate = null
    stage.departureDate = null
  }
  const undatedReport = tripAuditV1(undated)
  assert.equal(unterkunftAbdeckung(undated).kalenderNaechte, 4)
  assert.equal(unterkunftAbdeckung(undated).naechteGesamt, null)
  assert.equal(undatedReport.sections[0].coverage, 'partial')
  assert.match(undatedReport.sections[0].detail, /4 Übernachtungsintervalle im Reisekalender sind bekannt/)
  assert.doesNotMatch(undatedReport.sections[0].detail, /Übergang/)
  assert(!undatedReport.findings.some(f => f.domain === 'lodging' && (f.state === 'known_gap' || /Übergang/.test(f.title))))
})

test('T04: selected versus user-marked booking retains canonical counts and explicit authority limit', () => {
  const input = trip([item('stay', { kind: 'stay', endsOn: '2026-09-14' })])
  assert.match(tripAuditV1(input).sections[0].detail, /2 mit ausgewählter Unterkunft; 0 von dir als gebucht markiert/)
  input.days[0].items[0].bookingStatus = 'booked'
  input.days[0].items[0].bookingSource = 'user'
  assert.match(tripAuditV1(input).sections[0].detail, /0 mit ausgewählter Unterkunft; 2 von dir als gebucht markiert/)
  assert.match(tripAuditV1(input).sections[0].detail, /Keine externe Buchungsbestätigung geprüft/)
})

test('T05: flight/mobility open sections compare exactly with canonical readers', () => {
  const input = trip()
  for (const [domain, canonical] of [
    ['flights', flugAbdeckung(input).abschnitte], ['mobility', mobilitaetsAbdeckung(input).kanten],
  ] as const) {
    assert.deepEqual(tripAuditV1(input).findings.filter(f => f.domain === domain && f.state === 'known_gap').map(f => f.refs.sectionId),
      canonical.filter(c => c.status === 'open' && c.date).map(c => c.id).sort())
  }
  assert.equal(connectionFindingState('covered_by_flight', true, '2026-09-12'), null)
  assert.equal(connectionFindingState('selected', true, '2026-09-12'), null)
  assert.equal(connectionFindingState('open', true, null), 'unknown')
  assert.equal(connectionFindingState('open', false, '2026-09-12'), 'unknown')
})

test('T05: unknown/unassigned/not-determinable connections never require a booking', () => {
  const input = trip([item('unassigned', { kind: 'flight', startsOn: null, endsOn: null })])
  const report = tripAuditV1(input)
  assert(!report.findings.some(f => f.domain === 'flights' && f.state === 'known_gap'))
  assert(report.findings.some(f => f.domain === 'flights' && f.state === 'unknown'))
  input.origin = null
  input.originPlaceId = null
  input.stages = []
  input.days = []
  const unknown = tripAuditV1(input)
  assert(unknown.sections.filter(s => s.domain === 'flights' || s.domain === 'mobility').every(s => s.coverage === 'unavailable'))
})

test('T06/T10: deterministic, frozen guest/account snapshot; no mutation, clock, provider or ambient locale', () => {
  const input = trip([item('b'), item('a')])
  const original = structuredClone(input)
  freeze(input)
  const guest = tripAuditV1(input)
  const account = tripAuditV1(input, input.ohneTag)
  assert.deepEqual(guest, account)
  assert.deepEqual(guest, tripAuditV1(input))
  assert.deepEqual(input, original)
  const reordered = structuredClone(input)
  reordered.days[0].items.reverse()
  assert.deepEqual(tripAuditV1(reordered), guest)
  assert.equal(new Set(guest.findings.map(f => f.id)).size, guest.findings.length)
  assert.equal(guest.claimScope, 'stored_plan_only')
  assert.equal(guest.notChecked.length, 4)
  assert.doesNotMatch(JSON.stringify(guest), /bookingUrl|externalRef|provider|travelWish|bookingConfirmedAt/)
})

test('T07: selected workspace unplanned projection exactly once, no hidden old inventory', () => {
  const input = trip([item('planned')])
  input.ohneTag = [item('obsolete', { dayId: null })]
  const chosen = [item('selected', { dayId: null })]
  assert.equal(ungeplantePunkteLesen(input, chosen), chosen)
  const view = { ...input, ohneTag: chosen }
  const report = tripAuditV1(input, chosen)
  assert.deepEqual(report.time?.coverage, tripZeitpruefung(view, chosen).coverage)
  assert.deepEqual(report.findings.filter(f => f.domain === 'time').map(f => f.evidence), tripZeitpruefung(view, chosen).pairs)
  assert.doesNotMatch(JSON.stringify(report), /obsolete/)
  assert.deepEqual(report, tripAuditV1(view))
  assert.deepEqual(tripAuditV1(input, []), tripAuditV1(input))
})

test('T07: edits without a revision increment change the report, including booking and itinerary content', () => {
  const input = trip([item('a'), item('b')])
  const first = tripAuditV1(input)
  const revision = input.revision
  input.days[0].items[1].startsAt = '15:00'
  input.days[0].items[1].endsAt = '16:00'
  assert.notDeepEqual(tripAuditV1(input), first)
  assert.equal(input.revision, revision)
  input.days[0].items[0].kind = 'stay'
  input.days[0].items[0].endsOn = '2026-09-14'
  const selected = tripAuditV1(input)
  input.days[0].items[0].bookingStatus = 'booked'
  input.days[0].items[0].bookingSource = 'user'
  assert.notDeepEqual(tripAuditV1(input), selected)
})

test('T08: output and canonical pair work limits are explicit, with correct retained/omitted totals', () => {
  const input = trip(Array.from({ length: 150 }, (_, i) => item(`item-${i}`)))
  const report = tripAuditV1(input)
  assert.equal(report.evaluation, 'incomplete')
  assert.equal(report.findings.length, AUDIT_LIMITS.findings)
  assert.equal(report.findingCount, report.findings.length + report.omittedFindings)
  assert(report.omittedFindings > 0)
  assert(report.limitReasons.includes('output_limit'))
  assert(report.limitReasons.includes('temporal_work_limit'))
  assert.deepEqual(report.time?.coverage, tripZeitpruefung(input).coverage)
  assert(report.findings.filter(f => f.domain === 'time').every(f => f.items?.length === 2))
})

test('R1: real finding markup identifies saved items with exact known dates/times, never opaque refs', () => {
  const ids = ['31ffec60-7421-4c40-9187-45cd0224dd6f', 'a26b4ab4-2d31-4326-a50e-7b86d775c727']
  const input = trip([
    item(ids[0], { title: 'Zug zum Flughafen', startsAt: '10:00', endsAt: '11:00' }),
    item(ids[1], { title: 'Altstadtführung', startsAt: '10:30', endsAt: '11:30' }),
  ])
  const before = structuredClone(input)
  freeze(input)
  const report = tripAuditV1(input)
  const finding = report.findings.find(f => f.domain === 'time')!
  assert.deepEqual(finding.evidence, tripZeitpruefung(input).pairs[0])
  assert.deepEqual(new Set(finding.refs.itemIds), new Set(ids))
  assert.deepEqual(finding.items, finding.refs.itemIds!.map(id => storedItemDetails(input.days[0].items.find(i => i.id === id))))
  const html = renderToStaticMarkup(createElement(TripAuditFinding, { finding }))
  for (const name of ['Zug zum Flughafen', 'Altstadtführung', '2026-09-12', '10:00', '11:00', '10:30', '11:30']) assert(html.includes(name))
  for (const id of [...ids, input.id, input.days[0].id]) assert(!html.includes(id))
  assert.match(html, /Möglicher Konflikt/)
  assert.doesNotMatch(html, /Belegter Konflikt|bestätigt gebucht|UTC|00:00/)
  assert.deepEqual(input, before)
})

test('R1: missing and ID-only labels remain unknown, with no invented dates or clocks', () => {
  const opaque = 'cb55749d-01f4-4fc8-a9cb-1d88024bb104'
  const blank = item(opaque, { title: '   ', startsOn: null, startsAt: null, endsOn: null, endsAt: null })
  const unknown = { title: null, startsOn: null, startsAt: null, endsOn: null, endsAt: null }
  assert.deepEqual(storedItemDetails(undefined), unknown)
  assert.deepEqual(storedItemDetails(blank), unknown)
  // ID-only names are valid schema strings, but are not useful display labels.
  const input = trip([item(opaque, { title: opaque, startsAt: null }), item('other', { title: 'Bahnhofbesuch' })])
  const finding = tripAuditV1(input).findings.find(f => f.domain === 'time')!
  assert.equal(finding.items!.find(i => i.title === null)?.startsAt, null)
  assert.equal(finding.state, 'not_evaluable')
  const html = renderToStaticMarkup(createElement(TripAuditFinding, { finding }))
  assert.match(html, /Bezeichnung unbekannt/)
  assert.match(html, /Uhrzeit unbekannt/)
  assert.doesNotMatch(html, /cb55749d|00:00|Belegter Konflikt|bestätigt gebucht/)
  const missingHtml = renderToStaticMarkup(createElement(TripAuditFinding, { finding: { ...finding, items: [storedItemDetails(blank)] } }))
  assert.match(missingHtml, /Datum unbekannt/)
  assert.doesNotMatch(missingHtml, /2026-09-12|10:00|11:00/)
  // Do not relax canonical schema validation to accept an invalid missing title.
  const invalid = trip([blank])
  assert.equal(tripAuditV1(invalid).evaluation, 'incomplete')
  assert.equal(tripAuditV1(invalid).findings.length, 0)
})

test('R1: display labels use the selected snapshot and reflect same-revision edits without persistence', () => {
  const input = trip([item('planned', { title: 'Ankunft am Bahnhof' })])
  input.ohneTag = [item('obsolete', { dayId: null, title: 'Veraltete Bezeichnung' })]
  const selected = [item('current', { dayId: null, title: 'Fahrt zum Hotel' })]
  const before = structuredClone({ input, selected })
  const first = tripAuditV1(input, selected)
  const firstHtml = first.findings.map(finding => renderToStaticMarkup(createElement(TripAuditFinding, { finding }))).join('')
  assert.match(firstHtml, /Ankunft am Bahnhof/)
  assert.match(firstHtml, /Fahrt zum Hotel/)
  assert.doesNotMatch(firstHtml, /Veraltete Bezeichnung|obsolete|current|planned/)
  assert.deepEqual({ input, selected }, before)
  const revision = input.revision
  selected[0].title = 'Fahrt zur Unterkunft'
  const second = tripAuditV1(input, selected)
  const secondHtml = second.findings.map(finding => renderToStaticMarkup(createElement(TripAuditFinding, { finding }))).join('')
  assert.match(secondHtml, /Fahrt zur Unterkunft/)
  assert.doesNotMatch(secondHtml, /Fahrt zum Hotel/)
  assert.match(firstHtml, /Fahrt zum Hotel/)
  assert.equal(input.revision, revision)
  assert.deepEqual(first.findings.map(f => [f.id, f.state, f.evidence]), second.findings.map(f => [f.id, f.state, f.evidence]))
})

test('R1: saved titles are bounded escaped text, not HTML or external actions', () => {
  const title = '<img src="https://example.invalid/pixel" onerror="alert(1)">'
  const input = trip([item('opaque-one', { title }), item('opaque-two', { title: 'A'.repeat(120) })])
  const finding = tripAuditV1(input).findings.find(f => f.domain === 'time')!
  const html = renderToStaticMarkup(createElement(TripAuditFinding, { finding }))
  assert.match(html, /&lt;img/)
  assert.doesNotMatch(html, /<img|<script|<a |opaque-one|opaque-two/)
  assert(finding.items!.every(i => i.title === null || i.title.length <= 120))
  const oversized = trip([item('opaque-one', { title: 'x'.repeat(AUDIT_LIMITS.stringLength + 1) })])
  assert.equal(tripAuditV1(oversized).evaluation, 'incomplete')
  assert.equal(tripAuditV1(oversized).findings.length, 0)
})

test('T08: malformed, cyclic, duplicate and oversized inputs fail closed without raw errors', () => {
  const cyclic = trip()
  Object.assign(cyclic, { cycle: cyclic })
  const duplicate = trip([item('same'), item('same')])
  const giant = trip(Array.from({ length: 1001 }, (_, i) => item(`${i}`)))
  const malformed = { ...trip(), days: null } as unknown as Trip
  const hugeText = trip([item('a', { note: 'x'.repeat(5000) })])
  for (const input of [cyclic, duplicate, giant, malformed, hugeText]) {
    const report = tripAuditV1(input)
    assert.equal(report.evaluation, 'incomplete')
    assert.equal(report.findings.length, 0)
    assert.equal(report.sections.length, 4)
    assert(report.sections.every(s => s.coverage === 'not_run'))
    assert(JSON.stringify(report).length < 5000)
  }
  const getter = Object.defineProperty({}, 'trip', { enumerable: true, get() { throw new Error('PRIVATE_DO_NOT_LOG') } })
  assert.equal(boundedSnapshot(getter), 'invalid_snapshot')
  assert.doesNotMatch(JSON.stringify(tripAuditV1(getter as Trip)), /PRIVATE_DO_NOT_LOG/)
})

test('T08: bound the canonical lodging date loop before evaluation', () => {
  const input = trip([item('stay', { kind: 'stay', startsOn: '1000-01-01', endsOn: '9999-12-31' })])
  const report = tripAuditV1(input)
  assert.equal(report.evaluation, 'incomplete')
  assert(report.limitReasons.includes('lodging_work_limit'))
  assert.equal(report.sections[0].coverage, 'not_run')
  assert(!report.findings.some(f => f.domain === 'lodging'))
})

test('T09: closed panel is accessible and does not even read Trip before user interaction', () => {
  const unreadable = new Proxy({} as Trip, { get() { throw new Error('Audit ran before click') } })
  const html = renderToStaticMarkup(createElement(TripAuditV1Panel, { reise: unreadable }))
  assert.match(html, /<section aria-label="Reise prüfen"/)
  assert.match(html, /<button type="button" aria-expanded="false" aria-controls="[^"]+"/)
  assert.match(html, />Reise prüfen<\/button>/)
  assert.match(html, /hidden=""/)
  assert.match(html, /min-h-11/)
  assert.match(html, /focus-visible:outline/)
  assert.doesNotMatch(html, /ermittelten Befunden|Auswertung vollständig/)
})

test('T09/T10: guest and account use common Workspace; additive selected-list mount preserves Jetzt wichtig', () => {
  const source = (path: string) => readFileSync(path, 'utf8')
  const overview = source('components/trips/TripWorkspaceUebersicht.tsx')
  const workspace = source('components/trips/TripWorkspace.tsx')
  assert.match(workspace, /<TripWorkspaceUebersicht\s+reise=\{reise\}\s+ungeplantePunkte=\{ungeplantePunkte\}/)
  assert.match(overview, /<TripAuditV1Panel key=\{reise.id\} reise=\{reise\} ungeplantePunkte=\{ungeplantePunkte\}/)
  assert(overview.indexOf('<TripWorkspaceJetztWichtig') < overview.indexOf('<TripAuditV1Panel'))
  assert.match(source('components/trips/GastArbeitsbereich.tsx'), /<TripWorkspace/)
  assert.match(source('components/trips/KontoArbeitsbereich.tsx'), /<TripWorkspace/)
  const runtime = ['lib/trips/trip-audit-v1/audit.ts', 'lib/trips/trip-audit-v1/f05-ground-flight.ts', 'lib/trips/trip-audit-v1/limits.ts', 'components/trips/TripAuditV1Panel.tsx'].map(source).join('\n')
  assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|sendBeacon|Date\.now|new Date\(\)|useEffect|useMemo|supabase|console\./)
  assert.doesNotMatch(runtime, /from ['"].*(?:readiness\/provider|safety|seasonal|auth|payment|server)/)
})
