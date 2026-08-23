// lib/readiness/uebernahme.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readinessAlsUebernahme, readinessNachUebernahmeBauen, tripItemFuerUebernahme } from '@/lib/readiness/uebernahme'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripItem, TripReadinessItem } from '@/types/trips'

const JETZT = '2026-08-22T08:00:00.000Z'

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'item-alt',
    dayId: null,
    stageId: null,
    kind: 'flight',
    title: 'ZRH–BKK',
    note: null,
    position: 1,
    startsOn: '2026-09-12',
    startsAt: null,
    endsOn: '2026-09-12',
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
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

function check(teil: Partial<TripReadinessItem> & Pick<TripReadinessItem, 'clientRef' | 'kind'>): TripReadinessItem {
  return {
    id: teil.clientRef,
    userStatus: 'done',
    evidence: 'user',
    countryCode: 'IT',
    tripItemId: null,
    title: null,
    contextFingerprint: 'v1|x',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Guest → Account Readiness-Übernahme', () => {
  test('idempotent: dieselbe clientRef wird nicht verdoppelt', () => {
    const gast = beispielreise({
      readinessItems: [
        check({ clientRef: 'entry_check:IT', kind: 'entry_check' }),
        check({ clientRef: 'entry_check:IT', kind: 'entry_check', id: 'dup' }),
      ],
    })
    const payload = readinessAlsUebernahme(gast)
    const konto = beispielreise({ id: 'aaaaaaaa-0000-4000-8000-000000000099' })
    const gebaut = readinessNachUebernahmeBauen(konto, [...payload, ...payload])
    assert.equal(gebaut.filter((item) => item.clientRef === 'entry_check:IT').length, 1)
  })

  test('Confirmation wird über Fakten neu zugeordnet, nicht über Gast-ID', () => {
    const gast = beispielreise({
      ohneTag: [flug()],
      readinessItems: [
        check({
          clientRef: 'booking_confirmation_check:item-alt',
          kind: 'booking_confirmation_check',
          tripItemId: 'item-alt',
          countryCode: null,
        }),
      ],
    })
    const payload = readinessAlsUebernahme(gast)
    const konto = beispielreise({
      ohneTag: [flug({ id: 'dddddddd-0000-4000-8000-000000000001' })],
    })
    const id = tripItemFuerUebernahme(konto, payload[0]!)
    assert.equal(id, 'dddddddd-0000-4000-8000-000000000001')
    const gebaut = readinessNachUebernahmeBauen(konto, payload)
    assert.equal(gebaut[0]?.tripItemId, 'dddddddd-0000-4000-8000-000000000001')
    assert.equal(gebaut[0]?.userStatus, 'done')
  })

  test('ohne Match bleibt Confirmation ohne fremden Planpunkt', () => {
    const gebaut = readinessNachUebernahmeBauen(beispielreise(), [
      {
        clientRef: 'booking_confirmation_check:weg',
        kind: 'booking_confirmation_check',
        userStatus: 'done',
        countryCode: null,
        title: null,
        itemKind: 'flight',
        itemStartsOn: '2026-01-01',
        itemEndsOn: '2026-01-01',
        itemTitle: 'Gibt es nicht',
      },
    ])
    assert.equal(gebaut[0]?.tripItemId, null)
  })

  test('travellerClientRef überlebt Guest→Account-Bau', () => {
    const gast = beispielreise({
      party: [
        {
          id: 'traveller:1',
          clientRef: 'traveller:1',
          label: 'Sasa',
          residenceCountryCode: 'CH',
          citizenships: [
            {
              id: 'citizenship:CH',
              clientRef: 'citizenship:CH',
              countryCode: 'CH',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
          ],
          documents: [],
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      readinessItems: [
        check({
          clientRef: 'entry_check:TH',
          kind: 'entry_check',
          travellerClientRef: 'traveller:1',
          countryCode: 'TH',
        }),
      ],
    })
    const payload = readinessAlsUebernahme(gast)
    assert.equal(payload[0]?.travellerClientRef, 'traveller:1')
    const gebaut = readinessNachUebernahmeBauen(beispielreise({ id: 'aaaaaaaa-0000-4000-8000-000000000099' }), payload)
    assert.equal(gebaut[0]?.travellerClientRef, 'traveller:1')
  })
})
