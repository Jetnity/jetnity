import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { Ort } from '@/lib/places/domain'
import { createZieleGraph } from '@/lib/trips/create-stages'
import { GRENZEN } from '@/lib/trips/schema'

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: 'city',
    country: teil.country ?? 'France',
    countryCode: teil.countryCode ?? 'FR',
    region: null,
    lat: teil.lat ?? 48.85,
    lon: teil.lon ?? 2.35,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const PARIS = ort({
  id: 'geonames:2988507',
  name: 'Paris',
  country: 'France',
  countryCode: 'FR',
  lat: 48.85341,
  lon: 2.3488,
})
const ROM = ort({
  id: 'geonames:3169070',
  name: 'Rom',
  country: 'Italy',
  countryCode: 'IT',
  lat: 41.89193,
  lon: 12.51133,
})
const ZEITRAUM = { startDate: '2026-09-12', endDate: '2026-09-17' }

describe('TW6-B Create-Stages – bestehende trip_stages', () => {
  test('ein Ziel bleibt die bisherige eine Stage mit Reisezeitraum', () => {
    const graph = createZieleGraph([PARIS], ZEITRAUM)

    assert.equal(graph.einzelziel, true)
    assert.equal(graph.assignmentSource, 'single_destination')
    assert.equal(graph.title, 'Paris')
    assert.equal(graph.dayStagePosition, 1)
    assert.equal(graph.stages.length, 1)
    assert.equal(graph.stages[0]?.placeId, PARIS.id)
    assert.equal(graph.stages[0]?.arrivalDate, ZEITRAUM.startDate)
    assert.equal(graph.stages[0]?.departureDate, ZEITRAUM.endDate)
  })

  test('drei bestätigte Ziele behalten Eingabereihenfolge und Place-Fakten', () => {
    const graph = createZieleGraph([PARIS, ROM, PARIS], ZEITRAUM)

    assert.equal(graph.einzelziel, false)
    assert.equal(graph.assignmentSource, 'unassigned')
    assert.equal(graph.title, 'Paris')
    assert.equal(graph.dayStagePosition, null)
    assert.deepEqual(
      graph.stages.map((etappe) => etappe.placeId),
      [PARIS.id, ROM.id, PARIS.id],
    )
    assert.deepEqual(
      graph.stages.map((etappe) => etappe.position),
      [1, 2, 3],
    )
    assert.deepEqual(
      graph.stages.map((etappe) => etappe.name),
      ['Paris', 'Rom', 'Paris'],
    )
    assert.equal(
      graph.stages.every((etappe) => etappe.arrivalDate === null && etappe.departureDate === null),
      true,
    )
  })

  test('Paris → Rom → Paris bleibt drei Stages und wird nicht nach placeId dedupliziert', () => {
    const graph = createZieleGraph([PARIS, ROM, PARIS], ZEITRAUM)
    assert.equal(graph.stages.length, 3)
    assert.equal(graph.stages[0]?.placeId, graph.stages[2]?.placeId)
    assert.notEqual(graph.stages[0]?.position, graph.stages[2]?.position)
  })

  test('keine erfundenen Stage-Daten, Koordinaten oder Aufenthalte', () => {
    const graph = createZieleGraph([PARIS, ROM], ZEITRAUM)

    assert.equal(graph.stages[0]?.latitude, PARIS.lat)
    assert.equal(graph.stages[0]?.longitude, PARIS.lon)
    assert.equal(graph.stages[0]?.countryCode, PARIS.countryCode)
    assert.equal(graph.stages[1]?.latitude, ROM.lat)
    assert.equal(graph.stages.every((etappe) => etappe.arrivalDate === null), true)
    assert.equal(graph.dayStagePosition, null)
    assert.equal(JSON.stringify(graph).includes('ZRH'), false)
    assert.equal(JSON.stringify(graph).includes('Staatsbürgerschaft'), false)
  })

  test('die bestehende Etappengrenze gilt: Maximum akzeptiert, Maximum+1 nicht', () => {
    const maximum = Array.from({ length: GRENZEN.etappenJeReise }, (_, index) =>
      ort({
        id: `geonames:${1000000 + index}`,
        name: `Ort ${index + 1}`,
        countryCode: 'CH',
        lat: 47,
        lon: 8,
      }),
    )

    const graph = createZieleGraph(maximum, ZEITRAUM)
    assert.equal(graph.stages.length, GRENZEN.etappenJeReise)
    assert.equal(graph.dayStagePosition, null)

    assert.throws(
      () => createZieleGraph([...maximum, PARIS], ZEITRAUM),
      /höchstens 50 Reiseziele/i,
    )
  })

  test('ohne bestätigtes Ziel entsteht kein Graph', () => {
    assert.throws(() => createZieleGraph([], ZEITRAUM), /Mindestens ein bestätigtes Reiseziel/)
  })
})
