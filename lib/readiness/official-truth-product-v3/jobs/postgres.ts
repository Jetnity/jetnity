// Internal fixed-operation adapters. No connection, arbitrary SQL or method oracle.
import 'server-only'
import { same } from '../monitor/internal'
import { createM04SubjectIdentity,
  type M04Claim, type M04Command, type M04Continuation, type M04Disposition, type M04FixedOperation, type M04NativeReply } from './contract'
import type { V3ManagedJobRecord, V3QueueStoragePort, V3JobFence } from '../monitor/queue'
import type { V3ResearchResultCustodyPort, V3WorkerResultRecord } from '../monitor/worker'
import type { V3ResearchArtifactPort, V3ResearchArtifact } from '../integration/ports'
import type { V3IntakeReference } from '../storage/intake-contract'
import type { V3StoredProposal } from '../storage/quarantine-postgres'
import type { createV3ProposalIntakeStore } from '../storage/intake-server'

type Store = ReturnType<typeof createV3ProposalIntakeStore>
type Prepared = Extract<M04NativeReply, { status: 'prepared' }>
type ReadPrepared = Prepared & { claim: M04Claim; leasedJob: V3ManagedJobRecord }
type Completed = Extract<M04NativeReply, { status: 'completed' }>
type Retained = ReadPrepared | Completed
function jobKey(job: V3ManagedJobRecord) { return job.kind === 'research_job_record' ? job.jobKey : job.identity.jobKey }
function method(job: V3ManagedJobRecord) { return job.kind === 'research_job_record' ? job.method : job.identity.method }
function fence(job: V3ManagedJobRecord): V3JobFence | null {
  return job.state === 'leased' && job.lease ? { jobId: job.jobId, revision: job.revision,
    leaseId: job.lease.leaseId, generation: job.lease.generation } : null
}
function subject(job: V3ManagedJobRecord) {
  return job.kind === 'research_job_record' ? createM04SubjectIdentity('rule_research', { context: job.context,
    method: job.method, factKind: job.research.factKind, researchReason: job.research.researchReason })
    : createM04SubjectIdentity('combination_discovery', { destinationCountryCode: job.identity.destinationCountryCode,
      citizenshipCountryCode: job.identity.citizenshipCountryCode, method: job.identity.method })
}

export function createM04QueueStorage(options: Readonly<{
  fixed: M04FixedOperation; commandFor: (operationId: string, commandKey: string) => M04Command | null;
  continuation: () => M04Continuation; disposition: (command: M04Command) => M04Disposition | null;
  onRecord: (job: V3ManagedJobRecord) => void; settled: () => void;
}>): V3QueueStoragePort {
  return Object.freeze<V3QueueStoragePort>({
    async read(keyValue, signal) {
      const reply = await options.fixed({ operation: 'queue_read', body: { jobKey: keyValue, continuation: options.continuation() } }, signal)
      if (reply.status === 'absent') return { status: 'ok' as const, record: null }
      if (reply.status !== 'present' || jobKey(reply.record) !== keyValue) return { status: 'unavailable' as const }
      options.onRecord(reply.record)
      return { status: 'ok' as const, record: reply.record }
    },
    async confirm(operationId, commandKey, signal) {
      const command = options.commandFor(operationId, commandKey)
      if (!command) return { status: 'unconfirmed' as const }
      const reply = await options.fixed({ operation: 'queue_confirm', body: { command: command.value, continuation: options.continuation() } }, signal, undefined, true)
      if (reply.status === 'not_attempted' || reply.status === 'collision') return { status: reply.status }
      if (reply.status !== 'committed' || reply.commandText !== command.commandText || reply.commandKey !== commandKey
        || reply.operationId !== operationId || jobKey(reply.record) !== command.jobKey) return { status: 'unconfirmed' as const }
      // This is reconciliation only. It cannot mint a start token or retry an effect.
      return { status: 'committed' as const, operationId, commandKey, record: reply.record }
    },
    async compareAndSwap(commit, authority, signal) {
      const command = options.commandFor(commit.operationId, commit.commandKey), identity = subject(commit.next)
      if (!command || !identity || identity.jobKey !== command.jobKey || commit.jobKey !== command.jobKey
        || !same(authority.method, method(commit.next))) return { status: 'unconfirmed' as const }
      const disposition = options.disposition(command)
      if (!disposition) return { status: 'unconfirmed' as const }
      const reply = await options.fixed({ operation: 'queue_cas', body: { command: command.value, commit,
        subjectText: identity.subjectText, disposition } }, signal, authority.receipt, command.action === 'complete' || command.action === 'fail')
      if (reply.status === 'mismatch' || reply.status === 'collision') return { status: reply.status }
      if (reply.status !== 'committed' || !same(reply.record, commit.next)) return { status: 'unconfirmed' as const }
      // fixed() returned only after terminal COMMIT ACK, cleanup, decode and expiry checks.
      // Clear unresolved-only continuation BEFORE unchanged confirmed()->storage.read().
      if (command.action === 'complete' || command.action === 'fail') options.settled()
      options.onRecord(reply.record)
      return { status: 'committed' as const, operationId: command.operationId, commandKey: command.commandKey, record: reply.record }
    },
  })
}

export function createM04ExecutionIndex(options: Readonly<{
  claim: M04Claim; fixed: M04FixedOperation; processingFixed: M04FixedOperation;
  onPrepared: (value: ReadPrepared) => void; preparedOnly: () => boolean;
}>) {
  const receipts = new WeakMap<object, ReadPrepared>()
  function remember(value: ReadPrepared) {
    const receipt = Object.freeze({}); receipts.set(receipt, value); options.onPrepared(value)
    return receipt
  }
  async function read(purpose: 'resume' | 'lookup' | 'confirm' | 'artifact', signal: AbortSignal) {
    return options.fixed({ operation: 'execution_read', body: { claim: options.claim, purpose } }, signal)
  }
  function bound(raw: M04NativeReply): raw is ReadPrepared | Completed {
    return (raw.status === 'prepared' || raw.status === 'completed') && !!raw.claim && !!raw.leasedJob
      && same(raw.claim, options.claim) && jobKey(raw.leasedJob) === options.claim.jobKey
  }
  const results: V3ResearchResultCustodyPort<object> = Object.freeze<V3ResearchResultCustodyPort<object>>({
    async lookup(job, signal) {
      const value = await read('lookup', signal)
      if (value.status === 'absent' && !options.preparedOnly()) return { status: 'not_attempted' as const }
      if (!bound(value) || value.status !== 'prepared' || !same(value.leasedJob, job)) return { status: 'unconfirmed' as const }
      return { status: 'prepared' as const, receipt: remember(value) }
    },
    async confirm(receipt, job, checkedAt, signal) {
      const held = receipts.get(receipt)
      if (!held || !same(held.leasedJob, job)) return { status: 'unconfirmed' as const }
      const value = await read('confirm', signal)
      if (!bound(value) || value.status !== 'prepared' || !same(value, held) || value.result.preparedAt > checkedAt) return { status: 'unconfirmed' as const }
      return { status: 'confirmed' as const, record: value.result }
    },
  })
  return Object.freeze({ results, read, bound,
    async reserve(job: V3ManagedJobRecord, signal: AbortSignal) {
      if (options.preparedOnly()) return { status: 'blocked' as const }
      const identity = subject(job)
      if (!identity) return { status: 'blocked' as const }
      const value = await options.processingFixed({ operation: 'execution_start', body: { claim: options.claim,
        leasedJob: job, subjectText: identity.subjectText } }, signal)
      return value.status === 'reserved' && same(value.claim, options.claim) && same(value.leasedJob, job) ? value : { status: 'blocked' as const }
    },
    async prepare(job: V3ManagedJobRecord, attemptKey: string, token: string, result: V3WorkerResultRecord,
      references: readonly V3IntakeReference[], signal: AbortSignal) {
      const value = await options.processingFixed({ operation: 'execution_prepare', body: { claim: options.claim,
        attemptKey, token, result, references } }, signal, undefined, true)
      if (value.status !== 'prepared' || value.attemptKey !== attemptKey || !same(value.result, result)
        || !same(value.references, references)) return null
      return remember({ ...value, claim: options.claim, leasedJob: job })
    },
  })
}

export function createM04ArtifactCustody(options: Readonly<{
  claim: M04Claim; index: ReturnType<typeof createM04ExecutionIndex>; store: Store;
  onPreparedOnly: (value: ReadPrepared) => void; onCompleted: (value: Completed) => void;
  retain: (bytes: number) => boolean;
}>): V3ResearchArtifactPort {
  const receipts = new WeakMap<object, { artifact: V3ResearchArtifact; value: Completed }>()
  async function originals(value: Retained, signal: AbortSignal): Promise<readonly V3StoredProposal[] | null> {
    const out: V3StoredProposal[] = []
    for (const reference of value.references) {
      const opened = await options.store.open(reference, signal)
      if (opened.status !== 'recorded' || signal.aborted || !options.retain(opened.record.reference.bytes)) return null
      const p = opened.record.upload.proposal, j = value.leasedJob, raw = JSON.parse(opened.record.text) as Record<string, unknown>
      if (!same(raw.context, p.context) || !same(raw.research, p.research)
        || p.jobId !== j.jobId || !same(reference.binding.method, method(j))) return null
      if (j.kind === 'research_job_record') {
        if (!same(p.context, j.context) || p.contextKey !== j.contextKey || !same(p.research, j.research)
          || !opened.record.completion || value.result.kind !== 'rule_research') return null
        const outcome = opened.record.completion.outcome
        const decision = outcome.status === 'prepared' ? outcome.value.decision : outcome.status === 'escalation' ? outcome.decision : null
        if (!decision || decision.reference !== value.result.decisionRef) return null
      } else if (p.context.scope.destinationCountryCode !== j.identity.destinationCountryCode
        || p.context.scope.citizenship.countryCodes[0] !== j.identity.citizenshipCountryCode) return null
      out.push(opened.record)
    }
    return out
  }
  return Object.freeze<V3ResearchArtifactPort>({
    async resume(claim, signal) {
      if (!same(claim, options.claim)) return { status: 'unconfirmed' as const }
      const value = await options.index.read('resume', signal)
      if (value.status === 'absent') return { status: 'not_attempted' as const }
      if (!options.index.bound(value)) return { status: 'unconfirmed' as const }
      if (value.status === 'prepared') { options.onPreparedOnly(value); return { status: 'not_attempted' as const } }
      options.onCompleted(value)
      return { status: 'completed' as const, worker: { status: 'completed' as const, job: value.job, result: value.result, acceptedRule: false as const } }
    },
    async open(job, result, signal) {
      const value = await options.index.read('artifact', signal)
      if (!options.index.bound(value) || value.status !== 'completed' || !same(value.job, job) || !same(value.result, result)) return { status: 'unconfirmed' as const }
      const loaded = await originals(value, signal), f = fence(value.leasedJob)
      if (!loaded || !f) return { status: 'unconfirmed' as const }
      const artifact: V3ResearchArtifact = Object.freeze({ jobId: job.jobId, jobOperationId: job.operationId,
        jobKey: jobKey(job), resultRef: result.kind === 'rule_research' ? result.decisionRef : result.discoveryRef,
        fence: f, method: method(job), uploads: Object.freeze(loaded.map(x => x.text)) })
      const receipt = Object.freeze({}); receipts.set(receipt, { artifact, value }); options.onCompleted(value)
      return { status: 'available' as const, receipt, artifact }
    },
    async reprove(receipt, artifact, job, clock, signal) {
      const held = receipts.get(receipt)
      if (!held || !same(held.artifact, artifact) || !same(held.value.job, job)) return false
      const value = await options.index.read('artifact', signal)
      return options.index.bound(value) && value.status === 'completed' && same(value, held.value)
        && value.result.preparedAt <= clock.now && !signal.aborted
      // execution_read consumes EVERY actual S1 original/outcome under final MA1.
      // Held original strings are immutable custody, not cached source authority.
      // Reopening all 16 originals again at each E1 loop would be quadratic.
    },
  })
}
