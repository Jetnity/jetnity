import assert from 'node:assert/strict'
import { test } from 'node:test'
import { angebote, ausEtappe, partnerlink, tag, type Ort, type Katalog } from './katalog'
const z: Ort = { id: '373297', name: 'Zürich', country: 'CH', lat: 47.38, lng: 8.54 }
const m: Ort = { id: '388252', name: 'Mailand', country: 'IT', lat: 45.46, lng: 9.19 }
const katalog: Katalog = {
  date: '2026-11-09',
  publisher: '8110171',
  places: [z, m],
  routes: { '373297/388252': { train: [4726, 197], bus: [1365, 210] } },
}
test('directional prices, absent return route, and independent missing metrics', () => {
  assert.equal(angebote(katalog, z, m)[0]?.preis, 4726)
  assert.deepEqual(angebote(katalog, m, z), [])
  const partial = { ...katalog, routes: { '373297/388252': { ferry: [null, 50] as [null, number] } } }
  assert.deepEqual(angebote(partial, z, m), [{ mode: 'ferry', preis: null, minuten: 50 }])
})
test('name matching respects region, coordinates and ambiguous places', () => {
  const original = { ...z, id: 'reise:1' }
  assert.equal(ausEtappe([z, m], original), z)
  assert.deepEqual(ausEtappe([z, m], { ...original, country: 'IT' }).id, 'reise:1')
  assert.equal(ausEtappe([z, m], { ...original, lat: 8 }).id, 'reise:1')
  assert.equal(ausEtappe([z, { ...z, id: 'andere' }], original), original)
})
test('handoff includes the selected travel day, mode and currency, rejects invalid dates and duplicate stops', () => {
  const url = new URL(partnerlink(katalog.publisher, z, m, '2080-11-16', 'train')!)
  const target = new URL(url.searchParams.get('u')!)
  assert.equal(url.hostname, 'omio.sjv.io')
  assert.equal(target.searchParams.get('departurePosTerm'), 'Zürich')
  assert.equal(target.searchParams.get('arrivalPosTerm'), 'Mailand')
  assert.equal(target.searchParams.get('departureDate'), '2080-11-16')
  assert.equal(target.searchParams.get('travelMode'), 'TRAIN')
  assert.equal(target.searchParams.get('currency'), 'CHF')
  assert.equal(partnerlink(katalog.publisher, z, m, '2020-01-01'), null)
  assert.equal(partnerlink(katalog.publisher, z, z, '2080-11-16'), null)
  assert.equal(tag('2080-02-31'), false)
})
