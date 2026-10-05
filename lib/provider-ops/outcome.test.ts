import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PROVIDER_OPS_DOMAINS,
  PROVIDER_OPS_OUTCOMES,
  istProviderOpsOutcome,
  providerOpsHttpStatusFuerOutcome,
} from '@/lib/provider-ops'

describe('Provider-Ops Outcome-Taxonomie', () => {
  test('enthält nur technische Providerzustände', () => {
    assert.deepEqual(PROVIDER_OPS_OUTCOMES, [
      'ok',
      'partial',
      'empty',
      'checked_empty',
      'unavailable',
      'timeout',
      'invalid',
      'rate_limited',
      'error',
    ])
    assert.equal(istProviderOpsOutcome('ok'), true)
    assert.equal(istProviderOpsOutcome('recheck_needed'), false)
    assert.equal(istProviderOpsOutcome('insufficient_context'), false)
    assert.equal(istProviderOpsOutcome('rejected_acute'), false)
    assert.ok(PROVIDER_OPS_DOMAINS.includes('flights'))
  })

  test('HTTP bleibt orchestriert: 429/400, sonst 200, nie 504', () => {
    assert.equal(providerOpsHttpStatusFuerOutcome('rate_limited'), 429)
    assert.equal(providerOpsHttpStatusFuerOutcome('invalid'), 400)
    for (const outcome of PROVIDER_OPS_OUTCOMES) {
      if (outcome === 'rate_limited' || outcome === 'invalid') continue
      assert.equal(providerOpsHttpStatusFuerOutcome(outcome), 200)
    }
  })
})
