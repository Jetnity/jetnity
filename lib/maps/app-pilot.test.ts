import { planstrecken, abreiseId } from './planstrecken'
import { routeModell } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import test from 'node:test'
import assert from 'node:assert/strict'
import { APP_MAP_ORIGIN, INCIDENT_DEV_MAP_ORIGIN, mapPilotConfig } from './config'
import { PARIS_ORTE, reiseKarteninhalt, wegauswahl } from './reisekarte'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'

test('the app map is limited to its branch, exact host and one-hour interval', () => {
  const now = Date.now()
  const env = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feat/private-travel-ux-20261113',
    GOOGLE_MAPS_MAP_ID: '12345678abcdef00', GOOGLE_MAPS_BROWSER_KEY: 'test-browser-value-private',
    JETNITY_MAPS_ENABLED: 'true', JETNITY_MAPS_ALLOWED_ORIGIN: APP_MAP_ORIGIN,
    JETNITY_MAPS_PILOT_EXPIRES_AT: new Date(now + 3600000).toISOString() }
  assert.ok(mapPilotConfig(env, APP_MAP_ORIGIN, now))
  assert.equal(mapPilotConfig(env, APP_MAP_ORIGIN, now - 1), null)
  assert.equal(mapPilotConfig(env, APP_MAP_ORIGIN, now + 3600000), null)
  assert.equal(mapPilotConfig({ ...env, VERCEL_ENV: 'production' }, APP_MAP_ORIGIN, now), null)
  assert.equal(mapPilotConfig({ ...env, VERCEL_GIT_COMMIT_REF: 'main' }, APP_MAP_ORIGIN, now), null)
  assert.equal(mapPilotConfig(env, 'https://jetnity.com', now), null)
})

test('production serves a non-expiring map only for the main deployment on jetnity.com', () => {
  const origin = 'https://jetnity.com'
  const env = { VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main', JETNITY_MAPS_ENABLED: 'true',
    JETNITY_MAPS_ALLOWED_ORIGIN: origin, GOOGLE_MAPS_MAP_ID: '12345678abcdef00', GOOGLE_MAPS_BROWSER_KEY: 'test-production-browser-key' }
  assert.equal(mapPilotConfig(env, origin)?.expiresAt, null)
  assert.equal(mapPilotConfig(env, APP_MAP_ORIGIN), null)
  assert.equal(mapPilotConfig({ ...env, VERCEL_GIT_COMMIT_REF: 'feature' }, origin), null)
  assert.equal(mapPilotConfig({ ...env, JETNITY_MAPS_ALLOWED_ORIGIN: APP_MAP_ORIGIN }, origin), null)
  assert.equal(mapPilotConfig({ ...env, JETNITY_MAPS_ENABLED: 'false' }, origin), null)
  assert.equal(mapPilotConfig({ ...env, GOOGLE_MAPS_BROWSER_KEY: undefined }, origin), null)
})

test('sample landmarks remain separate from real hotels whose coordinates are unknown', () => {
  const reise = referenzReise()
  const sample = reiseKarteninhalt({ ...reise, id: 'paris-beispiel' })
  assert.equal(sample.orte.filter(o => o.tage.includes('museen')).length, 3)
  assert.ok(PARIS_ORTE.every(o => o.position))
  const real = reiseKarteninhalt(reise)
  for (const ort of real.orte.filter(o => o.art !== 'Etappe')) assert.equal(ort.position, null)
  assert.ok(real.orte.every(o => !PARIS_ORTE.some(s => s.id === o.id)))
})

test('Paris opens the airport transfer and the adjacent museum walks in travel order', () => {
  for (const [fokus, von, nach] of [
    ['cdg-t2', 'cdg-t2', 'normandy'], ['normandy', 'normandy', 'louvre'],
    ['louvre', 'normandy', 'louvre'], ['orsay', 'louvre', 'orsay'],
  ]) {
    const { start, ziel } = wegauswahl(PARIS_ORTE, fokus)
    assert.equal(start?.id, von)
    assert.equal(ziel?.id, nach)
  }
})

test('Bangkok itinerary, selected leg, missing coordinates and optional return use the route list', () => {
  const trip = referenzReise()
  const route = routeModell(trip).zeilen
  const { orte } = reiseKarteninhalt(trip)
  for (const [index, ort] of orte.entries()) if (ort.art === 'Etappe') ort.position = { lat: 12 + index, lng: 100 }
  const edges = planstrecken(orte, route, { vonId: 'stage-kc', nachId: 'stage-hkt' })
  assert.deepEqual(edges, [{ von: 0, nach: 1, aktiv: false }, { von: 1, nach: 2, aktiv: true }])
  const start = orte.length
  orte.push({ id: abreiseId, name: 'Zürich', art: 'Abreise', position: { lat: 47.37, lng: 8.54 }, tage: [] })
  const all = planstrecken(orte, route, undefined, true, true)
  assert.deepEqual(all.map(e => [e.von, e.nach]), [[start, 0], [0, 1], [1, 2], [2, start]])
  orte[1].position = null
  assert.deepEqual(planstrecken(orte, route), [])
})

test('incident QA map can mirror live only with exact Preview origin, deliberate activation and short expiry', () => {
  const now = Date.parse('2026-11-21T09:00:00Z')
  const origin = INCIDENT_DEV_MAP_ORIGIN
  const env = {
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: 'fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120',
    JETNITY_MAPS_ENABLED: 'true',
    JETNITY_MAPS_ALLOWED_ORIGIN: origin,
    JETNITY_MAPS_PILOT_EXPIRES_AT: new Date(now + 30 * 60_000).toISOString(),
    GOOGLE_MAPS_BROWSER_KEY: 'test-qa-placeholder-never-sent',
    GOOGLE_MAPS_MAP_ID: '12345678abcdef00',
  }
  assert.ok(mapPilotConfig(env, origin, now))
  for (const patch of [
    { VERCEL_ENV: 'production' },
    { VERCEL_GIT_COMMIT_REF: 'main' },
    { VERCEL_GIT_COMMIT_REF: 'feat/unrelated' },
    { JETNITY_MAPS_ENABLED: 'false' },
    { JETNITY_MAPS_ALLOWED_ORIGIN: 'https://jetnity.com' },
    { GOOGLE_MAPS_BROWSER_KEY: undefined },
    { GOOGLE_MAPS_MAP_ID: undefined },
    { JETNITY_MAPS_PILOT_EXPIRES_AT: new Date(now + 2 * 3600_000).toISOString() },
  ]) assert.equal(mapPilotConfig({ ...env, ...patch }, origin, now), null)
  assert.equal(mapPilotConfig(env, 'https://jetnity.com', now), null)
})
