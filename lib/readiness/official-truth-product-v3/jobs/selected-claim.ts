// Private selection for one retained CH→DE request. Metadata never replaces M04 custody.
import 'server-only'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { readNow, same } from '../monitor/internal'
import type { V3ManagedJobRecord } from '../monitor/queue'
import { readM04Command, type M04Claim, type M04FixedOperation, type M04NativeReply } from './contract'

type Root = Readonly<{ operationId: string; leaseId: string }>
type Cycle = Readonly<{ operationId: string; jobId: string }>
type Selection = Readonly<{ status: 'selected'; claim: M04Claim; cycle: Cycle; generation: number;
  attemptLimit: number; method: Readonly<{ methodId: string; revision: number }>;
  predecessor: V3ManagedJobRecord | null; acquiredRevision: number }>
type Outcome = Selection | Readonly<{ status: 'unconfirmed' }> | Readonly<{ status: 'exhausted'; job: V3ManagedJobRecord }>

/** Keep the already deployed enqueue/job bytes exactly unchanged. */
export function chDeRefreshRequestIdentity(root: Root): Cycle | null {
  if (!/^op3_[a-f0-9]{32}$/.test(root.operationId) || !/^lease3_[a-f0-9]{32}$/.test(root.leaseId)) return null
  const input = root.operationId + '\n' + root.leaseId
  const digest = (kind: string) => createHash('sha256').update('jetnity.ch-de-refresh.' + kind + '.v1\n' + input).digest('hex').slice(0, 32)
  return Object.freeze({ operationId: 'op3_' + digest('enqueue'), jobId: 'job3_' + digest('job') })
}

/** Generation zero is the original claim. Four acquisitions, then only the
 * ordinary terminal claim, fit the selected program's unchanged attempt limit. */
export function retainedChDeClaim(root: M04Claim, generation: number): M04Claim | null {
  if (!Number.isSafeInteger(generation) || generation < 0 || generation > 4
    || root.leaseMilliseconds !== 30000 || !readM04Command({ action: 'claim', input: root })) return null
  if (generation === 0) return Object.freeze({ ...root })
  const input = [root.operationId, root.leaseId, root.jobKey, String(generation)].join('\n')
  const digest = (kind: string) => createHash('sha256').update('jetnity.ch-de-claim-continuation.' + kind + '.v1\n' + input).digest('hex').slice(0, 32)
  return Object.freeze({ ...root, operationId: 'op3_' + digest('operation'), leaseId: 'lease3_' + digest('lease') })
}

function inCycle(job: V3ManagedJobRecord, selected: Pick<Selection, 'claim' | 'cycle' | 'attemptLimit' | 'method'>): boolean {
  return job.kind === 'research_job_record' && job.jobKey === selected.claim.jobKey
    && job.jobId === selected.cycle.jobId && job.operationId === selected.cycle.operationId
    && job.attemptLimit === selected.attemptLimit && same(job.method, selected.method)
}
function acquisition(job: V3ManagedJobRecord, selected: Selection): boolean {
  return inCycle(job, selected) && selected.generation < selected.attemptLimit && job.state === 'leased'
    && job.attempt === selected.generation + 1 && job.revision === selected.acquiredRevision
    && job.lease?.leaseId === selected.claim.leaseId && job.lease.generation === selected.acquiredRevision
}

/** Only existing, fully validated fixed reads select a claim. No queue mutation,
 * new START, clock extension, or inference from a missing HTTP response occurs here. */
export async function selectRetainedChDeClaim(options: Readonly<{
  root: M04Claim; attemptLimit: number; method: Selection['method']; fixed: M04FixedOperation;
  now: () => string; deadline: number; signal: AbortSignal;
}>): Promise<Outcome> {
  const { root, fixed, signal, attemptLimit, method } = options
  const cycle = chDeRefreshRequestIdentity(root), initial = retainedChDeClaim(root, 0)
  const unknown: Outcome = { status: 'unconfirmed' }
  if (!cycle || !initial || !Number.isSafeInteger(attemptLimit) || attemptLimit < 1 || attemptLimit > 4) return unknown
  const base = { cycle, attemptLimit, method }
  const stopped = () => signal.aborted || !Number.isFinite(options.deadline) || performance.now() >= options.deadline
  const selected = (claim: M04Claim, generation: number, acquiredRevision: number,
    predecessor: V3ManagedJobRecord | null): Selection => Object.freeze({ status: 'selected', claim, generation,
      ...base, acquiredRevision, predecessor: predecessor === null ? null : JSON.parse(JSON.stringify(predecessor)) })
  async function read(request: Parameters<M04FixedOperation>[0]): Promise<M04NativeReply> {
    if (stopped()) return { status: 'unconfirmed' }
    const reply = await fixed(request, signal)
    return stopped() ? { status: 'unconfirmed' } : reply
  }
  function retained(reply: M04NativeReply, claim: M04Claim, generation: number): Selection | null {
    if ((reply.status !== 'prepared' && reply.status !== 'completed') || !reply.claim || !reply.leasedJob
      || !same(reply.claim, claim)) return null
    const candidate = selected(claim, generation, reply.leasedJob.revision, null)
    return acquisition(reply.leasedJob, candidate)
      && (reply.status !== 'completed' || inCycle(reply.job, candidate)) ? candidate : null
  }
  function originalAcquisition(job: V3ManagedJobRecord): Selection | null {
    const candidate: Selection = Object.freeze({ ...selected(root, job.attempt - 1, job.revision, null),
      cycle: Object.freeze({ jobId: job.jobId, operationId: job.operationId }) })
    return job.attempt >= 1 && job.attempt <= attemptLimit && acquisition(job, candidate) ? candidate : null
  }
  function originalRetained(reply: M04NativeReply): Selection | null {
    if ((reply.status !== 'prepared' && reply.status !== 'completed') || !reply.claim || !reply.leasedJob
      || !same(reply.claim, root)) return null
    // Earlier saved UI requests preceded deterministic refresh enqueue IDs. A
    // real exact original result can still be resumed, but grants no new claim.
    const candidate = originalAcquisition(reply.leasedJob)
    return candidate && (reply.status !== 'completed' || inCycle(reply.job, candidate)) ? candidate : null
  }
  try {
    const original = await read({ operation: 'execution_read', body: { claim: initial, purpose: 'resume' } })
    const originalResult = originalRetained(original)
    if (originalResult) return originalResult
    if (original.status !== 'absent' && original.status !== 'blocked') return unknown
    const current = await read({ operation: 'queue_read', body: { jobKey: root.jobKey, continuation: null } })
    if (current.status === 'blocked') {
      // An open START hides ordinary queue reads. Search only the finite original
      // claim family for a real retained result; blocked/absent is never permission.
      for (let generation = attemptLimit - 1; generation >= 0; generation--) {
        const claim = retainedChDeClaim(root, generation)!
        const reply = await read({ operation: 'execution_read', body: { claim, purpose: 'resume' } })
        const found = generation === 0 ? originalRetained(reply) : retained(reply, claim, generation)
        if (found) return found
        if (reply.status !== 'blocked' && reply.status !== 'absent') return unknown
      }
      return unknown
    }
    if (current.status !== 'present') return unknown
    const job = current.record, now = readNow(options.now)
    if (!now || job.updatedAt > now) return unknown
    if (!inCycle(job, { claim: root, ...base })) {
      // A legacy UNSTARTED claim may only replay its genuine still-valid original
      // acquisition. No negative lookup or unrelated current job creates custody.
      if (original.status !== 'absent' || job.state !== 'leased' || !job.lease || job.lease.expiresAt <= now) return unknown
      const command = readM04Command({ action: 'claim', input: root })!
      const reply = await read({ operation: 'queue_confirm', body: { command: command.value, continuation: null } })
      if (reply.status !== 'committed' || reply.operationId !== root.operationId || reply.commandKey !== command.commandKey
        || reply.commandText !== command.commandText || !same(reply.record, job)) return unknown
      const checkedAt = readNow(options.now)
      return checkedAt && job.lease.expiresAt > checkedAt ? originalAcquisition(job) ?? unknown : unknown
    }
    if (job.state === 'exhausted') return { status: 'exhausted', job }
    if (job.state === 'queued' && job.attempt === 0) return selected(initial, 0, job.revision + 1, job)
    if (job.state === 'succeeded' && job.attempt >= 1 && job.attempt <= attemptLimit && job.predecessorRevision !== null) {
      const generation = job.attempt - 1, claim = retainedChDeClaim(root, generation)!
      const reply = await read({ operation: 'execution_read', body: { claim, purpose: 'resume' } })
      const found = retained(reply, claim, generation)
      return found && reply.status === 'completed' && same(reply.job, job) ? found : unknown
    }
    if (job.state !== 'leased' || !job.lease || job.attempt < 1 || job.attempt > attemptLimit) return unknown
    const generation = job.attempt - 1, claim = retainedChDeClaim(root, generation)!
    const held = selected(claim, generation, job.revision, null)
    if (!acquisition(job, held)) return unknown
    if (job.lease.expiresAt > now) return held
    const execution = await read({ operation: 'execution_read', body: { claim, purpose: 'resume' } })
    const found = retained(execution, claim, generation)
    if (found) return found
    if (execution.status !== 'absent') return unknown
    const command = readM04Command({ action: 'claim', input: claim })!
    const confirmation = await read({ operation: 'queue_confirm', body: { command: command.value, continuation: null } })
    if (confirmation.status !== 'committed' || confirmation.operationId !== claim.operationId
      || confirmation.commandKey !== command.commandKey || confirmation.commandText !== command.commandText
      || !same(confirmation.record, job)) return unknown
    const checkedAt = readNow(options.now)
    if (!checkedAt || job.lease.expiresAt > checkedAt || stopped()) return unknown
    // The following existing CAS must compare this exact predecessor. SQL's
    // open-attempt gate closes a racing START; a later cycle cannot be adopted.
    return selected(retainedChDeClaim(root, generation + 1)!, generation + 1, job.revision + 1, job)
  } catch { return unknown }
}

/** Additional private binding around the unchanged fixed API. It cannot grant
 * authority: every accepted call still traverses MA1, native decoding and SQL CAS. */
export function guardRetainedChDeClaim(selected: Selection, fixed: M04FixedOperation): M04FixedOperation {
  function fenceMatches(value: unknown): boolean {
    return same(value, { jobId: selected.cycle.jobId, revision: selected.acquiredRevision,
      leaseId: selected.claim.leaseId, generation: selected.acquiredRevision })
  }
  function recordMatches(job: V3ManagedJobRecord): boolean {
    if (!inCycle(job, selected)) return false
    if (selected.predecessor && same(job, selected.predecessor)) return true
    if (acquisition(job, selected)) return true
    if (selected.generation === selected.attemptLimit) return job.state === 'exhausted'
      && job.attempt === selected.attemptLimit && job.revision === selected.acquiredRevision
      && job.predecessorRevision === selected.predecessor?.revision
    return ['succeeded', 'backoff', 'exhausted'].includes(job.state)
      && job.attempt === selected.generation + 1 && job.revision === selected.acquiredRevision + 1
      && job.predecessorRevision === selected.acquiredRevision
  }
  return async (request, signal, receipt, terminal) => {
    if (signal.aborted) return { status: 'unconfirmed' }
    if (request.operation === 'queue_read') {
      if (request.body.jobKey !== selected.claim.jobKey
        || (request.body.continuation && !same(request.body.continuation.claim, selected.claim))) return { status: 'blocked' }
    } else if (request.operation === 'queue_confirm' || request.operation === 'queue_cas') {
      const command = readM04Command(request.body.command)
      if (!command || command.kind !== 'rule_research' || command.jobKey !== selected.claim.jobKey
        || command.action === 'enqueue') return { status: 'blocked' }
      if (command.action === 'claim' ? !same(command.value.input, selected.claim)
        : !fenceMatches((command.value.input as Record<string, unknown>).fence)) return { status: 'blocked' }
      if (request.operation === 'queue_confirm') {
        if (request.body.continuation && !same(request.body.continuation.claim, selected.claim)) return { status: 'blocked' }
      } else {
        const commit = request.body.commit
        if (!commit.expected || !inCycle(commit.expected, selected) || !recordMatches(commit.next)) return { status: 'blocked' }
        if (command.action === 'claim') {
          if (!selected.predecessor || !same(commit.expected, selected.predecessor)
            || (selected.generation === selected.attemptLimit ? commit.next.state !== 'exhausted' : !acquisition(commit.next, selected))) return { status: 'blocked' }
        } else if (!acquisition(commit.expected, selected)) return { status: 'blocked' }
      }
    } else {
      if (!same(request.body.claim, selected.claim)) return { status: 'blocked' }
      if (request.operation === 'execution_start' && !acquisition(request.body.leasedJob, selected)) return { status: 'blocked' }
      if (request.operation === 'execution_prepare' && (request.body.result.jobId !== selected.cycle.jobId
        || request.body.result.operationId !== selected.cycle.operationId || request.body.result.jobKey !== selected.claim.jobKey)) return { status: 'blocked' }
    }
    const reply = await fixed(request, signal, receipt, terminal)
    if ((reply.status === 'present' || reply.status === 'committed') && !recordMatches(reply.record)) return { status: 'blocked' }
    if (reply.status === 'reserved' || reply.status === 'prepared' || reply.status === 'completed') {
      if (reply.claim && !same(reply.claim, selected.claim)) return { status: 'blocked' }
      if (reply.leasedJob && !acquisition(reply.leasedJob, selected)) return { status: 'blocked' }
      if (reply.status === 'completed' && !recordMatches(reply.job)) return { status: 'blocked' }
    }
    return reply
  }
}
