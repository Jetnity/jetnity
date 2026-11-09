// SYNTHETIC E1 COMPOSITION ONLY. Actual I1/M1/U1 functions, fictional external ports.
import assert from 'node:assert/strict'
import { sha256Hex } from '@/lib/readiness/digest'
import { createV3WorkIdentity, readV3ResearchJobRecord, readV3CombinationDiscoveryJobRecord } from '../../contract'
import { createV3ImportCoordinator } from '../../import/service-server'
import { readV3ProposalUpload } from '../../import/interface'
import type { V3ResearchWorkPort, V3ResearchResultCustodyPort, V3WorkerResultRecord } from '../../monitor/worker'
import type { V3JobFence, V3ManagedJobRecord } from '../../monitor/queue'
import type { V3MonitorTarget, V3MonitorPlanPort, V3SourceObservationPort, V3ProjectionSuppressionPort } from '../../monitor/monitor'
import { key, same } from '../../monitor/internal'
import { createV3IntegrationCoordinator } from '../coordinator'
import type { V3IntegrationPorts, V3ResearchArtifact, V3ResearchArtifactPort } from '../ports'
import { makeSyntheticOriginals, METHOD, id, ref } from './originals'
import { makeSyntheticStore } from './store'

export function integrationFixture() {
  const originals = makeSyntheticOriginals(), store = makeSyntheticStore(originals)
  const researchControl = { provider: 'a' as 'a' | 'b', calls: 0, loseOpen: false, wrongDigest: false,
    wrongPair: false, fakeReceipt: false, beforeExecute: null as (() => Promise<void>) | null }
  type Held = { artifact: V3ResearchArtifact; result: V3WorkerResultRecord; job: V3ManagedJobRecord; receipt: object }
  const heldResults = new Map<string, Held>(), resultReceipts = new WeakMap<object, Held>(), artifactReceipts = new WeakMap<object, Held>()
  const jobKey = (job: V3ManagedJobRecord) => job.kind === 'research_job_record' ? job.jobKey : job.identity.jobKey
  const currentFence = (job: V3ManagedJobRecord, fence: V3JobFence) => {
    const current = store.queueRows.get(jobKey(job))
    return current?.state === 'leased' && current.jobId === fence.jobId && current.revision === fence.revision
      && current.lease?.leaseId === fence.leaseId && current.lease.generation === fence.generation
      && current.lease.expiresAt > store.clock().now
  }
  const work: V3ResearchWorkPort<object> = {
    async execute(job, fence, signal) {
      researchControl.calls++; await researchControl.beforeExecute?.()
      if (signal.aborted || !currentFence(job, fence)) return { status: 'unconfirmed' }
      const country = job.kind === 'combination_discovery_job_record' ? job.identity.citizenshipCountryCode : job.context.scope.citizenship.countryCodes[0]
      const destination = job.kind === 'combination_discovery_job_record' ? job.identity.destinationCountryCode : job.context.scope.destinationCountryCode
      // Each supplier receives only a work item and emits the SAME neutral format.
      const proposal = originals.proposal(`research-${job.operationId}`, researchControl.wrongPair ? 'US' : country, job.jobId, destination)
      if (job.kind === 'research_job_record') { proposal.context = job.context; proposal.contextKey = job.contextKey; proposal.research = job.research }
      const text = researchControl.provider === 'a' ? JSON.stringify(proposal) : JSON.stringify(proposal, null, 2)
      const upload = readV3ProposalUpload(text, originals.registry); assert.ok(upload.ok)
      if (!upload.ok) return { status: 'failed', reason: 'invalid_proposal' }
      let result: V3WorkerResultRecord
      if (job.kind === 'research_job_record') {
        // M1's rule-result decision is produced by the real I1 coordinator, never the provider.
        const imported = await createV3ImportCoordinator(store.importPorts).submit(text, signal)
        if (imported.status !== 'completed') return { status: 'unconfirmed' }
        const decisionRef = imported.outcome.status === 'prepared' ? imported.outcome.value.decision.reference
          : imported.outcome.status === 'escalation' ? imported.outcome.decision.reference : null
        if (!decisionRef) return { status: 'failed', reason: 'invalid_proposal' }
        result = { kind: 'rule_research', jobId: job.jobId, operationId: job.operationId, jobKey: jobKey(job),
          preparedAt: store.clock().now, decisionRef }
      } else result = { kind: 'combination_discovery', jobId: job.jobId, operationId: job.operationId, jobKey: jobKey(job),
        preparedAt: store.clock().now, discoveryRef: ref('combination-discovery-result', job.operationId),
        proposalDigests: [researchControl.wrongDigest ? '0'.repeat(64) : upload.value.digest] }
      return store.locked(async () => {
        if (signal.aborted || !currentFence(job, fence) || !store.control.methodEnabled) return { status: 'unconfirmed' as const }
        const receipt = Object.freeze({})
        const artifact: V3ResearchArtifact = { jobId: job.jobId, jobOperationId: job.operationId, jobKey: jobKey(job),
          resultRef: result.kind === 'combination_discovery' ? result.discoveryRef : result.decisionRef,
          fence: structuredClone(fence), method: METHOD, uploads: [text] }
        const held = { artifact, result, job: structuredClone(job), receipt }
        heldResults.set(job.operationId, held); resultReceipts.set(receipt, held)
        return { status: 'prepared' as const, receipt }
      })
    },
  }
  const results: V3ResearchResultCustodyPort<object> = {
    async lookup(job) { const held = heldResults.get(job.operationId)
      if (!held) return { status: 'not_attempted' }
      return held.artifact.fence.revision === job.revision ? { status: 'prepared', receipt: held.receipt } : { status: 'unconfirmed' } },
    async confirm(receipt, job) { const held = resultReceipts.get(receipt)
      return held && currentFence(job, held.artifact.fence) && heldResults.get(job.operationId) === held
        ? { status: 'confirmed', record: structuredClone(held.result) } : { status: 'unconfirmed' } },
  }
  const artifacts: V3ResearchArtifactPort = {
    async resume(claim) {
      const heldClaim = store.queueOperations.get(claim.operationId)
      if (!heldClaim) return { status: 'not_attempted' }
      // This is the exact command key generated by the real M1 claim operation,
      // including duration. A stable operation ID alone cannot attest its bytes.
      if (heldClaim.operationId !== claim.operationId || heldClaim.commandKey !== key('queue-command', { action: 'claim', input: claim })) return { status: 'unconfirmed' }
      const readJob = claim.jobKey.startsWith('combination-discovery-job:') ? readV3CombinationDiscoveryJobRecord : readV3ResearchJobRecord
      const original = readJob(heldClaim.record), actual = readJob(store.queueRows.get(claim.jobKey))
      if (!original.ok || !actual.ok) return { status: 'unconfirmed' }
      const claimed = original.value, current = actual.value
      if (jobKey(claimed) !== claim.jobKey || jobKey(current) !== claim.jobKey || claimed.state !== 'leased' || !claimed.lease
        || claimed.lease.leaseId !== claim.leaseId || claimed.lease.generation !== claimed.revision
        || Date.parse(claimed.lease.expiresAt) - Date.parse(claimed.lease.acquiredAt) !== claim.leaseMilliseconds
        || current.jobId !== claimed.jobId || current.operationId !== claimed.operationId) return { status: 'unconfirmed' }
      if (same(current, claimed)) return { status: 'not_attempted' }
      const held = heldResults.get(current.operationId)
      if (!held || current.state !== 'succeeded' || current.predecessorRevision !== claimed.revision
        || !same(held.job, claimed) || !same(held.artifact.fence, { jobId: claimed.jobId, revision: claimed.revision,
          leaseId: claimed.lease.leaseId, generation: claimed.lease.generation })) return { status: 'unconfirmed' }
      return { status: 'completed', worker: { status: 'completed', job: structuredClone(current), result: structuredClone(held.result), acceptedRule: false } }
    },
    async open(job, result) {
      if (researchControl.loseOpen) { researchControl.loseOpen = false; return { status: 'unconfirmed' } }
      const held = heldResults.get(job.operationId), current = store.queueRows.get(jobKey(job))
      if (!held || !same(current, job) || !same(result, held.result)) return { status: 'unconfirmed' }
      const receipt = Object.freeze({}); artifactReceipts.set(receipt, held)
      return { status: 'available', artifact: structuredClone(held.artifact), receipt: researchControl.fakeReceipt ? { ...receipt } : receipt }
    },
    async reprove(receipt, artifact, job) {
      const held = artifactReceipts.get(receipt)
      return !!held && heldResults.get(job.operationId) === held && same(held.artifact, artifact)
        && same(store.queueRows.get(jobKey(job)), job) && store.control.methodEnabled
    },
  }
  const monitorControl = { target: null as V3MonitorTarget | null, changed: false, unreachable: false }
  const planReceipts = new WeakMap<object, V3MonitorTarget[]>(), observationReceipts = new WeakMap<object,
    { target: V3MonitorTarget; epoch: number; changed: boolean }>()
  function targetCurrent(target: V3MonitorTarget) {
    const identity = createV3WorkIdentity({ context: target.context, method: METHOD, factKind: target.factKind,
      researchReason: { status: 'missing' } })
    if (!identity.ok || !same(target, monitorControl.target)) return false
    const head = store.actualHead(identity.value.contextKey)
    return head.pointer.versionRef === target.expectedVersionRef && head.sourceDecisionRef === target.sourceDecisionRef
  }
  const plans: V3MonitorPlanPort<object> = {
    registry: originals.registry,
    async load() { const receipt = Object.freeze({}), targets = monitorControl.target ? [structuredClone(monitorControl.target)] : []
      planReceipts.set(receipt, targets)
      return { status: 'available', receipt, plan: { method: METHOD, targets: structuredClone(targets), attemptLimit: 3 } } },
    async reprove(receipt, target, method, _at, signal) { return !signal.aborted && same(method, METHOD)
      && !!planReceipts.get(receipt)?.some((held) => same(held, target)) && targetCurrent(target) },
  }
  const sources: V3SourceObservationPort<object> = {
    async observe(target) { if (monitorControl.unreachable) return { status: 'unreachable' }
      const receipt = Object.freeze({}); observationReceipts.set(receipt, { target: structuredClone(target),
        epoch: originals.control.epoch, changed: monitorControl.changed })
      return { status: 'observed', receipt, observation: { source: target.source,
        fingerprint: monitorControl.changed ? { sourceContentHash: sha256Hex('different synthetic bytes'), sourceFingerprintProtocol: 1 } : target.baseline,
        retrievedAt: store.clock().now } } },
    async reprove(receipt, target, method, _at, signal) { const held = observationReceipts.get(receipt)
      return !signal.aborted && same(method, METHOD) && !!held && held.epoch === originals.control.epoch
        && held.changed === monitorControl.changed && !monitorControl.unreachable && same(held.target, target) && targetCurrent(target) },
  }
  const suppressionOperations = new Map<string, string>()
  const suppressions: V3ProjectionSuppressionPort = {
    async confirm(operationId, auditRef) { const held = suppressionOperations.get(operationId)
      return held === auditRef ? { status: 'confirmed', auditRef } : held ? { status: 'unconfirmed' } : { status: 'not_attempted' } },
    async apply(effect, reprove, signal) { return store.locked(async () => {
      const held = suppressionOperations.get(effect.operationId)
      if (held) return held === effect.auditRef ? { status: 'confirmed', auditRef: held } : { status: 'unconfirmed' }
      const target = structuredClone(monitorControl.target), sourceEpoch = originals.control.epoch
      const proofEpoch = store.control.proofEpoch, archiveEpoch = store.control.archiveEpoch
      const allowed = await reprove(signal)
      if (!allowed || signal.aborted || !store.control.methodEnabled || store.control.methodRevision !== METHOD.revision
        || !target || !targetCurrent(target) || sourceEpoch !== originals.control.epoch || proofEpoch !== store.control.proofEpoch
        || archiveEpoch !== store.control.archiveEpoch || effect.expectedVersionRef !== target.expectedVersionRef
        || effect.sourceDecisionRef !== target.sourceDecisionRef || !same(effect.projectionRefs, target.projectionRefs)
        || store.actualHead(effect.contextKey).pointer.versionRef !== effect.expectedVersionRef) return { status: 'stale_head' }
      suppressionOperations.set(effect.operationId, effect.auditRef)
      const projection = store.cache.get(effect.contextKey)
      if (projection) store.cache.delete(effect.contextKey)
      store.audit.push({ kind: 'monitor_suppression', operationId: effect.operationId, reference: effect.auditRef })
      if (effect.escalationKey) store.outbox.add(effect.escalationKey)
      return { status: 'confirmed', auditRef: effect.auditRef }
    }) },
  }
  const ports: V3IntegrationPorts = {
    import: store.importPorts, queue: { storage: store.queueStorage, invocationMilliseconds: 1000,
      backoffBaseMilliseconds: 100, backoffMaxMilliseconds: 400 },
    versionStore: store.versionStore, versionProofs: store.versionProofs, publication: store.publication, escalations: store.escalations,
    research: { work, results, artifacts }, visitor: store.visitor, monitor: { plans, sources, suppressions },
    invocationMilliseconds: 2000, projectionMaxAgeMilliseconds: 300_000,
  }
  function claim(job: V3ManagedJobRecord) { return { operationId: id('op3', `claim-${job.jobId}`), jobKey: jobKey(job),
    leaseId: id('lease3', `lease-${job.jobId}`), leaseMilliseconds: 1000 } }
  function monitorTarget(contextKey: string) {
    const h = store.history(contextKey); assert.ok(h.version && h.decision)
    monitorControl.target = { context: h.version.subject.context, factKind: h.version.subject.fact.fact.kind,
      source: h.version.subject.evidence.source, role: 'primary', baseline: {
        sourceContentHash: h.version.subject.evidence.sourceContentHash, sourceFingerprintProtocol: h.version.subject.evidence.sourceFingerprintProtocol },
      nextCheckAt: store.clock().now, primaryFreshUntil: store.freshUntil(), expectedVersionRef: h.version.reference,
      sourceDecisionRef: h.decision.reference, projectionRefs: [...h.invalidatedProjectionRefs], knownUnresolvedConflictRef: null }
  }
  return { originals, store, ports, run: createV3IntegrationCoordinator(ports), researchControl, heldResults,
    artifacts, claim, monitorControl, monitorTarget, suppressionOperations }
}
