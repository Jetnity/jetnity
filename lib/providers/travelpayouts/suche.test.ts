import test from 'node:test'
import assert from 'node:assert/strict'
import {
  flugKontext,
  flugVergleichUrl,
  flugWidgetOrigin,
  type FlugVergleichEingabe,
} from './suche'
import { flugDatenschutzErlaubt, flugRahmenNachricht } from './rahmen'
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import type { Trip } from '@/types/trips'

const origin = 'https://jetnity-flights.example'
const heute = '2026-11-11'
const basis: FlugVergleichEingabe = {
  art: 'gabel',
  von: 'ZRH',
  nach: 'BKK',
  rueckflugAb: 'HKT',
  hin: '2026-11-15',
  rueck: '2026-12-06',
  erwachsene: 2,
  kinder: 0,
  babys: 0,
  kabine: 'economy',
}
const query = (e: FlugVergleichEingabe) => {
  const r = flugVergleichUrl(e, origin, heute)
  assert.ok('url' in r)
  return new URL(r.url).searchParams
}
test('real verified open-jaw route and passenger count, with exact airports', () => {
  const q = query(basis)
  assert.equal(q.get('flightSearch'), 'ZRH1511BKK-HKT06122')
  assert.equal(q.get('origin_airports'), '0,1')
  assert.equal(q.get('destination_airports'), '0,1')
  assert.equal([...q].length, 3)
})
test('roundtrip, one-way, cabin and child/infant encoding', () => {
  assert.equal(
    query({ ...basis, art: 'retour' }).get('flightSearch'),
    'ZRH1511BKK06122',
  )
  assert.equal(
    query({
      ...basis,
      art: 'einfach',
      kabine: 'business',
      kinder: 1,
      babys: 1,
    }).get('flightSearch'),
    'ZRH1511BKKc211',
  )
  assert.equal(
    query({ ...basis, art: 'einfach', babys: 1 }).get('flightSearch'),
    'ZRH1511BKK201',
  )
  assert.equal(query({ ...basis, art: 'einfach' }).get('origin_airports'), '0')
})
test('year rollover is supported but dates outside the unambiguous horizon fail closed', () => {
  assert.ok(
    'url' in
      flugVergleichUrl(
        { ...basis, hin: '2026-12-29', rueck: '2027-01-10' },
        origin,
        heute,
      ),
  )
  for (const patch of [
    { hin: '2026-02-30' },
    { hin: '2026-11-10' },
    { hin: '2027-11-15', rueck: '2027-12-06' },
    { rueck: '2026-11-14' },
    { hin: '2027-02-29' },
  ]) {
    assert.ok(
      'fehler' in flugVergleichUrl({ ...basis, ...patch }, origin, heute),
    )
  }
})
test('unconfirmed airports, unsupported cabins and impossible occupancy are rejected', () => {
  for (const patch of [
    { von: 'Zürich' },
    { nach: 'ZRH' },
    { rueckflugAb: undefined },
    { erwachsene: 0 },
    { erwachsene: 2.5 },
    { kinder: -1 },
    { babys: 3 },
    { kinder: 8 },
    { kabine: 'first' },
  ]) {
    assert.ok(
      'fehler' in
        flugVergleichUrl(
          { ...basis, ...patch } as FlugVergleichEingabe,
          origin,
          heute,
        ),
    )
  }
})
test('provider document must have its own secure origin; no query or credential injection', () => {
  for (const value of [
    'https://jetnity.com',
    'https://www.jetnity.com',
    'http://external.test',
    'javascript:alert(1)',
    'https://user:secret@external.test',
    'https://external.test/path',
    'https://external.test/?url=evil',
    'https://external.test/#x',
  ])
    assert.equal(flugWidgetOrigin(value), null)
  assert.equal(flugWidgetOrigin(undefined), null)
  assert.equal(flugWidgetOrigin(origin + '/'), origin)
  assert.equal(
    flugWidgetOrigin('http://127.0.0.1:3990'),
    'http://127.0.0.1:3990',
  )
})
test('trip edits invalidate flight state without tying it to unrelated budget/notes', () => {
  const trip = {
    id: 'trip-x',
    origin: 'Zürich',
    originPlaceId: 'iata:ZRH',
    startDate: basis.hin,
    endDate: basis.rueck,
    travellers: 2,
    stages: [
      {
        id: 'bkk',
        name: 'Bangkok',
        placeId: 'iata:BKK',
        latitude: 13,
        longitude: 100,
      },
    ],
  } as Trip
  assert.notEqual(flugKontext(trip), flugKontext({ ...trip, travellers: 3 }))
  assert.notEqual(
    flugKontext(trip),
    flugKontext({ ...trip, endDate: '2027-01-01' }),
  )
  assert.notEqual(
    flugKontext(trip),
    flugKontext({ ...trip, stages: [{ ...trip.stages[0], name: 'Phuket' }] }),
  )
})
test('frame messages require exact source, origin and known type/status', () => {
  const source = {} as Window
  const event = {
    source,
    origin,
    data: { type: 'jetnity-flight-widget', status: 'bereit' },
  }
  assert.equal(flugRahmenNachricht(event, source, origin), 'bereit')
  assert.equal(
    flugRahmenNachricht({ ...event, source: {} as Window }, source, origin),
    null,
  )
  assert.equal(
    flugRahmenNachricht(
      { ...event, origin: 'https://attacker.example' },
      source,
      origin,
    ),
    null,
  )
  assert.equal(
    flugRahmenNachricht(
      { ...event, data: { type: 'jetnity-flight-widget', status: 'booked' } },
      source,
      origin,
    ),
    null,
  )
})
test('explicit privacy denial, malformed or disappearing CMP must block provider', () => {
  const cmp = (allow: boolean) => ({
    hasExplicitConsent: () => true,
    getConsent: () => allow,
    getAllConsents: () =>
      Object.fromEntries(CMP_CATEGORIES.map((c) => [c, allow])),
  })
  assert.equal(flugDatenschutzErlaubt(cmp(true), true), true)
  assert.equal(flugDatenschutzErlaubt(cmp(false), false), false)
  assert.equal(flugDatenschutzErlaubt(undefined, true), false)
  assert.equal(flugDatenschutzErlaubt({}, false), false)
  assert.equal(flugDatenschutzErlaubt(undefined, false), true)
})
