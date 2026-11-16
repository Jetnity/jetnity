import assert from 'node:assert/strict'
import test from 'node:test'
import { GET } from '../../app/api/reisewetter/route'
import { APP_MAP_ORIGIN } from '../maps/config'
import { vorhersageLesen, wetterAmTag, wetterZurUhrzeit } from './vorhersage'

const unix = (utc: string) => Date.parse(utc) / 1000
const slot = { dt: unix('2026-11-15T21:00Z'), main: { temp: 8.4 }, pop: 0, wind: { speed: 5 }, visibility: 9700 }
const wetter = { city: { timezone: 19800, sunset: unix('2026-11-15T12:30Z') }, list: [slot] }

test('Datumswechsel in Ortszeit, Wind in km/h und 0 % bleiben erhalten', () => {
  const daten = vorhersageLesen(wetter)!
  assert.equal(daten.zeiten[0].zeit, '2026-11-16T02:30')
  assert.equal(daten.zeiten[0].regen, 0)
  assert.equal(daten.zeiten[0].wind, 18)
  assert.equal(wetterAmTag(daten, '2026-11-16').untergang, null)
  assert.equal(wetterAmTag(daten, '2026-11-15').untergang, '18:00')
  assert.equal(wetterAmTag(daten, '2026-11-17').zeiten.length, 0)
  assert.equal(wetterZurUhrzeit(daten.zeiten, '04:00'), daten.zeiten[0])
  assert.equal(wetterZurUhrzeit(daten.zeiten, '04:01'), null)
  assert.equal(wetterZurUhrzeit(daten.zeiten, '24:00'), null)
})

test('Fehlende Werte sind keine Nullprognose', () => {
  assert.equal(vorhersageLesen({ ...wetter, list: [{ ...slot, pop: null }] }), null)
  assert.equal(vorhersageLesen({ ...wetter, city: {} }), null)
})

test('consent, origin and bounded requests deny weather before any provider call', async t => {
  const env = process.env
  const keys = ['VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF', 'OPENWEATHER_API_KEY'] as const
  const old = keys.map(key => env[key])
  t.after(() => keys.forEach((key, i) => { if (old[i] === undefined) delete env[key]; else env[key] = old[i] }))
  const anfrage = (query = 'lat=48.85&lon=2.35', site = 'same-origin', origin = APP_MAP_ORIGIN, consent = false) =>
    new Request(origin + '/api/reisewetter?' + query, { headers: {
      'sec-fetch-site': site,
      ...(consent ? { 'x-jetnity-weather-consent': 'v1' } : {}),
    } })
  const adapter = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('upstream weather must never run before verified global admission')
  })
  env.OPENWEATHER_API_KEY = 'nur-test'
  env.VERCEL_GIT_COMMIT_REF = 'feat/private-travel-ux-20261113'
  env.VERCEL_ENV = 'production'
  assert.equal((await GET(anfrage())).status, 404)
  env.VERCEL_GIT_COMMIT_REF = 'main'
  assert.equal((await GET(anfrage('lat=47&lon=8', 'same-origin', 'https://jetnity.com'))).status, 403)
  assert.equal((await GET(anfrage(undefined, 'cross-site', APP_MAP_ORIGIN, true))).status, 403)
  assert.equal((await GET(anfrage('lat=91&lon=2', 'same-origin', APP_MAP_ORIGIN, true))).status, 400)
  assert.equal((await GET(anfrage('lat=48.85&lon=2.35&tripId=private', 'same-origin', APP_MAP_ORIGIN, true))).status, 400)
  assert.equal(adapter.mock.callCount(), 0)
  // Without a real authenticated customer AND an installed database quota,
  // a consent marker never authorizes a provider request in the test runtime.
  const response = await GET(anfrage(undefined, 'same-origin', APP_MAP_ORIGIN, true))
  assert.ok([401, 503].includes(response.status))
  assert.equal(adapter.mock.callCount(), 0)
  env.VERCEL_ENV = 'preview'
  env.VERCEL_GIT_COMMIT_REF = 'feat/private-travel-ux-20261113'
  assert.equal((await GET(anfrage(undefined, 'same-origin', 'https://jetnity.com', true))).status, 404)
  assert.equal(adapter.mock.callCount(), 0)
})
