import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { routeFactsAusGraph, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeKompakt } from '@/lib/route/anzeige'
import { metadataAusItinerary, itineraryAusMetadata } from '@/lib/route/metadata'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessReisekontext, routeFactsAusReise } from '@/lib/readiness/kontext'
import { safetyReisekontext } from '@/lib/safety/kontext'
import { seasonalAusFacts } from '@/lib/seasonal/engine'
import {
  SEASONAL_NOW_MS,
  bangkokGetrennteLegsReise,
  bangkokMehrzielLegsReise,
  bangkokOpenJawFluegeReise,
  bangkokOpenJawHkgLegsReise,
  bangkokOpenJawLegsReise,
  bangkokRouteReise,
  seasonalFact,
} from '@/lib/seasonal/fixtures'
import { providerAnfrageAusKontext, seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { Trip, TripItem } from '@/types/trips'

function rollen(reise: Trip) {
  const facts = routeFactsAusGraph(reise)
  return {
    transit: facts.transitCountryCodes,
    destinations: facts.destinationCountryCodes,
    fingerprint: facts.fingerprint,
    kompakt: routeKompakt(facts),
  }
}

function ohneItemDatum(reise: Trip): Trip {
  return {
    ...reise,
    ohneTag: reise.ohneTag.map((punkt) => ({ ...punkt, startsOn: null, startsAt: null })),
  }
}

function ohneJedeChronologie(reise: Trip): Trip {
  return {
    ...reise,
    ohneTag: reise.ohneTag.map((punkt) => ({
      ...punkt,
      startsOn: null,
      startsAt: null,
      routeItinerary: punkt.routeItinerary
        ? {
            ...punkt.routeItinerary,
            legs: punkt.routeItinerary.legs.map((bein) => ({
              segments: bein.segments.map((segment) => ({
                ...segment,
                departureDate: null,
                departureTime: null,
                arrivalDate: null,
                arrivalTime: null,
              })),
            })),
          }
        : null,
    })),
  }
}

function outboundOhneItemDatum(reise: Trip): Trip {
  return {
    ...reise,
    ohneTag: reise.ohneTag.map((punkt, index) =>
      index === 0 ? { ...punkt, startsOn: null, startsAt: null } : punkt,
    ),
  }
}

function readinessFp(reise: Trip) {
  const kontext = readinessReisekontext(reise)
  const route = routeFactsAusReise(reise)
  return readinessFingerprint({
    kind: 'entry_check',
    countryCode: 'TH',
    startDate: kontext.startDate,
    endDate: kontext.endDate,
    travellers: kontext.travellers,
    destinationCountries: kontext.destinationCountries,
    rentalCarPresent: false,
    tripItemId: null,
    itemKind: null,
    bookingStatus: null,
    startsOn: null,
    endsOn: null,
    originPlaceId: null,
    destinationPlaceId: null,
    title: null,
    originCountryCode: kontext.originCountryCode,
    transitCountryCodes: kontext.transitCountryCodes,
    routeFingerprint: route.fingerprint,
  })
}

describe('Route-Topologie Open Jaw und Leg-Grenzen', () => {
  test('Open Jaw in einer Itinerary: TH und SG sind Ziele, Transit leer', () => {
    const { transit, destinations } = rollen(bangkokOpenJawLegsReise())
    assert.deepEqual(transit, [])
    assert.deepEqual(destinations, ['TH', 'SG'])
  })

  test('derselbe Open Jaw als zwei Flight-Items liefert dieselben Rollen und dieselbe Identität', () => {
    const legs = rollen(bangkokOpenJawLegsReise())
    const fluege = rollen(bangkokOpenJawFluegeReise())
    assert.deepEqual(fluege.transit, legs.transit)
    assert.deepEqual(fluege.destinations, legs.destinations)
    assert.equal(fluege.fingerprint, legs.fingerprint)
  })

  test('Seasonal Country Scope SG applies und Provider-Request enthält SG', () => {
    const reise = bangkokOpenJawLegsReise()
    const evaluations = seasonalAusFacts(
      reise,
      [
        seasonalFact({
          factKey: 'haze-sg',
          category: 'monsoon',
          spatialScope: { kind: 'country', countryCode: 'SG' },
        }),
      ],
      'audit-seasonal',
      { nowMs: SEASONAL_NOW_MS },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    const anfrage = providerAnfrageAusKontext(seasonalReisekontext(reise))
    assert.equal(anfrage.countryCodes.includes('SG'), true)
  })

  test('Readiness- und Safety-Kontext enthalten SG', () => {
    const reise = bangkokOpenJawLegsReise()
    assert.equal(readinessReisekontext(reise).destinationCountries.includes('SG'), true)
    assert.equal(safetyReisekontext(reise).countryCodes.includes('SG'), true)
  })

  test('Multi-City und echter Transit bleiben korrekt', () => {
    assert.deepEqual(rollen(bangkokMehrzielLegsReise()).destinations, ['TH', 'SG'])
    assert.deepEqual(rollen(bangkokMehrzielLegsReise()).transit, [])
    const transit = routeFactsAusGraph(bangkokRouteReise())
    assert.deepEqual(transit.transitCountryCodes, ['QA'])
    assert.deepEqual(transit.destinationCountryCodes, ['TH'])
    assert.match(routeKompakt(transit), /Zürich ZRH → Doha DOH → Bangkok BKK/)
    assert.equal(routeKompakt(transit).includes('|'), false)
  })

  test('Item-Reihenfolge ändert Rollen und Identität bei belegter Chronologie nicht', () => {
    const basis = bangkokOpenJawFluegeReise()
    const umgestellt = { ...basis, ohneTag: [...basis.ohneTag].reverse() }
    assert.deepEqual(rollen(basis), rollen(umgestellt))
  })

  test('Outbound ohne Item-Datum, aber mit Segmentdatum, behält Origin CH', () => {
    const facts = routeFactsAusGraph(outboundOhneItemDatum(bangkokOpenJawFluegeReise()))
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH', 'SG'])
  })

  test('fehlende Item-Daten mit eindeutigen Segmentdaten bestimmen die Reihenfolge', () => {
    const facts = routeFactsAusGraph(ohneItemDatum(bangkokOpenJawFluegeReise()))
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.destinationCountryCodes, ['TH', 'SG'])
  })

  test('unklare Chronologie erfindet kein Origin aus dem lexikographischen Pfad', () => {
    const facts = routeFactsAusGraph(ohneJedeChronologie(bangkokOpenJawFluegeReise()))
    assert.equal(facts.origin.countryCode, null)
    assert.equal(facts.destinationCountryCodes.includes('TH'), true)
    assert.equal(facts.destinationCountryCodes.includes('SG'), true)
    assert.notDeepEqual(facts.destinationCountryCodes, ['CH'])
    const umgestellt = ohneJedeChronologie({
      ...bangkokOpenJawFluegeReise(),
      ohneTag: [...bangkokOpenJawFluegeReise().ohneTag].reverse(),
    })
    assert.deepEqual(routeFactsAusGraph(umgestellt).destinationCountryCodes, facts.destinationCountryCodes)
    assert.equal(routeFactsAusGraph(umgestellt).fingerprint, facts.fingerprint)
  })

  test('SIN-Rückflug und HKG-Rückflug erzeugen unterschiedliche Fingerprints', () => {
    const sin = routeFactsAusGraph(bangkokOpenJawLegsReise()).fingerprint
    const hkg = routeFactsAusGraph(bangkokOpenJawHkgLegsReise()).fingerprint
    assert.ok(sin)
    assert.ok(hkg)
    assert.notEqual(sin, hkg)
    assert.match(sin ?? '', /SIN:SG/)
    assert.match(hkg ?? '', /HKG:HK/)
  })

  test('Readiness-Context-Fingerprint ändert sich bei SIN→HKG', () => {
    assert.notEqual(readinessFp(bangkokOpenJawLegsReise()), readinessFp(bangkokOpenJawHkgLegsReise()))
  })

  test('Anzeige bewahrt den zweiten Leg-Origin und die Leg-Grenze', () => {
    const openJaw = routeKompakt(routeFactsAusGraph(bangkokOpenJawLegsReise()))
    assert.match(openJaw, /Singapore SIN/)
    assert.match(openJaw, / \| /)
    assert.equal(openJaw.includes('Zürich ZRH → Bangkok BKK → Zürich ZRH'), false)
    const rundreise = routeKompakt(routeFactsAusGraph(bangkokGetrennteLegsReise()))
    assert.match(rundreise, /Zürich ZRH → Bangkok BKK \| Bangkok BKK → Zürich ZRH/)
    const mehrziel = routeKompakt(routeFactsAusGraph(bangkokMehrzielLegsReise()))
    assert.match(mehrziel, /Bangkok BKK/)
    assert.match(mehrziel, /Singapore SIN/)
  })

  test('Guest- und Account-Parität für dieselbe Open-Jaw-Route', () => {
    const basis = bangkokOpenJawLegsReise().ohneTag[0]!
    const itinerary = basis.routeItinerary
    assert.ok(itinerary)
    const gast: TripItem = { ...basis, title: 'Freitext', note: 'Open Jaw in Singapur' }
    const konto: TripItem = {
      ...basis,
      id: 'konto-flug',
      routeItinerary: itineraryAusMetadata(metadataAusItinerary(itinerary)) ?? itinerary,
    }
    assert.deepEqual(routeFactsFuerPunkt(gast).destinationCountryCodes, ['TH', 'SG'])
    assert.deepEqual(routeFactsFuerPunkt(konto).destinationCountryCodes, ['TH', 'SG'])
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.deepEqual(routeFactsFuerPunkt(gast).transitCountryCodes, [])
  })
})
