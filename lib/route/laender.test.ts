import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { routeFactsAusGraph, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { itineraryEinTransit } from '@/lib/route/fixtures'
import { metadataAusItinerary, itineraryAusMetadata } from '@/lib/route/metadata'
import { readinessReisekontext } from '@/lib/readiness/kontext'
import {
  bangkokGetrennteFluegeReise,
  bangkokGetrennteLegsReise,
  bangkokMehrzielFluegeReise,
  bangkokMehrzielLegsReise,
  bangkokRundreiseTransitFluege,
  bangkokRundreiseTransitLegs,
} from '@/lib/seasonal/fixtures'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Trip, TripItem } from '@/types/trips'

function rollen(reise: Trip) {
  const facts = routeFactsAusGraph(reise)
  return {
    transit: facts.transitCountryCodes,
    destinations: facts.destinationCountryCodes,
  }
}

function flugOhneTitel(punkt: TripItem, itinerary: NonNullable<TripItem['routeItinerary']>): TripItem {
  return {
    ...punkt,
    title: 'Freitext darf keine Länderrolle erzeugen',
    note: 'Umstieg in Doha, Katar',
    routeItinerary: itinerary,
  }
}

describe('Route-Länderrollen', () => {
  test('Roundtrip in einer Itinerary: TH ist Ziel, nicht Transit; CH kein zusätzliches Ziel', () => {
    const { transit, destinations } = rollen(bangkokGetrennteLegsReise())
    assert.deepEqual(transit, [])
    assert.deepEqual(destinations, ['TH'])
    assert.equal(destinations.includes('CH'), false)
  })

  test('derselbe Roundtrip als zwei Flight-Items liefert dieselben Länderrollen', () => {
    assert.deepEqual(rollen(bangkokGetrennteFluegeReise()), rollen(bangkokGetrennteLegsReise()))
  })

  test('Multi-City CH→TH, TH→SG, SG→CH trägt TH und SG als Ziele, nicht als Transit', () => {
    const fluege = rollen(bangkokMehrzielFluegeReise())
    const legs = rollen(bangkokMehrzielLegsReise())
    assert.deepEqual(fluege.transit, [])
    assert.deepEqual(fluege.destinations, ['TH', 'SG'])
    assert.deepEqual(legs, fluege)
    assert.equal(fluege.destinations.includes('CH'), false)
  })

  test('echter Transit innerhalb eines Legs bleibt Transit, Leg-Ziel bleibt Ziel', () => {
    const facts = routeFactsAusGraph(
      beispielreise({
        ohneTag: [
          {
            ...bangkokGetrennteFluegeReise().ohneTag[0]!,
            routeItinerary: itineraryEinTransit('DOH'),
          },
        ],
      }),
    )
    assert.deepEqual(facts.transitCountryCodes, ['QA'])
    assert.deepEqual(facts.destinationCountryCodes, ['TH'])
  })

  test('Roundtrip mit echtem Transit pro Richtung behält Transitländer und verwechselt Leg-Ziele nicht', () => {
    const fluege = rollen(bangkokRundreiseTransitFluege())
    const legs = rollen(bangkokRundreiseTransitLegs())
    assert.deepEqual(fluege.transit, ['QA', 'SG'])
    assert.deepEqual(fluege.destinations, ['TH'])
    assert.deepEqual(legs, fluege)
  })

  test('Readiness erhält für Roundtrip die korrekten destinationCountries und transitCountryCodes', () => {
    const legs = readinessReisekontext(bangkokGetrennteLegsReise())
    const fluege = readinessReisekontext(bangkokGetrennteFluegeReise())
    assert.deepEqual(legs.transitCountryCodes, [])
    assert.deepEqual(fluege.transitCountryCodes, [])
    assert.deepEqual(legs.destinationCountries, ['TH'])
    assert.deepEqual(fluege.destinationCountries, ['TH'])
  })

  test('Guest- und Account-Parität über dasselbe Trip-Feld', () => {
    const basis = bangkokGetrennteLegsReise().ohneTag[0]!
    const itinerary = basis.routeItinerary
    assert.ok(itinerary)
    const gast = flugOhneTitel(basis, itinerary)
    const konto = flugOhneTitel(
      { ...basis, id: 'konto-flug' },
      itineraryAusMetadata(metadataAusItinerary(itinerary)) ?? itinerary,
    )
    assert.deepEqual(routeFactsFuerPunkt(gast).transitCountryCodes, [])
    assert.deepEqual(routeFactsFuerPunkt(konto).transitCountryCodes, [])
    assert.deepEqual(routeFactsFuerPunkt(gast).destinationCountryCodes, ['TH'])
    assert.deepEqual(routeFactsFuerPunkt(konto).destinationCountryCodes, ['TH'])
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
  })

  test('Flight-Item-Reihenfolge ändert die kanonische Rollenmenge nicht', () => {
    const basis = bangkokGetrennteFluegeReise()
    const umgestellt = { ...basis, ohneTag: [...basis.ohneTag].reverse() }
    const mehrziel = bangkokMehrzielFluegeReise()
    const mehrzielUmgestellt = { ...mehrziel, ohneTag: [...mehrziel.ohneTag].reverse() }
    assert.deepEqual(rollen(basis), rollen(umgestellt))
    assert.deepEqual(rollen(mehrziel), rollen(mehrzielUmgestellt))
  })
})
