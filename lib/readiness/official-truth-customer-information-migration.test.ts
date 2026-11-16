import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileCustomerInformationMigration, BUSINESS_REPLACEMENTS, PERFORMANCE_REPLACEMENTS, GUARD_REPLACEMENTS,
  ATOMIC_CLAIM_REPLACEMENTS, ATOMIC_QUEUE_HELPER_SIGNATURES } from '../../scripts/db/official-truth-v3-customer-information-1/build.mjs'
import { runCustomerInformationNative } from '../../scripts/db/official-truth-v3-customer-information-1/native'
import { runHistoryMemoNative } from '../../scripts/db/official-truth-v3-customer-information-1/history-native'
import { runHistoryCapacityNative } from '../../scripts/db/official-truth-v3-customer-information-1/history-capacity-native'
import { runHistoryClaimNative } from '../../scripts/db/official-truth-v3-customer-information-1/history-claim-native'
import { runAtomicClaimNative } from '../../scripts/db/official-truth-v3-customer-information-1/atomic-claim-native'
import { runHistoryPublicationNative } from '../../scripts/db/official-truth-v3-customer-information-1/history-publication-native'

test('customer information migration is the exact immutable-predecessor deterministic artifact', () => {
  const compiled = compileCustomerInformationMigration()
  assert.equal(BUSINESS_REPLACEMENTS.length, 6)
  assert.equal(PERFORMANCE_REPLACEMENTS.length, 2)
  assert.equal(ATOMIC_CLAIM_REPLACEMENTS.length, 2)
  assert.equal(GUARD_REPLACEMENTS.length, 5)
  assert.equal(compiled.inventory.length, 17)
  assert.deepEqual(compiled.inventory.filter(f => f.before === null).map(f => f.signature), [...ATOMIC_QUEUE_HELPER_SIGNATURES])
  assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-customer-information-1/provider-migration-body.sql', import.meta.url), 'utf8'), compiled.migration)
  assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-customer-information-1/readback.sql', import.meta.url), 'utf8'), compiled.readback)
  assert.ok(compiled.inventory.every(f => f.before !== f.after))
})

test('customer information real PG17 migration preserves historical identity and the complete BG1 chain',
  { timeout: 180000 }, runCustomerInformationNative)

test('customer history real PG17 bounded memo differential and complete-history rejection',
  { timeout: 180000 }, runHistoryMemoNative)

test('customer atomic claim real PG17 complete transitions, replay, quotas and three full history scans',
  { timeout: 180000 }, runAtomicClaimNative)

test('customer history real PG17 cold626 capacity retains the original complete five-second API boundary',
  { timeout: 180000 }, runHistoryCapacityNative)

test('customer history real PG17 complete factory claim retains one five-second queue budget',
  { timeout: 180000 }, runHistoryClaimNative)

test('customer history real PG17 selected publication and original completed resume retain full custody',
  { timeout: 180000 }, runHistoryPublicationNative)
