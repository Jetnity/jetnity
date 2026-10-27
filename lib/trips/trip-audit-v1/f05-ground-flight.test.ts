import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TripAuditFinding } from '@/components/trips/TripAuditV1Panel'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Bewegungskante } from '@/lib/mobility/kanten'
import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { flugAbdeckung, type FlugAbschnitt } from '@/lib/trips/flug-abdeckung'
import { TEST_FLUGHAFEN_REFS } from '@/lib/route/fixtures'
import { flughafenPunkt } from '@/lib/route/referenz'
import type { FlugRouteItinerary } from '@/lib/route/domain'
import { f05AdjustFlightKnownGap } from './f05-ground-flight'
import { tripAuditV1 } from './audit'
import type { Trip, TripItem } from '@/types/trips'

const ZRH = 'place:zurich'
const FLR = 'place:florence'
const ROM = 'place:rome'

function freeze(value: object) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child)
  Object.freeze(value)
}

function segment(changes: Partial<FlugAbschnitt> = {}): FlugAbschnitt {
  return {
    id: 'connection:stage-a:stage-b', art: 'connection', originName: 'Florenz', destinationName: 'Rom',
    originPlaceId: FLR, destinationPlaceId: ROM, date: '2026-09-15', status: 'open', item: null, ...changes,
  }
}

function railItem(changes: Partial<TripItem> = {}): TripItem {
  return {
    id: 'rail-1', dayId: 'day-1', stageId: 'stage-b', kind: 'transfer', title: 'Zug Florenz–Rom', note: null,
    position: 1, startsOn: '2026-09-15', startsAt: '08:00', endsOn: '2026-09-15', endsAt: '09:40',
    priceAmount: null, priceCurrency: null, provider: null, externalRef: null, bookingUrl: null,
    bookingStatus: 'unconfirmed', bookingSource: null, bookingConfirmedAt: null, mobilityMode: 'rail',
    originPlaceId: FLR, destinationPlaceId: ROM, originName: 'Nicht der Etappenname', destinationName: 'Auch nicht',
    connectionRef: null, mobilityChanges: null, mobilityEvidence: 'user', rentalSupplier: null, vehicleClass: null,
    transmission: null, rentalEvidence: null, routeItinerary: null, ...changes,
  }
}

function edge(item: TripItem | null, changes: Partial<Bewegungskante> = {}): Bewegungskante {
  return {
    id: 'connection:stage-a:stage-b', art: 'connection', originName: 'Florenz', destinationName: 'Rom',
    originPlaceId: FLR, destinationPlaceId: ROM, date: '2026-09-15',
    status: item ? (item.bookingStatus === 'booked' ? 'booked' : 'selected') : 'open',
    flightItem: null, mobilityItem: item, durationMinutes: null, ...changes,
  }
}

function adjust(row: FlugAbschnitt, bound: Bewegungskante, extra: { segments?: FlugAbschnitt[]; edges?: Bewegungskante[]; loose?: TripItem[] } = {}) {
  return f05AdjustFlightKnownGap(row, {
    bestimmbar: true, abschnitte: [row, ...(extra.segments ?? [])], unzugeordnet: [],
  }, {
    bestimmbar: true, kanten: [bound, ...(extra.edges ?? [])], unzugeordnet: extra.loose ?? [],
  })
}

test('F05 helper: exact rail proof is ground-selected and ignores display names', () => {
  const row = segment()
  const item = railItem()
  const bound = edge(item)
  freeze(row)
  freeze(bound)
  assert.deepEqual(adjust(row, bound), { kind: 'ground', itemId: 'rail-1', userMarkedBooked: false })
  for (const mobilityMode of ['bus', 'ferry', 'transfer'] as const) {
    assert.equal(adjust(segment(), edge(railItem({ mobilityMode }))).kind, 'ground', mobilityMode)
  }
  const booked = railItem({ bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-09-01T08:00:00.000Z' })
  assert.deepEqual(adjust(segment(), edge(booked)), { kind: 'ground', itemId: 'rail-1', userMarkedBooked: true })
})

test('F05 helper: weak, reversed, unknown, duplicate and repeated pairs fail closed', () => {
  assert.deepEqual(adjust(segment(), edge(null)), { kind: 'keep' })
  assert.equal(adjust(segment(), edge(railItem({ originPlaceId: null, destinationPlaceId: null }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ originPlaceId: ROM, destinationPlaceId: FLR }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ originPlaceId: 'airport:FLR', destinationPlaceId: 'airport:FCO' }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ mobilityMode: null }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ mobilityMode: 'helicopter' as TripItem['mobilityMode'] }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ stageId: null }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ stageId: 'stage-a' }))).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ startsOn: '2026-09-16' }))).kind, 'withhold')
  assert.equal(adjust(segment({ date: null }), edge(railItem())).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem(), { status: 'unknown' })).kind, 'withhold')
  assert.equal(adjust(segment(), edge(railItem({ bookingStatus: 'booked', bookingSource: null }))).kind, 'withhold')
  const twin = segment({ id: 'connection:stage-c:stage-d' })
  const twinEdge = edge(null, { id: twin.id, status: 'open', mobilityItem: null })
  assert.equal(adjust(segment(), edge(railItem()), { segments: [twin], edges: [twinEdge] }).kind, 'withhold')
  assert.equal(adjust(segment(), edge(null), { loose: [railItem({ id: 'loose', originPlaceId: null, destinationPlaceId: null })] }).kind, 'withhold')
})

function punkt(id: string, changes: Partial<TripItem> = {}): TripItem {
  return {
    ...beispielreise().days[0].items[0], id, title: id, kind: 'transfer', note: null, position: 1,
    startsOn: '2026-09-15', startsAt: '08:00', endsOn: '2026-09-15', endsAt: '09:40',
    priceAmount: null, priceCurrency: null, provider: null, externalRef: null, bookingUrl: null,
    bookingStatus: 'unconfirmed', bookingSource: null, bookingConfirmedAt: null, mobilityMode: 'rail',
    originPlaceId: FLR, destinationPlaceId: ROM, originName: 'Nicht Florenz', destinationName: 'Nicht Rom',
    connectionRef: null, mobilityChanges: null, mobilityEvidence: 'user', stageId: 'stage-2', ...changes,
  }
}

function threeCity(items: TripItem[] = []): Trip {
  const result = beispielreise()
  result.originPlaceId = ZRH
  result.stages = [
    { ...result.stages[0], placeId: FLR, countryCode: 'IT' },
    { ...result.stages[1], placeId: ROM, countryCode: 'IT' },
  ]
  result.days = result.days.map((day, index) => ({ ...day, items: index === 0 ? items : [] }))
  return result
}

function flightFinding(report: ReturnType<typeof tripAuditV1>, sectionId: string) {
  return report.findings.find((finding) => finding.domain === 'flights' && finding.refs.sectionId === sectionId)
}

test('F05: selected rail on one canonical stage edge removes only that false flight gap', () => {
  const bare = threeCity()
  const input = threeCity([punkt('rail-1', { title: 'Zug Florenz–Rom' })])
  const before = structuredClone(input)
  freeze(input)
  assert.equal(flightFinding(tripAuditV1(bare), 'connection:stage-1:stage-2')?.state, 'known_gap')
  const report = tripAuditV1(input)
  const covered = flightFinding(report, 'connection:stage-1:stage-2')
  assert.equal(covered?.state, 'unknown')
  assert.equal(covered?.title, 'Bodenverbindung geplant, Flugbedarf nicht belegt')
  assert.match(covered?.detail ?? '', /ausgewählt, nicht als gebucht markiert/)
  assert.doesNotMatch(covered?.detail ?? '', /Anbieterbestätigung ist erfolgt|bestätigt gebucht|Kein Flug/)
  assert.deepEqual(covered?.evidence, { status: 'open', date: '2026-09-15', reasons: ['ground_selected', 'flight_necessity_unknown'] })
  assert.equal(flightFinding(report, 'outbound:stage-1')?.title, 'Kein Flug für diesen Abschnitt im Plan')
  assert.equal(flightFinding(report, 'return:stage-2')?.title, 'Kein Flug für diesen Abschnitt im Plan')
  const flights = report.sections.find((section) => section.domain === 'flights')!
  const mobility = report.sections.find((section) => section.domain === 'mobility')!
  assert.equal(flights.coverage, 'partial')
  assert.match(flights.detail, /0 Abschnitte ausgewählt; 0 von dir als gebucht markiert/)
  assert.match(flights.detail, /1 Abschnitt hat eine gespeicherte Bodenverbindung/)
  assert.match(mobility.detail, /1 Abschnitte ausgewählt; 0 von dir als gebucht markiert/)
  assert.equal(report.findings.some((finding) => finding.domain === 'mobility' && finding.refs.sectionId === 'connection:stage-1:stage-2'), false)
  assert.deepEqual(
    tripAuditV1(bare).findings.filter((finding) => finding.domain === 'lodging'),
    report.findings.filter((finding) => finding.domain === 'lodging'),
  )
  assert.equal(report.sections.find((section) => section.domain === 'time')?.source, 'tripZeitpruefung')
  assert.deepEqual(report, tripAuditV1(input, input.ohneTag))
  assert.deepEqual(input, before)
  const html = renderToStaticMarkup(createElement(TripAuditFinding, { finding: covered! }))
  assert.match(html, /Unbekannt/)
  assert.match(html, /Zug Florenz–Rom/)
  assert.doesNotMatch(html, /Planungslücke|Kein Flug/)
})

test('F05: user-marked booked rail stays a user mark and does not book the flight section', () => {
  const report = tripAuditV1(threeCity([punkt('rail-1', {
    bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-09-01T08:00:00.000Z',
  })]))
  const covered = flightFinding(report, 'connection:stage-1:stage-2')
  assert.match(covered?.detail ?? '', /von dir als gebucht markiert/)
  assert.deepEqual(covered?.evidence, { status: 'open', date: '2026-09-15', reasons: ['ground_user_marked_booked', 'flight_necessity_unknown'] })
  assert.match(report.sections.find((section) => section.domain === 'flights')!.detail, /0 Abschnitte ausgewählt; 0 von dir als gebucht markiert/)
  assert.match(report.sections.find((section) => section.domain === 'mobility')!.detail, /0 Abschnitte ausgewählt; 1 von dir als gebucht markiert/)
})

test('F05: name, alias, direction, mode, stage, date and duplicate evidence fail closed', () => {
  const named = threeCity([punkt('rail-1', { originPlaceId: null, destinationPlaceId: null, originName: 'Florenz', destinationName: 'Rom' })])
  assert.equal(mobilitaetsAbdeckung(named).kanten.find((row) => row.id === 'connection:stage-1:stage-2')?.status, 'selected')
  const namedFinding = flightFinding(tripAuditV1(named), 'connection:stage-1:stage-2')
  assert.equal(namedFinding?.state, 'unknown')
  assert.notEqual(namedFinding?.title, 'Bodenverbindung geplant, Flugbedarf nicht belegt')
  assert.deepEqual(namedFinding?.evidence, { status: 'open', date: '2026-09-15', reasons: ['flight_obligation_not_established'] })

  const sameName = threeCity([punkt('rail-1', {
    originPlaceId: null, destinationPlaceId: null, originName: 'Paris', destinationName: 'Paris',
  })])
  sameName.stages[0].name = 'Paris'
  sameName.stages[1].name = 'Paris'
  sameName.stages[0].placeId = 'place:paris-fr'
  sameName.stages[1].placeId = 'place:paris-us'
  sameName.stages[1].countryCode = 'US'
  const sameNameFinding = flightFinding(tripAuditV1(sameName), 'connection:stage-1:stage-2')
  assert.equal(sameNameFinding?.title, 'Verbindung nicht vollständig bewertbar')
  assert.equal(sameNameFinding?.state, 'unknown')

  for (const changes of [
    { originPlaceId: ROM, destinationPlaceId: FLR, originName: 'Rom', destinationName: 'Florenz' },
    { originPlaceId: 'airport:FLR', destinationPlaceId: 'airport:FCO' },
    { mobilityMode: null },
    { stageId: null },
    { stageId: 'stage-1' },
    { startsOn: '2026-09-16', endsOn: '2026-09-16' },
  ] as const) {
    const report = tripAuditV1(threeCity([punkt('rail-1', changes)]))
    const finding = flightFinding(report, 'connection:stage-1:stage-2')
    assert.notEqual(finding?.title, 'Bodenverbindung geplant, Flugbedarf nicht belegt', JSON.stringify(changes))
    assert.notEqual(finding?.state, 'known_gap', JSON.stringify(changes))
  }

  const car = tripAuditV1(threeCity([punkt('car-1', {
    kind: 'rental_car', mobilityMode: null, mobilityEvidence: null, title: 'Mietwagen',
  })]))
  assert.equal(flightFinding(car, 'connection:stage-1:stage-2')?.state, 'known_gap')

  const duplicate = tripAuditV1(threeCity([punkt('rail-1'), punkt('rail-2', { title: 'Zweiter Zug' })]))
  assert.equal(duplicate.findings.some((finding) => finding.domain === 'flights' && finding.state === 'known_gap'), false)
  assert.equal(duplicate.findings.some((finding) => finding.title.startsWith('Bodenverbindung geplant')), false)

  const undated = threeCity()
  undated.stages[1].arrivalDate = null
  const undatedFinding = flightFinding(tripAuditV1(undated), 'connection:stage-1:stage-2')
  assert.equal(undatedFinding?.state, 'unknown')
  assert.equal(undatedFinding?.evidence && 'reasons' in undatedFinding.evidence, false)
  assert.equal(flightFinding(tripAuditV1(undated), 'outbound:stage-1')?.state, 'known_gap')
})

test('F05: repeated directed pair, projection order, country and an overnight stay do not invent flight truth', () => {
  const repeated = threeCity([punkt('rail-1', { startsOn: '2026-09-14', endsOn: '2026-09-14' })])
  const florence = repeated.stages[0]
  const rome = repeated.stages[1]
  repeated.stages = [
    { ...florence, arrivalDate: '2026-09-12', departureDate: '2026-09-13' },
    { ...rome, arrivalDate: '2026-09-14', departureDate: '2026-09-14' },
    { ...florence, id: 'stage-3', position: 3, arrivalDate: '2026-09-15', departureDate: '2026-09-15' },
    { ...rome, id: 'stage-4', position: 4, arrivalDate: '2026-09-16', departureDate: '2026-09-16' },
  ]
  const repeatedReport = tripAuditV1(repeated)
  for (const sectionId of ['connection:stage-1:stage-2', 'connection:stage-3:stage-4']) {
    const finding = flightFinding(repeatedReport, sectionId)
    assert.equal(finding?.state, 'unknown', sectionId)
    assert.deepEqual(finding?.evidence && 'reasons' in finding.evidence ? finding.evidence.reasons : [], ['flight_obligation_not_established'])
  }
  assert.equal(flightFinding(repeatedReport, 'connection:stage-2:stage-3')?.state, 'known_gap')

  const swapped = threeCity()
  swapped.stages = [
    { ...swapped.stages[0], position: 2 },
    { ...swapped.stages[1], position: 1 },
  ]
  assert.notDeepEqual(flugAbdeckung(swapped).abschnitte.map((row) => row.id), mobilitaetsAbdeckung(swapped).kanten.map((row) => row.id))
  const swappedReport = tripAuditV1(swapped)
  assert.equal(swappedReport.findings.some((finding) => finding.domain === 'flights' && finding.state === 'known_gap'), false)
  assert.equal(swappedReport.sections.find((section) => section.domain === 'flights')?.coverage, 'partial')

  const abroad = threeCity([punkt('rail-1')])
  abroad.stages[1].countryCode = 'FR'
  assert.equal(flightFinding(tripAuditV1(abroad), 'connection:stage-1:stage-2')?.title, 'Bodenverbindung geplant, Flugbedarf nicht belegt')
  const countriesOnly = threeCity()
  countriesOnly.stages[1].countryCode = 'FR'
  assert.equal(flightFinding(tripAuditV1(countriesOnly), 'connection:stage-1:stage-2')?.state, 'known_gap')

  const stay = tripAuditV1(threeCity([punkt('stay-1', {
    kind: 'stay', title: 'Hotel Florenz', startsOn: '2026-09-12', endsOn: '2026-09-14', stageId: 'stage-1',
    mobilityMode: null, mobilityEvidence: null, originPlaceId: null, destinationPlaceId: null, originName: null, destinationName: null,
  })]))
  assert.equal(flightFinding(stay, 'connection:stage-1:stage-2')?.state, 'known_gap')
  assert.equal(stay.findings.some((finding) => finding.domain === 'lodging'), true)
})

test('F05: a conflicting or genuinely selected flight stays flight evidence', () => {
  const conflict = tripAuditV1(threeCity([
    punkt('rail-1'),
    punkt('flight-1', { kind: 'flight', title: 'Unbewiesener Flug', mobilityMode: null, mobilityEvidence: null, originPlaceId: null, destinationPlaceId: null, originName: null, destinationName: null, stageId: 'stage-1' }),
  ]))
  assert.equal(conflict.findings.some((finding) => finding.title.startsWith('Bodenverbindung geplant')), false)
  assert.equal(conflict.findings.some((finding) => finding.domain === 'flights' && finding.state === 'known_gap'), false)
  assert.equal(conflict.sections.find((section) => section.domain === 'flights')?.coverage, 'partial')

  const route: FlugRouteItinerary = {
    v: 1, type: 'flight_route_itinerary',
    legs: [{ segments: [{
      origin: flughafenPunkt('ZRH', TEST_FLUGHAFEN_REFS),
      destination: flughafenPunkt('BKK', TEST_FLUGHAFEN_REFS),
      departureDate: '2026-09-12', departureTime: '10:00', arrivalDate: '2026-09-12', arrivalTime: '18:00',
    }] }],
  }
  const stored = beispielreise()
  stored.originPlaceId = 'airport:ZRH'
  stored.stages = [{ ...stored.stages[0], name: 'Bangkok', countryCode: 'TH', placeId: 'geonames:1609350', arrivalDate: '2026-09-12', departureDate: '2026-09-14' }]
  stored.days = stored.days.map((day) => ({ ...day, stageId: 'stage-1', items: [] }))
  stored.days[0].items = [punkt('flight-1', {
    kind: 'flight', title: 'ZRH → BKK', startsOn: '2026-09-12', endsOn: '2026-09-12', startsAt: '10:00', endsAt: '18:00',
    stageId: 'stage-1', mobilityMode: null, mobilityEvidence: null, originPlaceId: null, destinationPlaceId: null,
    originName: null, destinationName: null, routeItinerary: route,
  })]
  const selected = tripAuditV1(stored)
  assert.equal(selected.evaluation === 'incomplete', false)
  assert.equal(flugAbdeckung(stored).abschnitte.find((row) => row.id === 'outbound:stage-1')?.status, 'selected')
  assert.match(selected.sections.find((section) => section.domain === 'flights')!.detail, /1 Abschnitte ausgewählt; 0 von dir als gebucht markiert/)
  assert.equal(selected.findings.some((finding) => finding.domain === 'flights' && (finding.title.startsWith('Bodenverbindung geplant') || finding.refs.sectionId === 'outbound:stage-1')), false)
  stored.days[0].items[0].bookingStatus = 'booked'
  stored.days[0].items[0].bookingSource = 'user'
  stored.days[0].items[0].bookingConfirmedAt = '2026-09-01T08:00:00.000Z'
  const booked = tripAuditV1(stored)
  assert.match(booked.sections.find((section) => section.domain === 'flights')!.detail, /0 Abschnitte ausgewählt; 1 von dir als gebucht markiert/)
  assert.equal(booked.findings.some((finding) => finding.title.startsWith('Bodenverbindung geplant')), false)
})

test('F05: guest override and account storage use the same rail proof and do not mutate the trip', () => {
  const base = threeCity()
  const selected = [punkt('rail-1', { dayId: null, title: 'Zug Florenz–Rom' })]
  const before = structuredClone({ base, selected })
  const viaOverride = tripAuditV1(base, selected)
  const viaStored = tripAuditV1({ ...base, ohneTag: selected })
  assert.deepEqual(viaOverride, viaStored)
  assert.equal(flightFinding(viaOverride, 'connection:stage-1:stage-2')?.title, 'Bodenverbindung geplant, Flugbedarf nicht belegt')
  assert.equal(flightFinding(tripAuditV1(base), 'connection:stage-1:stage-2')?.state, 'known_gap')
  assert.deepEqual({ base, selected }, before)
})
