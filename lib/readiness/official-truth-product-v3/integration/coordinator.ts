import 'server-only'
import { z } from 'zod'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { schema2DatenPruefen } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { readV3SourceDecisionRecord, readV3PublicProjectionRecord, readV3ResearchJobRecord,
  readV3CombinationDiscoveryJobRecord, OFFICIAL_TRUTH_V3_LIMITS } from '../contract'
import { createV3ImportCoordinator, type V3ImportPrepared, type V3ImportResult } from '../import/service-server'
import { readV3ProposalUpload, type V3ProposalUpload } from '../import/interface'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3QueueResult } from '../monitor/queue'
import { runV3ResearchWorkerOnce, type V3WorkerOutcome } from '../monitor/worker'
import { commitV3PreparedTransition, type V3TransitionOutcome, type V3TransitionProofState } from '../monitor/recovery'
import { runV3SourceMonitorOnce } from '../monitor/monitor'
import { invocationBudget, key, same, readData, timestamp, operationId, jobId, leaseId,
  jobKey, discoveryJobKey, decisionRef, discoveryRef, type InvocationBudget } from '../monitor/internal'
import { createV3VisitorQuery, prepareV3VisitorProjection, queryOfficialTruthVisitorV3 } from '../visitor/query'
import type { V3IntegrationPorts, V3IntegrationEscalation, V3PublicationCommand, V3PublicationState,
  V3EscalationCommand, V3ResearchArtifact } from './ports'

export type V3IntegrationResult =
  | { status: 'published'; versionRef: string; projectionRef: string; replayed: boolean }
  | { status: 'escalated'; escalationKey: string; replayed: boolean }
  | { status: 'import_only'; result: V3ImportResult }
  | { status: 'version_only'; result: V3TransitionOutcome }
  | { status: 'unavailable' | 'unconfirmed' | 'invalid' | 'collision' | 'not_current' }
export type V3IntegratedWorkerResult =
  | { status: 'processed'; worker: Extract<V3WorkerOutcome, { status: 'completed' }>; results: readonly V3IntegrationResult[] }
  | { status: 'worker_only'; worker: V3WorkerOutcome }
  | { status: 'unavailable' | 'unconfirmed' | 'invalid' }

const claimSchema = z.object({ operationId, jobKey: z.union([jobKey, discoveryJobKey]), leaseId,
  leaseMilliseconds: z.number().int().min(1).max(OFFICIAL_TRUTH_V3_LIMITS.leaseMilliseconds) }).strict()
const publicationConfirmationSchema = z.object({ operationId: z.string(), operationKey: z.string(),
  projectionRef: z.string(), versionRef: z.string(), checkedAt: timestamp, freshUntil: timestamp }).strict()
// The external resume boundary needs its own closed DTO reader, using the existing
// M1/S0 identifiers. It grants no worker, source or method authority.
const retainedResultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('rule_research'), jobId, operationId, jobKey, preparedAt: timestamp, decisionRef }).strict(),
  z.object({ kind: z.literal('combination_discovery'), jobId, operationId, jobKey: discoveryJobKey,
    preparedAt: timestamp, discoveryRef, proposalDigests: z.array(z.string().regex(/^[a-f0-9]{64}$/))
      .min(1).max(OFFICIAL_TRUTH_V3_LIMITS.resultsPerCitizenship)
      .refine((items) => new Set(items).size === items.length) }).strict(),
])
const artifactMetadataSchema = z.object({ jobId, jobOperationId: operationId, jobKey: z.union([jobKey, discoveryJobKey]),
  resultRef: z.union([decisionRef, discoveryRef]),
  fence: z.object({ jobId, revision: z.number().int().positive(), leaseId, generation: z.number().int().positive() }).strict(),
  method: z.object({ methodId: z.string(), revision: z.number().int().positive() }).strict(),
}).strict()

function queueAnswer(result: V3QueueResult) {
  if (result.status === 'confirmed') return { status: 'confirmed' as const, record: result.record }
  if (result.status === 'unconfirmed') return { status: 'unconfirmed' as const }
  return { status: 'unavailable' as const }
}
function detachedPrepared(value: unknown): V3ImportPrepared | null {
  const row = ownRecord(value, ['proposalDigest', 'decision', 'previousDecision', 'archiveAppend',
    'version', 'transition', 'proposalDisposition', 'acceptance', 'reproof'])
  // Each record has its own S0 bound, not a new aggregate lifetime-history cap.
  if (!row || Object.values(row).some((item) => schema2DatenPruefen(item))) return null
  return JSON.parse(JSON.stringify(row)) as V3ImportPrepared // M1 performs complete semantic parsing before use.
}
function detachedArtifact(value: unknown): V3ResearchArtifact | null {
  const row = ownRecord(value, ['jobId', 'jobOperationId', 'jobKey', 'resultRef', 'fence', 'method', 'uploads'])
  if (!row) return null
  const { uploads: raw, ...metadata } = row
  const parsed = readData(metadata, artifactMetadataSchema)
  if (!parsed || !Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype) return null
  const length = Object.getOwnPropertyDescriptor(raw, 'length')?.value
  if (!Number.isInteger(length) || length < 1 || length > OFFICIAL_TRUTH_V3_LIMITS.resultsPerCitizenship
    || Reflect.ownKeys(raw).length !== length + 1) return null
  const uploads: string[] = []
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(raw, String(index))
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable || typeof descriptor.value !== 'string'
      || descriptor.value.length > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return null
    uploads.push(descriptor.value)
  }
  return { ...parsed, uploads }
}

/** No positive adapters, scheduler, HTTP route, environment switch or test fixture. */
export function officialTruthV3IntegrationProduction() {
  return Object.freeze({ query: queryOfficialTruthVisitorV3,
    ingest: async (): Promise<V3IntegrationResult> => ({ status: 'unavailable' }),
    workOnce: async (): Promise<V3IntegratedWorkerResult> => ({ status: 'unavailable' }),
    monitorOnce: async () => ({ status: 'unavailable' as const, outcomes: [] }),
    recover: async (): Promise<V3IntegrationResult> => ({ status: 'unavailable' }) })
}

/** Dormant real module composition for explicitly reviewed, code-owned ports. */
export function createV3IntegrationCoordinator(ports: V3IntegrationPorts) {
  const common = ports.import
  const valid = Number.isInteger(ports.invocationMilliseconds) && ports.invocationMilliseconds > 0 && ports.invocationMilliseconds <= 30_000
    && Number.isInteger(ports.projectionMaxAgeMilliseconds) && ports.projectionMaxAgeMilliseconds > 0
    && ports.projectionMaxAgeMilliseconds <= 3_600_000
  const queueOptions = { ...ports.queue, now: () => common.clock().now, methodAuthority: common.methodAuthority }
  const queue = createV3QueueCoordinator(queueOptions), discovery = createV3DiscoveryQueueCoordinator(queueOptions)
  const importer = createV3ImportCoordinator(common, { budgetMilliseconds: ports.invocationMilliseconds })
  const visitor = createV3VisitorQuery({ ...ports.visitor, registry: common.registry, method: common.method,
    methodAuthority: common.methodAuthority, clock: common.clock,
    queue: { enqueue: async (input, signal) => queueAnswer(await queue.enqueue(input, signal)) },
    discoveryQueue: { enqueue: async (input, signal) => queueAnswer(await discovery.enqueue(input, signal)) } })

  async function publish(prepared: V3ImportPrepared, budget: InvocationBudget): Promise<V3IntegrationResult> {
    const publisher = ports.publication, proofs = ports.versionProofs
    if (!publisher || !proofs) return { status: 'unavailable' }
    const start = common.clock()
    const method = await budget.call(() => common.methodAuthority.resolveCurrent(prepared.version.method, start.now))
    if (!method.ok || method.value.status !== 'approved') return { status: 'not_current' }
    const methodReceipt = method.value.receipt
    const proof = await budget.call((signal) => proofs.inspect(prepared, start.now, start.legalDate, signal))
    if (!proof.ok || proof.value.status !== 'verified') return { status: 'not_current' }
    const proofReceipt = proof.value.receipt
    async function reprove(signal: AbortSignal): Promise<V3TransitionProofState> {
      const time = common.clock()
      if (signal.aborted) return { status: 'unavailable' }
      const current = await budget.call(() => common.methodAuthority.reproveAtCommit(methodReceipt, prepared.version.method, time.now))
      if (!current.ok || current.value.status !== 'current') return { status: 'unavailable' }
      const source = await budget.call((child) => proofs!.reprove(proofReceipt, prepared, time.now, time.legalDate, child))
      const end = common.clock()
      if (!source.ok || source.value.status !== 'current' || end.now < time.now || end.legalDate !== time.legalDate
        || !readData(source.value.freshUntil, timestamp) || source.value.freshUntil <= end.now || signal.aborted) return { status: 'invalid' }
      return source.value
    }
    const fresh = await reprove(budget.signal)
    if (fresh.status !== 'current') return { status: 'not_current' }
    const clock = common.clock()
    // Stable per-version bytes: a retry never creates a later cache birth time.
    const builtAt = prepared.version.recordedAt
    const desiredExpiry = new Date(Date.parse(builtAt) + ports.projectionMaxAgeMilliseconds).toISOString()
    const projection = prepareV3VisitorProjection({ rule: prepared.version, decision: prepared.decision, builtAt,
      expiresAt: desiredExpiry < fresh.freshUntil ? desiredExpiry : fresh.freshUntil,
      sourceFreshUntil: fresh.freshUntil }, common.registry, clock)
    if (projection.status !== 'prepared') return { status: 'not_current' }
    const operationId = prepared.transition.operationId
    const operationKey = key('projection-publish', { operationId, prepared, projection: projection.projection })
    const command: V3PublicationCommand = { operationId, operationKey, prepared, projection: projection.projection,
      methodReceipt, proofReceipt, notAfter: projection.projection.expiresAt, reprove }
    const prior = await budget.call((signal) => publisher.confirm(command, signal))
    if (!prior.ok) return { status: 'unconfirmed' }
    const replayed = prior.value.status === 'confirmed'
    let confirmation: V3PublicationState = prior.value
    if (prior.value.status === 'not_attempted') {
      const write = await budget.call((signal) => publisher.publish(command, signal))
      if (!write.ok) return { status: 'unconfirmed' }
      if (write.value.status !== 'reported') return { status: write.value.status }
      const current = await budget.call((signal) => publisher.confirm(command, signal))
      if (!current.ok) return { status: 'unconfirmed' }
      confirmation = current.value
    }
    if (confirmation.status !== 'confirmed') return { status: confirmation.status === 'not_attempted' ? 'unconfirmed' : confirmation.status }
    const record = readData(confirmation.confirmation, publicationConfirmationSchema), end = common.clock()
    if (!record || record.operationId !== command.operationId || record.operationKey !== operationKey
      || record.projectionRef !== command.projection.reference || record.versionRef !== prepared.version.reference
      || record.checkedAt < start.now || record.checkedAt > end.now || record.freshUntil !== fresh.freshUntil) return { status: 'unconfirmed' }
    if (end.legalDate !== clock.legalDate || end.now < clock.now || !readV3PublicProjectionRecord(command.projection, common.registry, end).ok
      || budget.signal.aborted) return { status: 'not_current' }
    return { status: 'published', versionRef: prepared.version.reference, projectionRef: command.projection.reference, replayed }
  }

  async function finishPrepared(value: unknown, budget: InvocationBudget): Promise<V3IntegrationResult> {
    const prepared = detachedPrepared(value)
    if (!prepared) return { status: 'invalid' }
    const committed = await budget.call((signal) => commitV3PreparedTransition(prepared, {
      registry: common.registry, store: ports.versionStore, proofs: ports.versionProofs,
      methodAuthority: common.methodAuthority, now: () => common.clock().now, legalDate: () => common.clock().legalDate,
      invocationMilliseconds: ports.invocationMilliseconds,
    }, signal))
    if (!committed.ok) return { status: 'unconfirmed' }
    if (committed.value.status !== 'confirmed') return { status: 'version_only', result: committed.value }
    if (!same(committed.value.version, prepared.version)) return { status: 'unconfirmed' }
    return publish(prepared, budget)
  }

  async function escalate(upload: V3ProposalUpload, outcome: V3IntegrationEscalation, budget: InvocationBudget): Promise<V3IntegrationResult> {
    const sink = ports.escalations
    if (!sink) return { status: 'unavailable' }
    const decision = readV3SourceDecisionRecord(outcome.decision, common.registry, outcome.previousDecision, outcome.archiveAppend)
    if (!decision.ok || decision.value.contextKey !== upload.proposal.contextKey
      || decision.value.factKind !== upload.proposal.research.factKind || !same(decision.value.method, common.method)
      || decision.value.conclusion !== outcome.reason) return { status: 'invalid' }
    const retained: V3IntegrationEscalation = JSON.parse(JSON.stringify(outcome))
    const command: V3EscalationCommand = { operationId: upload.proposal.operationId,
      operationKey: key('escalation-publish', { digest: upload.digest, outcome: retained }), upload, outcome: retained }
    const prior = await budget.call((signal) => sink.confirm(command, signal))
    if (!prior.ok) return { status: 'unconfirmed' }
    let confirmation = prior.value
    const replayed = prior.value.status === 'confirmed'
    if (prior.value.status === 'not_attempted') {
      const write = await budget.call((signal) => sink.publish(command, signal))
      if (!write.ok) return { status: 'unconfirmed' }
      if (write.value.status !== 'reported') return { status: write.value.status }
      const current = await budget.call((signal) => sink.confirm(command, signal))
      if (!current.ok) return { status: 'unconfirmed' }
      confirmation = current.value
    }
    if (confirmation.status !== 'confirmed') return { status: confirmation.status === 'not_attempted' ? 'unconfirmed' : confirmation.status }
    return confirmation.operationKey === command.operationKey && confirmation.escalationKey === retained.key
      ? { status: 'escalated', escalationKey: retained.key, replayed } : { status: 'unconfirmed' }
  }

  async function ingest(upload: V3ProposalUpload, text: string, budget: InvocationBudget, expectedDecisionRef?: string): Promise<V3IntegrationResult> {
    const imported = await budget.call((signal) => importer.submit(text, signal))
    if (!imported.ok) return { status: 'unconfirmed' }
    if (imported.value.status !== 'completed') return { status: 'import_only', result: imported.value }
    const outcome = imported.value.outcome
    const decisionRef = outcome.status === 'prepared' ? outcome.value.decision.reference
      : outcome.status === 'escalation' ? outcome.decision.reference : null
    if (expectedDecisionRef !== undefined && decisionRef !== expectedDecisionRef) return { status: 'invalid' }
    if (outcome.status === 'prepared') {
      if (outcome.value.proposalDigest !== upload.digest || outcome.value.transition.operationId !== upload.proposal.operationId
        || outcome.value.decision.contextKey !== upload.proposal.contextKey) return { status: 'invalid' }
      return finishPrepared(outcome.value, budget)
    }
    if (outcome.status === 'escalation') return escalate(upload, outcome, budget)
    return { status: 'import_only', result: imported.value }
  }

  return Object.freeze({
    query: valid ? visitor : queryOfficialTruthVisitorV3,
    async ingest(text: unknown, signal?: AbortSignal): Promise<V3IntegrationResult> {
      if (!valid) return { status: 'unavailable' }
      const upload = readV3ProposalUpload(text, common.registry)
      if (!upload.ok || typeof text !== 'string') return { status: 'invalid' }
      const budget = invocationBudget(ports.invocationMilliseconds, signal)
      try { return await ingest(upload.value, text, budget) } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
    },
    async recover(value: unknown, signal?: AbortSignal): Promise<V3IntegrationResult> {
      if (!valid) return { status: 'unavailable' }
      const prepared = detachedPrepared(value)
      if (!prepared || prepared.transition?.action !== 'recover') return { status: 'invalid' }
      const budget = invocationBudget(ports.invocationMilliseconds, signal)
      try { return await finishPrepared(prepared, budget) } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
    },
    async workOnce(rawClaim: unknown, signal?: AbortSignal): Promise<V3IntegratedWorkerResult> {
      if (!valid || !ports.research.artifacts) return { status: 'unavailable' }
      const claim = readData(rawClaim, claimSchema)
      if (!claim) return { status: 'invalid' }
      const artifacts = ports.research.artifacts, budget = invocationBudget(ports.invocationMilliseconds, signal)
      try {
        const resumed = await budget.call((child) => artifacts.resume(claim, child))
        if (!resumed.ok) return { status: 'unconfirmed' }
        if (resumed.value.status === 'unavailable' || resumed.value.status === 'unconfirmed') return { status: resumed.value.status }
        if (resumed.value.status !== 'completed' && resumed.value.status !== 'not_attempted') return { status: 'unconfirmed' }
        const worker = resumed.value.status === 'completed' ? { ok: true as const, value: resumed.value.worker }
          : await budget.call((child) => runV3ResearchWorkerOnce(claim, { ...ports.research,
            queue: claim.jobKey.startsWith('combination-discovery-job:') ? discovery : queue,
            methodAuthority: common.methodAuthority, now: () => common.clock().now,
            invocationMilliseconds: ports.invocationMilliseconds }, child))
        if (!worker.ok) return { status: 'unconfirmed' }
        if (worker.value.status !== 'completed') return { status: 'worker_only', worker: worker.value }
        const completedRow = ownRecord(worker.value, ['status', 'job', 'result', 'acceptedRule'])
        if (!completedRow || completedRow.status !== 'completed' || completedRow.acceptedRule !== false) return { status: 'invalid' }
        const canonicalJob = claim.jobKey.startsWith('combination-discovery-job:')
          ? readV3CombinationDiscoveryJobRecord(completedRow.job) : readV3ResearchJobRecord(completedRow.job)
        const result = readData(completedRow.result, retainedResultSchema)
        if (!canonicalJob.ok || !result) return { status: 'invalid' }
        const job = canonicalJob.value
        const completed: Extract<V3WorkerOutcome, { status: 'completed' }> = { status: 'completed', job, result, acceptedRule: false }
        if (job.state !== 'succeeded'
          || result.jobId !== job.jobId || result.operationId !== job.operationId || result.jobKey !== claim.jobKey
          || result.preparedAt < job.createdAt || result.preparedAt > common.clock().now
          || (job.kind === 'research_job_record' ? result.kind !== 'rule_research' || result.decisionRef !== job.resultDecisionRef
            : result.kind !== 'combination_discovery' || result.discoveryRef !== job.resultDiscoveryRef)) return { status: 'invalid' }
        const opened = await budget.call((child) => artifacts.open(job, result, child))
        if (!opened.ok) return { status: 'unconfirmed' }
        if (opened.value.status !== 'available') return opened.value
        const artifactReceipt = opened.value.receipt
        const artifact = detachedArtifact(opened.value.artifact)
        if (!artifact) return { status: 'invalid' }
        if (artifact.jobId !== job.jobId || artifact.jobOperationId !== job.operationId || artifact.jobKey !== result.jobKey
          || artifact.resultRef !== (result.kind === 'combination_discovery' ? result.discoveryRef : result.decisionRef)
          || !same(artifact.method, common.method) || artifact.fence.jobId !== job.jobId
          || artifact.fence.leaseId !== claim.leaseId || artifact.fence.revision !== job.predecessorRevision
          || artifact.fence.generation !== artifact.fence.revision) return { status: 'invalid' }
        const uploads = artifact.uploads.map((text) => readV3ProposalUpload(text, common.registry))
        if (uploads.some((upload) => !upload.ok)) return { status: 'invalid' }
        const values: V3ProposalUpload[] = uploads.flatMap((upload) => upload.ok ? [upload.value] : [])
        if (new Set(values.map((upload) => upload.digest)).size !== values.length
          || new Set(values.map((upload) => upload.proposal.operationId)).size !== values.length) return { status: 'invalid' }
        if (result.kind === 'combination_discovery' && !same([...values.map((upload) => upload.digest)].sort(), [...result.proposalDigests].sort())) return { status: 'invalid' }
        for (const upload of values) {
          const proposal = upload.proposal
          if (proposal.jobId !== job.jobId) return { status: 'invalid' }
          if (job.kind === 'combination_discovery_job_record') {
            if (proposal.context.scope.destinationCountryCode !== job.identity.destinationCountryCode
              || proposal.context.scope.citizenship.countryCodes.length !== 1
              || proposal.context.scope.citizenship.countryCodes[0] !== job.identity.citizenshipCountryCode) return { status: 'invalid' }
          } else if (!same(proposal.context, job.context) || proposal.contextKey !== job.contextKey || !same(proposal.research, job.research)) return { status: 'invalid' }
        }
        const processed: V3IntegrationResult[] = []
        for (let index = 0; index < values.length; index++) {
          const current = await budget.call((child) => artifacts.reprove(artifactReceipt, artifact, job, common.clock(), child))
          if (!current.ok || !current.value) return { status: 'unconfirmed' }
          processed.push(await ingest(values[index], artifact.uploads[index], budget, result.kind === 'rule_research' ? result.decisionRef : undefined))
          if (budget.signal.aborted) return { status: 'unconfirmed' }
        }
        return { status: 'processed', worker: completed, results: processed }
      } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
    },
    async monitorOnce(signal?: AbortSignal) {
      if (!valid || (ports.monitor.plans !== null && ports.monitor.plans.registry !== common.registry)) return { status: 'unavailable' as const, outcomes: [] }
      return runV3SourceMonitorOnce({ ...ports.monitor, queue, methodAuthority: common.methodAuthority,
        now: () => common.clock().now, invocationMilliseconds: ports.invocationMilliseconds }, signal)
    },
  })
}
