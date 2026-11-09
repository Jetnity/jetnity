import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Trip, TripStage } from '@/types/trips'
import { reiseAbschnitte } from './reise'
import { ausEtappe } from './katalog'
function ort(id: string, name: string, position: number, placeId: string): TripStage {
  return {
    id,
    name,
    position,
    placeId,
    countryCode: 'TH',
    latitude: null,
    longitude: null,
    arrivalDate: null,
    departureDate: null,
  }
}
const bangkok = ort('b', 'Bangkok', 1, 'geonames:1609350'),
  koChang = ort('k', 'Ko Chang', 2, 'geonames:1611309')
const reise = {
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: '2026-11-15',
  stages: [koChang, bangkok],
} as Trip
test('the first intra-trip leg is selected and open dates remain open', () => {
  const [lokal, hin] = reiseAbschnitte(reise)
  assert.deepEqual([lokal?.von.name, lokal?.nach.name, lokal?.datum], ['Bangkok', 'Ko Chang', ''])
  assert.deepEqual([hin?.von.name, hin?.nach.name, hin?.datum], ['Zürich', 'Bangkok', '2026-11-15'])
  assert.equal(lokal?.von.placeId, bangkok.placeId)
})
test('checkout or arrival provides the day of the transfer; the 12Go identity survives matching', () => {
  const [s] = reiseAbschnitte({
    ...reise,
    stages: [
      { ...bangkok, departureDate: '2026-11-20' },
      { ...koChang, arrivalDate: '2026-11-21' },
    ],
  })
  assert.equal(s?.datum, '2026-11-21')
  assert.equal(ausEtappe([{ ...s!.von, id: '406676', placeId: null }], s!.von).placeId, bangkok.placeId)
  assert.equal(
    reiseAbschnitte({ ...reise, stages: [{ ...bangkok, departureDate: '2026-11-20' }, koChang] })[0]?.datum,
    '2026-11-20',
  )
})
test('single destination, empty trip and duplicate canonical stops', () => {
  assert.deepEqual(reiseAbschnitte({ ...reise, stages: [] }), [])
  assert.equal(reiseAbschnitte({ ...reise, stages: [bangkok] }).length, 1)
  assert.deepEqual(
    reiseAbschnitte({ ...reise, origin: null, stages: [bangkok, { ...bangkok, id: 'b2', position: 2 }] }),
    [],
  )
})
