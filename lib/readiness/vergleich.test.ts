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

  test('Pflicht überstimmt Convenience', () => {
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
        officialClass: 'unknown',
      }),
    ])
    assert.equal(vergleich.comparable, true)
    assert.equal(vergleich.duty, 'required')
    assert.equal(vergleich.winnerOptionRef, 'traveller:1:document:passport:CH')
  })
})
