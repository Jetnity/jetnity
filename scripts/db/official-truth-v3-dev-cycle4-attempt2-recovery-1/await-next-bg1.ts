// Owned local PostgreSQL has no cron worker. Wait for the real next due slot;
// neither an immutable completed slot nor any proof timestamp is rewritten.
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'

type Due = { generation: number; required: number; proofBoundary: string; proofStarted: string;
  nextDue: string; lastDue: string; incident: number; resumed: number; untilDue: number; remaining: number }
const creator = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'

export async function awaitNextBg1(proof: OwnedPersistentProof, signal: AbortSignal, baseline: string,
  diagnostic: (value: Due) => void = () => undefined): Promise<void> {
  assert.match(baseline, /^official_v3_guard_private\.[a-z0-9_]+_v1$/)
  const due = () => proof.value<Due>(`(WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS at)
    SELECT jsonb_build_object('generation',s.generation,'required',b.required_generation,
      'proofBoundary',b.proof_not_before,'proofStarted',s.last_proof_started,'lastDue',s.last_due,
      'nextDue',s.last_due+interval '5 minutes','incident',s.incident_generation,'resumed',s.resumed_generation,
      'untilDue',extract(epoch FROM s.last_due+interval '5 minutes'-instant.at)*1000,
      'remaining',extract(epoch FROM s.valid_until-instant.at)*1000)
    FROM official_v3_guard_private.state_v1 s CROSS JOIN ${baseline} b CROSS JOIN instant
    WHERE s.singleton AND b.singleton)`, creator)
  const original = await due()
  assert.ok(original.generation > 0 && original.required > original.generation)
  assert.equal(original.incident, original.resumed)
  diagnostic(original)
  let before = original
  for (;;) {
    signal.throwIfAborted()
    assert.equal(before.generation, original.generation)
    assert.equal(before.incident, original.incident); assert.equal(before.resumed, original.resumed)
    assert.equal(before.nextDue, original.nextDue); assert.equal(before.proofBoundary, original.proofBoundary)
    assert.ok(before.remaining > 0, 'never heal an expired proof or incident with a late audit')
    if (before.untilDue <= 0) break
    await delay(Math.min(20000, Math.ceil(before.untilDue) + 1), undefined, { signal })
    before = await due()
  }
  assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
  const after = await due()
  assert.equal(after.generation, original.generation + 1)
  assert.ok(after.generation >= after.required)
  assert.equal(after.lastDue, original.nextDue)
  assert.ok(Date.parse(after.proofStarted) >= Date.parse(after.proofBoundary))
  assert.equal(after.incident, original.incident); assert.equal(after.resumed, original.resumed)
  assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
  diagnostic(after)
}
