// Dormant composition. Pure delivery is not authority; actual S1 and MA1 own proof.
import 'server-only'
import { same, key, readNow } from '../monitor/internal'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3ManagedJobRecord, type V3JobFence } from '../monitor/queue'
import { createV3ImportCoordinator, type V3ImportQuarantinePort, type V3ImportEvidencePort, type V3ImportHistoryPort } from '../import/service-server'
import { createV3IntegrationCoordinator } from '../integration/coordinator'
import type { V3IntegrationPorts } from '../integration/ports'
import type { V3WorkerResultRecord, V3ResearchWorkPort } from '../monitor/worker'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { readV3IntakeBinding, type V3IntakeReference } from '../storage/intake-contract'
import { createV3ProposalIntakeStore } from '../storage/intake-server'
import type { V3IntakeSqlExecutor } from '../storage/quarantine-postgres'
import { readM04Command, M04_LIMITS, type M04Config, type M04Facade, type M04FixedOperation,
  type M04Authority, type M04Claim, type M04Continuation, type M04Disposition, type M04Command } from './contract'
import type { createM04InvocationScope } from './owned-scope'
import { createM04QueueStorage, createM04ExecutionIndex, createM04ArtifactCustody } from './postgres'

type Scope = NonNullable<ReturnType<typeof createM04InvocationScope>>
type Group = 'processing' | 'outer'
function own(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype
    || Reflect.ownKeys(value).length !== keys.length) return null
  const copy: Record<string, unknown> = {}
  for (const k of keys) {
    const d = Object.getOwnPropertyDescriptor(value, k)
    if (!d || !('value' in d) || !d.enumerable) return null
    Object.defineProperty(copy, k, { value: d.value, enumerable: true })
  }
  return copy
}
function keyOf(j: V3ManagedJobRecord) { return j.kind === 'research_job_record' ? j.jobKey : j.identity.jobKey }
function methodOf(j: V3ManagedJobRecord) { return j.kind === 'research_job_record' ? j.method : j.identity.method }
function fenceOf(j: V3ManagedJobRecord): V3JobFence | null {
  return j.state === 'leased' && j.lease ? { jobId: j.jobId, revision: j.revision, leaseId: j.lease.leaseId, generation: j.lease.generation } : null
}

export function composeM04Invocation(options: Readonly<{ config: M04Config; scope: Scope;
  authority: M04Authority; processingAuthority: M04Authority; fixed: M04FixedOperation; processingFixed: M04FixedOperation }>): M04Facade {
  const { config, scope } = options
  // Four exact predecessor paths, with closed arity/scalar validation below.
  const statements = [
    'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result',
    'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
    'SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
    'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
  ]
  function executor(group: Group): V3IntakeSqlExecutor {
    return Object.freeze<V3IntakeSqlExecutor>({ async execute(statement, params, signal) {
      const index = statements.indexOf(statement)
      if (index < 0 || !Array.isArray(params) || params.length !== [3, 3, 4, 7][index]
        || params.some(p => typeof p !== 'string' && (typeof p !== 'number' || !Number.isInteger(p) || p < 1 || p > 2_147_483_647))
        || params.some(p => typeof p === 'string' && new TextEncoder().encode(p).byteLength > 524_288)
        || typeof params[0] !== 'string' || (index !== 1 && (typeof params[1] !== 'string' || !/^[a-f0-9]{64}$/.test(params[1])
          || typeof params[2] !== 'number' || params[2] > 65_536))
        || (index === 1 && (typeof params[1] !== 'string' || typeof params[2] !== 'string' || !/^[a-f0-9]{64}$/.test(params[2])))
        || (index === 2 && (typeof params[3] !== 'number' || params[3] > 900_000))
        || (index === 3 && (typeof params[3] !== 'number' || typeof params[4] !== 'string'
          || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(params[4]) || typeof params[5] !== 'string' || typeof params[6] !== 'string'))) return { status: 'unavailable' }
      try { if (!readV3IntakeBinding(JSON.parse(params[0])).ok) return { status: 'unavailable' } } catch { return { status: 'unavailable' } }
      const detached = Object.freeze([...params])
      const reply = await scope.native('intake', group, s => config.intakeExecutor.execute(statement, detached, s), signal)
      if (!reply.ok || reply.value.status === 'unconfirmed' || signal.aborted) { scope.markAmbiguous(); return { status: 'unconfirmed' } }
      return reply.value
    } })
  }
  const store = createV3ProposalIntakeStore({ registry: config.registry, executor: executor('outer'), leaseMilliseconds: 5000 })
  const processingStore = createV3ProposalIntakeStore({ registry: config.registry, executor: executor('processing'), leaseMilliseconds: 5000 })
  function evidence(group: Group): V3ImportEvidencePort<object> {
    return Object.freeze<V3ImportEvidencePort<object>>({
      async inspect(request, signal) {
        const r = await scope.callback(group, s => config.evidence.inspect(request, s), signal)
        return r.ok ? r.value : { status: 'unavailable' }
      },
      async reprove(receipt, request, decision, archive, clock, signal) {
        const r = await scope.callback(group, s => config.evidence.reprove(receipt, request, decision, archive, clock, s), signal)
        return r.ok ? r.value : { status: 'unavailable' }
      },
    })
  }
  function history(group: Group): V3ImportHistoryPort<object> {
    return Object.freeze<V3ImportHistoryPort<object>>({
      async read(contextKey, kind, signal) {
        const r = await scope.callback(group, s => config.history.read(contextKey, kind, s), signal)
        return r.ok ? r.value : { status: 'unavailable' }
      },
      async reprove(receipt, value, signal) {
        const r = await scope.callback(group, s => config.history.reprove(receipt, value, s), signal)
        return r.ok ? r.value : { status: 'unavailable' }
      },
    })
  }
  function queue(storage: ReturnType<typeof createM04QueueStorage>, discovery = false) {
    const values = { storage, methodAuthority: options.authority, now: () => config.clock().now,
      invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 }
    return discovery ? createV3DiscoveryQueueCoordinator(values) : createV3QueueCoordinator(values)
  }
  async function enqueue(kind: 'rule_research' | 'combination_discovery', raw: unknown, signal?: AbortSignal) {
    const command = readM04Command({ action: 'enqueue', kind, input: raw })
    if (!command) return { status: 'invalid' as const }
    const storage = createM04QueueStorage({ fixed: options.fixed,
      commandFor: (op, k) => op === command.operationId && k === command.commandKey ? command : null,
      continuation: () => null, disposition: () => ({ kind: 'regular' }), onRecord() {}, settled() {} })
    return queue(storage, kind === 'combination_discovery').enqueue(command.value.input, signal)
  }
  return Object.freeze<M04Facade>({
    enqueueRule: (raw, signal) => enqueue('rule_research', raw, signal),
    enqueueDiscovery: (raw, signal) => enqueue('combination_discovery', raw, signal),
    async workOnce(rawClaim, signal) {
      const parsedClaim = readM04Command({ action: 'claim', input: rawClaim })
      if (!parsedClaim) return { status: 'invalid' }
      const claimCommand = parsedClaim
      const claim = claimCommand.value.input as M04Claim
      let leasedJob: V3ManagedJobRecord | null = null, continuation: M04Continuation = null, preparedOnly = false
      let preparedResult: V3WorkerResultRecord | null = null, reserved = false
      let failureReason: 'unreachable' | 'invalid_proposal' | 'verification_unavailable' | null = null
      const bindings = new Map<string, V3IntakeReference>() // bounded to this batch, <=16; not a persistence substitute
      const startTickets = new WeakMap<object, { attemptKey: string; token: string }>()
      function bindRefs(refs: readonly V3IntakeReference[]) { for (const ref of refs) bindings.set(ref.binding.operationId, ref) }
      function onPrepared(value: { claim: M04Claim; leasedJob: V3ManagedJobRecord; attemptKey: string;
        result: V3WorkerResultRecord; references: readonly V3IntakeReference[] }) {
        leasedJob = value.leasedJob; preparedResult = value.result; bindRefs(value.references)
        continuation = { kind: 'prepared', claim, attemptKey: value.attemptKey }; scope.markUnresolved()
        scope.sealProcessing(); beginTerminal('complete', value.attemptKey)
      }
      const index = createM04ExecutionIndex({ claim, fixed: options.fixed, processingFixed: options.processingFixed,
        onPrepared, preparedOnly: () => preparedOnly })
      function commandFor(op: string, commandKey: string): M04Command | null {
        if (op === claimCommand.operationId && commandKey === claimCommand.commandKey) return claimCommand
        const job = leasedJob, fence = job && fenceOf(job)
        if (!job || !fence) return null
        function derived(kind: string) { return `op3_${key('worker-command', { kind, jobId: job!.jobId, fence }).split(':').at(-1)!.slice(0, 32)}` }
        const candidates: unknown[] = ['unreachable', 'invalid_proposal', 'verification_unavailable', 'commit_unconfirmed'].map(reason => ({
          action: 'fail', input: { operationId: derived(`fail-${reason}`), jobKey: keyOf(job), fence, reason } }))
        if (preparedResult) candidates.push({ action: 'complete', kind: preparedResult.kind, input: { operationId: derived('complete'), jobKey: keyOf(job), fence,
          ...(preparedResult.kind === 'rule_research' ? { decisionRef: preparedResult.decisionRef } : { discoveryRef: preparedResult.discoveryRef }) } })
        for (const raw of candidates) { const c = readM04Command(raw); if (c && c.operationId === op && c.commandKey === commandKey) return c }
        return null
      }
      function beginTerminal(action: 'complete' | 'fail', attemptKey: string) {
        const job = leasedJob, fence = job && fenceOf(job)
        if (!job || !fence) return false
        const kind = action === 'complete' ? 'complete' : `fail-${failureReason}`
        const operationId = `op3_${key('worker-command', { kind, jobId: job.jobId, fence }).split(':').at(-1)!.slice(0, 32)}`
        const raw = action === 'complete' && preparedResult
          ? { action, kind: preparedResult.kind, input: { operationId, jobKey: keyOf(job), fence,
              ...(preparedResult.kind === 'rule_research' ? { decisionRef: preparedResult.decisionRef } : { discoveryRef: preparedResult.discoveryRef }) } }
          : { action, input: { operationId, jobKey: keyOf(job), fence, reason: failureReason } }
        const command = readM04Command(raw)
        return !!command && scope.beginTerminal({ claim, attemptKey, commandKey: command.commandKey })
      }
      function disposition(c: M04Command): M04Disposition | null {
        if (c.action === 'complete') return continuation?.kind === 'prepared' ? { kind: 'completed', attemptKey: continuation.attemptKey } : null
        if (c.action === 'fail') {
          const input = c.value.input as Record<string, unknown>
          return continuation?.kind === 'owned_failure' && failureReason === input.reason && scope.processingTerminal() && !scope.isAmbiguous()
            ? { kind: 'settled_failure', attemptKey: continuation.attemptKey, token: continuation.token } : null
        }
        if (preparedOnly && c.action !== 'claim') return null
        return reserved ? null : { kind: 'regular' }
      }
      const storage = createM04QueueStorage({ fixed: options.fixed, commandFor, continuation: () => continuation, disposition,
        onRecord(job) { if (job.state === 'leased') leasedJob = job },
        settled() { continuation = null; scope.markSettled() } })
      const artifacts = createM04ArtifactCustody({ claim, index, store, retain: scope.retain,
        onPreparedOnly(value) { preparedOnly = true; onPrepared(value); scope.sealProcessing() },
        onCompleted(value) { leasedJob = value.leasedJob; preparedResult = value.result; bindRefs(value.references); continuation = null; scope.markSettled(); scope.sealProcessing() } })
      const work: V3ResearchWorkPort<object> = Object.freeze<V3ResearchWorkPort<object>>({ async execute(job, fence, childSignal) {
        if (preparedOnly || reserved || !scope.admits('processing') || !same(fenceOf(job), fence)) return { status: 'unconfirmed' }
        scope.markUnresolved()
        const start = await index.reserve(job, childSignal)
        if (start.status !== 'reserved') { scope.markAmbiguous(); scope.sealProcessing(); return { status: 'unconfirmed' } }
        reserved = true; leasedJob = job
        const ticket = Object.freeze({}); startTickets.set(ticket, { attemptKey: start.attemptKey, token: start.token })
        const winner = startTickets.get(ticket)!; startTickets.delete(ticket) // one-use, never reconstruct from a read
        async function knownFailure(reason: 'unreachable' | 'invalid_proposal' | 'verification_unavailable') {
          scope.sealProcessing(); await scope.drainNative()
          if (!scope.processingTerminal() || scope.isAmbiguous() || childSignal.aborted) return { status: 'unconfirmed' as const }
          failureReason = reason; continuation = { kind: 'owned_failure', claim, ...winner }
          if (!beginTerminal('fail', winner.attemptKey)) return { status: 'unconfirmed' as const }
          return reason === 'verification_unavailable' ? { status: 'unavailable' as const } : { status: 'failed' as const, reason }
        }
        const delivery = await scope.callback('processing', s => config.producer.produce({ job, fence }, s), childSignal)
        if (!delivery.ok) { scope.sealProcessing(); return { status: 'unconfirmed' } }
        const failed = own(delivery.value, ['status', 'reason'])
        if (failed?.status === 'failed' && (failed.reason === 'unreachable' || failed.reason === 'invalid_proposal')) return knownFailure(failed.reason)
        const delivered = own(delivery.value, ['status', 'deliveries']), batch = delivered?.deliveries
        if (delivered?.status !== 'delivered' || !Array.isArray(batch) || Object.getPrototypeOf(batch) !== Array.prototype
          || batch.length < 1 || batch.length > M04_LIMITS.deliveries || Reflect.ownKeys(batch).length !== batch.length + 1
          || (job.kind === 'research_job_record' && batch.length !== 1)) return knownFailure('invalid_proposal')
        const admitted: { reference: V3IntakeReference; text: string }[] = [], ids = new Set<string>(), digests = new Set<string>()
        let bytes = 0
        // Whole-batch admission happens before the first S1/I1 effect. Preserve text bytes.
        for (let i = 0; i < batch.length; i++) {
          const d = Object.getOwnPropertyDescriptor(batch, String(i)), item = d && 'value' in d ? own(d.value, ['binding', 'text']) : null
          if (!item || typeof item.text !== 'string') return knownFailure('invalid_proposal')
          const binding = readV3IntakeBinding(item.binding), upload = readV3RetainableProposal(item.text, config.registry)
          if (!binding.ok || !upload.ok) return knownFailure('invalid_proposal')
          const p = upload.value.proposal, raw = JSON.parse(item.text) as Record<string, unknown>
          if (!same(raw.context, p.context) || !same(raw.research, p.research) || p.jobId !== job.jobId
            || p.operationId !== binding.value.operationId || p.jobId !== binding.value.jobId || p.contextKey !== binding.value.contextKey
            || !same(binding.value.method, methodOf(job)) || ids.has(p.operationId) || digests.has(upload.value.digest)) return knownFailure('invalid_proposal')
          if (job.kind === 'research_job_record' ? !same(p.context, job.context) || p.contextKey !== job.contextKey || !same(p.research, job.research)
            : p.context.scope.destinationCountryCode !== job.identity.destinationCountryCode || p.context.scope.citizenship.countryCodes[0] !== job.identity.citizenshipCountryCode) return knownFailure('invalid_proposal')
          bytes += upload.value.bytes
          if (bytes > M04_LIMITS.originalBatchBytes || !scope.retain(upload.value.bytes)) return knownFailure('invalid_proposal')
          ids.add(p.operationId); digests.add(upload.value.digest)
          admitted.push({ reference: Object.freeze({ binding: binding.value, proposalDigest: upload.value.digest, bytes: upload.value.bytes }), text: item.text })
        }
        admitted.sort((a, b) => a.reference.binding.operationId.localeCompare(b.reference.binding.operationId))
        for (const item of admitted) {
          const captured = await processingStore.intake.capture(item.text, item.reference.binding, childSignal)
          if (captured.status !== 'recorded' || !same(captured.reference, item.reference)) { scope.markAmbiguous(); scope.sealProcessing(); return { status: 'unconfirmed' } }
          const read = await processingStore.open(item.reference, childSignal)
          if (read.status !== 'recorded' || read.record.text !== item.text) { scope.markAmbiguous(); scope.sealProcessing(); return { status: 'unconfirmed' } }
        }
        const preparedAt = readNow(() => config.clock().now)
        if (!preparedAt) { scope.sealProcessing(); return { status: 'unconfirmed' } }
        let result: V3WorkerResultRecord
        if (job.kind === 'research_job_record') {
          const item = admitted[0]
          const importer = createV3ImportCoordinator({ registry: config.registry, method: methodOf(job), clock: config.clock,
            methodAuthority: options.processingAuthority, evidence: evidence('processing'), history: history('processing'),
            quarantine: processingStore.forImport(item.reference.binding) }, { budgetMilliseconds: 5000 })
          const outcome = await importer.submit(item.text, childSignal)
          if (outcome.status !== 'completed') { scope.markAmbiguous(); scope.sealProcessing(); return { status: 'unconfirmed' } }
          const confirmed = await processingStore.confirmImport(item.reference, childSignal)
          if (confirmed.status !== 'completed' || !same(confirmed.outcome, outcome.outcome)) { scope.markAmbiguous(); scope.sealProcessing(); return { status: 'unconfirmed' } }
          const decision = outcome.outcome.status === 'prepared' ? outcome.outcome.value.decision
            : outcome.outcome.status === 'escalation' ? outcome.outcome.decision : null
          if (!decision) return knownFailure('verification_unavailable')
          result = { kind: 'rule_research', jobId: job.jobId, operationId: job.operationId,
            jobKey: job.jobKey, preparedAt, decisionRef: decision.reference }
        } else {
          const proposalDigests = admitted.map(x => x.reference.proposalDigest).sort()
          result = { kind: 'combination_discovery', jobId: job.jobId, operationId: job.operationId, jobKey: job.identity.jobKey, preparedAt,
            discoveryRef: key('combination-discovery-result', { jobId: job.jobId, operationId: job.operationId,
              jobKey: job.identity.jobKey, claim, fence, proposalDigests }), proposalDigests }
        }
        const receipt = await index.prepare(job, winner.attemptKey, winner.token, result, admitted.map(x => x.reference), childSignal)
        scope.sealProcessing()
        if (!receipt) { scope.markAmbiguous(); return { status: 'unconfirmed' } }
        return { status: 'prepared', receipt }
      } })
      const importTickets = new WeakMap<object, { port: V3ImportQuarantinePort<object>; ticket: object }>()
      const quarantine: V3ImportQuarantinePort<object> = Object.freeze<V3ImportQuarantinePort<object>>({
        async reserve(upload, s) {
          const ref = bindings.get(upload.proposal.operationId)
          if (!ref || ref.proposalDigest !== upload.digest || ref.bytes !== upload.bytes) return { status: 'unavailable' }
          const port = store.forImport(ref.binding), result = await port.reserve(upload, s)
          if (result.status !== 'acquired') return result
          const ticket = Object.freeze({}); importTickets.set(ticket, { port, ticket: result.ticket })
          return { status: 'acquired', ticket }
        },
        async finish(ticket, outcome, audit, s) {
          const held = importTickets.get(ticket); if (!held) return { status: 'unconfirmed' }
          importTickets.delete(ticket); return held.port.finish(held.ticket, outcome, audit, s)
        },
      })
      const ports: V3IntegrationPorts = {
        import: { registry: config.registry, method: { methodId: config.binding.methodId, revision: config.binding.revision }, clock: config.clock, methodAuthority: options.authority,
          evidence: evidence('outer'), history: history('outer'), quarantine },
        queue: { storage, invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 },
        versionStore: null, versionProofs: null, publication: null, escalations: null,
        research: { work, results: index.results, artifacts },
        visitor: { dataMode: 'official_projection', coverage: { async targets() { return { zeilen: null, problem: { status: 503, message: 'Unbound' } } } },
          cache: { async read() { return { zeilen: null, problem: { status: 503, message: 'Unbound' } } } },
          current: { async reprove() { return { status: 'unavailable' } }, async confirmBatch() { return { status: 'unavailable' } } },
          ids: () => { throw Error('unbound_visitor') } },
        monitor: { plans: null, sources: null, suppressions: null }, invocationMilliseconds: 30000, projectionMaxAgeMilliseconds: 1,
      }
      return createV3IntegrationCoordinator(ports).workOnce(claim, signal)
    },
  })
}
