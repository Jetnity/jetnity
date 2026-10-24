import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Executes the mounted TripPlanner / Reiseidee harness.
// This file does not treat source text as evidence of async behavior.
test('Planning Creation Lifecycle 1 mounted component proof', { timeout: 300_000 }, () => {
  execFileSync(process.execPath, ['scripts/planning-creation-lifecycle-1/run.mjs'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  const ergebnis = JSON.parse(
    readFileSync('docs/evidence/planning-creation-lifecycle-1/result.json', 'utf8'),
  ) as { failed: number; cases: { ok: boolean }[]; stubs: { hosted: boolean } }
  assert.equal(ergebnis.failed, 0)
  assert.equal(ergebnis.stubs.hosted, false)
  assert.ok(ergebnis.cases.length >= 18)
  assert.equal(ergebnis.cases.every((fall) => fall.ok), true)
})
