import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileCycle4Attempt2RecoveryMigration, REPLACEMENTS } from '../../scripts/db/official-truth-v3-dev-cycle4-attempt2-recovery-1/build.mjs'
import { compileDevTerminalCycle4Attempt2Review } from '../../scripts/db/official-truth-v3-dev-cycle4-attempt2-recovery-1/cycle4-review.mjs'
import { runCycle4Attempt2RecoveryNative } from '../../scripts/db/official-truth-v3-dev-cycle4-attempt2-recovery-1/native'

test('Dev Cycle4 Attempt2 recovery and subsequent review are exact additive artifacts', () => {
  const compiled = compileCycle4Attempt2RecoveryMigration(), review = compileDevTerminalCycle4Attempt2Review()
  assert.equal(compiled.inventory.length, 17)
  assert.deepEqual(compiled.inventory.map(f => f.signature), REPLACEMENTS)
  assert.ok(compiled.inventory.every(f => f.before !== f.after))
  for (const [name, expected] of [['provider-migration-body.sql', compiled.migration], ['readback.sql', compiled.readback],
    ['review-cycle4.sql', review.migration], ['readback-cycle4.sql', review.readback]])
    assert.equal(readFileSync(new URL('../../scripts/db/official-truth-v3-dev-cycle4-attempt2-recovery-1/' + name, import.meta.url), 'utf8'), expected)
})

test('Dev Cycle4 Attempt2 actual PG17 preserves five retirements and six publications, then uses the normal original resume',
  // Includes up to two real five-minute intervals until the next immutable BG1 due slot.
  { timeout: 900000 }, runCycle4Attempt2RecoveryNative)
