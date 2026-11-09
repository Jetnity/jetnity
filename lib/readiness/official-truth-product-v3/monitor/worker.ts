import 'server-only'
import { z } from 'zod'
import { type V3MethodAuthorityPort, type V3MethodRef } from '../contract'
import { type V3QueueCoordinator, type V3ManagedJobRecord, type V3JobFence } from './queue'
import { invocationBudget, readData, readNow, key, timestamp, decisionRef, discoveryRef, same } from './internal'

const resultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('rule_research'), jobId: z.string(), operationId: z.string(), jobKey: z.string(),
    preparedAt: timestamp, decisionRef }).strict(),
  z.object({ kind: z.literal('combination_discovery'), jobId: z.string(), operationId: z.string(), jobKey: z.string(),
    preparedAt: timestamp, discoveryRef, proposalDigests: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(16)
      .refine((items) => new Set(items).size === items.length) }).strict(),
])
export type V3WorkerResultRecord = z.infer<typeof resultSchema>
export interface V3ResearchWorkPort<Receipt extends object> {
  /** Must bind result custody to jobId, stable operationId and this exact lease.
   * Discovery receives only its neutral identity; no inferred rule context.
   * Work may be attempted again only after authoritative not_attempted. */
  execute(job: V3ManagedJobRecord, fence: V3JobFence, signal: AbortSignal): Promise<
    { status: 'prepared'; receipt: Receipt } | { status: 'failed'; reason: 'unreachable' | 'invalid_proposal' }
    | { status: 'unconfirmed' | 'unavailable' }>
}
export interface V3ResearchResultCustodyPort<Receipt extends object> {
  lookup(job: V3ManagedJobRecord, signal: AbortSignal): Promise<
    { status: 'prepared'; receipt: Receipt } | { status: 'not_attempted' | 'unconfirmed' | 'unavailable' }>
  /** Confirms actual stored untrusted proposals/decision custody, never acceptance. */
  confirm(receipt: Receipt, job: V3ManagedJobRecord, checkedAt: string, signal: AbortSignal): Promise<
    { status: 'confirmed'; record: unknown } | { status: 'unconfirmed' | 'unavailable' }>
}
export type V3WorkerOutcome =
  | { status: 'completed'; job: V3ManagedJobRecord; result: V3WorkerResultRecord; acceptedRule: false }
  | { status: 'backoff' | 'exhausted'; job: V3ManagedJobRecord }
  | { status: 'unavailable' | 'unconfirmed' | 'not_due' | 'superseded' | 'invalid' }
export type V3WorkerDependencies<Receipt extends object> = Readonly<{
  queue: V3QueueCoordinator | null; work: V3ResearchWorkPort<Receipt> | null;
  results: V3ResearchResultCustodyPort<Receipt> | null; methodAuthority: V3MethodAuthorityPort<object> | null;
  now: () => string; invocationMilliseconds: number;
}>

function methodOf(job: V3ManagedJobRecord): V3MethodRef {
  return job.kind === 'research_job_record' ? job.method : job.identity.method
}
function keyOf(job: V3ManagedJobRecord): string {
  return job.kind === 'research_job_record' ? job.jobKey : job.identity.jobKey
}
function op(kind: string, job: V3ManagedJobRecord, fence: V3JobFence): string {
  return `op3_${key('worker-command', { kind, jobId: job.jobId, fence }).split(':').at(-1)!.slice(0, 32)}`
}

/** One bounded call; no cron, loop scheduler, transport or production composition. */
export async function runV3ResearchWorkerOnce<Receipt extends object>(
  claim: unknown, dependencies: V3WorkerDependencies<Receipt>, signal?: AbortSignal,
): Promise<V3WorkerOutcome> {
  const { queue, work, results, methodAuthority } = dependencies
  if (!queue || !work || !results || !methodAuthority || !Number.isInteger(dependencies.invocationMilliseconds)
    || dependencies.invocationMilliseconds < 1 || dependencies.invocationMilliseconds > 30_000) return { status: 'unavailable' }
  const budget = invocationBudget(dependencies.invocationMilliseconds, signal)
  try {
    const claimed = await budget.call((s) => queue.claim(claim, s))
    if (!claimed.ok) return { status: 'unconfirmed' }
    if (claimed.value.status !== 'confirmed') {
      const status = claimed.value.status
      return { status: status === 'collision' || status === 'contended' ? 'unavailable' : status }
    }
    const job = claimed.value.record
    if (job.state === 'exhausted') return { status: 'exhausted', job }
    if (job.state !== 'leased' || job.lease === null) return { status: 'not_due' }
    const fence: V3JobFence = { jobId: job.jobId, revision: job.revision, leaseId: job.lease.leaseId, generation: job.lease.generation }
    const method = methodOf(job), now = readNow(dependencies.now)
    if (!now || job.lease.expiresAt <= now) return { status: 'superseded' }
    const approval = await budget.call(() => methodAuthority.resolveCurrent(method, now))
    if (!approval.ok || approval.value.status !== 'approved') return { status: 'unavailable' }
    const methodReceipt = approval.value.receipt

    async function fail(reason: 'unreachable' | 'invalid_proposal' | 'verification_unavailable' | 'commit_unconfirmed'): Promise<V3WorkerOutcome> {
      const outcome = await budget.call((s) => queue!.fail({ operationId: op(`fail-${reason}`, job, fence), jobKey: keyOf(job), fence, reason }, s))
      if (!outcome.ok) return { status: 'unconfirmed' }
      if (outcome.value.status !== 'confirmed') return { status: outcome.value.status === 'superseded' ? 'superseded' : 'unconfirmed' }
      if (outcome.value.record.state !== 'backoff' && outcome.value.record.state !== 'exhausted') return { status: 'unconfirmed' }
      return { status: outcome.value.record.state, job: outcome.value.record }
    }

    const retained = await budget.call((s) => results.lookup(job, s))
    if (!retained.ok) return await fail('commit_unconfirmed')
    if (retained.value.status === 'unconfirmed') return await fail('commit_unconfirmed')
    if (retained.value.status === 'unavailable') return await fail('verification_unavailable')
    let receipt: Receipt
    if (retained.value.status === 'prepared') receipt = retained.value.receipt
    else {
      const current = await budget.call((s) => queue.read(keyOf(job), s))
      if (!current.ok || current.value.status !== 'confirmed' || !same(current.value.record, job)) return { status: 'superseded' }
      const at = readNow(dependencies.now)
      if (!at || job.lease.expiresAt <= at) return { status: 'superseded' }
      const valid = await budget.call(() => methodAuthority.reproveAtCommit(methodReceipt, method, at))
      if (!valid.ok || valid.value.status !== 'current') return await fail('verification_unavailable')
      const produced = await budget.call((s) => work.execute(job, fence, s))
      if (!produced.ok) return await fail('commit_unconfirmed')
      if (produced.value.status === 'failed') return await fail(produced.value.reason)
      if (produced.value.status !== 'prepared') return await fail(produced.value.status === 'unconfirmed' ? 'commit_unconfirmed' : 'verification_unavailable')
      receipt = produced.value.receipt
    }
    const checkedAt = readNow(dependencies.now)
    if (!checkedAt || job.lease.expiresAt <= checkedAt) return { status: 'superseded' }
    const confirmed = await budget.call((s) => results.confirm(receipt, job, checkedAt, s))
    if (!confirmed.ok || confirmed.value.status !== 'confirmed') return await fail('commit_unconfirmed')
    const record = readData(confirmed.value.record, resultSchema)
    const expectedKind = job.kind === 'research_job_record' ? 'rule_research' : 'combination_discovery'
    if (!record || record.kind !== expectedKind || record.jobId !== job.jobId || record.operationId !== job.operationId
      || record.jobKey !== keyOf(job) || record.preparedAt > checkedAt || record.preparedAt < job.createdAt) return await fail('invalid_proposal')
    const commitTime = readNow(dependencies.now)
    if (!commitTime || job.lease.expiresAt <= commitTime) return { status: 'superseded' }
    const stillApproved = await budget.call(() => methodAuthority.reproveAtCommit(methodReceipt, method, commitTime))
    if (!stillApproved.ok || stillApproved.value.status !== 'current') return await fail('verification_unavailable')
    const completion = { operationId: op('complete', job, fence), jobKey: keyOf(job), fence,
      ...(record.kind === 'rule_research' ? { decisionRef: record.decisionRef } : { discoveryRef: record.discoveryRef }) }
    const completed = await budget.call((s) => queue.complete(completion, s))
    if (!completed.ok) return { status: 'unconfirmed' }
    if (completed.value.status !== 'confirmed') return { status: completed.value.status === 'superseded' ? 'superseded' : 'unconfirmed' }
    if (completed.value.record.state !== 'succeeded') return { status: 'unconfirmed' }
    return { status: 'completed', job: completed.value.record, result: record, acceptedRule: false }
  } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
}
