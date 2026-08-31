// lib/readiness/status.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { officialRequirementsPruefen } from '@/lib/readiness/anforderungen'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessAnsicht, readinessZusammenfassungText } from '@/lib/readiness/status'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Trip, TripReadinessItem } from '@/types/trips'

const JETZT = '2026-08-22T08:00:00.000Z'

function aktuell(reise: Trip, kind: TripReadinessItem['kind'], extra: Partial<TripReadinessItem> = {}): string {
  return readinessFingerprint({
    kind,
    countryCode: extra.countryCode ?? (kind === 'insurance_check' ? null : 'IT'),
    startDate: reise.startDate,
    endDate: reise.endDate,
    travellers: reise.travellers,
    destinationCountries: ['IT'],
    rentalCarPresent: false,
    tripItemId: extra.tripItemId ?? null,
    itemKind: null,
    bookingStatus: null,
    startsOn: null,
    endsOn: null,
    originPlaceId: null,
    destinationPlaceId: null,
    title: extra.title ?? null,
  })
}

function item(
  reise: Trip,
  teil: Partial<TripReadinessItem> & Pick<TripReadinessItem, 'clientRef' | 'kind'>,
): TripReadinessItem {
  const countryCode = teil.countryCode ?? (teil.kind === 'insurance_check' ? null : 'IT')
  const rest = { ...teil }
  delete (rest as { countryCode?: string | null }).countryCode
  return {
    id: teil.clientRef,
    userStatus: 'open',
    evidence: 'user',
    tripItemId: null,
    title: null,
    contextFingerprint: aktuell(reise, teil.kind, { ...teil, countryCode }),
    createdAt: JETZT,
    updatedAt: JETZT,
    ...rest,
    countryCode,
  }
}

describe('Readiness-Gesamtstatus', () => {
  test('0 persistierte Items bleiben ehrlich', () => {
    const { summary } = readinessAnsicht(beispielreise())
    assert.ok(summary.open > 0)
    assert.equal(summary.done, 0)
    assert.equal(summary.officialResult, 'unknown')
    assert.match(readinessZusammenfassungText(summary), /Automatische Einreiseprüfung derzeit nicht verfügbar/)
  })

  test('nur User Items done + official unknown', () => {
    const basis = beispielreise()
    const reise = beispielreise({
      readinessItems: [
        item(basis, { clientRef: 'entry_check:IT', kind: 'entry_check', userStatus: 'done' }),
        item(basis, { clientRef: 'visa_check:IT', kind: 'visa_check', userStatus: 'done' }),
        item(basis, { clientRef: 'travel_document_check:IT', kind: 'travel_document_check', userStatus: 'done' }),
        item(basis, { clientRef: 'insurance_check:trip', kind: 'insurance_check', userStatus: 'done', countryCode: null }),
      ],
    })
    const { summary } = readinessAnsicht(reise)
    assert.ok(summary.done >= 1)
    assert.equal(summary.officialResult, 'unknown')
    assert.doesNotMatch(readinessZusammenfassungText(summary), /Reise ist bereit|reisebereit/i)
  })

  test('offene Items werden gezählt', () => {
    const { summary } = readinessAnsicht(beispielreise())
    assert.ok(summary.open >= 1)
  })

  test('stale Items werden separat gezählt', () => {
    const { summary } = readinessAnsicht(
      beispielreise({
        readinessItems: [
          {
            id: 'insurance_check:trip',
            clientRef: 'insurance_check:trip',
            kind: 'insurance_check',
            userStatus: 'done',
            evidence: 'user',
            countryCode: null,
            tripItemId: null,
            title: null,
            contextFingerprint: 'alt',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
        ],
      }),
    )
    assert.ok(summary.stale >= 1)
  })

  test('mehrere Länder getrennt', () => {
    const reise = beispielreise({
      stages: [
        { ...beispielreise().stages[0], countryCode: 'TH' },
        { ...beispielreise().stages[1], countryCode: 'JP' },
      ],
    })
    const { summary, items } = readinessAnsicht(reise)
    assert.deepEqual(summary.destinationCountries, ['JP', 'TH'])
    assert.equal(new Set(items.filter((eintrag) => eintrag.kind === 'entry_check').map((eintrag) => eintrag.countryCode)).size, 2)
  })

  test('mehrere Reisende verbieten individuelle Aussagen', () => {
    const { summary } = readinessAnsicht(beispielreise({ travellers: 3 }))
    assert.equal(summary.individualClaimsForbidden, true)
    assert.equal(summary.travellers, 3)
  })

  test('Provider unavailable', () => {
    const official = officialRequirementsPruefen({ destinationCountryCode: 'TH' })
    assert.ok(official.status === 'unavailable' || official.status === 'insufficient_context')
    const { summary } = readinessAnsicht(beispielreise())
    assert.ok(summary.officialStatus === 'unavailable' || summary.officialStatus === 'insufficient_context')
  })

  test('gelieferte Evaluations erreichen die Ansicht ohne Client-Provider', () => {
    const { evaluations, summary } = readinessAnsicht(beispielreise({ travellers: 1 }), [
      {
        travellerClientRef: 'traveller:1',
        destinationCountryCode: 'IT',
        transitCountryCode: null,
        requirementType: 'visa',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        visaMode: 'unknown',
        missingFacts: [],
        evidence: {
          provider: 'test',
          authority: 'Test',
          sourceUrl: null,
          checkedAt: JETZT,
          validFrom: null,
          validUntil: null,
          ruleReference: 'VISA-IT',
          contextFingerprint: 'off',
        },
        action: null,
      },
    ])
    assert.equal(evaluations[0]?.result, 'not_required')
    assert.equal(summary.officialFreshness, 'current')
    assert.equal(summary.officialResult, 'unknown')
    assert.doesNotMatch(readinessZusammenfassungText(summary), /Reise ist bereit/)
  })
})
