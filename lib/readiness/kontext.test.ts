// lib/readiness/kontext.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readinessChecksAbleiten } from '@/lib/readiness/ableitung'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessReisekontext } from '@/lib/readiness/kontext'
import { readinessAnsicht } from '@/lib/readiness/status'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripItem, TripReadinessItem } from '@/types/trips'

const JETZT = '2026-08-22T08:00:00.000Z'

function flug(teil: Partial<TripItem> = {}): TripItem {
  return {
    id: 'flug-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH–BKK',
    note: null,
    position: 1,
    startsOn: '2026-09-12',
    startsAt: '09:00',
    endsOn: '2026-09-12',
    endsAt: '23:00',
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
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
    ...teil,
  }
}

function persistiert(teil: Partial<TripReadinessItem> & Pick<TripReadinessItem, 'clientRef' | 'kind'>): TripReadinessItem {
  return {
    id: teil.clientRef,
    userStatus: 'done',
    evidence: 'user',
    countryCode: null,
    tripItemId: null,
    title: null,
    contextFingerprint: 'alt',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Readiness-Kontext und Stale-Logik', () => {
  test('Ziel-Land geändert → alter Check nicht mehr aktuell', () => {
    const vorher = beispielreise()
    const fingerprint = readinessFingerprint({
      kind: 'entry_check',
      countryCode: 'TH',
      startDate: vorher.startDate,
      endDate: vorher.endDate,
      travellers: vorher.travellers,
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
    })
    const nachher = beispielreise({
      stages: vorher.stages.map((etappe) => ({ ...etappe, countryCode: 'JP', name: 'Tokio' })),
      readinessItems: [
        persistiert({
          clientRef: 'entry_check:TH',
          kind: 'entry_check',
          countryCode: 'TH',
          userStatus: 'done',
          contextFingerprint: fingerprint,
        }),
      ],
    })
    const { items, summary } = readinessAnsicht(nachher)
    const alt = items.find((item) => item.clientRef === 'entry_check:TH')
    assert.equal(alt?.currentness, 'not_applicable')
    assert.equal(summary.done, items.filter((item) => item.currentness === 'current' && item.userStatus === 'done').length)
    assert.ok(!items.some((item) => item.kind === 'entry_check' && item.countryCode === 'TH' && item.currentness === 'current'))
  })

  test('Datum geändert → relevanter Check stale', () => {
    const reise = beispielreise()
    const alt = readinessFingerprint({
      kind: 'insurance_check',
      countryCode: null,
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: 2,
      destinationCountries: ['IT'],
      rentalCarPresent: false,
      tripItemId: null,
      itemKind: null,
      bookingStatus: null,
      startsOn: null,
      endsOn: null,
      originPlaceId: null,
      destinationPlaceId: null,
      title: null,
    })
    const verschoben = beispielreise({
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      readinessItems: [
        persistiert({
          clientRef: 'insurance_check:trip',
          kind: 'insurance_check',
          userStatus: 'done',
          contextFingerprint: alt,
        }),
      ],
    })
    const { items } = readinessAnsicht(verschoben)
    const versicherung = items.find((item) => item.kind === 'insurance_check')
    assert.equal(versicherung?.currentness, 'stale')
    assert.equal(versicherung?.userStatus, 'done')
  })

  test('gleiches Land mehrfach → keine Duplikate', () => {
    const reise = beispielreise({
      stages: [
        { ...beispielreise().stages[0], countryCode: 'TH' },
        { ...beispielreise().stages[1], countryCode: 'TH', name: 'Phuket' },
      ],
    })
    const checks = readinessChecksAbleiten(reise)
    const einreise = checks.filter((check) => check.kind === 'entry_check')
    assert.equal(einreise.length, 1)
    assert.equal(einreise[0]?.countryCode, 'TH')
  })

  test('Abreiseort-Name ist kein Origin-Ländercode und kein Transit', () => {
    const kontext = readinessReisekontext(beispielreise({ origin: 'Zürich' }))
    assert.equal(kontext.originCountryCode, null)
    assert.deepEqual(kontext.transitCountryCodes, [])
  })

  test('fehlender Country Code → unknown, kein Guess', () => {
    const reise = beispielreise({
      stages: beispielreise().stages.map((etappe) => ({ ...etappe, countryCode: null })),
    })
    const kontext = readinessReisekontext(reise)
    assert.deepEqual(kontext.destinationCountries, [])
    assert.ok(kontext.unknownCountryStages > 0)
    const { summary } = readinessAnsicht(reise)
    assert.equal(summary.unknownCountryContext, true)
    assert.equal(summary.officialResult, 'unknown')
    assert.ok(!readinessChecksAbleiten(reise).some((check) => check.kind === 'entry_check'))
  })

  test('gebuchter Planpunkt ersetzt → Confirmation nicht aktuell', () => {
    const altFlug = flug({ id: 'flug-alt', bookingStatus: 'booked', bookingSource: 'user' })
    const neuFlug = flug({ id: 'flug-neu', bookingStatus: 'booked', bookingSource: 'user', title: 'ZRH–NRT' })
    const fingerprint = readinessFingerprint({
      kind: 'booking_confirmation_check',
      countryCode: null,
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: 2,
      destinationCountries: ['IT'],
      rentalCarPresent: false,
      tripItemId: 'flug-alt',
      itemKind: 'flight',
      bookingStatus: 'booked',
      startsOn: '2026-09-12',
      endsOn: '2026-09-12',
      originPlaceId: null,
      destinationPlaceId: null,
      title: null,
    })
    const reise = beispielreise({
      ohneTag: [neuFlug],
      readinessItems: [
        persistiert({
          clientRef: 'booking_confirmation_check:flug-alt',
          kind: 'booking_confirmation_check',
          tripItemId: altFlug.id,
          userStatus: 'done',
          contextFingerprint: fingerprint,
        }),
      ],
    })
    const { items, summary } = readinessAnsicht(reise)
    const alt = items.find((item) => item.clientRef === 'booking_confirmation_check:flug-alt')
    assert.equal(alt?.currentness, 'not_applicable')
    assert.ok(items.some((item) => item.tripItemId === 'flug-neu' && item.userStatus === 'open'))
    assert.equal(summary.done, 0)
  })

  test('booked → Confirmation nicht automatisch done', () => {
    const reise = beispielreise({
      ohneTag: [flug({ bookingStatus: 'booked', bookingSource: 'user' })],
    })
    const { items } = readinessAnsicht(reise)
    const bestaetigung = items.find((item) => item.kind === 'booking_confirmation_check')
    assert.equal(bestaetigung?.userStatus, 'open')
    assert.equal(bestaetigung?.persisted, false)
  })

  test('unconfirmed → kein booked-confirmation Fakt', () => {
    const reise = beispielreise({
      ohneTag: [flug({ bookingStatus: 'unconfirmed' })],
    })
    const checks = readinessChecksAbleiten(reise)
    assert.ok(!checks.some((check) => check.kind === 'booking_confirmation_check'))
  })
})
