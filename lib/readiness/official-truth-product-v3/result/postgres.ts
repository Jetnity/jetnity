// Dormant HRS adapters. Durable SQL and private source/method custody are both required.
import 'server-only'
import { ownRecord, immutable } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { readV3SourceDecisionRecord, readV3RuleVersionRecord, readV3TransitionPlan, readV3PublicProjectionRecord,
  type V3ReadClock, type V3MethodRef } from '../contract'
import type { V3ImportHistoryPort, V3ImportHistory, V3ImportPrepared } from '../import/service-server'
import type { V3VersionCommitPort, V3TransitionProofPort, V3TransitionAtomicCommand, V3VersionHead } from '../monitor/recovery'
import type { V3ProjectionPublicationPort, V3EscalationPublicationPort, V3PublicationCommand,
  V3EscalationCommand, V3IntegrationPorts } from '../integration/ports'
import type { V3MonitorTarget, V3MonitorOutcome } from '../monitor/monitor'
import type { V3ProjectionBinding } from '../visitor/query'
import { readV3IntakeReference, type V3IntakeReference } from '../storage/intake-contract'
import { HRS1_LIMITS, hrs1Canonical, hrs1Hash, hrs1Ref, hrs1Same, hrs1Data, hrs1Time, hrs1Clock, hrs1Method,
  type Hrs1Binding, type Hrs1FixedOperation, type Hrs1Operation, type Hrs1Reply, type Hrs1Verification } from './contract'
import type { Hrs1SourceConsumer } from './source-proof'

type HistoryState = Readonly<{ history: V3ImportHistory; head: V3VersionHead;
  stickyDecision: unknown; suppressionEpoch: number; generation: number; suppression: unknown }>
type Proof = Readonly<{ prepared: V3ImportPrepared; receipt: object; verification: Hrs1Verification }>
type Plan = Readonly<{ generation: number; plan: Readonly<{ method: V3MethodRef; targets: readonly V3MonitorTarget[]; attemptLimit: number }> }>
export type Hrs1ResultPorts = Readonly<{
  evidence: Hrs1SourceConsumer['evidence']; history: V3ImportHistoryPort<object>;
  versionStore: V3VersionCommitPort; versionProofs: V3TransitionProofPort<object>;
  publication: V3ProjectionPublicationPort; escalations: V3EscalationPublicationPort;
  visitor: V3IntegrationPorts['visitor']; monitor: V3IntegrationPorts['monitor'];
  /** Actual M04 artifact/S1 references, retained only for this invocation. SQL reopens
   * and locks the exact durable binding, original bytes, completion and audit. */
  bindIntake(references: readonly V3IntakeReference[]): void;
  claimMonitor(operationId: string, claimId: string, signal: AbortSignal): Promise<Hrs1Reply>;
  finishMonitor(operationId: string, claimId: string, generation: number,
    outcomes: readonly V3MonitorOutcome[], signal: AbortSignal): Promise<Hrs1Reply>;
}>

function preparedRead(raw: unknown, registry: QuellenRegistry, binding: Hrs1Binding): V3ImportPrepared | null {
  if (!hrs1Data(raw)) return null
  const r = ownRecord(raw, ['proposalDigest','decision','previousDecision','archiveAppend','version','transition',
    'proposalDisposition','acceptance','reproof'])
  if (!r || typeof r.proposalDigest !== 'string' || !/^[a-f0-9]{64}$/.test(r.proposalDigest)
    || !['matched','superseded_by_source'].includes(String(r.proposalDisposition))
    || r.acceptance !== 'not_committed' || r.reproof !== 'required_before_commit') return null
  const decision = readV3SourceDecisionRecord(r.decision, registry, r.previousDecision, r.archiveAppend)
  const transition = readV3TransitionPlan(r.transition)
  if (!decision.ok || !transition.ok) return null
  const version = readV3RuleVersionRecord(r.version, registry, decision.value)
  if (!version.ok || !hrs1Same(decision.value, r.decision) || !hrs1Same(transition.value, r.transition)
    || !hrs1Same(version.value, r.version) || !hrs1Same(decision.value.context, binding.context)
    || decision.value.contextKey !== binding.contextKey || decision.value.factKind !== binding.factKind
    || !hrs1Same(decision.value.method, hrs1Method(binding))
    || transition.value.contextKey !== binding.contextKey || transition.value.factKind !== binding.factKind
    || !hrs1Same(transition.value.method, hrs1Method(binding))
    || version.value.reference !== transition.value.next.versionRef || version.value.revision !== transition.value.next.revision
    || version.value.state !== transition.value.next.state || version.value.predecessor !== transition.value.expected.versionRef
    || version.value.operationId !== transition.value.operationId || version.value.sourceDecisionRef !== decision.value.reference
    || transition.value.sourceDecisionRef !== decision.value.reference
    || version.value.subject.evidence.versionId !== transition.value.primaryEvidenceVersionId) return null
  return immutable(JSON.parse(hrs1Canonical(r)) as V3ImportPrepared)
}

/** Selected code-owned executors only. None of these DTO readers creates authority. */
export function createHrs1ResultPorts(input: Readonly<{
  binding: Hrs1Binding; registry: QuellenRegistry; fixed: Hrs1FixedOperation; clock: () => V3ReadClock;
  source: Hrs1SourceConsumer; ids(): Readonly<{ jobId: string; operationId: string }>;
}>): Hrs1ResultPorts {
  const { binding, registry, fixed, clock, source } = input
  const histories = new WeakMap<object, HistoryState>(), proofs = new WeakMap<object, Proof>()
  const projections = new WeakMap<object, V3ProjectionBinding>(), plans = new WeakMap<object, Plan>()
  const intakes = new Map<string, V3IntakeReference>()
  let badIntakes = false, lastPlan: Plan | null = null
  const closed = (): Hrs1Reply => ({ status: 'unavailable' })
  function validClock(): V3ReadClock | null {
    try { const c = clock(); return hrs1Same(c, hrs1Clock(c.now, binding.legalTimeZone)) ? c : null } catch { return null }
  }
  function receipt(): object { return Object.freeze(Object.create(null) as object) }
  async function call(operation: Hrs1Operation, body: Record<string, unknown>, signal: AbortSignal,
    methodReceipt?: object, notAfter?: string): Promise<Hrs1Reply> {
    if (!source.available || signal.aborted || !hrs1Data(body) || !validClock()) return closed()
    return fixed({ schema: 1, operation, bindingHash: hrs1Hash(binding), body }, signal, methodReceipt, notAfter)
  }
  function intake(operationId: string, digest: string): V3IntakeReference | null {
    const r = intakes.get(operationId)
    return !badIntakes && r && r.proposalDigest === digest && r.binding.contextKey === binding.contextKey
      && hrs1Same(r.binding.method, hrs1Method(binding)) ? r : null
  }
  function state(raw: unknown): HistoryState | null {
    if (!hrs1Data(raw)) return null
    const r = ownRecord(raw, ['history','head','stickyDecision','suppressionEpoch','generation','suppression'])
    if (!r || !Number.isSafeInteger(r.suppressionEpoch) || (r.suppressionEpoch as number) < 0
      || !Number.isSafeInteger(r.generation) || (r.generation as number) < 0
      || !ownRecord(r.history, ['pointer','version','decision','decisionPredecessor','decisionArchiveAppend','invalidatedProjectionRefs'])
      || !ownRecord(r.head, ['pointer','sourceDecisionRef','historyArchive'])) return null
    return immutable(JSON.parse(hrs1Canonical(r)) as HistoryState)
  }
  const history: V3ImportHistoryPort<object> = Object.freeze<V3ImportHistoryPort<object>>({
    async read(contextKey, factKind, signal) {
      if (contextKey !== binding.contextKey || factKind !== binding.factKind) return { status: 'unavailable' }
      const r = await call('history', { contextKey, factKind }, signal), h = r.status === 'snapshot' ? state(r.value) : null
      if (!h) return { status: 'unavailable' }
      const own = receipt(); histories.set(own, h)
      return { status: 'snapshot', receipt: own, history: h.history }
    },
    async reprove(own, value, signal) {
      const old = histories.get(own)
      if (!old || !hrs1Same(old.history, value)) return { status: 'changed' }
      const r = await call('history', { contextKey: binding.contextKey, factKind: binding.factKind }, signal)
      const current = r.status === 'snapshot' ? state(r.value) : null
      return current ? { status: hrs1Same(current, old) ? 'current' : 'changed' } : { status: 'unavailable' }
    },
  })
  async function reproveProof(own: object, prepared: V3ImportPrepared, at: V3ReadClock, signal: AbortSignal): Promise<Proof | null> {
    const h = proofs.get(own)
    if (!h || !hrs1Same(h.prepared, prepared) || !hrs1Same(at, hrs1Clock(at.now, binding.legalTimeZone))
      || at.now >= h.verification.validUntilExclusive
      || !await source.reproveVerification(h.receipt, h.verification, at, signal) || signal.aborted) return null
    return source.held(h.receipt) === h.verification ? h : null
  }
  const versionProofs: V3TransitionProofPort<object> = Object.freeze<V3TransitionProofPort<object>>({
    async inspect(raw, checkedAt, legalDate, signal) {
      const prepared = preparedRead(raw, registry, binding)
      const at = hrs1Clock(checkedAt, binding.legalTimeZone)
      if (!prepared || !at || at.legalDate !== legalDate) return { status: 'invalid' }
      const issued = await source.openVerification(hrs1Ref('hrs1-decision-custody', prepared.decision), signal)
      if (!issued || !hrs1Same(issued.verification.decision, prepared.decision)
        || !hrs1Same(issued.verification.previousDecision, prepared.previousDecision)
        || !hrs1Same(issued.verification.archiveAppend, prepared.archiveAppend)
        || !await source.reproveVerification(issued.receipt, issued.verification, at, signal)) return { status: 'unavailable' }
      const own = receipt()
      proofs.set(own, { prepared, receipt: issued.receipt, verification: issued.verification })
      return { status: 'verified', receipt: own }
    },
    async reprove(own, raw, checkedAt, legalDate, signal) {
      const prepared = preparedRead(raw, registry, binding), at = hrs1Clock(checkedAt, binding.legalTimeZone)
      if (!prepared || !at || at.legalDate !== legalDate) return { status: 'invalid' }
      const h = await reproveProof(own, prepared, at, signal)
      return h ? { status: 'current', freshUntil: h.verification.validUntilExclusive } : { status: 'unavailable' }
    },
  })
  async function transition(command: V3TransitionAtomicCommand, current: boolean, signal: AbortSignal): Promise<Hrs1Reply> {
    const prepared = preparedRead(command.prepared, registry, binding), cap = command.notAfter
    const methodReceipt = command.authority.methodReceipt, proofReceipt = command.authority.proofReceipt
    if (!prepared || !hrs1Time(cap) || !hrs1Data(command.expectedHead)
      || !hrs1Same(command.authority.method, hrs1Method(binding)) || !methodReceipt || !proofReceipt) return closed()
    const expectedHead = immutable(JSON.parse(hrs1Canonical(command.expectedHead)) as V3VersionHead)
    const original = intake(prepared.transition.operationId, prepared.proposalDigest)
    if (!original || (await command.reprove(signal)).status !== 'current') return closed()
    const at = validClock(), h = at ? await reproveProof(proofReceipt, prepared, at, signal) : null
    if (!h || !at || at.now >= cap) return closed()
    return call(current ? 'transition_current' : 'transition', { operationKey: command.operationKey, prepared, expectedHead,
      verificationRef: h.verification.reference, intake: original }, signal, methodReceipt,
      cap < h.verification.validUntilExclusive ? cap : h.verification.validUntilExclusive)
  }
  const versionStore: V3VersionCommitPort = Object.freeze<V3VersionCommitPort>({
    async confirm(operationId, operationKey, signal) {
      const r = await call('version_confirm', { operationId, operationKey }, signal)
      return r.status === 'committed' ? { status: 'committed', confirmation: r.value }
        : ['not_attempted','collision','unconfirmed'].includes(r.status)
          ? { status: r.status as 'not_attempted' | 'collision' | 'unconfirmed' } : { status: 'unavailable' }
    },
    async readHead(contextKey, factKind, signal) {
      if (contextKey !== binding.contextKey || factKind !== binding.factKind) return { status: 'unavailable' }
      const r = await call('head', { contextKey, factKind }, signal)
      return r.status === 'current' && ownRecord(r.value, ['pointer','sourceDecisionRef','historyArchive'])
        ? { status: 'current', head: r.value as V3VersionHead } : { status: 'unavailable' }
    },
    atomicBoundary: Object.freeze<V3VersionCommitPort['atomicBoundary']>({
      async commit(command, signal) {
        const r = await transition(command, false, signal)
        return r.status === 'committed' ? { status: 'commit_reported' }
          : ['unconfirmed','stale_head'].includes(r.status) ? { status: r.status as 'unconfirmed' | 'stale_head' } : { status: 'unavailable' }
      },
      async confirmCurrent(command, signal) {
        const r = await transition(command, true, signal)
        return r.status === 'current' ? { status: 'current', confirmation: r.value }
          : r.status === 'unconfirmed' ? { status: 'unconfirmed' }
          : r.status === 'not_current' || r.status === 'stale_head' ? { status: 'not_current' } : { status: 'unavailable' }
      },
    }),
  })
  async function publicationCall(command: V3PublicationCommand, confirm: boolean, signal: AbortSignal): Promise<Hrs1Reply> {
    const prepared = preparedRead(command.prepared, registry, binding), cap = command.notAfter
    if (!prepared || !hrs1Time(cap)) return closed()
    const projection = readV3PublicProjectionRecord(command.projection, registry, validClock())
    if (!projection.ok || !hrs1Same(projection.value, command.projection) || !hrs1Same(projection.value.rule, prepared.version)) return closed()
    const original = intake(prepared.transition.operationId, prepared.proposalDigest)
    const proofReceipt = command.proofReceipt, methodReceipt = command.methodReceipt
    if (!original || (await command.reprove(signal)).status !== 'current') return closed()
    const at = validClock(), h = at ? await reproveProof(proofReceipt, prepared, at, signal) : null
    if (!h || !at || at.now >= cap) return closed()
    return call(confirm ? 'publication_confirm' : 'publication', { operationId: command.operationId, operationKey: command.operationKey,
      prepared, projection: projection.value, verificationRef: h.verification.reference, intake: original }, signal,
      methodReceipt, cap < h.verification.validUntilExclusive ? cap : h.verification.validUntilExclusive)
  }
  const publication: V3ProjectionPublicationPort = Object.freeze<V3ProjectionPublicationPort>({
    async confirm(command, signal) {
      const r = await publicationCall(command, true, signal)
      if (r.status === 'confirmed' && ownRecord(r.value, ['operationId','operationKey','projectionRef','versionRef','checkedAt','freshUntil'])) {
        return { status: 'confirmed', confirmation: r.value as Extract<Awaited<ReturnType<V3ProjectionPublicationPort['confirm']>>, { status: 'confirmed' }>['confirmation'] }
      }
      return ['not_attempted','not_current','unconfirmed','collision'].includes(r.status)
        ? { status: r.status as 'not_attempted' | 'not_current' | 'unconfirmed' | 'collision' } : { status: 'unavailable' }
    },
    async publish(command, signal) {
      const r = await publicationCall(command, false, signal)
      return ['reported','unconfirmed','collision','not_current'].includes(r.status)
        ? { status: r.status as 'reported' | 'unconfirmed' | 'collision' | 'not_current' } : { status: 'unavailable' }
    },
  })
  async function escalationCall(command: V3EscalationCommand, confirm: boolean, signal: AbortSignal): Promise<Hrs1Reply> {
    if (!hrs1Data(command) || !hrs1Same(command.upload.proposal.context, binding.context)
      || command.upload.proposal.contextKey !== binding.contextKey) return closed()
    const value = immutable(JSON.parse(hrs1Canonical(command)) as V3EscalationCommand)
    const original = intake(value.upload.proposal.operationId, value.upload.digest)
    const issued = await source.openVerification(hrs1Ref('hrs1-decision-custody', value.outcome.decision), signal)
    const at = validClock()
    if (!original || !issued || !at || !hrs1Same(issued.verification.decision, value.outcome.decision)
      || !hrs1Same(issued.verification.previousDecision, value.outcome.previousDecision)
      || !hrs1Same(issued.verification.archiveAppend, value.outcome.archiveAppend)
      || !await source.reproveVerification(issued.receipt, issued.verification, at, signal)) return closed()
    return call(confirm ? 'escalation_confirm' : 'escalation', { ...value, verificationRef: issued.verification.reference, intake: original },
      signal, undefined, issued.verification.validUntilExclusive)
  }
  const escalations: V3EscalationPublicationPort = Object.freeze<V3EscalationPublicationPort>({
    async confirm(command, signal) {
      const r = await escalationCall(command, true, signal)
      const v = r.status === 'confirmed' && ownRecord(r.value, ['operationKey','escalationKey'])
      return v && typeof v.operationKey === 'string' && typeof v.escalationKey === 'string'
        ? { status: 'confirmed', operationKey: v.operationKey, escalationKey: v.escalationKey }
        : ['not_attempted','unconfirmed','collision'].includes(r.status)
          ? { status: r.status as 'not_attempted' | 'unconfirmed' | 'collision' } : { status: 'unavailable' }
    },
    async publish(command, signal) {
      const r = await escalationCall(command, false, signal)
      return ['reported','unconfirmed','collision'].includes(r.status)
        ? { status: r.status as 'reported' | 'unconfirmed' | 'collision' } : { status: 'unavailable' }
    },
  })
  const failure = { status: 503, message: 'Temporary failure' } as const
  const visitor: V3IntegrationPorts['visitor'] = {
    dataMode: binding.dataMode, ids: input.ids,
    coverage: { async targets(pair, signal) {
      const r = await call('coverage', { ...pair }, signal)
      return r.status === 'current' && Array.isArray(r.value) ? { zeilen: r.value as { context: Hrs1Binding['context']; factKind: Hrs1Binding['factKind'] }[], problem: null }
        : { zeilen: null, problem: failure }
    } },
    cache: { async read(key, signal) {
      const r = await call('projection', { key }, signal)
      if (r.status === 'missing') return { zeilen: [], problem: null }
      return r.status === 'current' && Array.isArray(r.value) ? { zeilen: r.value, problem: null } : { zeilen: null, problem: failure }
    } },
    current: {
      async reprove(raw, signal) {
        if (!hrs1Data(raw)) return { status: 'unavailable' }
        const bound = immutable(JSON.parse(hrs1Canonical(raw)) as V3ProjectionBinding)
        const r = await call('projection_current', { binding: bound }, signal)
        if (r.status === 'current' && hrs1Same(r.value, bound)) {
          const own = receipt(); projections.set(own, bound); return { status: 'current', binding: bound, receipt: own }
        }
        const conflict = r.status === 'conflict' && ownRecord(r.value, ['decisionRef','reason'])
        if (conflict && typeof conflict.decisionRef === 'string' && ['comparable_conflict','primary_unclear'].includes(String(conflict.reason))) {
          return { status: 'conflict', decisionRef: conflict.decisionRef, reason: conflict.reason as 'comparable_conflict' | 'primary_unclear' }
        }
        return r.status === 'missing' || r.status === 'not_current' ? { status: 'withdrawn' } : { status: 'unavailable' }
      },
      async confirmBatch(items, methodReceipt, at, signal) {
        if (!Array.isArray(items) || items.length > HRS1_LIMITS.batchProjections || !hrs1Same(at, hrs1Clock(at.now, binding.legalTimeZone))
          || items.some(item => !hrs1Same(projections.get(item.receipt), item.binding))) return { status: 'unavailable' }
        const r = await call('projection_batch', { bindings: items.map(item => projections.get(item.receipt)!) }, signal, methodReceipt)
        return r.status === 'confirmed' && Array.isArray(r.value) && r.value.every(v => typeof v === 'string')
          ? { status: 'confirmed', currentProjectionRefs: r.value as string[] }
          : r.status === 'not_current' || r.status === 'missing' ? { status: 'not_current' } : { status: 'unavailable' }
      },
    },
  }
  const monitor: V3IntegrationPorts['monitor'] = {
    sources: source.sources,
    plans: {
      registry,
      async load(signal) {
        const r = await call('plan', {}, signal), row = r.status === 'snapshot' && ownRecord(r.value, ['generation','plan'])
        if (!row || !Number.isSafeInteger(row.generation) || !hrs1Data(row.plan)) return { status: 'unavailable' }
        const p = immutable(JSON.parse(hrs1Canonical(row)) as Plan), own = receipt()
        if (!hrs1Same(p.plan.method, hrs1Method(binding)) || !Array.isArray(p.plan.targets) || p.plan.targets.length > HRS1_LIMITS.monitorTargets) return { status: 'unavailable' }
        plans.set(own, p); lastPlan = p
        return { status: 'available', plan: p.plan, receipt: own }
      },
      async reprove(own, target, method, checkedAt, signal) {
        const p = plans.get(own)
        if (!p || !hrs1Same(method, hrs1Method(binding)) || !p.plan.targets.some(t => hrs1Same(t, target)) || !hrs1Time(checkedAt)) return false
        const r = await call('plan_reprove', { generation: p.generation, target }, signal)
        return r.status === 'current' && hrs1Same(r.value, { generation: p.generation, target })
      },
    },
    suppressions: {
      async confirm(operationId, auditRef, signal) {
        const r = await call('suppression_confirm', { operationId, auditRef }, signal)
        return r.status === 'confirmed' && hrs1Same(r.value, { auditRef }) ? { status: 'confirmed', auditRef }
          : r.status === 'not_attempted' ? { status: 'not_attempted' } : r.status === 'unconfirmed' ? { status: 'unconfirmed' } : { status: 'unavailable' }
      },
      async apply(effect, reprove, signal) {
        if (!hrs1Data(effect) || !lastPlan || !await reprove(signal)) return { status: 'unavailable' }
        const original = immutable(JSON.parse(hrs1Canonical(effect)) as typeof effect)
        const selected = lastPlan.plan.targets.find(t => t.expectedVersionRef === original.expectedVersionRef
          && t.sourceDecisionRef === original.sourceDecisionRef && hrs1Same(t.projectionRefs, original.projectionRefs))
        if (!selected) return { status: 'unavailable' }
        const observation = source.lastObservation(selected)
        const r = await call('suppress', { effect: original, generation: lastPlan.generation,
          observationRef: observation?.reference ?? null }, signal)
        return r.status === 'confirmed' && hrs1Same(r.value, { auditRef: original.auditRef }) ? { status: 'confirmed', auditRef: original.auditRef }
          : r.status === 'stale_head' ? { status: 'stale_head' } : r.status === 'unconfirmed' ? { status: 'unconfirmed' } : { status: 'unavailable' }
      },
    },
  }
  return Object.freeze({ evidence: source.evidence, history, versionStore, versionProofs, publication, escalations,
    visitor, monitor,
    bindIntake(references) {
      if (!Array.isArray(references) || references.length > 16 || badIntakes) { badIntakes = true; return }
      for (const raw of references) {
        const parsed = readV3IntakeReference(raw)
        if (!parsed.ok || (intakes.has(parsed.value.binding.operationId) && !hrs1Same(intakes.get(parsed.value.binding.operationId), parsed.value))) {
          badIntakes = true; return
        }
        intakes.set(parsed.value.binding.operationId, parsed.value)
        if (intakes.size > 16) { badIntakes = true; return }
      }
    },
    claimMonitor: (operationId, claimId, signal) => call('monitor_claim', { operationId, claimId }, signal),
    finishMonitor: (operationId, claimId, generation, outcomes, signal) =>
      call('monitor_finish', { operationId, claimId, generation, outcomes }, signal),
  })
}
