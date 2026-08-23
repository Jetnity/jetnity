import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { routeFactsAusGraph } from '@/lib/route/ableitung'
import {
  bangkokGetrennteFluegeReise,
  bangkokGetrennteLegsReise,
  bangkokRouteReise,
} from '@/lib/seasonal/fixtures'

function bkk(reise: ReturnType<typeof bangkokGetrennteFluegeReise>) {
  return routeFactsAusGraph(reise).airportContacts.filter((kontakt) => kontakt.airportCode === 'BKK')
}

describe('Route-Airport-Zeitkontakte', () => {
  test('getrennte Flight-Items bleiben getrennte BKK-Kontakte', () => {
    const kontakte = bkk(bangkokGetrennteFluegeReise())
    assert.deepEqual(
      kontakte.map((kontakt) => [kontakt.start, kontakt.end]),
      [
        ['2026-09-13T06:20', '2026-09-13T06:20'],
        ['2026-09-20T23:00', '2026-09-20T23:00'],
      ],
    )
    assert.equal(
      kontakte.some((kontakt) => kontakt.start === '2026-09-13T06:20' && kontakt.end === '2026-09-20T23:00'),
      false,
    )
  })

  test('getrennte Legs in einer Itinerary werden nicht über den Aufenthalt verbunden', () => {
    const kontakte = bkk(bangkokGetrennteLegsReise())
    assert.deepEqual(
      kontakte.map((kontakt) => [kontakt.start, kontakt.end]),
      [
        ['2026-09-13T06:20', '2026-09-13T06:20'],
        ['2026-09-20T23:00', '2026-09-20T23:00'],
      ],
    )
  })

  test('echter Transit im selben Leg bleibt ein Layover-Kontakt', () => {
    const doh = routeFactsAusGraph(bangkokRouteReise()).airportContacts.filter(
      (kontakt) => kontakt.airportCode === 'DOH',
    )
    assert.equal(doh.length, 1)
    assert.equal(doh[0]?.start, '2026-09-12T17:40')
    assert.equal(doh[0]?.end, '2026-09-12T19:10')
  })

  test('Item-Reihenfolge ändert die kanonische Kontaktmenge nicht', () => {
    const basis = bangkokGetrennteFluegeReise()
    const umgestellt = { ...basis, ohneTag: [...basis.ohneTag].reverse() }
    assert.deepEqual(routeFactsAusGraph(basis).airportContacts, routeFactsAusGraph(umgestellt).airportContacts)
  })
})
