import assert from 'node:assert/strict'
import test from 'node:test'
import { mapStopDay, mapWireStops, tripMapStops } from '@/lib/maps/trip-map'
import { mapPilotConfig, type MapEnvironment } from '@/lib/maps/config'
import { tripMapFrameResponse } from '@/lib/maps/frame'
import { referenzReise, wiederholteEtappenReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'

// Existing synthetic trip fixtures are tests only, never product content.
test('every stored stage survives projection; missing/invalid coordinates are never inferred', () => {
  const trip = referenzReise()
  trip.stages[0].latitude = 0; trip.stages[0].longitude = 0
  trip.stages[1].latitude = 91; trip.stages[1].longitude = 10
  const before = JSON.stringify(trip)
  const stops = tripMapStops(trip)
  assert.equal(stops.length, trip.stages.length)
  assert.deepEqual(stops.map((s) => s.position), [{ lat: 0, lng: 0 }, null, null])
  assert.equal(JSON.stringify(trip), before)
  assert.deepEqual(Object.keys(mapWireStops(stops)[0]).sort(), ['index', 'label', 'lat', 'lng'])
  assert.equal(mapStopDay(stops[0], 'day-4'), 'day-4')
  assert.equal(mapStopDay(stops[1], 'day-4'), 'day-9')
  for (const bad of [NaN, Infinity, -Infinity, -91]) {
    trip.stages[0].latitude = bad
    assert.equal(tripMapStops(trip)[0].position, null)
  }
})

test('repeated visits retain their actual day; ambiguous and unassigned stages do not manufacture one', () => {
  const trip = wiederholteEtappenReise()
  const stops = tripMapStops(trip)
  const repeated = stops.find((s) => s.dayIds.length > 1)!
  assert.ok(repeated)
  const last = repeated.dayIds.at(-1)!
  assert.equal(mapStopDay(repeated, last), last)
  trip.stages.push({ ...trip.stages[0], position: 99 })
  assert.deepEqual(tripMapStops(trip).filter((s) => s.stageId === trip.stages[0].id).map((s) => s.dayIds), [[], []])
  trip.days = trip.days.map((d) => ({ ...d, stageId: null }))
  assert.ok(tripMapStops(trip).every((s) => mapStopDay(s, last) === null))
})

const now = Date.parse('2026-11-04T08:00:00Z')
const origin = 'https://maps-pilot.example.vercel.app'
const env: MapEnvironment = {
  VERCEL_ENV: 'preview', JETNITY_MAPS_ENABLED: 'true', JETNITY_MAPS_ALLOWED_ORIGIN: origin,
  JETNITY_MAPS_PILOT_EXPIRES_AT: '2026-11-04T08:30:00Z',
  GOOGLE_MAPS_BROWSER_KEY: 'test-key-never-sent-to-google', GOOGLE_MAPS_MAP_ID: '12345678abcdef00',
}

test('release is source-closed, with exact-host, preview, explicit switch, key, map ID and expiry gates', () => {
  assert.equal(mapPilotConfig(env, origin, now), null)
  assert.ok(mapPilotConfig(env, origin, now, true))
  for (const patch of [
    { VERCEL_ENV: 'production' }, { VERCEL_ENV: undefined }, { JETNITY_MAPS_ENABLED: 'false' },
    { JETNITY_MAPS_ALLOWED_ORIGIN: 'https://*.vercel.app' }, { GOOGLE_MAPS_BROWSER_KEY: '' },
    { GOOGLE_MAPS_MAP_ID: 'DEMO_MAP_ID' }, { JETNITY_MAPS_PILOT_EXPIRES_AT: 'invalid' },
    { JETNITY_MAPS_PILOT_EXPIRES_AT: '2026-11-04T08:00:00Z' },
    { JETNITY_MAPS_PILOT_EXPIRES_AT: '2026-11-04T10:00:00Z' },
  ]) assert.equal(mapPilotConfig({ ...env, ...patch }, origin, now, true), null)
  for (const wrong of ['https://jetnity.com', 'https://maps-pilot.example.vercel.app.evil.test', origin + '/path', origin.replace('https:', 'http:')]) {
    assert.equal(mapPilotConfig({ ...env, JETNITY_MAPS_ALLOWED_ORIGIN: wrong }, wrong, now, true), null)
  }
})

test('real HTTP handler returns no key or external script even with every environment switch set', async () => {
  const nonces = new Set<string>()
  for (const headers of [new Headers(), new Headers({ 'sec-fetch-dest': 'iframe', 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'navigate' })]) {
    const response = tripMapFrameResponse(new Request(origin + '/embed/trip-map', { headers }), env)
    const html = await response.text()
    assert.ok(!html.includes(env.GOOGLE_MAPS_BROWSER_KEY!))
    assert.ok(!html.includes('maps.googleapis.com'))
    assert.match(html, /noch nicht freigeschaltet/)
    assert.match(response.headers.get('content-security-policy')!, /sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox/)
    assert.ok(!response.headers.get('content-security-policy')!.includes('allow-same-origin'))
    const nonce = /script-src 'nonce-([a-f0-9]{32})'/.exec(response.headers.get('content-security-policy')!)?.[1]
    assert.ok(nonce)
    nonces.add(nonce)
    assert.ok(html.includes(`src="/maps/trip-map.js" nonce="${nonce}"`))
    assert.ok(html.includes(`<style nonce="${nonce}">`))
    assert.ok(!response.headers.get('content-security-policy')!.includes('unsafe-inline'))
    assert.match(response.headers.get('content-security-policy')!, /worker-src blob:/)
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin')
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
  assert.equal(nonces.size, 2)
})
