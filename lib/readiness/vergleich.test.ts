// lib/readiness/vergleich.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { OfficialEvaluation } from '@/lib/readiness/official'
import { VERGLEICH_NICHT_VERFUEGBAR, credentialOptionenVergleichen } from '@/lib/readiness/vergleich'

function evaluation(teil: Partial<OfficialEvaluation> & Pick<OfficialEvaluation, 'credentialOptionRef'>): OfficialEvaluation {
  return {
    travellerClientRef: 'traveller:1',
    destinationCountryCode: 'TH',
    transitCountryCode: null,
    requirementType: 'visa',
    result: 'unknown',
    status: 'unavailable',
    freshness: 'provider_unavailable',
    officialClass: 'unknown',
    missingFacts: [],
    evidence: {
      provider: null,
      authority: null,
      sourceUrl: null,
      checkedAt: null,
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: 'off-v2',
    },
    action: null,
    ...teil,
  }
}

describe('Credential-Vergleich', () => {
  test('ohne Evidence nicht vergleichbar', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({ credentialOptionRef: 'traveller:1:document:passport:CH' }),
      evaluation({ credentialOptionRef: 'traveller:1:document:passport:RS' }),
    ])
    assert.equal(vergleich.comparable, false)
    assert.equal(vergleich.reason, VERGLEICH_NICHT_VERFUEGBAR)
    assert.equal(vergleich.winnerOptionRef, null)
  })

  test('visa required gegen not_required ohne Eligibility ist nicht vergleichbar', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
      }),
    ])
    assert.equal(vergleich.comparable, false)
    assert.equal(vergleich.winnerOptionRef, null)
    assert.equal(vergleich.reason, VERGLEICH_NICHT_VERFUEGBAR)
  })

  test('explizit mandatory Document gewinnt', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'unknown',
        status: 'current',
        freshness: 'current',
        optionMandate: 'mandatory',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'unknown',
        status: 'current',
        freshness: 'current',
        optionMandate: 'not_mandatory',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(vergleich.comparable, true)
    assert.equal(vergleich.duty, 'required')
    assert.equal(vergleich.winnerOptionRef, 'traveller:1:document:passport:CH')
  })

  test('explizit not-allowed Option scheidet aus', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'unknown',
        status: 'current',
        freshness: 'current',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'unknown',
        status: 'current',
        freshness: 'current',
        optionEligibility: 'not_allowed',
      }),
    ])
    assert.equal(vergleich.comparable, true)
    assert.equal(vergleich.duty, 'required')
    assert.equal(vergleich.winnerOptionRef, 'traveller:1:document:passport:CH')
  })

  test('zwei gleichwertige erlaubte Optionen sind nicht vergleichbar', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(vergleich.comparable, false)
    assert.equal(vergleich.winnerOptionRef, null)
  })

  test('nach expliziter Eligibility gewinnt geringere belegte Reibung', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(vergleich.comparable, true)
    assert.equal(vergleich.duty, 'recommendation')
    assert.equal(vergleich.winnerOptionRef, 'traveller:1:document:passport:CH')
  })

  test('stale oder conflicting Evidence bleibt nicht vergleichbar', () => {
    const stale = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'not_required',
        status: 'current',
        freshness: 'stale',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'required',
        status: 'unknown',
        freshness: 'stale',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(stale.comparable, false)
    assert.equal(stale.winnerOptionRef, null)

    const konflikt = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionMandate: 'mandatory',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionMandate: 'mandatory',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(konflikt.comparable, false)
    assert.equal(konflikt.winnerOptionRef, null)
  })
})
