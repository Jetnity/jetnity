import assert from 'node:assert/strict'
import { test } from 'node:test'

import { TRIPCOM_SUCHLINKS, tripComAufenthalte } from '@/lib/providers/tripcom/suche'
import type { TripStage } from '@/types/trips'

function etappe(id: string, name: string, position: number, arrivalDate: string | null, departureDate: string | null): TripStage {
  return { id, name, position, arrivalDate, departureDate, countryCode: null, latitude: null, longitude: null, placeId: null }
}

test('Wiederholte Ziele bleiben getrennte Aufenthalte; fehlende Etappendaten werden nicht durch die ganze Reise ersetzt', () => {
  const stages = [
    etappe('return', 'Bangkok', 3, '2027-11-20', '2027-11-22'),
    etappe('first', 'Bangkok', 1, '2027-11-15', '2027-11-17'),
    etappe('middle', 'Ko Chang', 2, null, null),
  ]
  const vorher = structuredClone(stages)
  const result = tripComAufenthalte({ stages, startDate: '2027-11-15', endDate: '2027-11-22' })
  assert.deepEqual(result.map((stop) => stop.id), ['first', 'middle', 'return'])
  assert.deepEqual(result[0].zeitraum, { checkIn: '2027-11-15', checkOut: '2027-11-17' })
  assert.equal(result[1].zeitraum, null)
  assert.deepEqual(result[2].zeitraum, { checkIn: '2027-11-20', checkOut: '2027-11-22' })
  assert.deepEqual(stages, vorher)
})

test('Ein unbekannter Ort wird nicht als unterstütztes Anbieterziel ausgegeben; ohne Ziele bleibt die Hilfe leer', () => {
  const result = tripComAufenthalte({ stages: [etappe('unknown', 'Mein noch ungeklärtes Ziel', 1, null, null)], startDate: null, endDate: null })
  assert.deepEqual(result, [{ id: 'unknown', ort: 'Mein noch ungeklärtes Ziel', zeitraum: null }])
  assert.deepEqual(tripComAufenthalte({ stages: [], startDate: null, endDate: null }), [])
})

test('Offizielle unveränderliche Links enthalten ausschließlich öffentliche Partner- und Darstellungseinstellungen', () => {
  for (const [art, wert] of Object.entries(TRIPCOM_SUCHLINKS)) {
    const url = new URL(wert)
    assert.equal(url.origin, 'https://de.trip.com')
    assert.equal(url.pathname, art === 'hotels' ? '/hotels/' : '/flights/')
    assert.deepEqual([...url.searchParams.keys()].sort(), ['Allianceid', 'SID', 'curr', 'locale', 'trip_sub1', 'trip_sub3'].sort())
    assert.equal(url.searchParams.get('Allianceid'), '11162929')
    assert.equal(url.searchParams.get('SID'), '334618271')
    assert.equal(url.searchParams.get('curr'), 'CHF')
    assert.equal(url.searchParams.get('locale'), 'de-DE')
    assert.equal(url.searchParams.get('trip_sub1'), `jetnity-${art}`)
    assert.equal(url.searchParams.get('trip_sub3'), art === 'hotels' ? 'D20822433' : 'D20822461')
  }
})
