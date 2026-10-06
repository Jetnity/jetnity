// lib/trips/flug-abdeckung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { FlugRouteItinerary } from '@/lib/route/domain'
import { itineraryAirportChangeOhneEvidence, itineraryEinTransit, itineraryHinDirektRueckTransit, TEST_FLUGHAFEN_REFS } from '@/lib/route/fixtures'
import { flughafenPunkt } from '@/lib/route/referenz'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function itinerary(von = 'ZRH', nach = 'BKK', datum = '2026-08-30', mitFacts = true): FlugRouteItinerary {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [{ segments: [{
      origin: flughafenPunkt(von, mitFacts ? TEST_FLUGHAFEN_REFS : {}),
      destination: flughafenPunkt(nach, mitFacts ? TEST_FLUGHAFEN_REFS : {}),
      departureDate: datum,
      departureTime: '10:00',
      arrivalDate: datum,
      arrivalTime: '18:00',
    }] }],
  }
}

function flug(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → BKK · Swiss',
    routeItinerary: itinerary(),
    note: null,
    position: 1,
    startsOn: '2026-08-30',
    startsAt: '10:00',
    endsOn: '2026-08-31',
    endsAt: '06:00',
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
    bookingUrl: null,
    ...unbestaetigteBuchung(),
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
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: 'TH',
    arrivalDate: '2026-08-30',
    departureDate: '2026-09-13',
    latitude: null,
    longitude: null,
    placeId: 'geonames:1609350',
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bangkok',
    origin: 'Zürich',
    originPlaceId: 'airport:ZRH',
    startDate: '2026-08-30',
    endDate: '2026-09-13',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe({ id: 'stage-1', name: 'Bangkok' })],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Flugabdeckung', () => {
  for (const bookingStatus of ['unconfirmed', 'booked'] as const) {
    for (const mitFacts of [false, true]) {
      test(`NRT → LAX deckt Zürich → Florenz nicht: ${bookingStatus}, Route-Facts ${mitFacts}`, () => {
        const falsch = flug({
          id: 'falsch', bookingStatus, bookingSource: bookingStatus === 'booked' ? 'user' : null,
          routeItinerary: itinerary('NRT', 'LAX', '2026-08-30', mitFacts),
        })
        const aktuell = reise({
          stages: [etappe({ id: 'florenz', name: 'Florenz', countryCode: 'IT', placeId: 'geonames:3176959' })],
          ohneTag: [falsch],
        })
        const vorher = structuredClone(aktuell)
        const ergebnis = flugAbdeckung(aktuell)
        assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
        assert.equal(ergebnis.abschnitte[0]?.item, null)
        assert.deepEqual(ergebnis.unzugeordnet, [falsch])
        assert.deepEqual(aktuell, vorher, 'Buchungsstatus und Route bleiben unverändert')
      })
    }
  }

  for (const [von, nach] of [['NRT', 'BKK'], ['ZRH', 'LAX'], ['BKK', 'ZRH']]) {
    test(`beide gerichteten Endpunkte sind erforderlich: ${von} → ${nach}`, () => {
      const falsch = flug({ id: 'falsch', routeItinerary: itinerary(von, nach) })
      const ergebnis = flugAbdeckung(reise({ ohneTag: [falsch] }))
      assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
      assert.deepEqual(ergebnis.unzugeordnet, [falsch])
    })
  }

  test('Legacy-Titel, Transferfelder, Provider und Stage-Zuordnung ersetzen keine Route-Facts', () => {
    const legacy = flug({
      id: 'legacy', routeItinerary: null, title: 'Zürich → Bangkok', note: 'ZRH → BKK',
      originName: 'Zürich', destinationName: 'Bangkok',
      originPlaceId: 'geonames:2657896', destinationPlaceId: 'geonames:1609350',
      bookingStatus: 'booked', bookingSource: 'user',
    })
    const ergebnis = flugAbdeckung(reise({ ohneTag: [legacy] }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.deepEqual(ergebnis.unzugeordnet, [legacy])
  })

  for (const fehlend of ['city', 'countryCode', 'beides'] as const) {
    test(`fehlende ${fehlend}-Facts werden nicht aus IATA oder Reiseziel geraten`, () => {
      const route = itinerary()
      for (const punkt of [route.legs[0]!.segments[0]!.origin, route.legs[0]!.segments[0]!.destination]) {
        if (fehlend !== 'countryCode') punkt.city = null
        if (fehlend !== 'city') punkt.countryCode = null
      }
      const item = flug({ id: 'guest', routeItinerary: route })
      const ergebnis = flugAbdeckung(reise({ ohneTag: [item] }))
      assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
      assert.deepEqual(ergebnis.unzugeordnet, [item])
    })
  }

  test('gleichnamige Stadt mit widersprechendem Land bleibt unzugeordnet', () => {
    const route = itinerary()
    route.legs[0]!.segments[0]!.destination.countryCode = 'US'
    const ergebnis = flugAbdeckung(reise({ ohneTag: [flug({ id: 'land', routeItinerary: route })] }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('Origin ohne vergleichbare Airport-ID hat kein Land für einen eindeutigen City-Vergleich', () => {
    for (const originPlaceId of [null, 'geonames:2657896']) {
      const ergebnis = flugAbdeckung(reise({ originPlaceId, ohneTag: [flug({ id: 'hin' })] }))
      assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
      assert.equal(ergebnis.unzugeordnet.length, 1)
    }
  })

  test('Zielstadt ohne Länderidentität wird durch Route-Facts nicht vervollständigt', () => {
    const ergebnis = flugAbdeckung(reise({
      stages: [etappe({ id: 'stage-1', name: 'Bangkok', countryCode: null })],
      ohneTag: [flug({ id: 'hin' })],
    }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('Airport-ID hat Vorrang vor einem übereinstimmenden City-Label', () => {
    const ergebnis = flugAbdeckung(reise({
      originPlaceId: 'airport:NRT', ohneTag: [flug({ id: 'hin' })],
    }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('explizite Airport-Identität und normalisierte kanonische City-Facts beweisen die Route', () => {
    const ergebnis = flugAbdeckung(reise({
      origin: 'Airport Zürich', originPlaceId: 'airport:ZRH',
      stages: [etappe({ id: 'stage-1', name: '  BANGKOK  ' })],
      ohneTag: [flug({ id: 'hin', title: 'Irrelevanter Titel' })],
    }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'selected')
    assert.equal(ergebnis.abschnitte[0]?.item?.id, 'hin')
    assert.deepEqual(ergebnis.unzugeordnet, [])
  })

  test('passender Flug plus falscher gleichdatiger Kandidat bleibt fail-closed', () => {
    const items = [flug({ id: 'richtig' }), flug({ id: 'falsch', routeItinerary: itinerary('NRT', 'LAX') })]
    for (const ohneTag of [items, [...items].reverse()]) {
      const ergebnis = flugAbdeckung(reise({ ohneTag }))
      assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
      assert.equal(ergebnis.abschnitte[0]?.item, null)
      assert.deepEqual(ergebnis.unzugeordnet, ohneTag)
    }
  })

  test('ein Flug für zwei gleiche Sollstrecken wird nicht durch Array-Reihenfolge zugeordnet', () => {
    const ergebnis = flugAbdeckung(reise({
      stages: [
        etappe({ id: 'bkk-1', name: 'Bangkok' }),
        etappe({ id: 'zrh', name: 'Zürich', placeId: 'airport:ZRH', countryCode: 'CH', position: 2 }),
        etappe({ id: 'bkk-2', name: 'Bangkok', position: 3 }),
      ],
      ohneTag: [flug({ id: 'mehrdeutig' })],
    }))
    assert.equal(ergebnis.abschnitte.every((abschnitt) => abschnitt.item === null), true)
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('unbewiesene Topologie und mehrere Legs werden nicht als einzelne Sollstrecke verbraucht', () => {
    for (const route of [itineraryAirportChangeOhneEvidence(), itineraryHinDirektRueckTransit()]) {
      const item = flug({ id: 'unklar', startsOn: '2026-11-01', routeItinerary: route })
      const ergebnis = flugAbdeckung(reise({
        stages: [etappe({ id: 'stage-1', name: 'Bangkok', arrivalDate: '2026-11-01' })],
        ohneTag: [item],
      }))
      assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
      assert.deepEqual(ergebnis.unzugeordnet, [item])
    }
  })

  test('ein widersprechendes gespeichertes Segmentdatum beweist keine Zuordnung', () => {
    const ergebnis = flugAbdeckung(reise({
      ohneTag: [flug({ id: 'datum', routeItinerary: itinerary('ZRH', 'BKK', '2026-08-29') })],
    }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('ein kanonisch bewiesener Transit innerhalb eines Legs bleibt zuordenbar', () => {
    const ergebnis = flugAbdeckung(reise({
      stages: [etappe({ id: 'stage-1', name: 'Bangkok', arrivalDate: '2026-11-01' })],
      ohneTag: [flug({ id: 'transit', startsOn: '2026-11-01', routeItinerary: itineraryEinTransit() })],
    }))
    assert.equal(ergebnis.abschnitte[0]?.status, 'selected')
    assert.equal(ergebnis.abschnitte[0]?.item?.id, 'transit')
    assert.deepEqual(ergebnis.unzugeordnet, [])
  })

  test('dieselbe ohneTag-Prop konsumiert den bewiesenen Flug genau einmal', () => {
    const aktuell = reise({ ohneTag: [flug({ id: 'hin' })] })
    const ergebnis = flugAbdeckung(aktuell, aktuell.ohneTag)
    assert.deepEqual(ergebnis, flugAbdeckung(aktuell))
    assert.equal(ergebnis.abschnitte.filter((abschnitt) => abschnitt.item?.id === 'hin').length, 1)
    assert.deepEqual(ergebnis.unzugeordnet, [])
  })

  test('ohne Sollabschnitt bleibt ein vorhandener Flug unzugeordnet', () => {
    const item = flug({ id: 'extra' })
    const ergebnis = flugAbdeckung(reise({
      origin: 'Bangkok', originPlaceId: 'geonames:1609350', ohneTag: [item],
    }))
    assert.equal(ergebnis.bestimmbar, true)
    assert.deepEqual(ergebnis.abschnitte, [])
    assert.deepEqual(ergebnis.unzugeordnet, [item])
  })

  test('fehlende Etappen und fehlende Abschnittsdaten bleiben ehrlich', () => {
    assert.equal(flugAbdeckung(reise({ stages: [] })).bestimmbar, false)
    const aktuell = reise({
      startDate: null, endDate: null,
      stages: [etappe({ id: 'stage-1', name: 'Bangkok', arrivalDate: null, departureDate: null })],
    })
    assert.equal(flugAbdeckung(aktuell).abschnitte.every((abschnitt) => abschnitt.status === 'open'), true)
    const ergebnis = flugAbdeckung({ ...aktuell, ohneTag: [flug({ id: 'hin' })] })
    assert.equal(ergebnis.abschnitte.every((abschnitt) => abschnitt.status === 'unknown'), true)
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('Hinflug gebucht und Rückflug offen', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [
          flug({
            id: 'hin',
            startsOn: '2026-08-30',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
        ],
      }),
    )
    assert.equal(ergebnis.bestimmbar, true)
    assert.equal(ergebnis.abschnitte[0]?.art, 'outbound')
    assert.equal(ergebnis.abschnitte[0]?.status, 'booked')
    assert.equal(ergebnis.abschnitte[1]?.art, 'return')
    assert.equal(ergebnis.abschnitte[1]?.status, 'open')
    assert.equal(ergebnis.zusammenfassung, 'Hinflug gebucht · Rückflug offen')
  })

  test('eine bewiesene Rückroute am Abreisetag füllt den Rückflug', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [flug({ id: 'rueck', startsOn: '2026-09-13', title: 'BKK → ZRH', routeItinerary: itinerary('BKK', 'ZRH', '2026-09-13') })],
      }),
    )
    assert.equal(ergebnis.abschnitte[0]?.status, 'open')
    assert.equal(ergebnis.abschnitte[1]?.status, 'selected')
    assert.equal(ergebnis.zusammenfassung, 'Hinflug offen · Rückflug ausgewählt')
  })

  test('ohne Origin keine erfundenen Abschnitte', () => {
    const ergebnis = flugAbdeckung(
      reise({
        origin: null,
        originPlaceId: null,
        ohneTag: [flug({ id: 'hin' })],
      }),
    )
    assert.equal(ergebnis.bestimmbar, false)
    assert.equal(ergebnis.abschnitte.length, 0)
    assert.equal(ergebnis.unzugeordnet.length, 1)
    assert.match(ergebnis.zusammenfassung, /Stand noch unklar/)
  })

  test('kein IATA-Code aus Ortsnamen raten', () => {
    const ergebnis = flugAbdeckung(reise())
    assert.equal(ergebnis.abschnitte.some((abschnitt) => abschnitt.originName === 'ZRH'), false)
    assert.equal(ergebnis.abschnitte[0]?.originName, 'Zürich')
    assert.equal(ergebnis.abschnitte[0]?.destinationName, 'Bangkok')
    assert.equal(ergebnis.zusammenfassung, 'Noch kein Flug ausgewählt')
  })

  test('ein unzugeordneter Restflug zerstört keinen eindeutigen Match', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [
          flug({ id: 'hin', startsOn: '2026-08-30' }),
          flug({ id: 'extra', startsOn: '2026-09-01', title: 'Zusatzflug', position: 2 }),
        ],
      }),
    )
    assert.equal(ergebnis.abschnitte[0]?.status, 'selected')
    assert.equal(ergebnis.abschnitte[0]?.item?.id, 'hin')
    assert.equal(ergebnis.abschnitte[1]?.status, 'unknown')
    assert.equal(ergebnis.unzugeordnet.length, 1)
    assert.equal(ergebnis.unzugeordnet[0]?.id, 'extra')
  })

  test('zwei Flüge am selben Tag bleiben unbestimmt statt falsch zugeordnet', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [
          flug({ id: 'a', startsOn: '2026-08-30' }),
          flug({ id: 'b', startsOn: '2026-08-30', position: 2, title: 'ZRH → BKK · Alternative' }),
        ],
      }),
    )
    assert.equal(ergebnis.abschnitte[0]?.status, 'unknown')
    assert.equal(ergebnis.abschnitte[0]?.item, null)
    assert.equal(ergebnis.unzugeordnet.length, 2)
    assert.match(ergebnis.zusammenfassung, /noch unklar/)
  })

  test('Flug ohne Datum wird nicht einer Strecke zugeordnet', () => {
    const ergebnis = flugAbdeckung(
      reise({
        ohneTag: [flug({ id: 'offen', startsOn: null, endsOn: null })],
      }),
    )
    assert.equal(ergebnis.abschnitte.every((abschnitt) => abschnitt.status === 'unknown'), true)
    assert.equal(ergebnis.unzugeordnet.length, 1)
  })

  test('gleiche Origin- und Zielorte brauchen keinen Flugabschnitt', () => {
    const ergebnis = flugAbdeckung(
      reise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        stages: [
          etappe({
            id: 'stage-1',
            name: 'Zürich',
            placeId: 'geonames:2657896',
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
          }),
        ],
      }),
    )
    assert.equal(ergebnis.abschnitte.length, 0)
    assert.equal(ergebnis.zusammenfassung, 'Kein Flugabschnitt erforderlich')
  })

  test('Multi-Stage erzeugt Zwischenstrecken nur bei wechselndem Ort', () => {
    const ergebnis = flugAbdeckung(
      reise({
        stages: [
          etappe({
            id: 'stage-1',
            name: 'Bangkok',
            position: 1,
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-05',
          }),
          etappe({
            id: 'stage-2',
            name: 'Singapore',
            countryCode: 'SG',
            position: 2,
            arrivalDate: '2026-09-05',
            departureDate: '2026-09-13',
            placeId: 'geonames:1880252',
          }),
        ],
        ohneTag: [
          flug({ id: 'hin', startsOn: '2026-08-30' }),
          flug({
            id: 'weiter',
            startsOn: '2026-09-05',
            title: 'BKK → SIN',
            routeItinerary: itinerary('BKK', 'SIN', '2026-09-05'),
            position: 2,
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
          }),
        ],
      }),
    )
    assert.deepEqual(
      ergebnis.abschnitte.map((abschnitt) => `${abschnitt.art}:${abschnitt.status}`),
      ['outbound:selected', 'connection:booked', 'return:open'],
    )
    assert.equal(ergebnis.abschnitte[1]?.originName, 'Bangkok')
    assert.equal(ergebnis.abschnitte[1]?.destinationName, 'Singapore')
    assert.equal(ergebnis.zusammenfassung, 'Hinflug ausgewählt · Bangkok → Singapore gebucht · Rückflug offen')
  })
})
