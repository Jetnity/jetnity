import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileRefreshRetirementMigration, REPLACEMENTS } from '../../scripts/db/official-truth-v3-dev-refresh-retirement-1/build.mjs'
import { runRefreshRetirementNative } from '../../scripts/db/official-truth-v3-dev-refresh-retirement-1/native'

test('Dev refresh retirement is the deterministic exact predecessor additive artifact', () => {
  const compiled = compileRefreshRetirementMigration()
  assert.equal(compiled.inventory.length, 17)
  assert.deepEqual(compiled.inventory.map(f => f.signature), REPLACEMENTS)
  assert.ok(compiled.inventory.every(f => f.before !== f.after))
  for (const [name, expected] of [['provider-migration-body.sql', compiled.migration], ['readback.sql', compiled.readback]])
    assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-dev-refresh-retirement-1/' + name, import.meta.url), 'utf8'), expected)
})

test('Dev refresh retirement actual PG17 preserves three retirements, five publications and exact Owner CAS',
  { timeout: 180000 }, runRefreshRetirementNative)
