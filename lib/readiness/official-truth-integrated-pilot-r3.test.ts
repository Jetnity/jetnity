import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runControlledSyntheticPilot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'
import { runR3NativeProof } from '../../scripts/db/official-truth-integrated-pilot-1/r3-proof'

test('R3 native canonical URL publication and post-arming guard loss preserve commit truth and recover', { timeout: 600_000 }, async context => {
  const primary = await runControlledSyntheticPilot('primary')
  assert.equal(primary.status, 'synthetic_bundle_verified')
  if (primary.status !== 'synthetic_bundle_verified') throw Error('r3_baseline_failed')
  const result = await runR3NativeProof(primary.envelope)
  assert.equal(result.status, 'PASS'); assert.equal(result.checks.length, 18)
  assert.ok(result.codecComparisons > 800)
  context.diagnostic(JSON.stringify(result))
})
