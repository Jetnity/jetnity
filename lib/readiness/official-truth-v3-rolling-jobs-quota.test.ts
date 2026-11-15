import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileRollingQuotaMigrationBody, ROLLING_REPLACEMENTS } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/build.mjs'
import { runRollingQuotaNative, runRollingStartBoundary } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/native'
import { runRollingWindowNative } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/window-native'
import { runRollingCanonicalNative } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/canonical-native'

test('rolling quota artifact is exactly its immutable-predecessor deterministic compiler', () => {
  assert.equal(ROLLING_REPLACEMENTS.length, 8)
  assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql', import.meta.url), 'utf8'), compileRollingQuotaMigrationBody())
})
test('rolling quota real PG17 canonical byte memo is exactly the unchanged serializer', { timeout: 120000 }, runRollingCanonicalNative)
test('rolling quota real PG17 window, clock and retained terminal credit', { timeout: 120000 }, runRollingWindowNative)
test('rolling quota real PG17 64 START refusal with operation capacity still available', { timeout: 120000 }, runRollingStartBoundary)
// Test harness only: 700s for the unchanged real API buildup plus at most 300s
// for the next ordinary BG1 due slot. API 5s, audit 30s and Hosted-CI 30m stay fixed.
test('rolling quota complete native PG17 successor above both lifetime caps', { timeout: 1000000 }, runRollingQuotaNative)
