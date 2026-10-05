// lib/route/nachziehen.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { itineraryDirekt, itineraryEinTransit, itineraryZweiTransits } from '@/lib/route/fixtures'
import { metadataAusItinerary } from '@/lib/route/metadata'
import {
  flugRoutenAusNutzlast,
  flugRoutenNachziehen,
  type RouteFlugItem,
  type RouteSchreibClient,
} from '@/lib/route/nachziehen'
import { routeFingerprintAus } from '@/lib/route/fingerprint'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { reiseNutzlastSchema, type ReiseNutzlast } from '@/lib/trips/schema'
import type { FlugRouteItinerary } from '@/lib/route/domain'

function flugNutzlast(itinerary: FlugRouteItinerary | null, teil: Record<string, unknown> = {}): ReiseNutzlast {
  return reiseNutzlastSchema.parse({
    client_ref: 'trip-guest-1',
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
        title: 'ZRH → BKK · SWISS',
        note: null,
        position: 1,
        starts_on: '2026-11-01',
        starts_at: '09:15',
        ends_on: '2026-11-01',
        ends_at: '21:40',
        price_amount: 890,
        price_currency: 'CHF',
        provider: 'duffel',
        external_ref: 'off_1',
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
        route_itinerary: itinerary,
        ...teil,
      },
    ],
  })
}

function item(teil: Partial<RouteFlugItem> = {}): RouteFlugItem {
  return {
    id: 'item-1',
    title: 'ZRH → BKK · SWISS',
    starts_on: '2026-11-01',
    ends_on: '2026-11-01',
    provider: 'duffel',
    external_ref: 'off_1',
    position: 1,
    day_id: null,
    metadata: {},
    ...teil,
  }
}

function clientAttrappe(teil: {
  items?: { data: RouteFlugItem[] | null; error: { message: string } | null }
  tage?: { data: { id: string; day_index: number }[] | null; error: { message: string } | null }
  schreiben?: { error: { message: string } | null } | (() => { error: { message: string } | null })
} = {}) {
  const geschrieben: { itemId: string; metadata: unknown }[] = []
  const client: RouteSchreibClient = {
    async flugItemsLesen() {
      return teil.items ?? { data: [item()], error: null }
    },
    async tageLesen() {
      return teil.tage ?? { data: [], error: null }
    },
    async metadataSchreiben(_tripId, itemId, metadata) {
      geschrieben.push({ itemId, metadata })
      const antwort = typeof teil.schreiben === 'function' ? teil.schreiben() : (teil.schreiben ?? { error: null })
      return antwort
    },
  }
  return { client, geschrieben }
}

function readinessRoute(itinerary: FlugRouteItinerary) {
  const fingerprint = routeFingerprintAus([{ sourceItemId: 'item-1', startsOn: null, startsAt: null, itinerary }])
  return readinessFingerprint({
    kind: 'entry_check',
    countryCode: 'TH',
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    travellers: 2,
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
    transitCountryCodes: itinerary.legs[0]!.segments.slice(0, -1).map((seg) => seg.destination.countryCode).filter((code): code is string => Boolean(code)),
    routeFingerprint: fingerprint,
  })
}

describe('Routen-Nachzug nach Guest → Account', () => {
  test('Direktflug behält die Itinerary', async () => {
    const itinerary = itineraryDirekt()
    const { client, geschrieben } = clientAttrappe()
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itinerary))
    assert.deepEqual(ergebnis, { ok: true })
    assert.deepEqual(geschrieben[0]?.metadata, metadataAusItinerary(itinerary))
  })

  test('ein Transit behält die vollständige Route', async () => {
    const itinerary = itineraryEinTransit()
    const { client } = clientAttrappe({
      items: { data: [item({ metadata: metadataAusItinerary(itinerary) })], error: null },
    })
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itinerary))
    assert.deepEqual(ergebnis, { ok: true })
    assert.equal(flugRoutenAusNutzlast(flugNutzlast(itinerary))[0]?.itinerary.legs[0]?.segments.length, 2)
  })

  test('zwei Transits behalten die vollständige Route', async () => {
    const itinerary = itineraryZweiTransits()
    const { client, geschrieben } = clientAttrappe()
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itinerary))
    assert.deepEqual(ergebnis, { ok: true })
    assert.equal(
      (geschrieben[0]?.metadata as { routeItinerary?: { legs: { segments: unknown[] }[] } })?.routeItinerary
        ?.legs[0]?.segments.length,
      3,
    )
  })

  test('ein Lesefehler ist kein vollständiger Erfolg', async () => {
    const { client } = clientAttrappe({
      items: { data: null, error: { message: 'timeout' } },
    })
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itineraryDirekt()))
    assert.deepEqual(ergebnis, { ok: false, grund: 'lesen' })
  })

  test('ein Schreibfehler ist kein vollständiger Erfolg', async () => {
    const { client } = clientAttrappe({
      schreiben: { error: { message: 'update failed' } },
    })
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itineraryDirekt()))
    assert.deepEqual(ergebnis, { ok: false, grund: 'schreiben' })
  })

  test('fehlende Flugzeilen sind kein vollständiger Erfolg', async () => {
    const { client } = clientAttrappe({
      items: { data: [], error: null },
    })
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itineraryDirekt()))
    assert.deepEqual(ergebnis, { ok: false, grund: 'unvollstaendig' })
  })

  test('Retry schreibt dieselbe Route auf dieselbe Zeile, nicht doppelt', async () => {
    const itinerary = itineraryEinTransit()
    let vorhanden = false
    const { client, geschrieben } = clientAttrappe({
      schreiben: () => {
        vorhanden = true
        return { error: null }
      },
    })
    const erst = await flugRoutenNachziehen(client, 'trip-1', flugNutzlast(itinerary))
    const clientZweiter: RouteSchreibClient = {
      ...client,
      async flugItemsLesen() {
        return {
          data: [item({ metadata: vorhanden ? metadataAusItinerary(itinerary) : {} })],
          error: null,
        }
      },
    }
    const retry = await flugRoutenNachziehen(clientZweiter, 'trip-1', flugNutzlast(itinerary))
    assert.deepEqual(erst, { ok: true })
    assert.deepEqual(retry, { ok: true })
    assert.equal(geschrieben.length, 1)
  })

  test('derselbe Fingerprint bleibt nach erfolgreichem Nachzug stabil', () => {
    const itinerary = itineraryEinTransit()
    const vorher = readinessRoute(itinerary)
    const nachher = readinessRoute(flugRoutenAusNutzlast(flugNutzlast(itinerary))[0]!.itinerary)
    assert.equal(vorher, nachher)
  })

  test('ungültige Route-Metadata wird nicht geschrieben', async () => {
    const { client, geschrieben } = clientAttrappe()
    const nutzlast = flugNutzlast(itineraryDirekt())
    nutzlast.ungeplante[0] = {
      ...nutzlast.ungeplante[0]!,
      route_itinerary: { v: 2, type: 'nope' } as never,
    }
    const ergebnis = await flugRoutenNachziehen(client, 'trip-1', nutzlast)
    assert.deepEqual(ergebnis, { ok: true })
    assert.equal(geschrieben.length, 0)
  })
})
