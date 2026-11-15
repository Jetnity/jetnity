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

test('Vorschaugrenzen, gemeinsame Ortsabfrage und keine Schlüssel in Antworten', async t => {
  const env = process.env
  const keys = ['VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF', 'OPENWEATHER_API_KEY'] as const
  const old = keys.map(key => env[key])
  t.after(() => keys.forEach((key, i) => { if (old[i] === undefined) delete env[key]; else env[key] = old[i] }))
  const anfrage = (query = 'lat=48.85&lon=2.35', site = 'same-origin', origin = APP_MAP_ORIGIN) =>
    new Request(origin + '/api/reisewetter?' + query, { headers: { 'sec-fetch-site': site } })
  const adapter = t.mock.method(globalThis, 'fetch', async (url: URL) => {
    assert.equal(url.origin + url.pathname, 'https://api.openweathermap.org/data/2.5/forecast')
    assert.equal(url.searchParams.get('appid'), 'nur-test')
    return Response.json(wetter)
  })
  env.OPENWEATHER_API_KEY = 'nur-test'
  env.VERCEL_GIT_COMMIT_REF = 'feat/private-travel-ux-20261113'
  env.VERCEL_ENV = 'production'
  assert.equal((await GET(anfrage())).status, 404)
  env.VERCEL_ENV = 'preview'
  assert.equal((await GET(anfrage(undefined, 'same-origin', 'https://jetnity.com'))).status, 404)
  assert.equal((await GET(anfrage(undefined, 'cross-site'))).status, 403)
  assert.equal((await GET(anfrage('lat=91&lon=2'))).status, 400)
  assert.equal((await GET(anfrage('lat=48.85&lon=2.35&tripId=private'))).status, 400)
  assert.equal(adapter.mock.callCount(), 0)
  const antworten = await Promise.all([GET(anfrage()), GET(anfrage())])
  assert.equal(adapter.mock.callCount(), 1)
  for (const antwort of antworten) {
    assert.equal(antwort.status, 200)
    assert.deepEqual(await antwort.json(), vorhersageLesen(wetter))
  }
  adapter.mock.mockImplementation(async () => new Response(null, { status: 401 }))
  assert.equal((await GET(anfrage('lat=46&lon=7'))).status, 503)
  adapter.mock.mockImplementation(async () => Response.json(wetter))
  assert.equal((await GET(anfrage('lat=46&lon=7'))).status, 200)
})
