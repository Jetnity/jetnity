// lib/readiness/fingerprint.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { fingerprintAktuell, readinessFingerprint } from '@/lib/readiness/fingerprint'

const basis = {
  countryCode: 'TH' as string | null,
  startDate: '2026-09-12' as string | null,
  endDate: '2026-09-16' as string | null,
  travellers: 2,
  destinationCountries: ['TH'],
  rentalCarPresent: false,
  tripItemId: null as string | null,
  itemKind: null as string | null,
  bookingStatus: null as string | null,
  startsOn: null as string | null,
  endsOn: null as string | null,
  originPlaceId: null as string | null,
  destinationPlaceId: null as string | null,
  title: null as string | null,
}

describe('Context-Fingerprint', () => {
  test('ist deterministisch', () => {
    const a = readinessFingerprint({ ...basis, kind: 'entry_check' })
    const b = readinessFingerprint({ ...basis, kind: 'entry_check' })
    assert.equal(a, b)
    assert.match(a, /^v1\|kind=entry_check/)
  })

  test('Länderreihenfolge ist irrelevant', () => {
    const a = readinessFingerprint({
      ...basis,
      kind: 'insurance_check',
      destinationCountries: ['JP', 'TH'],
    })
    const b = readinessFingerprint({
      ...basis,
      kind: 'insurance_check',
      destinationCountries: ['TH', 'JP'],
    })
    assert.equal(a, b)
  })

  test('Datumsänderung ändert den Fingerprint', () => {
    const a = readinessFingerprint({ ...basis, kind: 'travel_document_check' })
    const b = readinessFingerprint({ ...basis, kind: 'travel_document_check', startDate: '2026-10-01' })
    assert.notEqual(a, b)
    assert.equal(fingerprintAktuell(a, b), false)
  })

  test('Transitänderung ändert Einreise-Fingerprint, nicht Buchungsbestätigung', () => {
    const ohne = readinessFingerprint({ ...basis, kind: 'entry_check' })
    const mit = readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      originCountryCode: 'CH',
      transitCountryCodes: ['QA'],
      routeFingerprint: 'route-v1|ZRH:CH>DOH:QA>BKK:TH',
    })
    assert.notEqual(ohne, mit)
    const buchungOhne = readinessFingerprint({ ...basis, kind: 'booking_confirmation_check' })
    const buchungMit = readinessFingerprint({
      ...basis,
      kind: 'booking_confirmation_check',
      originCountryCode: 'CH',
      transitCountryCodes: ['QA'],
    })
    assert.equal(buchungOhne, buchungMit)
  })

  test('Mietwagen ändert nur den Versicherungs-Fingerprint', () => {
    const ohne = readinessFingerprint({ ...basis, kind: 'insurance_check', rentalCarPresent: false })
    const mit = readinessFingerprint({ ...basis, kind: 'insurance_check', rentalCarPresent: true })
    assert.notEqual(ohne, mit)
    const einreiseOhne = readinessFingerprint({ ...basis, kind: 'entry_check', rentalCarPresent: false })
    const einreiseMit = readinessFingerprint({ ...basis, kind: 'entry_check', rentalCarPresent: true })
    assert.equal(einreiseOhne, einreiseMit)
  })
})
