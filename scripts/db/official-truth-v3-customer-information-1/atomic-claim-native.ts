// Real owned PG17 oracle for the new ordinary-claim orchestration. Additional
// historical fixture rows and every positive/negative effect roll back. Only
// the unchanged queue coordinator constructs fixture envelopes; actual claim
// results below come from the original-authority M04 API and real DB records.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { TestContext } from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { buildHistoryMemoFixture } from './history-fixture'
import { historyGuardCadence } from './history-bg1-cadence-native'
import { baseSetup, methodSeed } from './native'
import { compileAtomicClaimDefinitions, ATOMIC_CLAIM_HELPER_SIGNATURE, ATOMIC_MUTATE_HELPER_SIGNATURE,
  ATOMIC_QUEUE_HELPER_SIGNATURES } from './atomic-claim-build.mjs'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import type { V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3QueueCoordinator, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { readM04Command, type M04Claim } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'

const owner = 'RESET ROLE;SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
const creator = 'RESET ROLE;SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const caller = 'SET SESSION AUTHORIZATION ot_m04_jobs;SET ROLE ot_v3_jobs_caller;'
const fixtureScope = "SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const id = (kind: string, tag: string) => kind + '_' + hash('owned-atomic-claim:' + tag).slice(0, 32)
const binding = program.binding
const tuple = { methodId: binding.methodId, revision: binding.revision,
  methodDigest: binding.methodDigest, packageDigest: binding.packageDigest }
const authority = { ...tuple, epoch: 1 }
const until = `to_char((clock_timestamp()+interval '5 seconds') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
const digest = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
  'slots',(SELECT jsonb_agg(to_jsonb(r) ORDER BY slot_id) FROM official_v3_jobs_private.slots_v1 r),
  'subjects',(SELECT jsonb_agg(to_jsonb(r) ORDER BY job_key) FROM official_v3_jobs_private.subjects_v1 r),
  'operations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 r),
  'starts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 r),
  'results',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_results_v1 r),
  'dispositions',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 r),
  'certificates',(SELECT jsonb_agg(to_jsonb(r) ORDER BY component) FROM official_v3_guard_private.certificates_v1 r),
  'certificate_history',(SELECT jsonb_agg(to_jsonb(r) ORDER BY component,generation) FROM official_v3_guard_private.certificate_history_v1 r)
  )::text,'UTF8')),'hex')))`
type Fixture = Awaited<ReturnType<typeof buildHistoryMemoFixture>>
type Reply = { status: string; record?: V3ResearchJobRecord; operationId?: string; commandKey?: string;
  commandText?: string; envelopeText?: string; replayed?: boolean; currentRecord?: V3ResearchJobRecord }
type Counts = { operations: number; starts: number; revision: number }
type CaseResult = { result: unknown; counts: Counts }

async function prospective(raw: unknown, current: V3ResearchJobRecord, now: string) {
  const command = readM04Command(raw)
  assert.ok(command && command.kind === 'rule_research')
  let commit: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = {
    async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } },
    async compareAndSwap(value) { commit = value; return { status: 'unconfirmed' } },
  }
  const queue = createV3QueueCoordinator({ storage, now: () => now, invocationMilliseconds: 5000,
    backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000,
    // Fixture DTO construction only. These objects never enter a DB adapter or
    // supply authority to the actual native API operation tested below.
    methodAuthority: { async resolveCurrent() { return { status: 'approved', receipt: {} } },
      async reproveAtCommit() { return { status: 'current' } } } })
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else if (command.action === 'claim') await queue.claim(command.value.input)
  else if (command.action === 'complete') await queue.complete(command.value.input)
  else await queue.fail(command.value.input)
  assert.ok(commit && commit.next.kind === 'research_job_record')
  return { command, commit, next: commit.next as V3ResearchJobRecord }
}

/** Called on the already installed, original64/192 history before queueSql.
 * Genuine local audits maintain due slots between complete rollback vectors;
 * neither a synthetic heartbeat nor a longer native deadline is installed. */
export async function checkAtomicClaimNative(t: TestContext, proof: OwnedPersistentProof, fixture: Fixture) {
  const compiled = compileAtomicClaimDefinitions(), original = fixture.original
  assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
  const guard = historyGuardCadence(t, proof)
  assert.equal(original.subjectRow.operation_count, 192)
  const jobKey = original.jobKey
  const initial = original.subjectRow.current_job as V3ResearchJobRecord
  const work = { context: initial.context, method: initial.method, factKind: initial.research.factKind,
    researchReason: initial.research.researchReason }
  const claim = (tag: string, leaseMilliseconds = 30000): M04Claim => ({ operationId: id('op3', tag),
    jobKey, leaseId: id('lease3', tag), leaseMilliseconds })
  const request = (value: M04Claim, extra: Record<string, unknown> = {}) => ({ operation: 'queue_claim', phase: 'authorized',
    body: { command: { action: 'claim', input: value }, continuation: null, expected: null, replayOnly: false, ...extra } })
  const executeWire = (wire: string, deadline = until) => `official_v3_jobs_api.execute_v1(${wire},
    ${literal(binding.methodId)},${binding.revision},${literal(binding.methodDigest)},${literal(binding.packageDigest)},1,5000,${deadline})`
  const execute = (value: unknown, deadline = until) => executeWire(literal(hrs1Canonical(value)), deadline)
  const direct = (value: unknown) => `official_v3_jobs_private.tx_queue_claim_v1(${json(value)},${json(tuple)},1,5000,clock_timestamp()+interval '5 seconds')`

  const seed = async (tag: string, kind: 'queued' | 'expired' | 'exhausted' | 'open' = 'queued') => {
    const firstAt = Date.now() - 120000
    const first = await prospective({ action: 'enqueue', kind: 'rule_research', input: { ...work,
      operationId: id('op3', tag + ':enqueue'), jobId: id('job3', tag), attemptLimit: kind === 'exhausted' ? 1 : 2 } },
    initial, new Date(firstAt).toISOString())
    const steps = [first]
    let oldClaim: M04Claim | undefined
    if (kind !== 'queued') {
      oldClaim = claim(tag + ':old')
      steps.push(await prospective({ action: 'claim', input: oldClaim }, first.next, new Date(firstAt + 1000).toISOString()))
    }
    const current = steps.at(-1)!.next
    let sql = steps.map(({ command, commit, next }) => `INSERT INTO official_v3_jobs_private.queue_operations_v1(
      operation_id,job_key,action,command_key,command_text,envelope_text,audit_reference,new_cycle_job_id,authority,recorded_at)
      VALUES(${literal(command.operationId)},${literal(jobKey)},${literal(command.action)},${literal(command.commandKey)},
        ${literal(command.commandText)},${literal(hrs1Canonical(commit))},${literal(commit.audit.reference)},
        ${command.action === 'enqueue' ? literal(next.jobId) : 'NULL'},${json(authority)},
        ${literal(new Date(Date.parse(commit.audit.observedAt) + 1).toISOString())}::timestamptz);`).join('\n')
    let attemptKey: string | null = null
    if (kind === 'open') {
      assert.ok(oldClaim)
      attemptKey = 'execution-attempt:v3:' + hash(hrs1Canonical({ subject: JSON.parse(original.subject.subjectText) as unknown,
        claim: oldClaim, leasedJob: current, authority }))
      sql += `INSERT INTO official_v3_jobs_private.execution_starts_v1(
        attempt_key,job_key,claim_operation_id,claim_text,leased_job,authority,token_hash,reserved_at)
        VALUES(${literal(attemptKey)},${literal(jobKey)},${literal(oldClaim.operationId)},${literal(hrs1Canonical(oldClaim))},
          ${json(current)},${json(authority)},${literal(hash('owned-only synthetic never-live token'))},
          ${literal(new Date(firstAt + 1500).toISOString())}::timestamptz);`
    }
    sql += `UPDATE official_v3_jobs_private.subjects_v1 SET current_job=${json(current)},
      operation_count=${192 + steps.length},start_count=${kind === 'open' ? 65 : 64},
      terminal_credit_claim=${oldClaim ? literal(oldClaim.operationId) : 'NULL'},open_attempt=${attemptKey ? literal(attemptKey) : 'NULL'}
      WHERE job_key=${literal(jobKey)} AND operation_count=192 AND start_count=64;`
    return { sql, current, oldClaim, queued: first.next, enqueueCommand: first.command.value,
      steps: steps.length, starts: kind === 'open' ? 65 : 64 }
  }
  let vectors = 0
  const run = async (tag: string, seeded: { sql: string }, body: string,
    options: { prefix?: string; role?: string; restore?: string } = {}): Promise<CaseResult> => {
    // The socket-free backend has no cron worker. Admit only while idle, before
    // any transaction, timed API call or fault injection. A real next-slot audit
    // legitimately changes certificates, so bind rollback to this full snapshot.
    await guard.admit('atomic claim: ' + tag, 30000)
    const beforeVector = await proof.value<string>(digest, owner)
    const output = await proof.run(owner + 'BEGIN;' + fixtureScope
      + 'SELECT official_v3_guard_private.begin_jobs_v1();' + seeded.sql
      + 'SELECT official_v3_guard_private.seal_jobs_v1();' + (options.prefix ?? '')
      + (options.role ?? caller)
      + `DO $atomic_case$ DECLARE first jsonb;second jsonb;third jsonb;fourth jsonb;result jsonb;error_state text;
        req jsonb;reserved jsonb;wire_value text;
        BEGIN ${body}
        RAISE WARNING 'ATOMIC_CLAIM_CASE %',result;END $atomic_case$;`
      + owner + (options.restore ?? '')
      + 'SELECT official_v3_guard_private.assert_catalog_v1();SELECT official_v3_guard_private.check_certificates_v1();'
      + `DO $atomic_counts$ BEGIN RAISE WARNING 'ATOMIC_CLAIM_COUNTS %',
        (SELECT jsonb_build_object('operations',operation_count,'starts',start_count,'revision',current_job->'revision')
          FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(jobKey)});END $atomic_counts$;ROLLBACK;`,
    'owned atomic-claim oracle: ' + tag)
    const parsed = <T>(marker: string) => {
      const found = [...output.matchAll(new RegExp('WARNING:\\s+' + marker + ' ([^\\r\\n]+)', 'g'))]
      assert.equal(found.length, 1, 'one exact native oracle result')
      return JSON.parse(found[0][1]) as T
    }
    assert.equal(await proof.value<string>(digest, owner), beforeVector, 'every native vector restores all original rows and certificates')
    vectors++
    return { result: parsed<unknown>('ATOMIC_CLAIM_CASE'), counts: parsed<Counts>('ATOMIC_CLAIM_COUNTS') }
  }
  const queued = await seed('ordinary')
  const freshClaim = claim('ordinary:claim'), freshRequest = request(freshClaim)
  const success = await run('ordinary claim and exact historical replay', queued,
    `first:=${execute(freshRequest)};second:=${execute(request(freshClaim, { replayOnly: true }))};
      result:=jsonb_build_array(first,second);`)
  const [fresh, replay] = success.result as Reply[]
  assert.equal(fresh.status, 'committed'); assert.equal(fresh.replayed, false)
  assert.equal(replay.status, 'committed'); assert.equal(replay.replayed, true)
  assert.deepEqual({ ...replay, replayed: false }, fresh)
  assert.deepEqual(Object.keys(fresh).sort(), ['status', 'record', 'operationId', 'commandKey', 'commandText', 'envelopeText', 'replayed'].sort())
  assert.ok(fresh.record && fresh.envelopeText)
  const envelope = JSON.parse(fresh.envelopeText) as V3QueueCommit
  const expected = await prospective(freshRequest.body.command, queued.current, envelope.audit.observedAt)
  assert.equal(fresh.envelopeText, hrs1Canonical(expected.commit), 'native ordinary transition equals the complete original coordinator envelope')
  assert.deepEqual(fresh.record, expected.next)
  assert.deepEqual(success.counts, { operations: 194, starts: 64, revision: 194 })

  const collided = await run('same operation with different command is a collision', queued,
    `first:=${execute(freshRequest)};
      second:=${execute(request({ ...freshClaim, leaseId: id('lease3', 'changed') }))};result:=second;`)
  assert.deepEqual(collided.result, { status: 'collision' }); assert.equal(collided.counts.operations, 194)
  const active = await run('active original lease is not due', queued,
    `first:=${execute(freshRequest)};second:=${execute(request(claim('other:claim')))};result:=second;`)
  assert.deepEqual(active.result, { status: 'not_due' }); assert.equal(active.counts.operations, 194)
  for (const [tag, value, status] of [
    ['retained exact predecessor mismatch', request(freshClaim, { expected: initial }), 'mismatch'],
    ['replay-only cannot create a missing operation', request(freshClaim, { replayOnly: true }), 'blocked'],
    ['continuation cannot create a new operation', request(freshClaim, { continuation: {
      kind: 'prepared', claim: freshClaim, attemptKey: 'execution-attempt:v3:' + 'a'.repeat(64) } }), 'blocked'],
  ] as const) {
    const checked = await run(tag, queued, 'result:=' + execute(value) + ';')
    assert.deepEqual(checked.result, { status }); assert.equal(checked.counts.operations, 193)
  }
  const retained = await run('retained exact predecessor permits only its own next transition', queued,
    'result:=' + execute(request(freshClaim, { expected: queued.current })) + ';',
    { prefix: "SELECT pg_stat_reset();SET LOCAL track_functions='all';",
      restore: "SET LOCAL track_functions='none';SELECT pg_stat_force_next_flush();" })
  assert.equal((retained.result as Reply).status, 'committed'); assert.equal(retained.counts.operations, 194)
  // Instrument only this separate64-cycle oracle. The completed fixture seal
  // precedes tracking; the production bodies and the626 timing path are intact.
  const scans = await proof.value<{ name: string; calls: number }[]>(`(SELECT jsonb_agg(
    jsonb_build_object('name',schemaname||'.'||funcname,'calls',calls)) FROM pg_stat_user_functions
    WHERE (schemaname='official_v3_jobs_private' AND funcname='assert_history_v1')
      OR (schemaname='official_v3_jobs_api' AND funcname='execute_v1')
      OR (schemaname='official_v3_guard_private' AND funcname='check_jobs_v1'))`,
  owner + 'SELECT pg_stat_clear_snapshot();')
  assert.equal(scans.find(row => row.name === 'official_v3_jobs_private.assert_history_v1')?.calls, 3)
  assert.equal(scans.find(row => row.name === 'official_v3_jobs_api.execute_v1')?.calls, 1)
  assert.equal(scans.find(row => row.name === 'official_v3_guard_private.check_jobs_v1')?.calls, 1)

  const expired = await seed('reclaim', 'expired'), reclaim = claim('reclaim:new')
  const reclaimed = await run('expired lease reclaims and the old receipt is superseded', expired,
    `first:=${execute(request(reclaim))};second:=${execute(request(expired.oldClaim!, { replayOnly: true }))};
      result:=jsonb_build_array(first,second);`)
  const [newLease, superseded] = reclaimed.result as Reply[]
  assert.equal(newLease.status, 'committed'); assert.equal(newLease.record?.state, 'leased')
  assert.equal(newLease.record?.attempt, 2); assert.equal(newLease.record?.lease?.generation, 195)
  assert.equal((JSON.parse(newLease.envelopeText!) as V3QueueCommit).audit.kind, 'reclaimed')
  assert.deepEqual(superseded, { status: 'superseded' }); assert.equal(reclaimed.counts.operations, 195)
  const exhausted = await seed('exhausted', 'exhausted')
  const terminal = await run('expired final attempt becomes exhausted without a START', exhausted,
    'result:=' + execute(request(claim('exhausted:new'))) + ';')
  assert.equal((terminal.result as Reply).record?.state, 'exhausted')
  assert.equal((terminal.result as Reply).record?.lease, null); assert.equal(terminal.counts.starts, 64)
  const open = await seed('unresolved', 'open')
  const blocked = await run('older unresolved START still blocks a new ordinary claim', open,
    'result:=' + execute(request(claim('unresolved:new'))) + ';')
  assert.deepEqual(blocked.result, { status: 'blocked' }); assert.equal(blocked.counts.operations, 194)
  const inactive = await run('terminal current head is not due', { sql: '' },
    'result:=' + execute(request(claim('inactive:new'))) + ';')
  assert.deepEqual(inactive.result, { status: 'not_due' }); assert.equal(inactive.counts.operations, 192)

  // The known254-operation recent prefix plus one genuine deduplicated enqueue
  // leaves255 operations. A new leased claim would consume an operation and its
  // mandatory terminal credit, so the unchanged rolling CAS must refuse it.
  const prefixCurrent = (JSON.parse(fixture.terminalClaimRow.envelope_text) as V3QueueCommit).expected
  assert.ok(prefixCurrent?.kind === 'research_job_record' && prefixCurrent.revision === 259)
  const dedup = await prospective({ action: 'enqueue', kind: 'rule_research', input: { ...work,
    operationId: id('op3', 'quota:dedup'), jobId: id('job3', 'quota:dedup'), attemptLimit: 2 } },
  prefixCurrent, new Date(Date.now() - 1000).toISOString())
  assert.equal(dedup.commit.audit.kind, 'deduplicated')
  const quotaSeed = { sql: fixture.queueSql + `INSERT INTO official_v3_jobs_private.queue_operations_v1(
    operation_id,job_key,action,command_key,command_text,envelope_text,audit_reference,new_cycle_job_id,authority,recorded_at)
    VALUES(${literal(dedup.command.operationId)},${literal(jobKey)},'enqueue',${literal(dedup.command.commandKey)},
      ${literal(dedup.command.commandText)},${literal(hrs1Canonical(dedup.commit))},${literal(dedup.commit.audit.reference)},
      NULL,${json(authority)},${literal(dedup.commit.audit.observedAt)}::timestamptz);
    UPDATE official_v3_jobs_private.subjects_v1 SET operation_count=447
      WHERE job_key=${literal(jobKey)} AND operation_count=446;` }
  const quota = await run('original rolling credit bound refuses an over-limit claim', quotaSeed,
    'result:=' + execute(request(claim('quota:new'))) + ';')
  assert.deepEqual(quota.result, { status: 'quota' })
  assert.deepEqual(quota.counts, { operations: 447, starts: 86, revision: 259 })

  for (const [tag, value] of [
    ['probe is never an atomic claim', { ...freshRequest, phase: 'probe' }],
    ['non-claim command is refused', { ...freshRequest, body: { ...freshRequest.body,
      command: { action: 'enqueue', kind: 'rule_research', input: {
        ...work, operationId: id('op3', 'wrong-action'), jobId: id('job3', 'wrong-action'), attemptLimit: 1 } } } }],
    ['boolean replayOnly is mandatory', request(freshClaim, { replayOnly: 'false' })],
  ] as const) {
    const refused = await run(tag, queued, `BEGIN first:=${execute(value)};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`)
    assert.deepEqual(refused.result, { state: 'P7601' }); assert.equal(refused.counts.operations, 193)
  }
  const access = await run('runtime caller cannot execute the private orchestration helper', queued,
    `BEGIN first:=${direct(freshRequest)};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`)
  assert.deepEqual(access.result, { state: '42501' }); assert.equal(access.counts.operations, 193)
  const expiredBudget = await run('expired API budget performs no effect', queued,
    `BEGIN first:=${execute(freshRequest, "'2000-01-01T00:00:00.000Z'")};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`)
  assert.deepEqual(expiredBudget.result, { state: 'P7605' }); assert.equal(expiredBudget.counts.operations, 193)

  const mutationVectorStart = vectors
  const enqueue = (tag: string, jobId = id('job3', tag), attemptLimit = 2) => ({
    action: 'enqueue', kind: 'rule_research', input: { ...work,
      operationId: id('op3', tag), jobId, attemptLimit },
  })
  const mutate = (command: unknown, extra: Record<string, unknown> = {}) => ({
    operation: 'queue_mutate', phase: 'authorized',
    body: { command, continuation: null, disposition: { kind: 'regular' }, expected: null, ...extra },
  })
  const directMutation = (value: unknown) => `official_v3_jobs_private.tx_queue_mutate_v1(${json(value)},${json(tuple)},1,5000,clock_timestamp()+interval '5 seconds')`
  const enqueueCommand = enqueue('mutation:enqueue'), enqueueRequest = mutate(enqueueCommand)
  const enqueued = await run('ordinary enqueue and unchanged operation replay', { sql: '' },
    `first:=${execute(enqueueRequest)};second:=${execute(enqueueRequest)};
      result:=jsonb_build_array(first,second);`)
  const [newQueue, sameQueue] = enqueued.result as Reply[]
  assert.equal(newQueue.status, 'committed'); assert.equal(newQueue.replayed, false)
  assert.equal(sameQueue.replayed, true); assert.deepEqual({ ...sameQueue, replayed: false }, newQueue)
  assert.deepEqual(Object.keys(newQueue).sort(), ['status', 'record', 'operationId', 'commandKey',
    'commandText', 'envelopeText', 'replayed', 'currentRecord'].sort())
  assert.deepEqual(newQueue.record, newQueue.currentRecord)
  const newEnvelope = JSON.parse(newQueue.envelopeText!) as V3QueueCommit
  const oldEnqueue = await prospective(enqueueCommand, initial, newEnvelope.audit.observedAt)
  assert.equal(newQueue.envelopeText, hrs1Canonical(oldEnqueue.commit), 'native enqueue preserves the complete original coordinator envelope')
  assert.deepEqual(enqueued.counts, { operations: 193, starts: 64, revision: 193 })

  const absentEnqueue = { action: 'enqueue', kind: 'combination_discovery', input: {
    destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: initial.method,
    operationId: id('op3', 'mutation:new-subject'), jobId: id('job3', 'mutation:new-subject'), attemptLimit: 2,
  } }
  const created = await run('ordinary enqueue creates a genuinely absent subject through original CAS', { sql: '' },
    'result:=' + execute(mutate(absentEnqueue)) + ';')
  const createdReply = created.result as Reply
  assert.equal(createdReply.status, 'committed'); assert.equal(createdReply.replayed, false)
  assert.equal(createdReply.record?.kind, 'combination_discovery_job_record')
  assert.equal(createdReply.record?.revision, 1); assert.deepEqual(createdReply.record, createdReply.currentRecord)
  assert.equal((JSON.parse(createdReply.envelopeText!) as V3QueueCommit).expected, null)
  assert.deepEqual(created.counts, { operations: 192, starts: 64, revision: 192 })

  const deduplicated = await run('active enqueue deduplicates to its original jobId and research', queued,
    'result:=' + execute(mutate({ ...enqueue('mutation:dedup'), input: { ...enqueue('mutation:dedup').input,
      researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } } })) + ';')
  const dedupReply = deduplicated.result as Reply
  assert.equal(dedupReply.status, 'committed'); assert.equal(dedupReply.replayed, false)
  assert.deepEqual(dedupReply.record, queued.current)
  assert.equal((JSON.parse(dedupReply.envelopeText!) as V3QueueCommit).audit.kind, 'deduplicated')
  assert.deepEqual(deduplicated.counts, { operations: 194, starts: 64, revision: 193 })

  const laterClaim = claim('mutation:later')
  const later = await run('enqueue replay retains its receipt and actually reads the later same-job generation', { sql: '' },
    `first:=${execute(enqueueRequest)};second:=${execute(request(laterClaim))};
      third:=${execute(enqueueRequest)};result:=jsonb_build_array(first,second,third);`)
  const [oldReceipt, laterLease, currentReplay] = later.result as Reply[]
  assert.equal(currentReplay.replayed, true)
  assert.deepEqual(currentReplay.record, oldReceipt.record)
  assert.equal(currentReplay.envelopeText, oldReceipt.envelopeText)
  assert.deepEqual(currentReplay.currentRecord, laterLease.record)
  assert.notDeepEqual(currentReplay.currentRecord, currentReplay.record)
  assert.deepEqual(later.counts, { operations: 194, starts: 64, revision: 194 })

  const replaced = await run('an old enqueue receipt cannot stand for a later different jobId', exhausted,
    `first:=${execute(request(claim('mutation:exhausted')))};
      second:=${execute(mutate(enqueue('mutation:replacement')))};
      third:=${execute(mutate(exhausted.enqueueCommand))};result:=jsonb_build_array(first,second,third);`)
  const [oldTerminal, replacement, replacedReply] = replaced.result as Reply[]
  assert.equal(oldTerminal.record?.state, 'exhausted'); assert.equal(replacement.status, 'committed')
  assert.notEqual(replacement.record?.jobId, exhausted.current.jobId)
  assert.deepEqual(replacedReply, { status: 'superseded' })
  assert.deepEqual(replaced.counts, { operations: 196, starts: 64, revision: 196 })

  for (const [tag, input, seeded, expectedStatus, expectedCount] of [
    ['foreign acquisition cannot authorize mutation', mutate(enqueue('mutation:expected'), { expected: initial }), queued, 'mismatch', 193],
    ['terminal jobId cannot be reused for a new cycle', mutate(enqueue('mutation:repeated', initial.jobId)), { sql: '' }, 'collision', 192],
    ['same operation with changed enqueue command collides', mutate({ ...enqueueCommand,
      input: { ...enqueueCommand.input, attemptLimit: 1 } }), { sql: '' }, 'collision', 193],
  ] as const) {
    const prefix = tag.startsWith('same operation') ? 'first:=' + execute(enqueueRequest) + ';' : ''
    const checked = await run(tag, seeded, prefix + 'result:=' + execute(input) + ';')
    assert.deepEqual(checked.result, { status: expectedStatus }); assert.equal(checked.counts.operations, expectedCount)
  }
  for (const [tag, input] of [
    ['claim is never accepted by queue_mutate', mutate(freshRequest.body.command)],
    ['mutation is never a probe', { ...enqueueRequest, phase: 'probe' }],
    ['external subjectText is never accepted by mutation', mutate(enqueueCommand, { subjectText: original.subject.subjectText })],
  ] as const) {
    const checked = await run(tag, { sql: '' }, `BEGIN first:=${execute(input)};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`)
    assert.deepEqual(checked.result, { state: 'P7601' }); assert.equal(checked.counts.operations, 192)
  }
  // These are actual STARTs with actual generated reservation secrets. No
  // producer is active in this isolated oracle; the complete private SQL
  // custody checks remain the same as the original terminal CAS.
  // JSONB::text is not the original canonical wire protocol. Canonicalize only
  // the actual local DTO under the existing helper owner, then restore and
  // assert the real runtime caller before every API effect. No helper, grant,
  // positive response or authority receipt is invented by this serializer.
  const invokeRequest = (expression = 'req', target = 'result') => `
    ${owner}SET LOCAL ROLE ot_v3_jobs_owner;
    wire_value:=official_v3_jobs_private.canonical_v1(${expression},0);
    RESET ROLE;${caller}
    IF session_user<>'ot_m04_jobs' OR current_user<>'ot_v3_jobs_caller' THEN
      RAISE EXCEPTION 'atomic oracle original runtime identity required'; END IF;
    ${target}:=${executeWire('wire_value')};`
  const terminalClaim = claim('mutation:terminal', 60000)
  const terminalPrefix = `first:=${execute(request(terminalClaim))};
    ${invokeRequest(`jsonb_build_object('operation','execution_start','phase','authorized','body',
      jsonb_build_object('claim',${json(terminalClaim)},'leasedJob',first->'record','subjectText',${literal(original.subject.subjectText)}))`, 'reserved')}
    IF reserved->>'status' IS DISTINCT FROM 'reserved' THEN RAISE EXCEPTION 'native terminal START missing'; END IF;
    req:=jsonb_build_object('operation','queue_mutate','phase','authorized','body',jsonb_build_object(
      'command',jsonb_build_object('action','fail','input',jsonb_build_object('operationId',${literal(id('op3', 'mutation:fail'))},
        'jobKey',${literal(jobKey)},'fence',jsonb_build_object('jobId',first#>'{record,jobId}',
          'revision',first#>'{record,revision}','leaseId',first#>'{record,lease,leaseId}',
          'generation',first#>'{record,lease,generation}'),'reason','unreachable')),
      'continuation',jsonb_build_object('kind','owned_failure','claim',${json(terminalClaim)},
        'attemptKey',reserved->'attemptKey','token',reserved->'token'),
      'disposition',jsonb_build_object('kind','settled_failure','attemptKey',reserved->'attemptKey','token',reserved->'token'),
      'expected',NULL));`
  const settled = await run('actual START settles once with exact original backoff envelope and replay', queued,
    terminalPrefix + `${invokeRequest('req', 'second')}${invokeRequest('req', 'third')}
      result:=jsonb_build_object('claim',first,'command',req#>'{body,command}','fresh',second,'replay',third);`)
  const settledReply = settled.result as { claim: Reply; command: unknown; fresh: Reply; replay: Reply }
  assert.equal(settledReply.fresh.status, 'committed'); assert.equal(settledReply.fresh.replayed, false)
  assert.equal(settledReply.fresh.record?.state, 'backoff')
  assert.equal(settledReply.replay.replayed, true)
  assert.deepEqual({ ...settledReply.replay, replayed: false }, settledReply.fresh)
  const failEnvelope = JSON.parse(settledReply.fresh.envelopeText!) as V3QueueCommit
  const oldFailure = await prospective(settledReply.command, settledReply.claim.record!, failEnvelope.audit.observedAt)
  assert.equal(settledReply.fresh.envelopeText, hrs1Canonical(oldFailure.commit), 'native settlement preserves the full original failure envelope')
  assert.deepEqual(settled.counts, { operations: 195, starts: 65, revision: 195 })

  const badTerminalExpressions = [
    ["wrong disposition secret", `jsonb_set(req,'{body,disposition,token}',to_jsonb(repeat('0',64)))`, 'blocked'],
    ["wrong continuation secret", `jsonb_set(req,'{body,continuation,token}',to_jsonb(repeat('0',64)))`, 'blocked'],
    ["missing continuation", `jsonb_set(req,'{body,continuation}','null'::jsonb)`, 'blocked'],
    ["different original claim", `jsonb_set(req,'{body,continuation,claim,leaseId}',${json(id('lease3', 'foreign-continuation'))})`, 'blocked'],
    ["foreign complete expected record", `jsonb_set(req,'{body,expected}',${json(initial)})`, 'mismatch'],
    ["unknown producer completion cannot settle", `jsonb_set(req,'{body,command,input,reason}','"commit_unconfirmed"'::jsonb)`, 'blocked'],
  ] as const
  for (const [tag, expression, expectedStatus] of badTerminalExpressions) {
    const checked = await run(tag, queued, terminalPrefix + invokeRequest(expression))
    assert.deepEqual(checked.result, { status: expectedStatus })
    assert.deepEqual(checked.counts, { operations: 194, starts: 65, revision: 194 })
  }
  const noPrepared = await run('completion cannot substitute a missing actual PREPARED result', queued,
    terminalPrefix + `req:=jsonb_set(jsonb_set(jsonb_set(req,'{body,command}',
      jsonb_build_object('action','complete','kind','rule_research','input',((req#>'{body,command,input}')-'reason')
        ||jsonb_build_object('decisionRef',${literal('source-decision:v3:' + 'a'.repeat(64))}))),
      '{body,continuation}',((req#>'{body,continuation}')-'token')||jsonb_build_object('kind','prepared')),
      '{body,disposition}',jsonb_build_object('kind','completed','attemptKey',reserved->'attemptKey'));
      ${invokeRequest()}`)
  assert.deepEqual(noPrepared.result, { status: 'blocked' }); assert.equal(noPrepared.counts.operations, 194)
  const staleTerminal = await run('an actual expired terminal fence cannot mutate', expired,
    'result:=' + execute(mutate({ action: 'fail', input: { operationId: id('op3', 'mutation:expired'), jobKey,
      fence: { jobId: expired.current.jobId, revision: expired.current.revision,
        leaseId: expired.current.lease!.leaseId, generation: expired.current.lease!.generation }, reason: 'unreachable' } })) + ';')
  assert.deepEqual(staleTerminal.result, { status: 'superseded' }); assert.equal(staleTerminal.counts.operations, 194)

  const mutateAccess = await run('runtime caller cannot execute the private mutation helper', { sql: '' },
    `BEGIN first:=${directMutation(enqueueRequest)};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`)
  assert.deepEqual(mutateAccess.result, { state: '42501' }); assert.equal(mutateAccess.counts.operations, 192)

  // A deliberately changed readback is negative fault injection only: the
  // actual private helper must throw after CAS, and its subtransaction restores
  // the seeded head. This does not claim an authority-approved positive result.
  const readHelper = functionsIn(readSql('official-truth-v3-hosted-durable-jobs-1/install-candidate.sql'))
    .find(f => f.name === 'official_v3_jobs_private.tx_queue_read_v1')!
  assert.equal(hash(readHelper.body), compiled.dependencies.find(d => d.signature === readHelper.signature)!.bodyDigest)
  const originalRead = 'CREATE OR REPLACE FUNCTION ' + readHelper.name + '(' + readHelper.args + ') '
    + readHelper.options + 'AS $atomic_fault$' + readHelper.body + '$atomic_fault$;'
  assert.equal(readHelper.body.split('\nBEGIN\n').length, 2)
  const faultBody = readHelper.body.replace('\nBEGIN\n', () => `
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=${literal(freshClaim.operationId)}) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false); END IF;
`)
  const faultyRead = 'CREATE OR REPLACE FUNCTION ' + readHelper.name + '(' + readHelper.args + ') '
    + readHelper.options + 'AS $atomic_fault$' + faultBody + '$atomic_fault$;'
  const rollback = await run('post-CAS readback failure rolls back every effect', queued,
    `BEGIN first:=${direct(freshRequest)};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`,
    { prefix: faultyRead, role: 'SET LOCAL ROLE ot_v3_jobs_owner;', restore: originalRead })
  assert.deepEqual(rollback.result, { state: 'P7603' }); assert.equal(rollback.counts.operations, 193)
  assert.equal(rollback.counts.revision, 193)
  const mutationFaultBody = faultBody.replace(literal(freshClaim.operationId), () => literal(enqueueCommand.input.operationId))
  assert.notEqual(mutationFaultBody, faultBody)
  const faultyMutationRead = 'CREATE OR REPLACE FUNCTION ' + readHelper.name + '(' + readHelper.args + ') '
    + readHelper.options + 'AS $atomic_fault$' + mutationFaultBody + '$atomic_fault$;'
  const mutationRollback = await run('post-mutation CAS readback failure rolls back every effect', { sql: '' },
    `BEGIN first:=${directMutation(enqueueRequest)};
      EXCEPTION WHEN OTHERS THEN error_state:=SQLSTATE;END;result:=jsonb_build_object('state',error_state);`,
    { prefix: faultyMutationRead, role: 'SET LOCAL ROLE ot_v3_jobs_owner;', restore: originalRead })
  assert.deepEqual(mutationRollback.result, { state: 'P7603' })
  assert.deepEqual(mutationRollback.counts, { operations: 192, starts: 64, revision: 192 })
  assert.deepEqual(ATOMIC_QUEUE_HELPER_SIGNATURES, [ATOMIC_CLAIM_HELPER_SIGNATURE, ATOMIC_MUTATE_HELPER_SIGNATURE])
  const granted = await proof.value<string[]>(`(SELECT coalesce(jsonb_agg(role_name||':'||signature),'[]'::jsonb)
    FROM unnest(ARRAY['ot_v3_jobs_caller','ot_m04_jobs','anon','authenticated','service_role','supabase_read_only_user']) role_name
    CROSS JOIN unnest(ARRAY[${ATOMIC_QUEUE_HELPER_SIGNATURES.map(literal).join(',')}]) signature
    WHERE has_function_privilege(role_name,signature,'EXECUTE'))`, owner)
  assert.deepEqual(granted, [], 'no caller or transport obtains helper EXECUTE')
  return { vectors, fullOriginalEnvelope: true, replayWrites: 0, postCasRollback: true,
    fullHistoryScans: 3, helperCallerGrants: granted.length, mutationVectors: vectors - mutationVectorStart - 1 }
}

/** Isolate UPDATE/ROLLBACK tuple versions from the separate History memo
 * comparison. Logical rows remain identical, but PostgreSQL can choose a
 * different physical iteration order after rolled-back real API updates. */
export async function runAtomicClaimNative(t: TestContext) {
  const fixture = await buildHistoryMemoFixture()
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await baseSetup(proof)
    await proof.run(owner + 'BEGIN;' + fixtureScope + methodSeed(fixture.original.oldestAt)
      + fixture.original.seedSql + 'COMMIT;', 'unchanged64-cycle predecessor for isolated atomic oracle')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
      'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;',
        'unchanged BG1 predecessor for isolated atomic oracle')
    }
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql')
      + 'COMMIT;', 'unchanged rolling predecessor for isolated atomic oracle')
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-customer-information-1/provider-migration-body.sql')
      + 'COMMIT;', 'exact complete additive successor before isolated atomic oracle')
    t.diagnostic(JSON.stringify(await checkAtomicClaimNative(t, proof, fixture)))
  } finally { await proof.close() }
}
