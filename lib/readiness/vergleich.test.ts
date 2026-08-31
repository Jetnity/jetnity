// lib/readiness/vergleich.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { entscheidungenGleich, entscheidungsSignatur } from '@/lib/readiness/entscheidung'
import { visaModeLesen, type OfficialEvaluation } from '@/lib/readiness/official'
import { VERGLEICH_NICHT_VERFUEGBAR, credentialOptionenVergleichen } from '@/lib/readiness/vergleich'

function evaluation(teil: Partial<OfficialEvaluation> & Pick<OfficialEvaluation, 'credentialOptionRef'>): OfficialEvaluation {
  const requirementType = teil.requirementType ?? 'visa'
  return {
    travellerClientRef: 'traveller:1',
    destinationCountryCode: 'TH',
    transitCountryCode: null,
    requirementType,
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
    temporalRule: null,
    ...teil,
    visaMode: visaModeLesen(requirementType, teil.visaMode),
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

  test('VISA vollständig und TRANSIT stale ergibt keinen globalen Winner', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        requirementType: 'visa',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        requirementType: 'visa',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'not_allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        requirementType: 'transit',
        transitCountryCode: 'QA',
        result: 'not_required',
        status: 'current',
        freshness: 'stale',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        requirementType: 'transit',
        transitCountryCode: 'QA',
        result: 'required',
        status: 'unavailable',
        freshness: 'provider_unavailable',
        officialClass: 'requirement',
      }),
    ])
    assert.equal(vergleich.comparable, false)
    assert.equal(vergleich.winnerOptionRef, null)
  })

  test('drei Optionen ohne vollständige current Evidence der ersten Option ergeben keinen Winner', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'unknown',
        status: 'unknown',
        freshness: 'recheck_needed',
        officialClass: 'unknown',
        optionEligibility: 'unknown',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'not_required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:DE',
        result: 'required',
        status: 'current',
        freshness: 'current',
        officialClass: 'requirement',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(vergleich.comparable, false)
    assert.equal(vergleich.winnerOptionRef, null)
  })

  test('entscheidungsSignatur unterscheidet officialClass, nicht Evidence-URLs', () => {
    const basis = evaluation({
      credentialOptionRef: 'traveller:1:document:passport:CH',
      result: 'not_required',
      status: 'current',
      freshness: 'current',
      officialClass: 'requirement',
      optionEligibility: 'allowed',
      optionMandate: 'not_mandatory',
    })
    assert.equal(entscheidungsSignatur(basis).officialClass, 'requirement')
    assert.equal(entscheidungsSignatur(basis).visaMode, 'unknown')
    assert.equal(
      entscheidungenGleich(basis, {
        ...basis,
        evidence: { ...basis.evidence, sourceUrl: 'https://example.test/andere' },
      }),
      true,
    )
    assert.equal(
      entscheidungenGleich(basis, {
        ...basis,
        visaMode: 'visa_on_arrival',
      }),
      false,
    )
    assert.equal(
      entscheidungenGleich(basis, {
        ...basis,
        officialClass: 'unknown',
      }),
      false,
    )
    assert.equal(
      entscheidungenGleich(basis, {
        ...basis,
        officialClass: 'recommendation',
      }),
      false,
    )
  })

  test('mandatory und not_allowed auf derselben Option sind nicht vergleichbar', () => {
    const vergleich = credentialOptionenVergleichen([
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:CH',
        result: 'unknown',
        status: 'current',
        freshness: 'current',
        optionMandate: 'mandatory',
        optionEligibility: 'not_allowed',
      }),
      evaluation({
        credentialOptionRef: 'traveller:1:document:passport:RS',
        result: 'unknown',
        status: 'current',
        freshness: 'current',
        optionEligibility: 'allowed',
      }),
    ])
    assert.equal(vergleich.comparable, false)
    assert.equal(vergleich.winnerOptionRef, null)
  })
})
