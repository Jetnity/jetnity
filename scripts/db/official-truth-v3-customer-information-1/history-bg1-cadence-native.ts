// A socket-free fixture has no cron worker. Maintain the real BG1 due slots at
// idle phase boundaries; never refresh authority inside a timed worker call.
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import type { TestContext } from 'node:test'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'

const creator = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
// Leave room for the following state readback without changing its own budget.
const readbackReserveMilliseconds = 5000
const fullAuditMilliseconds = 30000
type GuardState = {
  observedAt: string; dueAt: string; nextDueAt: string; validUntil: string;
  generation: number; incidentGeneration: number; resumedGeneration: number;
  remainingMilliseconds: number; untilNextDueMilliseconds: number; auditMilliseconds: number;
}

export function historyGuardCadence(t: TestContext, proof: OwnedPersistentProof) {
  const read = () => proof.value<GuardState>(`(WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS at)
    SELECT jsonb_build_object('observedAt',instant.at,'dueAt',s.last_due,
      'nextDueAt',s.last_due+interval '5 minutes','validUntil',s.valid_until,'generation',s.generation,
      'incidentGeneration',s.incident_generation,'resumedGeneration',s.resumed_generation,
      'remainingMilliseconds',extract(epoch FROM s.valid_until-instant.at)*1000,
      'untilNextDueMilliseconds',extract(epoch FROM s.last_due+interval '5 minutes'-instant.at)*1000,
      'auditMilliseconds',extract(epoch FROM s.last_finished-s.last_proof_started)*1000)
      FROM official_v3_guard_private.state_v1 s CROSS JOIN instant WHERE s.singleton)`, creator)

  async function observe(phase: string, invocationMilliseconds = 0): Promise<GuardState> {
    t.signal.throwIfAborted()
    const state = await read()
    t.diagnostic('actual BG1 phase admission: ' + JSON.stringify({ phase, invocationMilliseconds, ...state }))
    assert.ok(state.generation > 0 && state.remainingMilliseconds > 0, 'expired BG1 is never repaired by a late audit')
    assert.equal(state.incidentGeneration, state.resumedGeneration, 'no automatic incident recovery')
    await proof.value<number>('to_jsonb(official_v3_guard_private.require_open_v1())', creator)
    return state
  }

  async function admit(phase: string, invocationMilliseconds = 30000): Promise<GuardState> {
    for (;;) {
      const before = await observe(phase, invocationMilliseconds)
      if (before.untilNextDueMilliseconds <= 0) {
        assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
        const after = await read()
        assert.equal(after.generation, before.generation + 1, 'a genuinely new due slot executes the complete audit')
        assert.equal(after.incidentGeneration, before.incidentGeneration)
        assert.equal(after.resumedGeneration, before.resumedGeneration)
        assert.ok(after.auditMilliseconds < fullAuditMilliseconds, 'the original full BG1 deadline remains unchanged')
        t.diagnostic('actual BG1 next-slot full audit: ' + JSON.stringify({ phase, previousGeneration: before.generation, ...after }))
        continue
      }
      // Finish the whole next phase before the scheduler needs its original
      // thirty-second audit window, including the subsequent state readback.
      if (before.remainingMilliseconds > invocationMilliseconds + fullAuditMilliseconds + readbackReserveMilliseconds) return before
      // Same-slot audit is deliberately immutable. Await only the actual next
      // slot, then run its full proof; no timestamp or validity is rewritten.
      assert.ok(before.untilNextDueMilliseconds <= invocationMilliseconds + readbackReserveMilliseconds)
      await delay(Math.min(20000, Math.ceil(before.untilNextDueMilliseconds) + 1), undefined, { signal: t.signal })
    }
  }

  async function waitUntil(instant: number, phase: string) {
    while (Date.now() < instant) {
      const state = await admit(phase, 0)
      const remaining = instant - Date.now()
      if (remaining > 0) await delay(Math.min(20000, remaining, Math.ceil(state.untilNextDueMilliseconds) + 1),
        undefined, { signal: t.signal })
    }
  }
  return { admit, observe, waitUntil }
}

export type HistoryGuardCadence = ReturnType<typeof historyGuardCadence>
