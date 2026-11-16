// OWNED LOCAL PG17 FIXTURE ONLY. Complete prospective queue envelopes, no
// runtime authority, real source, remote approval, clock override or live write.
// Cycle2 remains exact; a declared synthetic bridge reaches revision29, then
// the six original Cycle3 next-records reach the exact terminal envelope35.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readV3ResearchJobRecord, type V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3QueueCoordinator, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { readM04Command } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { buildTerminalReviewFixture, type TerminalReviewOperation } from '../official-truth-v3-dev-terminal-cycle-review-1/history-fixture'
import { m04Canonical } from '../official-truth-v3-durable-jobs-1/fixtures'

const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const id = (kind: 'op3' | 'job3' | 'lease3', seed: string) => kind + '_' + hash('owned-local cycle3 review:' + seed).slice(0, 32)
const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'"
const json = (value: unknown) => literal(m04Canonical(value)) + '::jsonb'
const at = (milliseconds: number) => new Date(milliseconds).toISOString()
const read = (name: string): unknown => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'))

async function prospective(raw: unknown, current: V3ResearchJobRecord, instant: string) {
  const command = readM04Command(raw)
  assert.ok(command && command.kind === 'rule_research')
  assert.ok(command.action === 'enqueue' || command.action === 'claim')
  let retained: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = {
    async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } },
    async compareAndSwap(commit) { retained = structuredClone(commit); return { status: 'unconfirmed' } },
  }
  const queue = createV3QueueCoordinator({ storage, now: () => instant, invocationMilliseconds: 5000,
    backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000,
    methodAuthority: { async resolveCurrent() { return { status: 'approved', receipt: {} } },
      async reproveAtCommit() { return { status: 'current' } } },
  })
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  else await queue.claim(command.value.input)
  assert.ok(retained, 'the unchanged pure queue coordinator must build the full original envelope')
  assert.equal(retained.commandKey, command.commandKey)
  assert.equal(retained.operationId, command.operationId)
  assert.equal(retained.next.kind, 'research_job_record')
  return { command, commit: retained, next: retained.next as V3ResearchJobRecord }
}

export async function buildCycle3ReviewFixture(options: Readonly<{ newerTerminal?: boolean }> = {}) {
  const prior = await buildTerminalReviewFixture()
  assert.equal(prior.current.revision, 25)
  const original = read('./fixture-cycle3.json') as readonly TerminalReviewOperation[]
  const evidence = read('./original-evidence.json') as { terminal_operation: TerminalReviewOperation }
  assert.ok(Array.isArray(original) && original.length === 6)
  assert.deepEqual(original.at(-1), evidence.terminal_operation)
  const authority = prior.operations.at(-1)!.authority
  const { jobKey } = prior
  const operations: TerminalReviewOperation[] = [...prior.operations]
  let current = prior.current
  const work = { context: current.context, method: current.method, factKind: current.research.factKind,
    researchReason: current.research.researchReason }

  function append(value: Awaited<ReturnType<typeof prospective>>, recorded: string) {
    const { command, commit, next } = value
    assert.ok(command.action === 'enqueue' || command.action === 'claim')
    operations.push(Object.freeze({ operation_id: command.operationId, job_key: jobKey,
      action: command.action, command_key: command.commandKey, command_text: command.commandText,
      envelope_text: m04Canonical(commit), audit_reference: commit.audit.reference,
      new_cycle_job_id: command.action === 'enqueue' ? next.jobId : null,
      authority, recorded_at: recorded }))
    current = next
  }
  async function unstartedCycle(seed: string, limit: number, moment: number) {
    append(await prospective({ action: 'enqueue', kind: 'rule_research', input: { ...work,
      operationId: id('op3', seed + ':enqueue'), jobId: id('job3', seed), attemptLimit: limit } }, current, at(moment)), at(moment + 1))
    for (let step = 1; step <= limit + 1; step++) {
      const now = moment + step * 40000
      append(await prospective({ action: 'claim', input: { jobKey, operationId: id('op3', seed + ':claim:' + step),
        leaseId: id('lease3', seed + ':' + step), leaseMilliseconds: 30000 } }, current, at(now)), at(now + 1))
    }
    assert.equal(current.state, 'exhausted')
    assert.equal(current.lease, null)
  }
  // Four coherent append-only operations bridge25→29. This deliberately does
  // not impersonate the real manual publication or its eight lifetime STARTs.
  await unstartedCycle('synthetic-between-reviewed-cycles', 2, Date.parse(current.updatedAt) + 60000)
  assert.equal(current.revision, 29)
  for (const [index, row] of original.entries()) {
    const envelope = JSON.parse(row.envelope_text) as { next: unknown }
    const checked = readV3ResearchJobRecord(envelope.next)
    assert.ok(checked.ok)
    assert.equal(checked.value.revision, 30 + index)
    assert.equal(row.job_key, jobKey)
    assert.deepEqual(row.authority, authority)
    assert.ok(Date.parse(row.recorded_at) >= Date.parse(checked.value.updatedAt))
    const built = await prospective(JSON.parse(row.command_text) as unknown, current, checked.value.updatedAt)
    assert.deepEqual(built.next, checked.value, 'each Cycle3 next record matches its original readback')
    append(built, row.recorded_at)
    // The first original enqueue expected the real manual job29. Only that
    // predecessor is synthetic; all subsequent full original envelopes match.
    if (index > 0) assert.deepEqual(operations.at(-1), row, 'complete original Cycle3 claim envelope is byte-exact')
  }
  assert.equal(current.revision, 35)
  assert.deepEqual(operations.at(-1), evidence.terminal_operation)
  if (options.newerTerminal) await unstartedCycle('synthetic-later-terminal', 1, Date.parse(current.updatedAt) + 60000)
  assert.equal(current.revision, options.newerTerminal ? 38 : 35)
  assert.equal(current.state, 'exhausted')
  assert.equal(operations.length, current.revision)
  assert.equal(new Set(operations.map(row => row.operation_id)).size, operations.length)
  const subjectRow = Object.freeze({ ...prior.subjectRow, current_job: current, operation_count: operations.length })
  const rowSql = (parts: readonly string[]) => '(' + parts.join(',') + ')'
  const seedSql = `-- Complete synthetic local history with exact Cycle2 and Cycle3 terminal bytes. Never a Dev dump.
DO $fixture$
BEGIN
  IF current_setting('jetnity.local_terminal_cycle3_fixture',true) IS DISTINCT FROM 'owned-local-pg17-only'
    OR session_user<>'ot_pilot_owner' OR current_user<>'ot_pilot_owner'
    OR current_setting('server_version_num')::integer/10000<>17 OR current_database()<>'postgres'
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE job_key=${literal(jobKey)})
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=${literal(jobKey)})
    OR NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE slot_id=1 AND job_key IS NULL) THEN
    RAISE EXCEPTION 'new owned-local Cycle3 review fixture required';
  END IF;
END $fixture$;
UPDATE official_v3_jobs_private.slots_v1 SET job_key=${literal(jobKey)} WHERE slot_id=1 AND job_key IS NULL;
INSERT INTO official_v3_jobs_private.subjects_v1(job_key,slot_id,kind,subject_text,method_binding,current_job,
  operation_count,start_count,open_attempt,terminal_credit_claim) VALUES
  ${rowSql([literal(jobKey), '1', "'rule_research'", literal(subjectRow.subject_text), json(subjectRow.method_binding), json(current),
    String(operations.length), '0', 'NULL', 'NULL'])};
INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,
  audit_reference,new_cycle_job_id,authority,recorded_at) VALUES
  ${operations.map(value => rowSql([literal(value.operation_id), literal(value.job_key), literal(value.action), literal(value.command_key),
    literal(value.command_text), literal(value.envelope_text), literal(value.audit_reference),
    value.new_cycle_job_id === null ? 'NULL' : literal(value.new_cycle_job_id), json(value.authority),
    literal(value.recorded_at) + '::timestamptz'])).join(',\n  ')};
SELECT official_v3_jobs_private.assert_history_v1(${literal(jobKey)});
`
  return Object.freeze({ subject: prior.subject, subjectRow, jobKey, current, operations: Object.freeze(operations), seedSql,
    oldestAt: operations[0].recorded_at, newestAt: operations.at(-1)!.recorded_at,
    historyDigest: hash(m04Canonical({ subjectRow, operations })) })
}
