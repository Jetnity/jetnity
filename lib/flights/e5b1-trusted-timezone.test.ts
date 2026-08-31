import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ANGEBOT_DIREKT } from '@/lib/flights/duffel/fixtures/angebote'
import { duffelAngebotMappen } from '@/lib/flights/duffel/mapping'
import type { FlugOption } from '@/lib/flights/domain'
import { OPTION_DIREKT } from '@/lib/flights/fixtures/optionen'
import { flugKontoUebernahmePruefen } from '@/lib/flights/konto-uebernahme'
import { flugNachweisAusKatalog, type FlugNachweisKontext } from '@/lib/flights/nachweis'
import { flugKontoUebernahmeSchema, flugOptionLesen } from '@/lib/flights/schema'
import { alsFlugMomentaufnahme } from '@/lib/flights/uebernahme'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { itineraryDirekt, itineraryEinTransit, TEST_FLUGHAFEN_REFS } from '@/lib/route/fixtures'
import { itineraryAusFlugOption, itineraryKanonisieren } from '@/lib/route/itinerary'
import { reiseNutzlastRouteKanonisieren } from '@/lib/route/kanonisieren'
import { itineraryAusMetadata, metadataAusItinerary } from '@/lib/route/metadata'
import {
  flugRouteItineraryLesen,
  flugRouteItineraryTrustedLesen,
  flugRouteItineraryTrustedTimezoneLesen,
} from '@/lib/route/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { reiseLesen, reiseNutzlastSchema } from '@/lib/trips/schema'
import type { FlugRouteItinerary } from '@/lib/route/domain'
import type { TripItem } from '@/types/trips'

function duffelMit(
  origin: unknown,
  destination: unknown,
  extra: Record<string, unknown> = {},
) {
  const basis = ANGEBOT_DIREKT.slices[0]!.segments[0]!
  return {
    ...ANGEBOT_DIREKT,
    slices: [
      {
        ...ANGEBOT_DIREKT.slices[0],
        segments: [
          {
            ...basis,
            origin,
            destination,
            ...extra,
          },
        ],
      },
    ],
  }
}

function optionMitZeitzone(
  departureTimezone: string | null | undefined,
  arrivalTimezone: string | null | undefined,
): FlugOption {
  const segment = OPTION_DIREKT.legs[0]!.segments[0]!
  return {
    ...OPTION_DIREKT,
    legs: [
      {
        ...OPTION_DIREKT.legs[0]!,
        segments: [
          {
            ...segment,
            ...(departureTimezone !== undefined ? { departureTimezone } : {}),
            ...(arrivalTimezone !== undefined ? { arrivalTimezone } : {}),
          },
        ],
      },
    ],
  }
}

function browserItineraryMit(extra: Record<string, unknown>): unknown {
  return {
    v: 1,
    type: 'flight_route_itinerary',
    legs: [
      {
        segments: [
          {
            origin: { airportCode: 'ZRH', countryCode: 'CH' },
            destination: { airportCode: 'BKK', countryCode: 'TH' },
            departureDate: '2026-11-01',
            departureTime: '09:15',
            arrivalDate: '2026-11-01',
            arrivalTime: '23:45',
            ...extra,
          },
        ],
      },
    ],
  }
}

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flug-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → BKK',
    note: null,
    position: 1,
    startsOn: '2026-11-01',
    startsAt: '09:15',
    endsOn: '2026-11-01',
    endsAt: '23:45',
    priceAmount: 892.5,
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

const NACHWEIS_KONTEXT: FlugNachweisKontext = {
  legs: [{ origin: 'ZRH', destination: 'BKK', date: '2026-11-01' }],
  passengers: { adults: 2, children: 0, infants: 0 },
  cabin: 'economy',
  currency: 'CHF',
}

describe('E5-B1 – trusted airport timezone provenance', () => {
  test('1. strukturiertes Origin-Airport mit gültigem time_zone wird Departure-Timezone', () => {
    const option = duffelAngebotMappen(
      duffelMit({ iata_code: 'ZRH', time_zone: 'Europe/Zurich' }, { iata_code: 'BKK' }),
    )
    assert.ok(option)
    assert.equal(option.legs[0]?.segments[0]?.origin, 'ZRH')
    assert.equal(option.legs[0]?.segments[0]?.departureTimezone, 'Europe/Zurich')
    assert.equal(option.legs[0]?.segments[0]?.arrivalTimezone, null)
  })

  test('2. strukturiertes Destination-Airport mit gültigem time_zone wird Arrival-Timezone', () => {
    const option = duffelAngebotMappen(
      duffelMit({ iata_code: 'ZRH' }, { iata_code: 'BKK', time_zone: 'Asia/Bangkok' }),
    )
    assert.ok(option)
    assert.equal(option.legs[0]?.segments[0]?.destination, 'BKK')
    assert.equal(option.legs[0]?.segments[0]?.departureTimezone, null)
    assert.equal(option.legs[0]?.segments[0]?.arrivalTimezone, 'Asia/Bangkok')
  })

  test('3. String-/IATA-only Origin/Destination erhält null, keine Inferenz', () => {
    const option = duffelAngebotMappen(duffelMit('ZRH', 'BKK'))
    assert.ok(option)
    const segment = option.legs[0]!.segments[0]!
    assert.equal(segment.origin, 'ZRH')
    assert.equal(segment.destination, 'BKK')
    assert.equal(segment.departureTimezone, null)
    assert.equal(segment.arrivalTimezone, null)
  })

  test('4. fehlendes time_zone bleibt null; IATA/Country/City werden nicht geraten', () => {
    const option = duffelAngebotMappen(
      duffelMit(
        { iata_code: 'ZRH', name: 'Zurich', city_name: 'Zurich' },
        { iata_code: 'BKK', name: 'Bangkok', city_name: 'Bangkok' },
      ),
    )
    assert.ok(option)
    assert.equal(option.legs[0]?.segments[0]?.departureTimezone, null)
    assert.equal(option.legs[0]?.segments[0]?.arrivalTimezone, null)
  })

  test('5. malformed/unbounded time_zone wird fail-closed und verwirft das Angebot nicht', () => {
    const option = duffelAngebotMappen(
      duffelMit(
        { iata_code: 'ZRH', time_zone: '+02:00' },
        { iata_code: 'BKK', time_zone: 'Z' },
      ),
    )
    assert.ok(option)
    const segment = option.legs[0]!.segments[0]!
    assert.equal(segment.origin, 'ZRH')
    assert.equal(segment.destination, 'BKK')
    assert.equal(segment.departureTimezone, null)
    assert.equal(segment.arrivalTimezone, null)
    assert.equal(
      duffelAngebotMappen(
        duffelMit({ iata_code: 'ZRH', time_zone: 'Europe/London/Extra/City' }, { iata_code: 'BKK', time_zone: '' }),
      )?.legs[0]?.segments[0]?.departureTimezone,
      null,
    )
  })

  test('6. lokale Flight-Datum/Uhrzeit bleiben unverändert; Offset wird nicht zu Zone', () => {
    const ohneZone = duffelAngebotMappen(ANGEBOT_DIREKT)
    const mitZone = duffelAngebotMappen(
      duffelMit(
        { iata_code: 'ZRH', time_zone: 'Europe/Zurich' },
        { iata_code: 'BKK', time_zone: 'Asia/Bangkok' },
        {
          departing_at: '2026-11-01T09:15:00+01:00',
          arriving_at: '2026-11-01T23:45:00+07:00',
        },
      ),
    )
    assert.ok(ohneZone)
    assert.ok(mitZone)
    const a = ohneZone.legs[0]!.segments[0]!
    const b = mitZone.legs[0]!.segments[0]!
    assert.equal(a.departureDate, '2026-11-01')
    assert.equal(a.departureTime, '09:15')
    assert.equal(a.arrivalDate, '2026-11-01')
    assert.equal(a.arrivalTime, '23:45')
    assert.equal(b.departureDate, a.departureDate)
    assert.equal(b.departureTime, a.departureTime)
    assert.equal(b.arrivalDate, a.arrivalDate)
    assert.equal(b.arrivalTime, a.arrivalTime)
    assert.equal(a.departureTimezone, null)
    assert.equal(b.departureTimezone, 'Europe/Zurich')
    assert.equal(b.arrivalTimezone, 'Asia/Bangkok')
    assert.equal(b.departureTime.includes('Z'), false)
    assert.equal(b.arrivalTime.includes('+'), false)
  })

  test('7. Server-proven Snapshot trägt Timezone in die persistierbare Trusted Itinerary', async () => {
    const option = optionMitZeitzone('Europe/Zurich', 'Asia/Bangkok')
    const nachweis = flugNachweisAusKatalog({
      optionen: { direkt: option },
      kontexte: { direkt: NACHWEIS_KONTEXT },
    })
    const ergebnis = await flugKontoUebernahmePruefen(
      { tripId: 'trip-1', dayId: 'day-1', optionId: 'direkt' },
      {
        nachweis,
        reise: beispielreise(),
        suche: { legs: NACHWEIS_KONTEXT.legs, cabin: NACHWEIS_KONTEXT.cabin },
        refs: TEST_FLUGHAFEN_REFS,
      },
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    const segment = ergebnis.aufnahme.routeItinerary?.legs[0]?.segments[0]
    assert.equal(ergebnis.option.legs[0]?.segments[0]?.departureTimezone, 'Europe/Zurich')
    assert.equal(ergebnis.option.legs[0]?.segments[0]?.arrivalTimezone, 'Asia/Bangkok')
    assert.equal(segment?.departureTimezone, 'Europe/Zurich')
    assert.equal(segment?.arrivalTimezone, 'Asia/Bangkok')
    assert.equal(segment?.departureDate, '2026-11-01')
    assert.equal(segment?.departureTime, '09:15')
    const metadata = metadataAusItinerary(ergebnis.aufnahme.routeItinerary)
    assert.match(JSON.stringify(metadata), /Europe\/Zurich/)
    assert.match(JSON.stringify(metadata), /Asia\/Bangkok/)
  })

  test('8. Trusted Metadata-Lesepfad stellt Timezone wieder her und adelt keine Surface', () => {
    const itinerary = itineraryAusFlugOption(optionMitZeitzone('Europe/Zurich', 'Asia/Bangkok'), TEST_FLUGHAFEN_REFS)
    assert.ok(itinerary)
    const mitSurface = {
      ...itinerary,
      legs: [
        {
          segments: [
            {
              ...itinerary.legs[0]!.segments[0]!,
              surfaceFromAirportCode: 'CDG',
            },
          ],
        },
      ],
    }
    const gelesen = itineraryAusMetadata(metadataAusItinerary(mitSurface))
    assert.ok(gelesen)
    assert.equal(gelesen.legs[0]?.segments[0]?.departureTimezone, 'Europe/Zurich')
    assert.equal(gelesen.legs[0]?.segments[0]?.arrivalTimezone, 'Asia/Bangkok')
    assert.equal(gelesen.legs[0]?.segments[0]?.surfaceFromAirportCode, undefined)
    assert.equal('surfaceFromAirportCode' in (gelesen.legs[0]?.segments[0] ?? {}), false)
  })

  test('9. Untrusted Browser/Guest-Itinerary mit injizierter Timezone wird gestript', () => {
    const roh = browserItineraryMit({
      departureTimezone: 'Europe/Zurich',
      arrivalTimezone: 'Asia/Bangkok',
      surfaceFromAirportCode: 'CDG',
    })
    const gelesen = flugRouteItineraryLesen(roh)
    assert.ok(gelesen)
    assert.equal(gelesen.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(gelesen.legs[0]?.segments[0]?.arrivalTimezone, undefined)
    assert.equal(gelesen.legs[0]?.segments[0]?.surfaceFromAirportCode, undefined)
    assert.equal(gelesen.legs[0]?.segments[0]?.departureTime, '09:15')
    const kanonisch = itineraryKanonisieren(gelesen, TEST_FLUGHAFEN_REFS)
    assert.equal(kanonisch?.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(kanonisch?.legs[0]?.segments[0]?.arrivalTimezone, undefined)
    const gast = reiseLesen(
      beispielreise({ ohneTag: [flug({ routeItinerary: roh as FlugRouteItinerary })] }),
    )
    assert.equal(gast?.ohneTag[0]?.routeItinerary?.legs[0]?.segments[0]?.departureTimezone, undefined)
  })

  test('10. Guest→Account-Kanonisierung erfindet keine Timezone aus Airport-Refs', () => {
    const nutzlast = reiseNutzlastSchema.parse({
      client_ref: 'trip-guest-e5b1',
      title: 'Thailand',
      origin: 'Zürich',
      origin_place_id: 'airport:ZRH',
      start_date: '2026-11-01',
      end_date: '2026-11-10',
      travellers: 2,
      currency: 'CHF',
      budget_amount: null,
      pace: 'balanced',
      interests: [],
      travel_wish: null,
      stages: [{ position: 1, name: 'Bangkok', country_code: null, arrival_date: null, departure_date: null }],
      days: [],
      ungeplante: [
        {
          kind: 'flight',
          title: 'ZRH → BKK',
          note: null,
          position: 1,
          starts_on: '2026-11-01',
          starts_at: '09:15',
          ends_on: '2026-11-01',
          ends_at: '23:45',
          price_amount: 892.5,
          price_currency: 'CHF',
          provider: 'duffel',
          external_ref: 'off_1',
          booking_url: null,
          booking_status: 'unconfirmed',
          booking_confirmed_at: null,
          route_itinerary: browserItineraryMit({
            departureTimezone: 'Europe/Zurich',
            arrivalTimezone: 'Asia/Bangkok',
          }),
        },
      ],
    })
    assert.equal(nutzlast.ungeplante[0]?.route_itinerary?.legs[0]?.segments[0]?.departureTimezone, undefined)
    const konto = reiseNutzlastRouteKanonisieren(nutzlast, TEST_FLUGHAFEN_REFS).ungeplante[0]?.route_itinerary
    assert.ok(konto)
    assert.equal(konto.legs[0]?.segments[0]?.origin.airportCode, 'ZRH')
    assert.equal(konto.legs[0]?.segments[0]?.origin.countryCode, 'CH')
    assert.equal(konto.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(konto.legs[0]?.segments[0]?.arrivalTimezone, undefined)
  })

  test('11. timezone-lose Legacy-Itinerary-v1 bleibt kompatibel', () => {
    const legacy = itineraryDirekt()
    assert.equal('departureTimezone' in (legacy.legs[0]?.segments[0] ?? {}), false)
    const gelesen = flugRouteItineraryLesen(legacy)
    const trusted = flugRouteItineraryTrustedLesen(legacy)
    const metadata = itineraryAusMetadata(metadataAusItinerary(legacy))
    assert.ok(gelesen)
    assert.ok(trusted)
    assert.ok(metadata)
    assert.equal(gelesen.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(trusted.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(metadata.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.deepEqual(gelesen, legacy)
    assert.equal(JSON.stringify(metadataAusItinerary(legacy)).includes('Timezone'), false)
  })

  test('12. surfaceFromAirportCode Trusted-/Untrusted-Grenze bleibt erhalten', () => {
    const fixture = {
      v: 1 as const,
      type: 'flight_route_itinerary' as const,
      legs: [
        {
          segments: [
            {
              origin: { airportCode: 'ZRH', countryCode: 'CH', city: 'Zürich', country: 'Switzerland' },
              destination: { airportCode: 'CDG', countryCode: 'FR', city: 'Paris', country: 'France' },
              departureDate: '2026-11-01',
              departureTime: '07:10',
              arrivalDate: '2026-11-01',
              arrivalTime: '08:30',
            },
            {
              origin: { airportCode: 'ORY', countryCode: 'FR', city: 'Paris', country: 'France' },
              destination: { airportCode: 'BKK', countryCode: 'TH', city: 'Bangkok', country: 'Thailand' },
              departureDate: '2026-11-01',
              departureTime: '12:40',
              arrivalDate: '2026-11-02',
              arrivalTime: '06:10',
              surfaceFromAirportCode: 'CDG',
              departureTimezone: 'Europe/Paris',
            },
          ],
        },
      ],
    }
    const untrusted = flugRouteItineraryLesen(fixture)
    const trusted = flugRouteItineraryTrustedLesen(fixture)
    const metadata = itineraryAusMetadata(metadataAusItinerary(fixture))
    assert.equal(untrusted?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(untrusted?.legs[0]?.segments[1]?.departureTimezone, undefined)
    assert.equal(trusted?.legs[0]?.segments[1]?.surfaceFromAirportCode, 'CDG')
    assert.equal(trusted?.legs[0]?.segments[1]?.departureTimezone, 'Europe/Paris')
    assert.equal(metadata?.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
    assert.equal(metadata?.legs[0]?.segments[1]?.departureTimezone, 'Europe/Paris')
  })

  test('13. Route chronology/fingerprint/local-time bleiben timezone-neutral', () => {
    const ohne = itineraryAusFlugOption(OPTION_DIREKT, TEST_FLUGHAFEN_REFS)!
    const mit = itineraryAusFlugOption(optionMitZeitzone('Europe/Zurich', 'Asia/Bangkok'), TEST_FLUGHAFEN_REFS)!
    const transit = itineraryEinTransit('DOH')
    const factsOhne = routeFactsAusGraph(beispielreise({ ohneTag: [flug({ routeItinerary: ohne })] }))
    const factsMit = routeFactsAusGraph(beispielreise({ ohneTag: [flug({ routeItinerary: mit })] }))
    const factsTransit = routeFactsAusGraph(beispielreise({ ohneTag: [flug({ routeItinerary: transit })] }))
    assert.equal(factsOhne.chronologieBewiesen, true)
    assert.equal(factsMit.chronologieBewiesen, true)
    assert.equal(factsOhne.fingerprint, factsMit.fingerprint)
    assert.equal(factsOhne.origin.airportCode, 'ZRH')
    assert.equal(factsMit.destination.airportCode, 'BKK')
    assert.notEqual(factsOhne.fingerprint, factsTransit.fingerprint)
    assert.equal(mit.legs[0]?.segments[0]?.departureTime, ohne.legs[0]?.segments[0]?.departureTime)
  })

  test('14. Flight-proof/Account-Adoption akzeptiert nur identifiers und erhält Provider-Timezone', async () => {
    const option = optionMitZeitzone('Europe/Zurich', 'Asia/Bangkok')
    const nachweis = flugNachweisAusKatalog({
      optionen: { direkt: option },
      kontexte: { direkt: NACHWEIS_KONTEXT },
    })
    const geparst = flugKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      dayId: null,
      optionId: 'direkt',
      option: optionMitZeitzone('America/New_York', 'Pacific/Auckland'),
      departureTimezone: 'UTC',
    })
    assert.equal(geparst.success, true)
    if (geparst.success) {
      assert.deepEqual(Object.keys(geparst.data).sort(), ['dayId', 'optionId', 'tripId'])
    }
    const ergebnis = await flugKontoUebernahmePruefen(
      { tripId: 'trip-1', dayId: 'day-1', optionId: 'direkt' },
      {
        nachweis,
        reise: beispielreise(),
        suche: { legs: NACHWEIS_KONTEXT.legs, cabin: NACHWEIS_KONTEXT.cabin },
      },
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.legs[0]?.segments[0]?.departureTimezone, 'Europe/Zurich')
    assert.notEqual(ergebnis.option.legs[0]?.segments[0]?.departureTimezone, 'America/New_York')
  })

  test('15. FlugOption-Extra-Felder und ungültige Timezone werden nicht Trusted Truth', () => {
    const manipuliert = {
      ...optionMitZeitzone('not-a-zone', 'Z'),
      legs: [
        {
          ...OPTION_DIREKT.legs[0]!,
          segments: [
            {
              ...OPTION_DIREKT.legs[0]!.segments[0]!,
              departureTimezone: 'not-a-zone',
              arrivalTimezone: '+07:00',
              surfaceFromAirportCode: 'JFK',
            },
          ],
        },
      ],
    }
    const gelesen = flugOptionLesen(manipuliert)
    const itinerary = itineraryAusFlugOption(manipuliert, TEST_FLUGHAFEN_REFS)
    const aufnahme = alsFlugMomentaufnahme(manipuliert, TEST_FLUGHAFEN_REFS)
    assert.ok(gelesen)
    assert.equal(gelesen.legs[0]?.segments[0]?.departureTimezone, null)
    assert.equal(gelesen.legs[0]?.segments[0]?.arrivalTimezone, null)
    assert.equal('surfaceFromAirportCode' in (gelesen.legs[0]?.segments[0] ?? {}), false)
    assert.equal(itinerary?.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(aufnahme?.routeItinerary?.legs[0]?.segments[0]?.departureTimezone, undefined)
  })

  test('16. Trusted-Timezone-Reader und Untrusted-Reader bleiben getrennte Wege', () => {
    const roh = browserItineraryMit({
      departureTimezone: 'Europe/Zurich',
      surfaceFromAirportCode: 'CDG',
    })
    assert.equal(flugRouteItineraryLesen(roh)?.legs[0]?.segments[0]?.departureTimezone, undefined)
    assert.equal(flugRouteItineraryTrustedTimezoneLesen(roh)?.legs[0]?.segments[0]?.departureTimezone, 'Europe/Zurich')
    assert.equal(flugRouteItineraryTrustedTimezoneLesen(roh)?.legs[0]?.segments[0]?.surfaceFromAirportCode, undefined)
    assert.equal(flugRouteItineraryTrustedLesen(roh)?.legs[0]?.segments[0]?.surfaceFromAirportCode, 'CDG')
    assert.equal(flugRouteItineraryTrustedLesen(roh)?.legs[0]?.segments[0]?.departureTimezone, 'Europe/Zurich')
  })
})
