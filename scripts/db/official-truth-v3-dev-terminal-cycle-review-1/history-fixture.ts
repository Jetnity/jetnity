// OWNED LOCAL PG17 FIXTURE ONLY. No connection, source request, approval or
// runtime authority. The synthetic predecessor is explicitly not Dev history.
// Original Cycle2 next-records and its full terminal envelope are checked below.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readV3ResearchJobRecord, type V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import type { Ma1MethodBinding } from '../../../lib/readiness/official-truth-product-v3/method/contract'
import { createV3QueueCoordinator, type V3QueueCommit,
  type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { createM04SubjectIdentity, readM04Command } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { m04Canonical } from '../official-truth-v3-durable-jobs-1/fixtures'

const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const id = (kind: 'op3' | 'job3' | 'lease3', seed: string) => kind + '_' + hash('owned-local terminal review:' + seed).slice(0, 32)
const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'"
const json = (value: unknown) => literal(m04Canonical(value)) + '::jsonb'
const at = (milliseconds: number) => new Date(milliseconds).toISOString()
const read = (name: string): unknown => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'))
const terminalEnvelopeHash = '1d8b073aa5819dcf76bd463a104f78c66eae59b8dc63593cc2fdc8796dce182b'
type Authority = Ma1MethodBinding & Readonly<{ epoch: 1 }>
export type TerminalReviewOperation = Readonly<{
  operation_id: string; job_key: string; action: 'enqueue' | 'claim';
  command_key: string; command_text: string; envelope_text: string;
  audit_reference: string; new_cycle_job_id: string | null; authority: Authority; recorded_at: string;
}>
type RecordedCycleOperation = Readonly<{
  action: 'enqueue' | 'claim'; next_job: V3ResearchJobRecord; recorded_at: string;
  operation_id: string; command_operation_id: string; authority_epoch: string;
}>

async function prospective(raw: unknown, current: V3ResearchJobRecord | null, instant: string) {
  const command = readM04Command(raw)
  assert.ok(command && command.kind === 'rule_research', 'closed local command')
  assert.ok(command.action === 'enqueue' || command.action === 'claim', 'no synthetic execution outcome')
  let retained: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = {
    async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } },
    async compareAndSwap(commit) { retained = structuredClone(commit); return { status: 'unconfirmed' } },
  }
  const queue = createV3QueueCoordinator({ storage, now: () => instant, invocationMilliseconds: 5000,
    backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000,
    // Prospective DTO construction only, with no DB adapter or authority issuer.
    methodAuthority: { async resolveCurrent() { return { status: 'approved', receipt: {} } },
      async reproveAtCommit() { return { status: 'current' } } },
  })
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else await queue.claim(command.value.input)
  assert.ok(retained, 'actual queue coordinator must construct an original envelope')
  assert.equal(retained.commandKey, command.commandKey)
  assert.equal(retained.operationId, command.operationId)
  assert.equal(retained.next.kind, 'research_job_record')
  return { command, commit: retained, next: retained.next as V3ResearchJobRecord }
}

/** Alternative newerTerminal fixture seeds a complete longer chain before BG1;
 * it never rewrites a Subject or operation in an already installed database. */
export async function buildTerminalReviewFixture(options: Readonly<{ newerTerminal?: boolean }> = {}) {
  const original = read('./fixture-cycle2.json') as readonly RecordedCycleOperation[]
  assert.ok(Array.isArray(original) && original.length === 6)
  for (const [index, row] of original.entries()) {
    const checked = readV3ResearchJobRecord(row.next_job)
    assert.ok(checked.ok)
    assert.deepEqual(checked.value, row.next_job)
    assert.equal(row.next_job.revision, 20 + index)
    assert.equal(row.operation_id, row.command_operation_id)
    assert.equal(row.authority_epoch, '1')
    assert.ok(Date.parse(row.recorded_at) >= Date.parse(row.next_job.updatedAt))
  }
  const evidence = read('./original-evidence.json') as { terminal_operation: TerminalReviewOperation }
  const terminal = evidence.terminal_operation
  assert.equal(hash(terminal.envelope_text), terminalEnvelopeHash)
  assert.equal(hash(terminal.command_text), 'd8d9a3c3f78da3a13029851abf7a40e464da6f060eb095770506791544a6764c')
  const method: Ma1MethodBinding = Object.freeze({ methodId: program.binding.methodId,
    revision: program.binding.revision, methodDigest: program.binding.methodDigest,
    packageDigest: program.binding.packageDigest })
  const methodRef = Object.freeze({ methodId: method.methodId, revision: method.revision })
  const authority: Authority = Object.freeze({ ...method, epoch: 1 })
  assert.deepEqual(authority, terminal.authority)
  const firstOriginal = original[0].next_job
  assert.deepEqual(firstOriginal.context, program.context)
  assert.deepEqual(firstOriginal.method, methodRef)
  const work = { context: program.context, method: methodRef, factKind: firstOriginal.research.factKind,
    researchReason: firstOriginal.research.researchReason }
  const subject = createM04SubjectIdentity('rule_research', work)
  assert.ok(subject)
  const { jobKey } = subject
  assert.equal(jobKey, terminal.job_key)
  const operations: TerminalReviewOperation[] = []
  let current: V3ResearchJobRecord | null = null
  const first = Date.parse(firstOriginal.updatedAt) - 30 * 60 * 1000
  function head(): V3ResearchJobRecord { assert.ok(current); return current }

  function append(value: Awaited<ReturnType<typeof prospective>>, recorded: string) {
    const { command, commit } = value
    assert.ok(command.action === 'enqueue' || command.action === 'claim')
    operations.push(Object.freeze({ operation_id: command.operationId, job_key: jobKey,
      action: command.action, command_key: command.commandKey, command_text: command.commandText,
      envelope_text: m04Canonical(commit), audit_reference: commit.audit.reference,
      new_cycle_job_id: command.action === 'enqueue' ? value.next.jobId : null,
      authority, recorded_at: recorded }))
    current = value.next
  }
  async function unstartedCycle(seed: string, limit: number, moment: number) {
    append(await prospective({ action: 'enqueue', kind: 'rule_research', input: { ...work,
      operationId: id('op3', seed + ':enqueue'), jobId: id('job3', seed), attemptLimit: limit } }, current, at(moment)), at(moment + 1))
    for (let step = 1; step <= limit + 1; step++) {
      const now = moment + step * 40000
      append(await prospective({ action: 'claim', input: { jobKey, operationId: id('op3', seed + ':claim:' + step),
        leaseId: id('lease3', seed + ':' + step), leaseMilliseconds: 30000 } }, current, at(now)), at(now + 1))
    }
    assert.ok(current)
    assert.equal(current.state, 'exhausted')
    assert.equal(current.lease, null)
  }
  // 1 enqueue + 14 unstarted leases + one terminal claim = 16 revisions.
  // A second 1-attempt cycle adds three. All leases naturally expire first.
  await unstartedCycle('synthetic-predecessor-14', 14, first)
  await unstartedCycle('synthetic-predecessor-1', 1, first + 16 * 40000)
  assert.equal(head().revision, 19)
  assert.equal(operations.length, 19)

  for (const [index, row] of original.entries()) {
    const next = row.next_job
    const raw = index === 0 ? { action: 'enqueue', kind: 'rule_research', input: {
      context: next.context, method: next.method, factKind: next.research.factKind,
      researchReason: next.research.researchReason, operationId: row.operation_id,
      jobId: next.jobId, attemptLimit: next.attemptLimit,
    } } : index === original.length - 1 ? JSON.parse(terminal.command_text) as unknown
      : { action: 'claim', input: { jobKey, operationId: row.operation_id,
        leaseId: next.lease!.leaseId, leaseMilliseconds: 30000 } }
    const built = await prospective(raw, current, next.updatedAt)
    assert.deepEqual(built.next, next, 'each Cycle2 next record must match the original readback')
    assert.equal(built.command.operationId, row.operation_id)
    append(built, row.recorded_at)
  }
  const rebuiltTerminal = operations.at(-1)!
  assert.equal(rebuiltTerminal.envelope_text, terminal.envelope_text)
  assert.equal(hash(rebuiltTerminal.envelope_text), terminalEnvelopeHash)
  assert.equal(rebuiltTerminal.command_text, terminal.command_text)
  assert.equal(rebuiltTerminal.audit_reference, terminal.audit_reference)
  assert.equal(rebuiltTerminal.command_key, terminal.command_key)
  assert.equal(head().revision, 25)
  if (options.newerTerminal) await unstartedCycle('synthetic-newer-terminal', 1,
    Date.parse(original.at(-1)!.next_job.updatedAt) + 60000)
  const finalCurrent = head()
  assert.equal(finalCurrent.state, 'exhausted')
  assert.equal(finalCurrent.revision, options.newerTerminal ? 28 : 25)
  assert.equal(operations.length, finalCurrent.revision)
  assert.equal(new Set(operations.map(row => row.operation_id)).size, operations.length)
  const subjectRow = Object.freeze({ job_key: jobKey, slot_id: 1, kind: 'rule_research' as const,
    subject_text: subject.subjectText, method_binding: method, current_job: finalCurrent,
    operation_count: operations.length, start_count: 0, open_attempt: null, terminal_credit_claim: null })
  const rowSql = (parts: readonly string[]) => '(' + parts.join(',') + ')'
  const seedSql = `-- Synthetic owned-local prehistory; original Cycle2 terminal bytes only. Never a Dev dump.
DO $fixture$
BEGIN
  IF current_setting('jetnity.local_terminal_review_fixture',true) IS DISTINCT FROM 'owned-local-pg17-only'
    OR session_user<>'ot_pilot_owner' OR current_user<>'ot_pilot_owner'
    OR current_setting('server_version_num')::integer/10000<>17 OR current_database()<>'postgres'
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(jobKey)})
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=${literal(jobKey)})
    OR NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE slot_id=1 AND job_key IS NULL) THEN
    RAISE EXCEPTION 'new owned-local terminal review fixture required';
  END IF;
END $fixture$;
UPDATE official_v3_jobs_private.slots_v1 SET job_key=${literal(jobKey)} WHERE slot_id=1 AND job_key IS NULL;
INSERT INTO official_v3_jobs_private.subjects_v1(job_key,slot_id,kind,subject_text,method_binding,current_job,
  operation_count,start_count,open_attempt,terminal_credit_claim) VALUES
  ${rowSql([literal(jobKey), '1', "'rule_research'", literal(subject.subjectText), json(method), json(finalCurrent),
    String(operations.length), '0', 'NULL', 'NULL'])};
INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,
  audit_reference,new_cycle_job_id,authority,recorded_at) VALUES
  ${operations.map(value => rowSql([literal(value.operation_id), literal(value.job_key), literal(value.action), literal(value.command_key),
    literal(value.command_text), literal(value.envelope_text), literal(value.audit_reference),
    value.new_cycle_job_id === null ? 'NULL' : literal(value.new_cycle_job_id), json(value.authority),
    literal(value.recorded_at) + '::timestamptz'])).join(',\n  ')};
SELECT official_v3_jobs_private.assert_history_v1(${literal(jobKey)});
`
  return Object.freeze({ subject, subjectRow, jobKey, current: finalCurrent, operations: Object.freeze(operations), seedSql,
    oldestAt: operations[0].recorded_at, newestAt: operations.at(-1)!.recorded_at,
    requiredMethodApprovedBefore: at(first - 1000),
    historyDigest: hash(m04Canonical({ subjectRow, operations })) })
}
