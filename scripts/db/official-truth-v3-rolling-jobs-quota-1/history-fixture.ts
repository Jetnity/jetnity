// SYNTHETIC OWNED-LOCAL-DATABASE FIXTURE ONLY. No network, connection, importer,
// clock override, source fact, approval, or runtime authority is created here.
// The queue coordinator constructs prospective original envelopes. The test
// driver seeds those coherent historical rows before BG1/Quota installation;
// the successor cycle is then executed through the actual unchanged M04 API.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { V3GlobalRuleContext, V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import type { Ma1MethodBinding } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { createV3QueueCoordinator, type V3EnqueueInput, type V3QueueCommit,
  type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { createM04SubjectIdentity, readM04Command, type M04Claim,
  type M04Operation } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { m04Canonical } from '../official-truth-v3-durable-jobs-1/fixtures'

const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const id = (kind: 'op3' | 'job3' | 'lease3', seed: string) => kind + '_' + hash('rolling-quota local fixture:' + seed).slice(0, 32)
const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'"
const json = (value: unknown) => literal(m04Canonical(value)) + '::jsonb'
const at = (milliseconds: number) => new Date(milliseconds).toISOString()

type Authority = Ma1MethodBinding & Readonly<{ epoch: 1 }>
export type HistoricalQuotaOperation = Readonly<{
  operation_id: string; job_key: string; action: 'enqueue' | 'claim' | 'fail';
  command_key: string; command_text: string; envelope_text: string;
  audit_reference: string; new_cycle_job_id: string | null; authority: Authority; recorded_at: string;
}>
export type HistoricalQuotaStart = Readonly<{
  attempt_key: string; job_key: string; claim_operation_id: string; claim_text: string;
  leased_job: V3ResearchJobRecord; authority: Authority; token_hash: string; reserved_at: string;
}>
export type HistoricalQuotaDisposition = Readonly<{
  attempt_key: string; queue_operation_id: string; kind: 'settled_failure';
  failure_reason: 'unreachable'; settled_at: string;
}>

async function prospective(raw: unknown, current: V3ResearchJobRecord | null, instant: string) {
  const command = readM04Command(raw)
  assert.ok(command && command.kind === 'rule_research', 'closed fixture command')
  let retained: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = {
    async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } },
    async compareAndSwap(commit) { retained = structuredClone(commit); return { status: 'unconfirmed' } },
  }
  const queue = createV3QueueCoordinator({ storage, now: () => instant, invocationMilliseconds: 5000,
    backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000,
    // Prospective DTO construction only. These local objects never reach a DB
    // adapter, authority issuer, source producer or deployment runtime.
    methodAuthority: { async resolveCurrent() { return { status: 'approved', receipt: {} } },
      async reproveAtCommit() { return { status: 'current' } } },
  })
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else if (command.action === 'claim') await queue.claim(command.value.input)
  else if (command.action === 'fail') await queue.fail(command.value.input)
  else assert.fail('fixture contains no synthetic successful source result')
  assert.ok(retained, 'the unchanged queue must produce the complete envelope')
  assert.equal(retained.commandKey, command.commandKey)
  assert.equal(retained.operationId, command.operationId)
  assert.equal(retained.next.kind, 'research_job_record')
  return { command, commit: retained, next: retained.next as V3ResearchJobRecord }
}

export async function buildHistoricalQuotaFixture(input: Readonly<{
  method: Ma1MethodBinding;
  context: V3GlobalRuleContext;
  factKind: V3EnqueueInput['factKind'];
  firstAt: Date | string;
  cycleSpacingMs: number;
  cycles: number;
}>) {
  assert.ok(Number.isSafeInteger(input.cycles) && input.cycles >= 1 && input.cycles <= 64,
    'historical fixture must satisfy the predecessor lifetime START cap')
  assert.ok(Number.isSafeInteger(input.cycleSpacingMs) && input.cycleSpacingMs >= 3000,
    'each complete historical cycle precedes its successor')
  const first = input.firstAt instanceof Date ? input.firstAt.getTime() : Date.parse(input.firstAt)
  assert.ok(Number.isSafeInteger(first) && first > 0)
  const end = first + (input.cycles - 1) * input.cycleSpacingMs + 2001
  assert.ok(Number.isSafeInteger(end) && Number.isFinite(Date.parse(at(end))))
  const method: Ma1MethodBinding = Object.freeze({ methodId: input.method.methodId, revision: input.method.revision,
    methodDigest: input.method.methodDigest, packageDigest: input.method.packageDigest })
  const methodRef = Object.freeze({ methodId: method.methodId, revision: method.revision })
  const authority: Authority = Object.freeze({ ...method, epoch: 1 })
  const work = { context: input.context, method: methodRef, factKind: input.factKind,
    researchReason: { status: 'missing' as const } }
  const subject = createM04SubjectIdentity('rule_research', work)
  assert.ok(subject, 'complete canonical subject identity')
  const { jobKey } = subject
  const seed = hash(m04Canonical({ subject, firstAt: at(first), cycleSpacingMs: input.cycleSpacingMs, cycles: input.cycles }))
  const operations: HistoricalQuotaOperation[] = []
  const starts: HistoricalQuotaStart[] = []
  const dispositions: HistoricalQuotaDisposition[] = []
  const witnesses: Readonly<{ claim: M04Claim; attemptKey: string; token: string;
    enqueue: M04Operation; fail: M04Operation }>[] = []
  let current: V3ResearchJobRecord | null = null

  function append(value: Awaited<ReturnType<typeof prospective>>, recorded: string) {
    const { command, commit } = value
    assert.notEqual(command.action, 'complete')
    operations.push(Object.freeze({ operation_id: command.operationId, job_key: jobKey,
      action: command.action as HistoricalQuotaOperation['action'], command_key: command.commandKey,
      command_text: command.commandText, envelope_text: m04Canonical(commit), audit_reference: commit.audit.reference,
      new_cycle_job_id: command.action === 'enqueue' ? value.next.jobId : null,
      authority, recorded_at: recorded }))
    current = value.next
  }
  for (let index = 0; index < input.cycles; index++) {
    const moment = first + index * input.cycleSpacingMs
    const cycle = seed + ':' + index
    const enqueueInput = { ...work, operationId: id('op3', cycle + ':enqueue'), jobId: id('job3', cycle), attemptLimit: 1 }
    const enqueued = await prospective({ action: 'enqueue', kind: 'rule_research', input: enqueueInput }, current, at(moment))
    append(enqueued, at(moment + 1))
    const claim: M04Claim = Object.freeze({ operationId: id('op3', cycle + ':claim'), jobKey,
      leaseId: id('lease3', cycle), leaseMilliseconds: 30000 })
    const claimed = await prospective({ action: 'claim', input: claim }, current, at(moment + 1000))
    append(claimed, at(moment + 1001))
    assert.ok(claimed.next.lease)
    const leasedJob = claimed.next
    const attemptKey = 'execution-attempt:v3:' + hash(m04Canonical({ subject: JSON.parse(subject.subjectText),
      claim, leasedJob, authority }))
    const token = hash('SYNTHETIC NEVER-LIVE START TOKEN:' + cycle)
    starts.push(Object.freeze({ attempt_key: attemptKey, job_key: jobKey, claim_operation_id: claim.operationId,
      claim_text: m04Canonical(claim), leased_job: leasedJob, authority, token_hash: hash(token), reserved_at: at(moment + 1500) }))
    const failInput = { operationId: id('op3', cycle + ':fail'), jobKey,
      fence: { jobId: leasedJob.jobId, revision: leasedJob.revision, leaseId: leasedJob.lease!.leaseId,
        generation: leasedJob.lease!.generation }, reason: 'unreachable' as const }
    const failed = await prospective({ action: 'fail', input: failInput }, current, at(moment + 2000))
    append(failed, at(moment + 2001))
    assert.equal(failed.next.state, 'exhausted', 'the next cycle requires a genuinely terminal predecessor')
    dispositions.push(Object.freeze({ attempt_key: attemptKey, queue_operation_id: failInput.operationId,
      kind: 'settled_failure', failure_reason: 'unreachable', settled_at: at(moment + 2001) }))
    witnesses.push(Object.freeze({ claim, attemptKey, token,
      enqueue: { operation: 'queue_cas' as const, body: { command: enqueued.command.value, commit: enqueued.commit,
        subjectText: subject.subjectText, disposition: { kind: 'regular' as const } } },
      fail: { operation: 'queue_cas' as const, body: { command: failed.command.value, commit: failed.commit,
        subjectText: subject.subjectText, disposition: { kind: 'settled_failure' as const, attemptKey, token } } },
    }))
  }
  assert.ok(current)
  assert.equal(operations.length, 3 * input.cycles)
  assert.equal(starts.length, input.cycles)
  assert.equal(dispositions.length, input.cycles)
  assert.ok(operations.length <= 256)
  assert.equal(new Set(operations.map(row => row.operation_id)).size, operations.length)
  assert.equal(new Set(starts.map(row => row.attempt_key)).size, starts.length)
  const subjectRow = Object.freeze({ job_key: jobKey, slot_id: 1, kind: 'rule_research' as const,
    subject_text: subject.subjectText, method_binding: method, current_job: current,
    operation_count: operations.length, start_count: starts.length, open_attempt: null, terminal_credit_claim: null })
  const oldestAt = operations[0].recorded_at
  const newestAt = dispositions.at(-1)!.settled_at
  const row = (parts: readonly string[]) => '(' + parts.join(',') + ')'
  const seedSql = `-- Closed synthetic setup only, before BG1/Quota installation. Never apply to a hosted project.
DO $fixture$
BEGIN
  IF current_setting('jetnity.local_quota_fixture',true) IS DISTINCT FROM 'owned-local-pg17-only'
    OR current_setting('server_version_num')::integer/10000<>17 OR current_database()<>'postgres'
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(jobKey)})
    OR NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE slot_id=1 AND job_key IS NULL) THEN
    RAISE EXCEPTION 'new owned local quota fixture required';
  END IF;
END $fixture$;
UPDATE official_v3_jobs_private.slots_v1 SET job_key=${literal(jobKey)} WHERE slot_id=1 AND job_key IS NULL;
INSERT INTO official_v3_jobs_private.subjects_v1(job_key,slot_id,kind,subject_text,method_binding,current_job,
  operation_count,start_count,open_attempt,terminal_credit_claim) VALUES
  ${row([literal(jobKey), '1', "'rule_research'", literal(subject.subjectText), json(method), json(current),
    String(operations.length), String(starts.length), 'NULL', 'NULL'])};
INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,
  audit_reference,new_cycle_job_id,authority,recorded_at) VALUES
  ${operations.map(value => row([literal(value.operation_id), literal(value.job_key), literal(value.action), literal(value.command_key),
    literal(value.command_text), literal(value.envelope_text), literal(value.audit_reference),
    value.new_cycle_job_id === null ? 'NULL' : literal(value.new_cycle_job_id), json(value.authority), literal(value.recorded_at) + '::timestamptz'])).join(',\n  ')};
INSERT INTO official_v3_jobs_private.execution_starts_v1(attempt_key,job_key,claim_operation_id,claim_text,leased_job,
  authority,token_hash,reserved_at) VALUES
  ${starts.map(value => row([literal(value.attempt_key), literal(value.job_key), literal(value.claim_operation_id), literal(value.claim_text),
    json(value.leased_job), json(value.authority), literal(value.token_hash), literal(value.reserved_at) + '::timestamptz'])).join(',\n  ')};
INSERT INTO official_v3_jobs_private.execution_dispositions_v1(attempt_key,queue_operation_id,kind,failure_reason,settled_at) VALUES
  ${dispositions.map(value => row([literal(value.attempt_key), literal(value.queue_operation_id), "'settled_failure'", "'unreachable'",
    literal(value.settled_at) + '::timestamptz'])).join(',\n  ')};
SELECT official_v3_jobs_private.assert_history_v1(${literal(jobKey)});
`
  const oldQueueConfirm: M04Operation = Object.freeze({ operation: 'queue_confirm', body: {
    command: JSON.parse(operations[0].command_text) as Record<string, unknown>, continuation: null } })
  const oldExecutionRead: M04Operation = Object.freeze({ operation: 'execution_read', body: {
    claim: witnesses[0].claim, purpose: 'resume' as const } })
  return Object.freeze({ subject, subjectRow, jobKey, operations: Object.freeze(operations), starts: Object.freeze(starts),
    dispositions: Object.freeze(dispositions), witnesses: Object.freeze(witnesses), seedSql, oldestAt, newestAt,
    requiredMethodApprovedBefore: at(first - 1000), oldQueueConfirm, oldExecutionRead,
    expectedOldExecutionReadStatus: 'blocked' as const,
    historyDigest: hash(m04Canonical({ subjectRow, operations, starts, dispositions })) })
}
