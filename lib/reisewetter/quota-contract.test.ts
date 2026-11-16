import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { readWeatherQuota, weatherConsentPresent } from './quota-contract.ts'

test('only the exact positive database acknowledgement admits a request', () => {
  assert.deepEqual(readWeatherQuota({schema:1,allowed:true,retryAfterSec:0}), {allowed:true,retryAfterSec:0})
  assert.deepEqual(readWeatherQuota({schema:1,allowed:false,retryAfterSec:60}), {allowed:false,retryAfterSec:60})
  for (const value of [null, true, {}, [], {allowed:true}, {schema:2,allowed:true,retryAfterSec:0},
    {schema:1,allowed:'true',retryAfterSec:0}, {schema:1,allowed:true,retryAfterSec:1},
    {schema:1,allowed:false,retryAfterSec:0}, {schema:1,allowed:false,retryAfterSec:86401},
    {schema:1,allowed:false,retryAfterSec:NaN}, {schema:1,allowed:true,retryAfterSec:0,extra:true}]) {
    assert.equal(readWeatherQuota(value), null)
  }
})

test('missing, foreign and duplicated consent markers reject', () => {
  const h = () => new Headers({'x-jetnity-weather-consent':'v1','sec-fetch-site':'same-origin'})
  assert.equal(weatherConsentPresent(h()),true)
  for (const name of ['x-jetnity-weather-consent','sec-fetch-site']) {
    const absent = h(); absent.delete(name); assert.equal(weatherConsentPresent(absent),false)
    const doubled = h(); doubled.append(name,'v1'); assert.equal(weatherConsentPresent(doubled),false)
  }
  assert.equal(weatherConsentPresent(new Headers({'x-jetnity-weather-consent':'v1','sec-fetch-site':'cross-site'})),false)
})

test('the actual UI and route preserve consent, cancellation and the global no-fallback boundary', () => {
  const read = (file:string) => readFileSync(new URL('../../'+file,import.meta.url),'utf8')
  const ui = read('components/trips/wetter/Tageswetter.tsx')
  const route = read('app/api/reisewetter/route.ts')
  const gate = read('components/trips/wetter/WetterZustimmung.tsx')
  const map = read('components/trips/reisekarte/Reisekarte.tsx')
  assert.match(ui, /return <WetterSchutz><WetterFuerOrt/)
  assert.match(ui, /'x-jetnity-weather-consent': 'v1'/)
  assert.match(ui, /return \(\) => ctrl.abort\(\)/)
  assert.match(gate, /useState<Consent>\('pending'\)/)
  assert.match(gate, /context.consent !== 'granted'/)
  assert.match(map, /granted && <iframe/)
  assert.match(map, /Zustimmen und Karte laden/)
  assert.ok(route.indexOf('weatherConsentPresent(request.headers)') < route.indexOf('await reserveGlobalWeatherRequest()'))
  assert.ok(route.indexOf('await reserveGlobalWeatherRequest()') < route.indexOf('let eintrag = cache.get(id)'))
  assert.doesNotMatch(route, /InMemoryCostGuard|service_role|serviceRole/)
})
