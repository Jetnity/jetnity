import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileCustomerInformationMigration, BUSINESS_REPLACEMENTS, PERFORMANCE_REPLACEMENTS, GUARD_REPLACEMENTS } from '../../scripts/db/official-truth-v3-customer-information-1/build.mjs'
import { runCustomerInformationNative } from '../../scripts/db/official-truth-v3-customer-information-1/native'
import { runHistoryMemoNative } from '../../scripts/db/official-truth-v3-customer-information-1/history-native'

test('customer information migration is the exact immutable-predecessor deterministic artifact', () => {
  const compiled = compileCustomerInformationMigration()
  assert.equal(BUSINESS_REPLACEMENTS.length, 6)
  assert.equal(PERFORMANCE_REPLACEMENTS.length, 1)
  assert.equal(GUARD_REPLACEMENTS.length, 5)
  assert.equal(compiled.inventory.length, 12)
  assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-customer-information-1/provider-migration-body.sql', import.meta.url), 'utf8'), compiled.migration)
  assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-customer-information-1/readback.sql', import.meta.url), 'utf8'), compiled.readback)
  assert.ok(compiled.inventory.every(f => f.before !== f.after))
})

test('customer information real PG17 migration preserves historical identity and the complete BG1 chain',
  { timeout: 180000 }, runCustomerInformationNative)

test('customer history real PG17 bounded memo differential and complete-history rejection',
  { timeout: 180000 }, runHistoryMemoNative)
