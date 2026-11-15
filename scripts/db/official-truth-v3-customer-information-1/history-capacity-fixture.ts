// Owned-local capacity horizon only. Preserve the complete existing 86/447
// journal, including 187 deduplicated operations and outstanding claim87,
// then construct 540 further starts through the original queue coordinator.
// These fictional historical records are not source, API or cron evidence.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3QueueCoordinator, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { readM04Command, type M04Claim } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import type { HistoricalQuotaOperation, HistoricalQuotaStart,
  HistoricalQuotaDisposition } from '../official-truth-v3-rolling-jobs-quota-1/history-fixture'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { buildHistoryMemoFixture } from './history-fixture'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const id = (kind: string, value: string) => kind + '_' + hash('customer-history-local:' + value).slice(0, 32)
const binding = program.binding
const instant = (value: number) => new Date(value).toISOString()
const cycleMilliseconds = 40 * 60000
const cooldownMilliseconds = 24 * 3600000

export async function buildCapacityFixture626() {
  // One historical anchor for the complete old fixture. Never shift or
  // regenerate individual journal rows after their bytes were constructed.
  // The final queued job remains about an hour before the real test clock.
  const observedAt = Date.now()
  const asOf = observedAt - cooldownMilliseconds - 539 * cycleMilliseconds
  const history = await buildHistoryMemoFixture(asOf)
  const original = history.original
  const prefixSql = history.queueSql + history.claimSql
  const prefixCutoff = history.terminalClaimRow.recorded_at
  const prefixCounts = { operations: 447, starts: 86, dispositions: 86 } as const
  assert.equal(history.retainedOperations, prefixCounts.operations)
  assert.equal(history.retainedStarts, prefixCounts.starts)
  assert.equal(history.leasedJob.state, 'leased')
  assert.equal(history.leasedJob.revision, 260)
  assert.deepEqual(JSON.parse(history.terminalClaimRow.envelope_text).next, history.leasedJob)
  assert.deepEqual(JSON.parse(history.terminalClaimRow.command_text).input, history.terminalClaim)
  const originalLeasedBytes = hrs1Canonical(history.leasedJob)
  const originalClaimBytes = hrs1Canonical(history.terminalClaim)
  // Only the fixed method tuple is part of authority, not the source binding.
  const method = original.subjectRow.method_binding
  const exactAuthority = { ...method, epoch: 1 as const }
  const work = { context: binding.context, method: { methodId: binding.methodId, revision: binding.revision },
    factKind: 'requirement_effect' as const, researchReason: { status: 'missing' as const } }
  let current: V3ResearchJobRecord = history.leasedJob
  let clock = Date.parse(history.afterClaimAt)
  assert.ok(Number.isSafeInteger(clock) && clock > Date.parse(prefixCutoff))
  const operations: HistoricalQuotaOperation[] = [], starts: HistoricalQuotaStart[] = [], dispositions: HistoricalQuotaDisposition[] = []
  const prospective = async (raw: unknown) => {
    const command = readM04Command(raw); assert.ok(command)
    let commit: V3QueueCommit | undefined
    const storage: V3QueueStoragePort = { async read() { return { status: 'ok', record: current } },
      async confirm() { return { status: 'not_attempted' } }, async compareAndSwap(value) { commit = value; return { status: 'unconfirmed' } } }
    const queue = createV3QueueCoordinator({ storage, now: () => instant(clock), invocationMilliseconds: 5000,
      backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000,
      methodAuthority: { async resolveCurrent() { return { status: 'approved', receipt: {} } }, async reproveAtCommit() { return { status: 'current' } } } })
    if (command.action === 'enqueue') await queue.enqueue(command.value.input)
    else if (command.action === 'claim') await queue.claim(command.value.input)
    else if (command.action === 'fail') await queue.fail(command.value.input)
    else assert.fail('no successful source result in diagnostic fixture')
    assert.ok(commit); assert.equal(commit.next.kind, 'research_job_record'); assert.ok(commit.next.kind === 'research_job_record')
    assert.equal(commit.operationId, command.operationId)
    assert.equal(commit.commandKey, command.commandKey)
    const row: HistoricalQuotaOperation = { operation_id: command.operationId, job_key: original.jobKey,
      action: command.action as HistoricalQuotaOperation['action'], command_key: command.commandKey, command_text: command.commandText,
      envelope_text: hrs1Canonical(commit), audit_reference: commit.audit.reference,
      new_cycle_job_id: commit.audit.kind === 'enqueued' ? commit.next.jobId : null, authority: exactAuthority, recorded_at: instant(clock + 1) }
    operations.push(row); current = commit.next
    clock += 1000
    return { command, commit, row }
  }
  const enqueue = (tag: string) => prospective({ action: 'enqueue', kind: 'rule_research', input: {
    ...work, operationId: id('op3', tag + '-enqueue'), jobId: id('job3', tag), attemptLimit: 1 } })
  const settleClaim = async (claim: M04Claim, tag: string) => {
    const leasedJob = current, lease = leasedJob.lease
    assert.ok(lease)
    assert.equal(lease.leaseId, claim.leaseId)
    const reservedAt = clock - 500
    assert.ok(reservedAt > Date.parse(prefixCutoff))
    assert.ok(reservedAt > Date.parse(lease.acquiredAt) && clock < Date.parse(lease.expiresAt))
    const attemptKey = 'execution-attempt:v3:' + hash(hrs1Canonical({ subject: JSON.parse(original.subject.subjectText),
      claim, leasedJob, authority: exactAuthority }))
    starts.push({ attempt_key: attemptKey, job_key: original.jobKey, claim_operation_id: claim.operationId, claim_text: hrs1Canonical(claim),
      leased_job: leasedJob, authority: exactAuthority, token_hash: hash('SYNTHETIC NO-LIVE-TOKEN:' + tag), reserved_at: instant(reservedAt) })
    const failed = await prospective({ action: 'fail', input: { operationId: id('op3', tag + '-fail'), jobKey: original.jobKey,
      fence: { jobId: leasedJob.jobId, revision: leasedJob.revision, leaseId: lease.leaseId, generation: lease.generation }, reason: 'unreachable' } })
    assert.equal(current.state, 'exhausted')
    dispositions.push({ attempt_key: attemptKey, queue_operation_id: failed.command.operationId,
      kind: 'settled_failure', failure_reason: 'unreachable', settled_at: failed.row.recorded_at })
  }
  // Claim87 already consumed operation447 and owns terminal credit. START87
  // retains that exact claim/job pair; fail448 reaches the old 256-operation
  // rolling limit inside the original lease, before the required cooldown.
  await settleClaim(history.terminalClaim, '87')
  assert.equal(current.revision, 261)
  assert.equal(operations.length, 1)
  assert.equal(starts[0].claim_text, originalClaimBytes)
  assert.equal(hrs1Canonical(starts[0].leased_job), originalLeasedBytes)
  // Only historical timestamps advance. No database clock, quota or deadline
  // is overridden. The last recorded operation is already 999ms behind clock.
  clock += cooldownMilliseconds
  assert.ok(clock - Date.parse(operations[0].recorded_at) > cooldownMilliseconds)
  for (let cycle = 88; cycle <= 626; cycle++) {
    const tag = String(cycle)
    await enqueue(tag)
    const claim: M04Claim = { operationId: id('op3', tag + '-claim'), jobKey: original.jobKey,
      leaseId: id('lease3', tag), leaseMilliseconds: 30000 }
    await prospective({ action: 'claim', input: claim })
    await settleClaim(claim, tag)
    clock += cycleMilliseconds - 3000
  }
  await enqueue('627')
  const queued = current
  assert.equal(queued.revision, 1879)
  assert.equal(operations.length, 1619)
  assert.equal(starts.length, 540)
  assert.equal(dispositions.length, 540)
  assert.equal(prefixCounts.operations + operations.length, 2066)
  assert.equal(prefixCounts.starts + starts.length, 626)
  assert.equal(new Set(operations.map(row => row.operation_id)).size, operations.length)
  assert.equal(new Set(starts.map(row => row.attempt_key)).size, starts.length)
  assert.ok(Date.parse(queued.updatedAt) < observedAt - 30 * 60000)
  assert.equal(hrs1Canonical(history.leasedJob), originalLeasedBytes)
  assert.equal(hrs1Canonical(history.terminalClaim), originalClaimBytes)
  const queuedRows = [...operations]
  const bad = await enqueue('capacity-invalid-after-reset')
  const invalidCommit = { ...bad.commit, expected: { ...bad.commit.expected, attemptLimit: 0 } }
  const invalidRow = { ...bad.row, envelope_text: hrs1Canonical(invalidCommit) }
  const append = (table: string, values: readonly object[]) => {
    assert.ok(values.length > 0)
    const columns = Object.keys(values[0]); assert.ok(columns.every(column => /^[a-z_]+$/.test(column)))
    // Retain each journal text as its own SQL literal, as the original fixture
    // does. Wrapping escaped command/envelope strings in one giant JSON literal
    // needlessly makes the existing diagnostic SQL splitter scan quadratically.
    const rows = values.map(value => {
      assert.deepEqual(Object.keys(value), columns)
      return '(' + Object.values(value).map((field: unknown) => {
        if (field === null) return 'NULL'
        if (typeof field === 'object') return json(field)
        assert.equal(typeof field, 'string'); return literal(field as string)
      }).join(',') + ')'
    })
    return 'INSERT INTO official_v3_jobs_private.' + table + '(' + columns.join(',') + ') VALUES ' + rows.join(',\n') + ';'
  }
  const scope = `DO $scope$ BEGIN IF current_user<>'ot_pilot_owner'
    OR current_setting('jetnity.local_quota_fixture',true) IS DISTINCT FROM 'owned-local-pg17-only'
    OR current_setting('server_version_num')::integer/10000<>17 THEN RAISE EXCEPTION 'owned local diagnostic only'; END IF; END $scope$;`
  const queueSql = prefixSql + scope + append('queue_operations_v1', queuedRows) + append('execution_starts_v1', starts)
    + append('execution_dispositions_v1', dispositions)
    + 'DO $continued$ BEGIN UPDATE official_v3_jobs_private.subjects_v1 SET current_job=' + json(queued)
    + ',operation_count=2066,start_count=626,terminal_credit_claim=NULL,open_attempt=NULL'
    + ' WHERE job_key=' + literal(original.jobKey) + ' AND operation_count=447 AND start_count=86 AND open_attempt IS NULL'
    + ' AND terminal_credit_claim=' + literal(history.terminalClaim.operationId)
    + ' AND current_job::text COLLATE "C"=(' + json(history.leasedJob) + ')::text COLLATE "C";'
    + " IF NOT FOUND THEN RAISE EXCEPTION 'unchanged original86/447 prefix required';END IF;END $continued$;"
  assert.ok(queueSql.startsWith(history.queueSql + history.claimSql))
  const invalidSql = scope + append('queue_operations_v1', [invalidRow])
    + 'UPDATE official_v3_jobs_private.subjects_v1 SET operation_count=2067 WHERE job_key=' + literal(original.jobKey) + ' AND operation_count=2066;'
  return { original, prefixSql, prefixCutoff, prefixCounts, queueSql, invalidSql,
    retainedOperations: 2066, retainedStarts: 626, asOf: instant(asOf) }
}
