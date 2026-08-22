// lib/readiness/truth.test.ts
//
// Official Requirement Truth vs User Preparation Truth.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { officialRequirementsPruefen } from '@/lib/readiness/anforderungen'
import { readinessAnsicht, readinessZusammenfassungText } from '@/lib/readiness/status'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripReadinessItem } from '@/types/trips'

const JETZT = '2026-08-22T08:00:00.000Z'

function check(teil: Partial<TripReadinessItem> & Pick<TripReadinessItem, 'clientRef' | 'kind'>): TripReadinessItem {
  return {
    id: teil.id ?? teil.clientRef,
    userStatus: 'done',
    evidence: 'user',
    countryCode: 'IT',
    tripItemId: null,
    title: null,
    contextFingerprint: 'alt',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Official Truth bleibt von User Evidence getrennt', () => {
  test('User done + official unknown → official bleibt unknown', () => {
    const reise = beispielreise({
      readinessItems: [check({ clientRef: 'entry_check:IT', kind: 'entry_check', userStatus: 'done' })],
    })
    const { items, summary } = readinessAnsicht(reise)
    const einreise = items.find((item) => item.kind === 'entry_check')
    assert.equal(einreise?.userStatus, 'done')
    assert.equal(einreise?.official.result, 'unknown')
    assert.equal(summary.officialResult, 'unknown')
    assert.match(readinessZusammenfassungText(summary), /noch nicht offiziell geprüft/)
    assert.doesNotMatch(readinessZusammenfassungText(summary), /Reise ist bereit/)
  })

  test('User skipped wird nicht als offiziell not_required ausgegeben', () => {
    const reise = beispielreise({
      readinessItems: [check({ clientRef: 'visa_check:IT', kind: 'visa_check', userStatus: 'skipped' })],
    })
    const { items } = readinessAnsicht(reise)
    const visum = items.find((item) => item.kind === 'visa_check')
    assert.equal(visum?.userStatus, 'skipped')
    assert.notEqual(visum?.official.result, 'not_required')
    assert.equal(visum?.official.result, 'unknown')
  })

  test('kein Provider → keine Visa-/Passbehauptung', () => {
    const official = officialRequirementsPruefen({ destinationCountryCode: 'TH', travellers: 1 })
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
    assert.equal(official.sourceUrl, null)
    assert.notEqual(official.result, 'required')
    assert.notEqual(official.result, 'not_required')
  })

  test('fehlende Traveller-Identität → keine individuelle Einreisebehauptung', () => {
    const official = officialRequirementsPruefen({ destinationCountryCode: 'TH', travellers: 1 })
    assert.equal(official.result, 'unknown')
    assert.ok(official.requiredTravellerFacts.includes('nationality'))
  })

  test('mehrere Reisende → niemals für alle geprüft', () => {
    const reise = beispielreise({ travellers: 2 })
    const { summary, items } = readinessAnsicht(reise)
    assert.equal(summary.individualClaimsForbidden, true)
    assert.equal(summary.officialResult, 'unknown')
    for (const item of items) {
      assert.notEqual(item.official.result, 'required')
      assert.notEqual(item.official.result, 'not_required')
    }
  })

  test('Country Code allein erzeugt keine definitive Visa-Aussage', () => {
    const official = officialRequirementsPruefen({ destinationCountryCode: 'US', travellers: 1 })
    assert.equal(official.result, 'unknown')
    assert.equal(official.destinationCountryCode, 'US')
  })
})
