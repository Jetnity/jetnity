// Owned-local capacity proof only. Fictional source observations come from the
// established BG1 fixture. Queue, MA1, S1 and execution effects below are actual
// original APIs; no SQL response, authority receipt, timeout or COMMIT is mocked.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { fixturePrepared, fixtureVerification } from '../official-truth-v3-background-guard-1/fixtures'
import { createV3PostgresDurableJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import type { M04Config, M04NativeReply, M04Operation } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { readM04NativeReply } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { V3ImportHistory, V3ImportVerificationRequest } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import type { V3IntakeBinding } from '../../../lib/readiness/official-truth-product-v3/storage/intake-contract'
import { readV3RetainableProposal } from '../../../lib/readiness/official-truth-product-v3/storage/proposal-bytes'
import { AA_CH_DE_DELIVERY_PRODUCER } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-delivery-producer'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { hrs1Canonical, hrs1Ref, hrs1Same } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import type { HistoryFactoryBridge, HistoryFactoryEvent } from './history-claim-native'
import type { HistoryGuardCadence } from './history-bg1-cadence-native'

const owner = 'RESET ROLE;SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
const creator = 'RESET ROLE;SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const hash = (s: string) => createHash('sha256').update(s).digest('hex')
const id = (kind: string, tag: string) => kind + '_' + hash('owned-full-factory626:' + tag).slice(0, 32)
const missing: V3ImportHistory = Object.freeze({ pointer: { state: 'missing', revision: 0, versionRef: null },
  version: null, decision: null, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] })
const quotaExpression = 'official_v3_guard_private.ch_de_quota_v2()'
type Quota = { lifetime_starts: number; lifetime_operations: number; starts: number; operations: number; clock_ok: boolean }
type Delivery = { binding: V3IntakeBinding; text: string }

/** This boundary is deliberately local fiction. Only source/history ports use
 * the established canonical BG1 vectors; MA1 and persistence are real SQL. The
 * normal importer still constructs and validates the complete prepared outcome. */
function fictionalSources() {
  const evidenceReceipts = new WeakMap<object, { request: V3ImportVerificationRequest;
    verification: ReturnType<typeof fixtureVerification> }>()
  const historyReceipts = new WeakSet<object>()
  const deliveries: Delivery[] = []
  const counts = { produced: 0, inspected: 0, evidenceReproof: 0, historyRead: 0, historyReproof: 0 }
  const producer: M04Config['producer'] = { async produce(input, signal) {
    counts.produced++
    const result = await AA_CH_DE_DELIVERY_PRODUCER.produce(input, signal)
    assert.equal(result.status, 'delivered'); assert.ok(result.status === 'delivered')
    deliveries.push(...result.deliveries)
    return result
  } }
  const history: M04Config['history'] = {
    async read(contextKey, factKind, signal) {
      assert.equal(signal.aborted, false); assert.equal(contextKey, program.contextKey)
      assert.equal(factKind, 'requirement_effect'); counts.historyRead++
      const receipt = Object.freeze({}); historyReceipts.add(receipt)
      return { status: 'snapshot', receipt, history: missing }
    },
    async reprove(receipt, current, signal) {
      counts.historyReproof++
      return { status: !signal.aborted && historyReceipts.has(receipt) && hrs1Same(current, missing) ? 'current' : 'changed' }
    },
  }
  const evidence: M04Config['evidence'] = {
    async inspect(request, signal) {
      assert.equal(signal.aborted, false); counts.inspected++
      const verification = fixtureVerification(request.clock.now, request.decisionRef)
      assert.deepEqual(verification.request, request, 'fictional observations remain bound to the actual import request')
      const { primary, counterCheck, knownConflicts, historyArchive } = verification.decision
      const receipt = Object.freeze({}); evidenceReceipts.set(receipt, { request, verification })
      return { status: 'inspected', receipt, parts: { primary, counterCheck, knownConflicts, historyArchive },
        archiveAppend: null, validUntilExclusive: verification.validUntilExclusive }
    },
    async reprove(receipt, request, decision, archive, clock, signal) {
      counts.evidenceReproof++
      const held = evidenceReceipts.get(receipt)
      if (!held || signal.aborted || !hrs1Same(held.request, request) || archive !== null
        || decision.reference !== request.decisionRef || decision.predecessor !== null
        || !hrs1Same(decision.context, request.context) || !hrs1Same(decision.method, request.method)
        || decision.contextKey !== request.contextKey || decision.factKind !== request.factKind
        || decision.evaluatedAt < request.clock.now || decision.evaluatedAt > clock.now
        || clock.now >= held.verification.validUntilExclusive) return { status: 'changed' }
      const original = held.verification.decision
      return { status: hrs1Same([decision.primary, decision.counterCheck, decision.knownConflicts, decision.historyArchive],
        [original.primary, original.counterCheck, original.knownConflicts, original.historyArchive]) ? 'current' : 'changed' }
    },
  }
  return { producer, evidence, history, deliveries, counts }
}

function summary(events: HistoryFactoryEvent[]) {
  return events.map(e => ({ operation: e.operation, phase: e.phase, action: e.action, purpose: e.purpose,
    status: e.status, milliseconds: e.finished - e.entered, dispatched: e.dispatched, error: e.error }))
}
function publicationBoundary(result: { status: string; result?: { status: string } }) {
  return { status: result.status, retainedStatus: result.result?.status ?? null }
}
function completeWithinOriginalBudget(events: HistoryFactoryEvent[]) {
  const position = events.findIndex(e => e.operation === 'queue_mutate' && e.action === 'complete')
  assert.ok(position >= 2, 'actual complete follows real acquisition and pre-effect reproof')
  const calls = events.slice(position - 2, position + 2)
  assert.deepEqual(calls.map(e => e.operation), ['method', 'method', 'queue_mutate', 'method'])
  assert.deepEqual(calls.map(e => e.status), ['approved', 'approved', 'committed', 'approved'])
  assert.ok(calls.every(e => e.dispatched && !e.error && e.finished < e.deadline))
  assert.ok(calls[3].finished - calls[0].entered < 5000, 'actual complete keeps its original whole-operation deadline')
  for (let i = 1; i < calls.length; i++) assert.ok(calls[i].deadline <= calls[i - 1].deadline)
  return calls[3].finished - calls[0].entered
}

export async function checkHistoryFactorySuccess(t: TestContext, proof: OwnedPersistentProof, base: M04Config,
  bridge: HistoryFactoryBridge, jobKey: string, guard: HistoryGuardCadence) {
  const before = await proof.value<Quota>(quotaExpression, creator)
  assert.equal(before.lifetime_starts, 627); assert.equal(before.lifetime_operations, 2068)
  assert.equal(await proof.value<number>('(SELECT to_jsonb(count(*)) FROM official_v3_result_private.versions_v1)', owner), 0,
    'the local missing source-history fixture has no retained accepted version')
  const source = fictionalSources()
  const config: M04Config = { ...base, intakeExecutor: bridge.intake,
    producer: source.producer, evidence: source.evidence, history: source.history }
  const ruleInput = (tag: string) => ({ context: program.context, method: program.method, factKind: 'requirement_effect',
    researchReason: { status: 'missing' }, operationId: id('op3', tag + ':enqueue'), jobId: id('job3', tag), attemptLimit: 1 })
  const claimInput = (tag: string) => ({ operationId: id('op3', tag + ':claim'), jobKey,
    leaseId: id('lease3', tag), leaseMilliseconds: 30000 })

  async function enqueue(tag: string) {
    await guard.admit(tag + ' enqueue', 5000)
    const input = ruleInput(tag), first = bridge.events.length, started = performance.now()
    const result = await createV3PostgresDurableJobs(config).enqueueRule(input, t.signal)
    await bridge.drain()
    const milliseconds = performance.now() - started, events = bridge.events.slice(first)
    t.diagnostic('actual fresh enqueue626 horizon: ' + JSON.stringify({ status: result.status, milliseconds, calls: summary(events) }))
    assert.equal(result.status, 'confirmed'); assert.ok(result.status === 'confirmed')
    assert.equal(result.replayed, false); assert.equal(result.record.state, 'queued')
    assert.equal(result.record.jobId, input.jobId); assert.ok(milliseconds < 5000)
    assert.equal(events.filter(e => e.operation === 'queue_mutate' && e.action === 'enqueue').length, 1)
    assert.ok(events.every(e => !e.error && e.finished < e.deadline))
    return { input, job: result.record }
  }
  async function verifyCompleted(tag: string, expectedStarts: number, expectedOperations: number, delivery: Delivery) {
    const quota = await proof.value<Quota>(quotaExpression, creator)
    assert.equal(quota.lifetime_starts, expectedStarts); assert.equal(quota.lifetime_operations, expectedOperations)
    assert.equal(quota.clock_ok, true); assert.ok(quota.starts <= 64 && quota.operations <= 256)
    const retained = await proof.value<{ job: { state: string; jobId: string }; open: unknown; credit: unknown;
      original: string; digest: string; outcome: { status: string }; disposition: string; starts: number; results: number }>(`(SELECT jsonb_build_object(
      'job',s.current_job,'open',s.open_attempt,'credit',s.terminal_credit_claim,
      'original',convert_from(o.original_bytes,'UTF8'),'digest',o.proposal_digest,'outcome',c.outcome,
      'disposition',d.kind,'starts',(SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1 z WHERE z.leased_job->>'jobId'=${literal(id('job3', tag))}),
      'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 z WHERE z.result->>'jobId'=${literal(id('job3', tag))}))
      FROM official_v3_jobs_private.subjects_v1 s JOIN official_v3_jobs_private.execution_starts_v1 x ON x.job_key=s.job_key
      JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key)
      JOIN official_v3_intake_private.operations_v1 o ON o.binding->>'jobId'=x.leased_job->>'jobId'
      JOIN official_v3_intake_private.completions_v1 c USING(operation_id)
      WHERE s.job_key=${literal(jobKey)} AND x.leased_job->>'jobId'=${literal(id('job3', tag))})`, owner)
    assert.equal(retained.job.state, 'succeeded'); assert.equal(retained.job.jobId, id('job3', tag))
    assert.equal(retained.open, null); assert.equal(retained.credit, null)
    assert.equal(retained.starts, 1); assert.equal(retained.results, 1); assert.equal(retained.disposition, 'completed')
    assert.equal(retained.original, delivery.text); assert.equal(retained.digest, hash(delivery.text)); assert.equal(retained.outcome.status, 'prepared')
    await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();SELECT official_v3_guard_private.check_certificates_v1();',
      'full factory completed under exact catalog and genuine component seals')
  }

  await enqueue('ordinary-success')
  await guard.admit('ordinary successful factory')
  const freshClaim = claimInput('ordinary-success'), first = bridge.events.length, started = performance.now()
  const outcome = await createV3PostgresDurableJobs(config).workOnce(freshClaim, t.signal)
  await bridge.drain()
  const elapsed = performance.now() - started, events = bridge.events.slice(first)
  t.diagnostic('actual ordinary successful factory626 horizon: ' + JSON.stringify({ status: outcome.status,
    milliseconds: elapsed, source: source.counts,
    results: outcome.status === 'processed' ? outcome.results.map(publicationBoundary) : null, calls: summary(events) }))
  assert.equal(outcome.status, 'processed'); assert.ok(outcome.status === 'processed')
  assert.equal(outcome.worker.status, 'completed'); assert.equal(outcome.worker.job.state, 'succeeded')
  assert.equal(outcome.worker.acceptedRule, false); assert.ok(elapsed < 30000, 'full original thirty-second factory invocation')
  assert.deepEqual(outcome.results.map(publicationBoundary), [{ status: 'version_only', retainedStatus: 'unavailable' }],
    'this DurableJobs worker/S1 proof has no bound HRS store or publication authority')
  assert.deepEqual(source.counts, { produced: 1, inspected: 1, evidenceReproof: 1, historyRead: 1, historyReproof: 1 })
  assert.equal(source.deliveries.length, 1)
  assert.ok(events.some(e => e.operation === 'execution_start' && e.status === 'reserved'))
  assert.ok(events.some(e => e.operation === 'execution_prepare' && e.status === 'prepared'))
  assert.ok(events.some(e => e.operation === 's1_finish' && e.status === 'recorded'))
  t.diagnostic('actual ordinary complete milliseconds: ' + completeWithinOriginalBudget(events).toFixed(3))
  await verifyCompleted('ordinary-success', 628, 2071, source.deliveries[0])

  // A second, separately prepared attempt proves the real resume/continuation
  // branch as well. These original APIs create every retained S1/START/result
  // row. The subsequent fresh factory gets no invented token or positive reply.
  const preparedTag = 'prepared-resume'
  const queued = await enqueue(preparedTag), resumeClaim = claimInput(preparedTag)
  // Schedule before acquiring the original thirty-second fixture lease. Its
  // preparation and the following thirty-second factory keep all old limits.
  await guard.admit('separate prepared original setup and resume', 60000)
  const runtime = (login: string, role: string) => `SET SESSION AUTHORIZATION ${login};SET ROLE ${role};SET search_path=pg_catalog;
    BEGIN;SET LOCAL statement_timeout='5000ms';SET LOCAL lock_timeout='5000ms';`
  const m04 = async (operation: M04Operation): Promise<M04NativeReply> => {
    const until = new Date(Date.now() + 5000).toISOString()
    const raw = await proof.value<unknown>(`official_v3_jobs_api.execute_v1(${literal(hrs1Canonical({ ...operation, phase: 'authorized' }))},
      ${literal(program.binding.methodId)},${program.binding.revision},${literal(program.binding.methodDigest)},
      ${literal(program.binding.packageDigest)},1,5000,${literal(until)})`, runtime('ot_m04_jobs', 'ot_v3_jobs_caller'),
    `DO $until$ BEGIN IF clock_timestamp()>=${literal(until)}::timestamptz THEN RAISE EXCEPTION 'original fixture API deadline';END IF;END $until$;COMMIT;`)
    const parsed = readM04NativeReply([{ result: JSON.stringify(raw) }], operation.operation)
    assert.ok(parsed); return parsed
  }
  const claimed = await m04({ operation: 'queue_claim', body: { command: { action: 'claim', input: resumeClaim },
    continuation: null, expected: queued.job, replayOnly: false } })
  assert.equal(claimed.status, 'committed'); assert.ok(claimed.status === 'committed' && claimed.record.lease)
  const job = claimed.record, lease = job.lease; assert.ok(lease)
  const subject = await proof.value<{ subject_text: string }>(`(SELECT jsonb_build_object('subject_text',subject_text)
    FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(jobKey)})`, owner)
  const reserved = await m04({ operation: 'execution_start', body: { claim: resumeClaim, leasedJob: job, subjectText: subject.subject_text } })
  assert.equal(reserved.status, 'reserved'); assert.ok(reserved.status === 'reserved')
  const produced = await AA_CH_DE_DELIVERY_PRODUCER.produce({ job, fence: { jobId: job.jobId, revision: job.revision,
    leaseId: lease.leaseId, generation: lease.generation } }, t.signal)
  assert.equal(produced.status, 'delivered'); assert.ok(produced.status === 'delivered')
  const item = produced.deliveries[0], read = readV3RetainableProposal(item.text, program.registry); assert.ok(read.ok)
  const upload = read.value
  const s1 = <T>(expression: string) => proof.value<T>(expression, runtime('ot_m04_intake', 'ot_v3_intake_caller'), 'COMMIT;')
  assert.equal((await s1<{ status: string }>(`official_v3_intake_api.capture_v1(${json(item.binding)},${literal(item.text)},${literal(upload.digest)})`)).status, 'recorded')
  const verification = fixtureVerification(new Date().toISOString(), hrs1Ref('source-decision', { operationId: item.binding.operationId,
    proposalDigest: upload.digest, contextKey: program.contextKey, method: program.method, predecessor: null }))
  const prepared = fixturePrepared(upload, verification).prepared
  const reservation = await s1<{ status: string; generation: number; leaseToken: string }>(
    `official_v3_intake_api.reserve_v1(${json(item.binding)},${literal(upload.digest)},${upload.bytes},5000)`)
  assert.equal(reservation.status, 'acquired')
  const audit = { schema: 3, kind: 'import_attempt_record', operationId: item.binding.operationId, proposalDigest: upload.digest,
    jobId: job.jobId, contextKey: program.contextKey, method: program.method, recordedAt: verification.decision.evaluatedAt,
    result: 'prepared', decisionRef: prepared.decision.reference, escalationKey: null }
  assert.equal((await s1<{ status: string }>(`official_v3_intake_api.finish_v1(${json(item.binding)},${literal(upload.digest)},${upload.bytes},
    ${reservation.generation},${literal(reservation.leaseToken)}::uuid,${json({ status: 'prepared', value: prepared })},${json(audit)})`)).status, 'recorded')
  const preparing = await m04({ operation: 'execution_prepare', body: { claim: resumeClaim, attemptKey: reserved.attemptKey, token: reserved.token,
    result: { kind: 'rule_research', jobId: job.jobId, operationId: job.operationId, jobKey,
      preparedAt: verification.decision.evaluatedAt, decisionRef: prepared.decision.reference },
    references: [{ binding: item.binding, proposalDigest: upload.digest, bytes: upload.bytes }] } })
  assert.equal(preparing.status, 'prepared')
  assert.ok(preparing.status === 'prepared')
  const actualS1 = await s1<{ status: string; record: { text: string } }>(
    `official_v3_intake_api.read_v1(${json(item.binding)},${literal(upload.digest)},${upload.bytes})`)
  assert.equal(actualS1.status, 'recorded')
  const mismatchedS1 = await s1<unknown>(
    `official_v3_intake_api.read_v1(${json(item.binding)},${literal(upload.digest)},${upload.bytes + 1})`)
  const immutableState = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
    'jobs',official_v3_guard_private.fingerprint_jobs_v1(),'s1',official_v3_guard_private.fingerprint_s1_v1(),
    'certificates',(SELECT jsonb_agg(to_jsonb(r) ORDER BY component) FROM official_v3_guard_private.certificates_v1 r),
    'history',(SELECT jsonb_agg(to_jsonb(r) ORDER BY component,generation) FROM official_v3_guard_private.certificate_history_v1 r)
    )::text,'UTF8')),'hex')))`
  const intact = await proof.value<string>(immutableState, owner)
  await proof.run(owner + 'BEGIN;SET LOCAL ROLE ot_v3_jobs_owner;SELECT official_v3_jobs_private.consume_s1_v1('
    + [json(actualS1), json(job), json(preparing.result), "'complete'"].join(',') + ');ROLLBACK;',
  'original complete-purpose consumer accepts the actual stored original and prepared outcome')
  for (const [tag, damaged] of [
    ['actual reference byte-count mismatch', mismatchedS1],
    ['changed returned original bytes', { ...actualS1, record: { ...actualS1.record, text: actualS1.record.text + ' ' } }],
  ] as const) {
    // Negative pure-consumer fault vectors only. Neither altered reply is ever
    // used as a positive API/authority result, and stored originals never change.
    const output = await proof.run(owner + `BEGIN;SET LOCAL ROLE ot_v3_jobs_owner;
      DO $bad_s1$ BEGIN
        PERFORM official_v3_jobs_private.consume_s1_v1(${json(damaged)},${json(job)},${json(preparing.result)},'complete');
        RAISE EXCEPTION 'invalid S1 unexpectedly accepted' USING ERRCODE='P9999';
      EXCEPTION WHEN SQLSTATE 'P7604' THEN RAISE WARNING 'COMPLETE_S1_ORIGINAL_REFUSAL';END $bad_s1$;ROLLBACK;`, tag)
    assert.match(output, /COMPLETE_S1_ORIGINAL_REFUSAL/)
    assert.equal(await proof.value<string>(immutableState, owner), intact, 'negative S1 proof cannot alter any retained row or certificate')
  }
  const resumeConfig: M04Config = { ...config,
    producer: { async produce() { assert.fail('prepared resume cannot run the producer again') } },
    evidence: { async inspect() { assert.fail('prepared resume cannot invent another source check') }, async reprove() { assert.fail('prepared resume cannot invent source custody') } },
    history: { async read() { assert.fail('prepared resume cannot fabricate source history') }, async reprove() { assert.fail('prepared resume cannot fabricate history custody') } },
  }
  // The prepared original is already retained: observe, but never insert a
  // scheduler wait or audit into its held lease/authority interval.
  await guard.observe('separately prepared factory resume', 30000)
  const resumeFirst = bridge.events.length, resumeStarted = performance.now()
  const resumed = await createV3PostgresDurableJobs(resumeConfig).workOnce(resumeClaim, t.signal)
  await bridge.drain()
  const resumeMilliseconds = performance.now() - resumeStarted, resumedEvents = bridge.events.slice(resumeFirst)
  t.diagnostic('actual prepared-resume factory626 horizon: ' + JSON.stringify({ status: resumed.status,
    milliseconds: resumeMilliseconds,
    results: resumed.status === 'processed' ? resumed.results.map(publicationBoundary) : null, calls: summary(resumedEvents) }))
  assert.equal(resumed.status, 'processed'); assert.ok(resumed.status === 'processed')
  assert.equal(resumed.worker.job.state, 'succeeded'); assert.ok(resumeMilliseconds < 30000)
  assert.deepEqual(resumed.results.map(publicationBoundary), [{ status: 'version_only', retainedStatus: 'unavailable' }],
    'prepared resume also proves only the actual worker/S1 boundary without an HRS store')
  assert.equal(resumedEvents.filter(e => e.operation === 'execution_start' || e.operation === 'execution_prepare').length, 0,
    'fresh resume consumes the exact already prepared durable attempt')
  t.diagnostic('actual resumed complete milliseconds: ' + completeWithinOriginalBudget(resumedEvents).toFixed(3))
  await verifyCompleted(preparedTag, 629, 2074, item)
}
