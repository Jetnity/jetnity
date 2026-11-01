import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { Trip } from '@/types/trips'
import { twelveGoKantenFuerReise } from '../affiliate/kanten'
import { timetableAnfrageFuerKante, timetableAnfrageSchema, type TimetableAnfrage } from './schema'
import { createTimetableService, timetableQuelle } from './service'
import { createTimetableHandler } from './http'

const html = readFileSync(new URL('./fixtures/bangkok-koh-chang-2026-11-01.html', import.meta.url), 'utf8')
const region: TimetableAnfrage = { country: 'TH', from: 'Bangkok', to: 'Ko Chang', fromPlaceId: 'geonames:1609348', toPlaceId: 'geonames:1611309' }
const city: TimetableAnfrage = { ...region, fromPlaceId: 'geonames:1609350' }
function reise(): Trip {
  return {
    id: 'trip-qa-bangkok-region', clientRef: 'synthetic-local-only', title: 'Region regression',
    origin: 'Zürich', originPlaceId: 'geonames:2657896', startDate: '2026-11-15', endDate: '2026-12-06',
    travellers: 2, currency: 'CHF', budgetAmount: null, status: 'draft', pace: 'calm', interests: [],
    travelWish: null, revision: 1, lastMutationId: null,
    stages: [
      { id: 'bangkok-region', name: 'Bangkok', placeId: region.fromPlaceId },
      { id: 'koh-chang', name: 'Ko Chang', placeId: region.toPlaceId },
      { id: 'phuket', name: 'Phuket', placeId: 'geonames:1151254' },
      { id: 'bangkok-repeat', name: 'Bangkok', placeId: region.fromPlaceId },
    ].map((stage, position) => ({ ...stage, position, countryCode: 'TH', arrivalDate: null,
      departureDate: null, latitude: null, longitude: null })),
    days: [], ohneTag: [], createdAt: '2026-11-01T18:00:00.000Z', updatedAt: '2026-11-01T18:00:00.000Z',
  }
}
function req(body: unknown): Request {
  return new Request('https://preview.example/api/mobility/twelve-go-timetable', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

test('saved ADM1 trip reaches the real timetable parser through adjacent edges, schema and HTTP without mutation', async () => {
  const trip = reise(), before = JSON.stringify(trip)
  const edges = twelveGoKantenFuerReise(trip)
  assert.deepEqual(edges.map((edge) => `${edge.vonName} → ${edge.nachName}`), [
    'Bangkok → Ko Chang', 'Ko Chang → Phuket', 'Phuket → Bangkok',
  ])
  const requests = edges.map(timetableAnfrageFuerKante)
  assert.deepEqual(requests[0], region)
  assert.ok(requests.every(Boolean))
  const urls: string[] = []
  const load = createTimetableService(async (url) => {
    urls.push(String(url))
    return new Response(html, { headers: { 'content-type': 'text/html' } })
  })
  const response = await createTimetableHandler(load, () => true)(req(requests[0]))
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.status, 'ready')
  assert.equal(data.routeLabel, 'Bangkok → Koh Chang')
  assert.deepEqual(data.options.map((option: { mode: string }) => option.mode), ['bus', 'charter', 'ferry', 'van'])
  assert.deepEqual(urls, ['https://12go.asia/de/timetable/TH/bangkok/koh-chang?embedded&css=yes&z=17323861&noreturn&lang=de&currency=CHF'])
  assert.equal(JSON.stringify(trip), before)
})

test('city and verified administrative region share provider scope/cache; reverse travel retains direction', async () => {
  assert.equal(timetableQuelle(region), timetableQuelle(city))
  const reverse: TimetableAnfrage = { ...region, from: 'Koh Chang', to: 'Bangkok', fromPlaceId: region.toPlaceId, toPlaceId: region.fromPlaceId }
  assert.equal(timetableQuelle(reverse), 'https://12go.asia/de/timetable/TH/koh-chang/bangkok?embedded&css=yes&z=17323861&noreturn&lang=de&currency=CHF')
  let calls = 0
  const load = createTimetableService(async () => {
    calls++
    return new Response(html, { headers: { 'content-type': 'text/html' } })
  })
  const results = await Promise.all([load(region), load(city)])
  assert.deepEqual(results[0], results[1])
  assert.equal(calls, 1)
})

test('different IDs in the same Bangkok provider region never request a Bangkok–Bangkok timetable', async () => {
  let calls = 0
  const handler = createTimetableHandler(async () => { calls++; throw new Error('must not load') }, () => true)
  for (const [fromPlaceId, toPlaceId] of [[region.fromPlaceId, city.fromPlaceId], [city.fromPlaceId, region.fromPlaceId]]) {
    const sameRegion = { ...region, fromPlaceId, toPlaceId, to: 'Bangkok' }
    assert.equal(timetableAnfrageSchema.safeParse(sameRegion).success, false)
    assert.throws(() => timetableQuelle(sameRegion))
    const trip = reise()
    trip.stages = trip.stages.slice(0, 2).map((stage, i) => ({ ...stage, name: 'Bangkok', placeId: i === 0 ? fromPlaceId! : toPlaceId! }))
    assert.deepEqual(twelveGoKantenFuerReise(trip).map(timetableAnfrageFuerKante), [null])
    assert.equal((await handler(req(sameRegion))).status, 400)
  }
  assert.equal(calls, 0)
})

test('ADM1 support does not turn name matches, country mismatches or Ranong into accepted identities', async () => {
  let calls = 0
  const handler = createTimetableHandler(async () => { calls++; throw new Error('must not load') }, () => true)
  for (const bad of [
    { ...region, fromPlaceId: 'geonames:9999999' },
    { ...region, fromPlaceId: 'geonames:1609349' },
    { ...region, from: 'Phuket' },
    { ...region, country: 'MY' },
    { ...region, toPlaceId: 'geonames:1153735' },
  ]) {
    assert.equal(timetableAnfrageSchema.safeParse(bad).success, false)
    assert.equal((await handler(req(bad))).status, 400)
  }
  assert.equal(calls, 0)
})
