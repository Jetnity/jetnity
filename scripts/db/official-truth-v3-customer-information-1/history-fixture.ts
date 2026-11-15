// Owned-local diagnostic fixture only. This extends 64 coherent historical
// cycles with explicit fictional records; it is not API/cron/source evidence.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3QueueCoordinator, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { readM04Command } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { buildHistoricalQuotaFixture, type HistoricalQuotaOperation, type HistoricalQuotaStart,
  type HistoricalQuotaDisposition } from '../official-truth-v3-rolling-jobs-quota-1/history-fixture'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const id = (kind: string, value: string) => kind + '_' + hash('customer-history-local:' + value).slice(0, 32)
const binding = program.binding
const instant = (value: number) => new Date(value).toISOString()

export async function buildHistoryMemoFixture() {
  const first = Date.now() - 4 * 86400000
  const original = await buildHistoricalQuotaFixture({ method: binding, context: binding.context, factKind: 'requirement_effect',
    firstAt: new Date(first), cycleSpacingMs: 40 * 60000, cycles: 64 })
  // Only the fixed method tuple is part of authority, not the source binding.
  const method = original.subjectRow.method_binding
  const exactAuthority = { ...method, epoch: 1 as const }
  const work = { context: binding.context, method: { methodId: binding.methodId, revision: binding.revision },
    factKind: 'requirement_effect' as const, researchReason: { status: 'missing' as const } }
  let current = original.subjectRow.current_job as V3ResearchJobRecord
  let clock = Date.now() - 3600000
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
  for (let cycle = 65; cycle <= 86; cycle++) {
    const tag = String(cycle)
    await enqueue(tag)
    const claim = { operationId: id('op3', tag + '-claim'), jobKey: original.jobKey, leaseId: id('lease3', tag), leaseMilliseconds: 30000 }
    await prospective({ action: 'claim', input: claim })
    const leasedJob = current; assert.ok(leasedJob.lease)
    const attemptKey = 'execution-attempt:v3:' + hash(hrs1Canonical({ subject: JSON.parse(original.subject.subjectText),
      claim, leasedJob, authority: exactAuthority }))
    starts.push({ attempt_key: attemptKey, job_key: original.jobKey, claim_operation_id: claim.operationId, claim_text: hrs1Canonical(claim),
      leased_job: leasedJob, authority: exactAuthority, token_hash: hash('SYNTHETIC NO-LIVE-TOKEN:' + tag), reserved_at: instant(clock - 500) })
    const failed = await prospective({ action: 'fail', input: { operationId: id('op3', tag + '-fail'), jobKey: original.jobKey,
      fence: { jobId: leasedJob.jobId, revision: leasedJob.revision, leaseId: claim.leaseId, generation: leasedJob.lease.generation }, reason: 'unreachable' } })
    assert.equal(current.state, 'exhausted')
    dispositions.push({ attempt_key: attemptKey, queue_operation_id: failed.command.operationId,
      kind: 'settled_failure', failure_reason: 'unreachable', settled_at: failed.row.recorded_at })
  }
  await enqueue('87')
  for (let count = 68; count <= 254; count++) await enqueue('dedup-' + count)
  const queued = current
  assert.equal(queued.revision, 259); assert.equal(operations.length, 254)
  const queuedRows = [...operations]
  const bad = await enqueue('invalid-after-reset')
  const invalidCommit = { ...bad.commit, expected: { ...bad.commit.expected, attemptLimit: 0 } }
  const invalidRow = { ...bad.row, envelope_text: hrs1Canonical(invalidCommit) }
  const claim = { operationId: id('op3', '87-claim'), jobKey: original.jobKey, leaseId: id('lease3', '87'), leaseMilliseconds: 30000 }
  const claimed = await prospective({ action: 'claim', input: claim })
  assert.equal(current.revision, 260)
  const append = (table: string, values: readonly object[]) => {
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
  const queueSql = scope + append('queue_operations_v1', queuedRows) + append('execution_starts_v1', starts)
    + append('execution_dispositions_v1', dispositions)
    + 'UPDATE official_v3_jobs_private.subjects_v1 SET current_job=' + json(queued)
    + ',operation_count=446,start_count=86 WHERE job_key=' + literal(original.jobKey) + ' AND operation_count=192 AND start_count=64;'
  const claimSql = scope + append('queue_operations_v1', [claimed.row])
    + 'UPDATE official_v3_jobs_private.subjects_v1 SET current_job=' + json(current)
    + ',operation_count=447,terminal_credit_claim=' + literal(claim.operationId) + ' WHERE job_key=' + literal(original.jobKey) + ' AND operation_count=446;'
  const invalidSql = scope + append('queue_operations_v1', [invalidRow])
    + 'UPDATE official_v3_jobs_private.subjects_v1 SET operation_count=447 WHERE job_key=' + literal(original.jobKey) + ' AND operation_count=446;'
  return { original, queueSql, claimSql, invalidSql, retainedOperations: 447, retainedStarts: 86 }
}
