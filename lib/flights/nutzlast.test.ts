import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { flugNutzlastOhneUnbewieseneWahrheit } from '@/lib/flights/nutzlast'
import { itineraryDirekt } from '@/lib/route/fixtures'
import type { ReiseNutzlast } from '@/lib/trips/schema'

function nutzlastMitFlug(teil: {
  price_amount: number | null
  price_currency: string | null
  provider: string | null
  external_ref: string | null
  booking_url: string | null
}): ReiseNutzlast {
  return {
    client_ref: 'guest-1',
    title: 'Bangkok',
    origin: 'Zürich',
    origin_place_id: null,
    start_date: '2026-11-01',
    end_date: '2026-11-08',
    travellers: 2,
    currency: 'CHF',
    budget_amount: null,
    pace: 'balanced',
    interests: [],
    travel_wish: null,
    stages: [],
    days: [
      {
        day_index: 1,
        day_date: '2026-11-01',
        title: null,
        stage_position: null,
        items: [
          {
            kind: 'flight',
            title: 'ZRH → BKK',
            note: null,
            position: 1,
            starts_on: '2026-11-01',
            starts_at: '09:15',
            ends_on: '2026-11-01',
            ends_at: '21:40',
            price_amount: teil.price_amount,
            price_currency: teil.price_currency,
            provider: teil.provider,
            external_ref: teil.external_ref,
            booking_url: teil.booking_url,
            booking_status: 'unconfirmed',
            booking_confirmed_at: null,
            mobility_mode: null,
            origin_place_id: null,
            destination_place_id: null,
            origin_name: null,
            destination_name: null,
            connection_ref: null,
            mobility_changes: null,
            rental_supplier: null,
            vehicle_class: null,
            transmission: null,
            route_itinerary: itineraryDirekt(),
          },
        ],
      },
    ],
    ungeplante: [
      {
        kind: 'stay',
        title: 'Hotel',
        note: null,
        position: 1,
        starts_on: '2026-11-01',
        starts_at: null,
        ends_on: '2026-11-08',
        ends_at: null,
        price_amount: 760,
        price_currency: 'CHF',
        provider: 'test-hotel',
        external_ref: 'ref-77',
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
        mobility_mode: null,
        origin_place_id: null,
        destination_place_id: null,
        origin_name: null,
        destination_name: null,
        connection_ref: null,
        mobility_changes: null,
        rental_supplier: null,
        vehicle_class: null,
        transmission: null,
        route_itinerary: null,
      },
    ],
  }
}

describe('Flug-Nutzlast ohne unbewiesene Wahrheit', () => {
  test('Guest → Account streicht kommerzielle Flugfelder, behält Route-Itinerary', () => {
    const bereinigt = flugNutzlastOhneUnbewieseneWahrheit(
      nutzlastMitFlug({
        price_amount: 890,
        price_currency: 'CHF',
        provider: 'duffel',
        external_ref: 'off_1',
        booking_url: 'https://evil.example/book',
      }),
    )
    const flug = bereinigt.days[0]?.items[0]
    assert.equal(flug?.kind, 'flight')
    assert.equal(flug?.price_amount, null)
    assert.equal(flug?.price_currency, null)
    assert.equal(flug?.provider, null)
    assert.equal(flug?.external_ref, null)
    assert.equal(flug?.booking_url, null)
    assert.deepEqual(flug?.route_itinerary, itineraryDirekt())
  })

  test('Hotel- und andere Punkte bleiben kommerziell unberührt', () => {
    const bereinigt = flugNutzlastOhneUnbewieseneWahrheit(
      nutzlastMitFlug({
        price_amount: 890,
        price_currency: 'CHF',
        provider: 'duffel',
        external_ref: 'off_1',
        booking_url: null,
      }),
    )
    assert.equal(bereinigt.ungeplante[0]?.kind, 'stay')
    assert.equal(bereinigt.ungeplante[0]?.price_amount, 760)
    assert.equal(bereinigt.ungeplante[0]?.provider, 'test-hotel')
  })
})
