import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { flugNutzlastOhneUnbewieseneWahrheit } from '@/lib/flights/nutzlast'
import { itineraryDirekt } from '@/lib/route/fixtures'
import { nutzlastOhneUnbewieseneHandelsfelder } from '@/lib/trips/handelsfelder-nutzlast'
import type { ReiseNutzlast } from '@/lib/trips/schema'

type NutzlastPunkt = ReiseNutzlast['days'][number]['items'][number]

function basisPunkt(teil: Partial<NutzlastPunkt> & Pick<NutzlastPunkt, 'kind' | 'title'>): NutzlastPunkt {
  return {
    note: null,
    position: 1,
    starts_on: '2026-11-01',
    starts_at: null,
    ends_on: null,
    ends_at: null,
    price_amount: null,
    price_currency: null,
    provider: null,
    external_ref: null,
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
    ...teil,
  }
}

function nutzlastMit(punkte: NutzlastPunkt[]): ReiseNutzlast {
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
        items: punkte,
      },
    ],
    ungeplante: [],
  }
}

describe('Stay/Activity-Handelsfelder ohne unbewiesene Wahrheit', () => {
  test('manipuliertes Stay verliert Preis, Provider, Ref und Booking-URL', () => {
    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(
      nutzlastMit([
        basisPunkt({
          kind: 'stay',
          title: 'Uferhotel',
          note: 'am Fluss',
          starts_on: '2026-11-01',
          ends_on: '2026-11-08',
          price_amount: 9999,
          price_currency: 'CHF',
          provider: 'evil-hotel',
          external_ref: 'hack-stay',
          booking_url: 'https://evil.example/book',
        }),
      ]),
    )
    const stay = bereinigt.days[0]?.items[0]
    assert.equal(stay?.kind, 'stay')
    assert.equal(stay?.title, 'Uferhotel')
    assert.equal(stay?.note, 'am Fluss')
    assert.equal(stay?.starts_on, '2026-11-01')
    assert.equal(stay?.ends_on, '2026-11-08')
    assert.equal(stay?.price_amount, null)
    assert.equal(stay?.price_currency, null)
    assert.equal(stay?.provider, null)
    assert.equal(stay?.external_ref, null)
    assert.equal(stay?.booking_url, null)
  })

  test('manipulierte Activity verliert dieselben Handelsfelder', () => {
    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(
      nutzlastMit([
        basisPunkt({
          kind: 'activity',
          title: 'Bootsfahrt',
          note: 'früh da sein',
          starts_on: '2026-11-02',
          starts_at: '10:00',
          price_amount: 8888,
          price_currency: 'USD',
          provider: 'evil-activity',
          external_ref: 'hack-act',
          booking_url: 'https://evil.example/act',
        }),
      ]),
    )
    const activity = bereinigt.days[0]?.items[0]
    assert.equal(activity?.kind, 'activity')
    assert.equal(activity?.title, 'Bootsfahrt')
    assert.equal(activity?.note, 'früh da sein')
    assert.equal(activity?.starts_on, '2026-11-02')
    assert.equal(activity?.starts_at, '10:00')
    assert.equal(activity?.price_amount, null)
    assert.equal(activity?.price_currency, null)
    assert.equal(activity?.provider, null)
    assert.equal(activity?.external_ref, null)
    assert.equal(activity?.booking_url, null)
  })

  test('fehlende, null und halb gesetzte Handelsfelder enden fail-closed als null', () => {
    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(
      nutzlastMit([
        basisPunkt({
          kind: 'stay',
          title: 'Ohne Preis',
          price_amount: null,
          price_currency: 'CHF',
          provider: '',
          external_ref: null,
          booking_url: null,
        }),
        basisPunkt({
          kind: 'activity',
          title: 'Nur Ref',
          position: 2,
          price_amount: 12,
          price_currency: null,
          provider: null,
          external_ref: 'x',
          booking_url: 'not-a-url',
        }),
      ]),
    )
    for (const punkt of bereinigt.days[0]?.items ?? []) {
      assert.equal(punkt.price_amount, null)
      assert.equal(punkt.price_currency, null)
      assert.equal(punkt.provider, null)
      assert.equal(punkt.external_ref, null)
      assert.equal(punkt.booking_url, null)
    }
  })

  test('Flug-Strip bleibt wirksam und Stay/Activity werden zusätzlich gestrichen', () => {
    const roh = nutzlastMit([
      basisPunkt({
        kind: 'flight',
        title: 'ZRH → BKK',
        starts_at: '09:15',
        ends_on: '2026-11-01',
        ends_at: '21:40',
        price_amount: 890,
        price_currency: 'CHF',
        provider: 'duffel',
        external_ref: 'off_1',
        booking_url: 'https://evil.example/fly',
        route_itinerary: itineraryDirekt(),
      }),
      basisPunkt({
        kind: 'stay',
        title: 'Hotel',
        position: 2,
        price_amount: 760,
        price_currency: 'CHF',
        provider: 'test-hotel',
        external_ref: 'ref-77',
        booking_url: 'https://evil.example/stay',
      }),
    ])
    const nurFlug = flugNutzlastOhneUnbewieseneWahrheit(roh)
    assert.equal(nurFlug.days[0]?.items[0]?.price_amount, null)
    assert.equal(nurFlug.days[0]?.items[1]?.price_amount, 760)

    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(roh)
    const flug = bereinigt.days[0]?.items[0]
    const stay = bereinigt.days[0]?.items[1]
    assert.equal(flug?.price_amount, null)
    assert.equal(flug?.provider, null)
    assert.deepEqual(flug?.route_itinerary, itineraryDirekt())
    assert.equal(stay?.price_amount, null)
    assert.equal(stay?.provider, null)
    assert.equal(stay?.title, 'Hotel')
  })

  test('ungeplante Stay/Activity werden genauso gestrichen', () => {
    const roh = nutzlastMit([])
    roh.ungeplante = [
      basisPunkt({
        kind: 'stay',
        title: 'Offenes Hotel',
        price_amount: 1,
        price_currency: 'CHF',
        provider: 'x',
        external_ref: 'y',
        booking_url: 'https://evil.example/open',
      }),
    ]
    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(roh)
    assert.equal(bereinigt.ungeplante[0]?.title, 'Offenes Hotel')
    assert.equal(bereinigt.ungeplante[0]?.price_amount, null)
    assert.equal(bereinigt.ungeplante[0]?.provider, null)
  })

  test('Transfer- und Mietwagen-Nutzerpreise bleiben (S3 User-Intake)', () => {
    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(
      nutzlastMit([
        basisPunkt({
          kind: 'transfer',
          title: 'Zug',
          price_amount: 42,
          price_currency: 'CHF',
          mobility_mode: 'rail',
          origin_name: 'Zürich',
          destination_name: 'Lugano',
        }),
        basisPunkt({
          kind: 'rental_car',
          title: 'Mietwagen',
          position: 2,
          price_amount: 280,
          price_currency: 'CHF',
          rental_supplier: 'Europcar',
        }),
      ]),
    )
    assert.equal(bereinigt.days[0]?.items[0]?.price_amount, 42)
    assert.equal(bereinigt.days[0]?.items[1]?.price_amount, 280)
    assert.equal(bereinigt.days[0]?.items[1]?.rental_supplier, 'Europcar')
  })

  test('erfindet keinen Provider- oder Preisstatus', () => {
    const bereinigt = nutzlastOhneUnbewieseneHandelsfelder(
      nutzlastMit([basisPunkt({ kind: 'stay', title: 'Nur Titel' })]),
    )
    const stay = bereinigt.days[0]?.items[0]
    assert.equal(stay?.price_amount, null)
    assert.equal(stay?.provider, null)
    assert.equal('verified' in (stay as object), false)
    assert.equal('nachweis' in (stay as object), false)
  })
})
