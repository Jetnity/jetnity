import test from 'node:test'
import assert from 'node:assert/strict'
import { APP_MAP_ORIGIN, mapPilotConfig } from './config'
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
