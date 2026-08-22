// lib/route/ableitung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { OPTION_DIREKT, OPTION_GUENSTIG_LANG } from '@/lib/flights/fixtures/optionen'
import { routeFactsAusGraph, routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { routeAnzeigeAusFacts, routeAnzeigeAusOption, routeKompakt } from '@/lib/route/anzeige'
import {
  TEST_FLUGHAFEN_REFS,
  itineraryAirportChange,
  itineraryDirekt,
  itineraryEinTransit,
  itineraryOhneLaender,
  itineraryOhneZeiten,
  itineraryZweiTransits,
} from '@/lib/route/fixtures'
import { itineraryAusFlugOption } from '@/lib/route/itinerary'
import { metadataAusItinerary, itineraryAusMetadata } from '@/lib/route/metadata'
import { routeAenderungZwischen } from '@/lib/route/vergleich'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessReisekontext, routeFactsAusReise } from '@/lib/readiness/kontext'
import { readinessAnsicht } from '@/lib/readiness/status'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripItem } from '@/types/trips'

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flug-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → BKK · SWISS',
    note: 'Freitext darf keine Route erzeugen',
    position: 1,
    startsOn: '2026-11-01',
    startsAt: '09:15',
    endsOn: '2026-11-01',
    endsAt: '21:40',
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    routeItinerary: null,
    ...teil,
  }
}

describe('Route & Transit Intelligence', () => {
  test('1. Direktflug CH → TH', () => {
    const reise = beispielreise({
      stages: beispielreise().stages.map((etappe) => ({ ...etappe, countryCode: 'TH' })),
      ohneTag: [flug({ routeItinerary: itineraryDirekt() })],
    })
    const facts = routeFactsAusReise(reise)
    assert.equal(facts.quelle, 'flight_itinerary')
    assert.equal(facts.originCountryCode, 'CH')
    assert.deepEqual(facts.transitCountryCodes, [])
    assert.equal(routeFactsAusGraph(reise).destination.countryCode, 'TH')
    assert.equal(readinessReisekontext(reise).originCountryCode, 'CH')
  })

  test('2. ein Transit CH → QA → TH', () => {
    const reise = beispielreise({
      ohneTag: [flug({ routeItinerary: itineraryEinTransit('DOH') })],
    })
    const facts = routeFactsAusGraph(reise)
    assert.equal(facts.origin.countryCode, 'CH')
    assert.deepEqual(facts.transitCountryCodes, ['QA'])
    assert.equal(facts.connections.length, 1)
    assert.equal(facts.connections[0]?.airportCode, 'DOH')
    assert.match(routeKompakt(facts), /Zürich ZRH → Doha DOH → Bangkok BKK/)
  })

  test('3. zwei Transits', () => {
    const facts = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ routeItinerary: itineraryZweiTransits() })] }),
    )
    assert.deepEqual(facts.transitCountryCodes, ['DE', 'QA'])
    assert.equal(facts.segments.length, 3)
    assert.equal(facts.connections.length, 2)
  })

  test('4. fehlender Airport-Country-Kontext bleibt unknown', () => {
    const facts = routeFactsAusReise(
      beispielreise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        ohneTag: [flug({ routeItinerary: itineraryOhneLaender() })],
      }),
    )
    assert.equal(facts.quelle, 'flight_itinerary')
    assert.equal(facts.originCountryCode, null)
    assert.deepEqual(facts.transitCountryCodes, [])
    assert.equal(routeFactsAusReise(beispielreise({ origin: 'Doha' })).quelle, 'none')
  })

  test('5. gleiche Stadt, unterschiedlicher Airport ist Flughafenwechsel', () => {
    const facts = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ routeItinerary: itineraryAirportChange() })] }),
    )
    assert.equal(facts.connections[0]?.airportChange, true)
    assert.equal(facts.connections[0]?.airportCode, 'CDG')
    assert.deepEqual(facts.transitCountryCodes, ['FR'])
  })

  test('6. Transitwechsel QA → SG erzeugt neue Route Facts', () => {
    const vorher = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ routeItinerary: itineraryEinTransit('DOH') })] }),
    )
    const nachher = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ id: 'flug-2', routeItinerary: itineraryEinTransit('SIN') })] }),
    )
    const diff = routeAenderungZwischen(vorher, nachher)
    assert.equal(diff.geaendert, true)
    assert.deepEqual(diff.entfernteTransitlaender, ['QA'])
    assert.deepEqual(diff.neueTransitlaender, ['SG'])
    assert.notEqual(vorher.fingerprint, nachher.fingerprint)
  })

  test('7. Readiness Context wird bei Transitänderung stale', () => {
    const basis = beispielreise({
      stages: beispielreise().stages.map((etappe) => ({ ...etappe, countryCode: 'TH' })),
      ohneTag: [flug({ routeItinerary: itineraryEinTransit('DOH') })],
    })
    const fingerprint = readinessFingerprint({
      kind: 'entry_check',
      countryCode: 'TH',
      startDate: basis.startDate,
      endDate: basis.endDate,
      travellers: basis.travellers,
      destinationCountries: ['TH'],
      rentalCarPresent: false,
      tripItemId: null,
      itemKind: null,
      bookingStatus: null,
      startsOn: null,
      endsOn: null,
      originPlaceId: null,
      destinationPlaceId: null,
      title: null,
      originCountryCode: 'CH',
      transitCountryCodes: ['QA'],
      routeFingerprint: routeFactsAusReise(basis).fingerprint,
    })
    const nachher = beispielreise({
      stages: basis.stages,
      ohneTag: [flug({ routeItinerary: itineraryEinTransit('SIN') })],
      readinessItems: [
        {
          id: 'entry_check:TH',
          clientRef: 'entry_check:TH',
          kind: 'entry_check',
          userStatus: 'done',
          evidence: 'user',
          countryCode: 'TH',
          tripItemId: null,
          title: null,
          contextFingerprint: fingerprint,
          createdAt: '2026-08-22T08:00:00.000Z',
          updatedAt: '2026-08-22T08:00:00.000Z',
        },
      ],
    })
    const { items } = readinessAnsicht(nachher)
    assert.equal(items.find((item) => item.kind === 'entry_check')?.currentness, 'stale')
  })

  test('8. Segmentreihenfolge bleibt korrekt', () => {
    const facts = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ routeItinerary: itineraryZweiTransits() })] }),
    )
    assert.deepEqual(
      facts.segments.map((segment) => `${segment.origin.airportCode}-${segment.destination.airportCode}`),
      ['ZRH-FRA', 'FRA-DOH', 'DOH-BKK'],
    )
  })

  test('9. Connection Duration aus validen Zeiten', () => {
    const facts = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ routeItinerary: itineraryEinTransit('DOH') })] }),
    )
    assert.equal(facts.connections[0]?.durationMinutes, 135)
    const anzeige = routeAnzeigeAusFacts(facts)
    assert.match(anzeige?.sekundaer ?? '', /2 h 15 min/)
  })

  test('10. ungültige oder fehlende Zeiten erzeugen keine Duration', () => {
    const facts = routeFactsAusGraph(
      beispielreise({ ohneTag: [flug({ routeItinerary: itineraryOhneZeiten() })] }),
    )
    assert.equal(facts.connections[0]?.durationMinutes, null)
    assert.equal(facts.quelle, 'flight_itinerary')
  })

  test('11. Guest- und Account-Parität über dasselbe Trip-Feld', () => {
    const itinerary = itineraryEinTransit()
    const gast = flug({ routeItinerary: itinerary })
    const konto = flug({
      id: 'konto-flug',
      routeItinerary: itineraryAusMetadata(metadataAusItinerary(itinerary)),
    })
    assert.deepEqual(routeFactsFuerPunkt(gast).transitCountryCodes, ['QA'])
    assert.deepEqual(routeFactsFuerPunkt(konto).transitCountryCodes, ['QA'])
    assert.equal(routeFactsFuerPunkt(gast).fingerprint, routeFactsFuerPunkt(konto).fingerprint)
    assert.match(routeFactsFuerPunkt(gast).fingerprint ?? '', /ZRH:CH>DOH:QA>BKK:TH/)
  })

  test('12. Direktflug-Anzeige ist einfacher als Umstieg', () => {
    const direkt = routeAnzeigeAusFacts(
      routeFactsAusGraph(beispielreise({ ohneTag: [flug({ routeItinerary: itineraryDirekt() })] })),
    )
    const umstieg = routeAnzeigeAusFacts(
      routeFactsAusGraph(beispielreise({ ohneTag: [flug({ routeItinerary: itineraryEinTransit() })] })),
    )
    assert.equal(direkt?.direkt, true)
    assert.equal(direkt?.umstiege, 0)
    assert.match(direkt?.sekundaer ?? '', /Direktflug/)
    assert.equal(umstieg?.direkt, false)
    assert.equal(umstieg?.umstiege, 1)
    assert.match(umstieg?.sekundaer ?? '', /1 Umstieg/)
  })

  test('13. Titel und Notiz werden nicht zur Route', () => {
    const facts = routeFactsAusReise(
      beispielreise({
        ohneTag: [flug({ title: 'ZRH → DOH → BKK', note: 'Umstieg in Doha, Katar' })],
      }),
    )
    assert.equal(facts.quelle, 'none')
    assert.deepEqual(facts.transitCountryCodes, [])
  })

  test('14. FlugOption-Ableitung nutzt nur Referenzländer', () => {
    const mitRef = itineraryAusFlugOption(OPTION_GUENSTIG_LANG, TEST_FLUGHAFEN_REFS)
    const ohneRef = itineraryAusFlugOption(OPTION_DIREKT)
    assert.equal(mitRef?.legs[0]?.segments[0]?.destination.countryCode, 'GB')
    assert.equal(ohneRef?.legs[0]?.segments[0]?.origin.countryCode, null)
    const anzeige = routeAnzeigeAusOption(OPTION_GUENSTIG_LANG, TEST_FLUGHAFEN_REFS)
    assert.match(anzeige?.kompakt ?? '', /Zürich ZRH → London LHR → Bangkok BKK/)
  })
})
