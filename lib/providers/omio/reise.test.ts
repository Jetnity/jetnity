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

test('jeder ausgewählte Abschnitt behält seine Etappen-IDs und sein vorgeschlagenes Datum', () => {
  const phuket = ort('p:k', 'Phuket', 3, 'phuket')
  const stages = [phuket, bangkok, koChang]
  const tage = (ids: string[]) => ids.map((stageId, index) => ({
    id: 'tag-' + index, dayIndex: index + 1, dayDate: '2026-11-' + (15 + index),
    stageId, title: null, items: [],
  }))
  const days = tage(['b', 'k', 'k', 'p:k'])
  const abschnitt = (aenderung: Partial<Trip>) => reiseAbschnitte({ ...reise, stages, days, ...aenderung })
    .find(s => s.kanteId === 'connection:k:p:k')!
  const leg = abschnitt({})
  assert.deepEqual([leg.von.id, leg.nach.id, leg.datum, leg.ausTagesplan],
    ['reise:k', 'reise:p:k', '2026-11-18', true])
  const mitAnkunft = abschnitt({ stages: [bangkok, koChang, { ...phuket, arrivalDate: '2026-12-01' }] })
  assert.equal(mitAnkunft.datum, '2026-12-01')
  assert.equal(mitAnkunft.ausTagesplan, false)
  for (const mehrdeutig of [
    tage(['k', 'p:k', 'k', 'p:k']),
    days.map(d => d.stageId === 'p:k' ? { ...d, dayIndex: 8 } : d),
    days.map(d => d.stageId === 'p:k' ? { ...d, dayDate: '2026-02-30' } : d),
    [...days, { ...days[3], id: 'duplikat' }],
  ]) {
    assert.equal(abschnitt({ days: mehrdeutig }).datum, '')
  }
})
