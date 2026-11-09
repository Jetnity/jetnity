import 'server-only'
import { z } from 'zod'
import { evidenceVersionenVergleichen } from '@/lib/readiness/evidence'
import { readContentIdentityBinding, contentIdentityMatches, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { REGEL_FAKT_ARTEN } from '@/lib/readiness/rule-claims'
import { type QuellenRegistry } from '@/lib/readiness/source-registry'
import { createV3WorkIdentity, readV3GlobalRuleContext, resolveV3PublicSourceDisplay,
  type V3GlobalRuleContext, type V3MethodAuthorityPort, type V3MethodRef } from '../contract'
import { type V3QueueCoordinator } from './queue'
import { invocationBudget, readData, readNow, timestamp, versionRef, decisionRef, projectionRef, key, same } from './internal'

const contextSchema = z.unknown().transform((value, ctx): V3GlobalRuleContext => {
  const result = readV3GlobalRuleContext(value)
  if (!result.ok) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid' }); return z.NEVER }
  return result.value
})
const sourceSchema = z.unknown().transform((value, ctx): ContentIdentityBinding => {
  const result = readContentIdentityBinding(value)
  if (!result.ok) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid' }); return z.NEVER }
  return result.value
})
const methodSchema = z.object({ methodId: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/),
  revision: z.number().int().min(1).max(2_147_483_647) }).strict()
const fingerprint = z.object({ sourceContentHash: z.string().regex(/^[a-f0-9]{64}$/),
  sourceFingerprintProtocol: z.union([z.literal(1), z.literal(2)]) }).strict()
const targetSchema = z.object({ context: contextSchema, factKind: z.enum(REGEL_FAKT_ARTEN), source: sourceSchema,
  role: z.enum(['primary', 'counter']), baseline: fingerprint, nextCheckAt: timestamp,
  primaryFreshUntil: timestamp, expectedVersionRef: versionRef, sourceDecisionRef: decisionRef,
  projectionRefs: z.array(projectionRef).max(16).refine((refs) => new Set(refs).size === refs.length),
  knownUnresolvedConflictRef: z.string().regex(/^source-conflict:v3:[a-f0-9]{64}$/).nullable(),
}).strict()
export type V3MonitorTarget = z.infer<typeof targetSchema>
const planSchema = z.object({ method: methodSchema, targets: z.array(targetSchema).max(16),
  attemptLimit: z.number().int().min(1).max(16) }).strict()
const observedSchema = z.object({ source: sourceSchema, fingerprint, retrievedAt: timestamp }).strict()

export interface V3MonitorPlanPort<Receipt extends object> {
  /** Loaded server-owned canonical registry, never a visitor-supplied catalog. */
  registry: QuellenRegistry;
  load(signal: AbortSignal): Promise<{ status: 'available'; plan: unknown; receipt: Receipt } | { status: 'unavailable' }>
  /** Reprove approved source/role, original baseline, current version/conflict/archive head and plan revision. */
  reprove(receipt: Receipt, target: V3MonitorTarget, method: V3MethodRef, checkedAt: string, signal: AbortSignal): Promise<boolean>
}
export interface V3SourceObservationPort<Receipt extends object> {
  observe(target: V3MonitorTarget, method: V3MethodRef, signal: AbortSignal): Promise<
    { status: 'observed'; observation: unknown; receipt: Receipt }
    | { status: 'unclear'; receipt: Receipt } | { status: 'unreachable' | 'unavailable' }>
  /** True only for authentic original/qualified ambiguity under this plan/context/method. */
  reprove(receipt: Receipt, target: V3MonitorTarget, method: V3MethodRef, checkedAt: string, signal: AbortSignal): Promise<boolean>
}
export type V3ProjectionSuppression = Readonly<{
  operationId: string; auditRef: string; contextKey: string; expectedVersionRef: string; sourceDecisionRef: string;
  reason: 'known_conflict' | 'primary_unclear' | 'expired'; projectionRefs: readonly string[];
  escalationKey: string | null; observedAt: string;
}>
export interface V3ProjectionSuppressionPort {
  /** Atomically bind current version + append-only audit + dependent projection invalidation.
   * Consume operation IDs; reprove after waits/locks. An unknown outcome is confirmed only. */
  confirm(operationId: string, auditRef: string, signal: AbortSignal): Promise<
    { status: 'confirmed'; auditRef: string } | { status: 'not_attempted' | 'unconfirmed' | 'unavailable' }>
  apply(effect: V3ProjectionSuppression, reprove: (signal: AbortSignal) => Promise<boolean>, signal: AbortSignal): Promise<
    { status: 'confirmed'; auditRef: string } | { status: 'unconfirmed' | 'unavailable' | 'stale_head' }>
}
export type V3MonitorOutcome = Readonly<{
  contextKey: string; sourceId: string;
  status: 'unchanged' | 'research_queued' | 'already_researched' | 'optional_unreachable' | 'source_unavailable'
    | 'suppressed' | 'unconfirmed' | 'unavailable' | 'not_due' | 'invalid';
  ruleChange: 'not_asserted'; auditRef?: string; jobKey?: string;
}>

/** Bounded single pass. Comparison alone never accepts, refreshes or changes a rule. */
export async function runV3SourceMonitorOnce<PlanReceipt extends object, SourceReceipt extends object>(dependencies: Readonly<{
  plans: V3MonitorPlanPort<PlanReceipt> | null; sources: V3SourceObservationPort<SourceReceipt> | null;
  suppressions: V3ProjectionSuppressionPort | null; queue: V3QueueCoordinator | null;
  methodAuthority: V3MethodAuthorityPort<object> | null; now: () => string; invocationMilliseconds: number;
}>, signal?: AbortSignal): Promise<{ status: 'complete' | 'unavailable' | 'interrupted'; outcomes: readonly V3MonitorOutcome[] }> {
  const { plans, sources, suppressions, queue, methodAuthority } = dependencies
  if (!plans || !sources || !suppressions || !queue || !methodAuthority || !Number.isInteger(dependencies.invocationMilliseconds)
    || dependencies.invocationMilliseconds < 1 || dependencies.invocationMilliseconds > 30_000) return { status: 'unavailable', outcomes: [] }
  const budget = invocationBudget(dependencies.invocationMilliseconds, signal), outcomes: V3MonitorOutcome[] = []
  try {
    const loaded = await budget.call((s) => plans.load(s))
    if (!loaded.ok || loaded.value.status !== 'available') return { status: 'unavailable', outcomes }
    const plan = readData(loaded.value.plan, planSchema), planReceipt = loaded.value.receipt
    const now = readNow(dependencies.now)
    if (!plan || !now) return { status: 'unavailable', outcomes }
    const approval = await budget.call(() => methodAuthority.resolveCurrent(plan.method, now))
    if (!approval.ok || approval.value.status !== 'approved') return { status: 'unavailable', outcomes }
    const methodReceipt = approval.value.receipt
    const seen = new Set<string>()
    for (const target of plan.targets) {
      if (budget.signal.aborted) return { status: 'interrupted', outcomes }
      const identity = createV3WorkIdentity({ context: target.context, method: plan.method,
        factKind: target.factKind, researchReason: { status: 'missing' } })
      if (!identity.ok) return { status: 'unavailable', outcomes }
      const contextKey = identity.value.contextKey
      const base = { contextKey, sourceId: target.source.sourceId, ruleChange: 'not_asserted' as const }
      const unique = key('monitor-target', { contextKey, source: target.source, factKind: target.factKind })
      if (seen.has(unique) || !resolveV3PublicSourceDisplay(target.source, plans.registry).ok) {
        outcomes.push({ ...base, status: 'invalid' }); continue
      }
      seen.add(unique)
      const instant = readNow(dependencies.now)
      if (!instant) return { status: 'unavailable', outcomes }
      let sourceReceiptForEffect: SourceReceipt | null = null
      const reprove = async (s: AbortSignal) => {
        const at = readNow(dependencies.now)
        if (!at || s.aborted) return false
        const method = await budget.call(() => methodAuthority.reproveAtCommit(methodReceipt, plan.method, at))
        const targetProof = await budget.call((child) => plans.reprove(planReceipt, target, plan.method, at, child))
        if (!method.ok || method.value.status !== 'current' || !targetProof.ok || !targetProof.value || s.aborted) return false
        if (sourceReceiptForEffect !== null) {
          const sourceReceipt = sourceReceiptForEffect
          const observed = await budget.call((child) => sources.reprove(sourceReceipt, target, plan.method, at, child))
          if (!observed.ok || !observed.value) return false
        }
        return !s.aborted
      }
      if (!await reprove(budget.signal)) { outcomes.push({ ...base, status: 'unavailable' }); continue }
      let expired = target.primaryFreshUntil <= instant
      let reason: V3ProjectionSuppression['reason'] | null = target.knownUnresolvedConflictRef ? 'known_conflict' : expired ? 'expired' : null
      let observed: { status: 'observed'; observation: unknown; receipt: SourceReceipt } | { status: 'unclear'; receipt: SourceReceipt }
        | { status: 'unreachable' | 'unavailable' } | null = null
      async function suppress(reasonToApply: V3ProjectionSuppression['reason'], at: string): Promise<boolean> {
        const escalationSeed = { contextKey, method: plan!.method, expectedVersionRef: target.expectedVersionRef,
          sourceDecisionRef: target.sourceDecisionRef, reason: reasonToApply, conflict: target.knownUnresolvedConflictRef }
        const seed = { ...escalationSeed, projectionRefs: [...target.projectionRefs].sort() }
        const auditRef = key('projection-suppression', seed), operationId = `op3_${auditRef.split(':').at(-1)!.slice(0, 32)}`
        const effect: V3ProjectionSuppression = { operationId, auditRef, contextKey, expectedVersionRef: target.expectedVersionRef,
          sourceDecisionRef: target.sourceDecisionRef, reason: reasonToApply, projectionRefs: target.projectionRefs,
          escalationKey: reasonToApply === 'expired' ? null : key('source-escalation', escalationSeed), observedAt: at }
        const previous = await budget.call((s) => suppressions!.confirm(operationId, auditRef, s))
        if (!previous.ok || previous.value.status === 'unconfirmed') { outcomes.push({ ...base, status: 'unconfirmed' }); return false }
        if (previous.value.status === 'unavailable') { outcomes.push({ ...base, status: 'unavailable' }); return false }
        const write = previous.value.status === 'confirmed' ? { ok: true as const, value: previous.value }
          : await budget.call((s) => suppressions!.apply(effect, reprove, s))
        if (!write.ok || write.value.status !== 'confirmed' || write.value.auditRef !== auditRef) {
          outcomes.push({ ...base, status: 'unconfirmed' }); return false
        }
        // A historical operation receipt does not authorize a current effect after
        // a method/plan/head changed while confirm or apply was awaited.
        if (!await reprove(budget.signal)) { outcomes.push({ ...base, status: 'unconfirmed' }); return false }
        outcomes.push({ ...base, status: 'suppressed', auditRef })
        return true
      }
      // A source outage/timeout must not delay an already-known invalidation.
      if (reason && !await suppress(reason, instant)) continue
      if (target.nextCheckAt <= instant) {
        const read = await budget.call((s) => sources.observe(target, plan.method, s))
        observed = read.ok ? read.value : { status: 'unavailable' }
        if ('receipt' in observed) {
          const at = readNow(dependencies.now), receipt = observed.receipt
          const valid = at ? await budget.call((s) => sources.reprove(receipt, target, plan.method, at, s)) : null
          if (!valid?.ok || !valid.value) observed = { status: 'unavailable' }
          else sourceReceiptForEffect = receipt
        }
      }
      const effectTime = readNow(dependencies.now)
      if (!effectTime) return { status: 'unavailable', outcomes }
      expired = target.primaryFreshUntil <= effectTime
      const discoveredReason = reason === 'known_conflict' ? reason
        : observed?.status === 'unclear' && target.role === 'primary' ? 'primary_unclear'
          : expired ? 'expired' : null
      if (discoveredReason && discoveredReason !== reason) {
        if (!await suppress(discoveredReason, effectTime)) continue
        reason = discoveredReason
      }
      if (observed === null) { if (!reason) outcomes.push({ ...base, status: 'not_due' }); continue }
      if (observed.status === 'unreachable' || observed.status === 'unavailable') {
        if (!reason) outcomes.push({ ...base, status: target.role === 'counter' ? 'optional_unreachable' : 'source_unavailable' })
        continue
      }
      let changed = observed.status === 'unclear'
      let observationSeed: unknown = { status: observed.status, decision: target.sourceDecisionRef }
      if (observed.status === 'observed') {
        const item = readData(observed.observation, observedSchema), at = readNow(dependencies.now)
        if (!item || !at || item.retrievedAt > at || !contentIdentityMatches(item.source, target.source)) {
          outcomes.push({ ...base, status: 'invalid' }); continue
        }
        // Canonical legacy Evidence represents protocol 1 by absence, not literal 1.
        const legacy = (value: z.infer<typeof fingerprint>) => value.sourceFingerprintProtocol === 1
          ? { sourceContentHash: value.sourceContentHash } : { sourceContentHash: value.sourceContentHash, sourceFingerprintProtocol: 2 as const }
        const comparison = evidenceVersionenVergleichen(legacy(target.baseline), legacy(item.fingerprint))
        if (!comparison.ok || comparison.ruleChange !== 'not_asserted') { outcomes.push({ ...base, status: 'invalid' }); continue }
        changed = comparison.contentChanged
        observationSeed = { source: item.source, fingerprint: item.fingerprint }
      }
      if (!changed && !reason) { outcomes.push({ ...base, status: 'unchanged' }); continue }
      if (!await reprove(budget.signal)) { outcomes.push({ ...base, status: 'unavailable' }); continue }
      const opSeed = { contextKey, factKind: target.factKind, method: plan.method, previous: target.expectedVersionRef, observationSeed, reason }
      const operation = key('monitor-research', opSeed).split(':').at(-1)!
      const enqueued = await budget.call((s) => queue.enqueue({ context: target.context, method: plan.method, factKind: target.factKind,
        researchReason: expired ? { status: 'recheck_needed', reason: 'max_age_exceeded' } : { status: 'missing' },
        operationId: `op3_${operation.slice(0, 32)}`, jobId: `job3_${operation.slice(32)}`, attemptLimit: plan.attemptLimit }, s))
      if (!enqueued.ok || enqueued.value.status !== 'confirmed') { outcomes.push({ ...base, status: 'unconfirmed' }); continue }
      const job = enqueued.value.record
      if (job.kind !== 'research_job_record' || !same(job.method, plan.method) || job.contextKey !== contextKey) {
        outcomes.push({ ...base, status: 'invalid' }); continue
      }
      outcomes.push({ ...base, status: ['queued', 'leased', 'backoff'].includes(job.state) ? 'research_queued' : 'already_researched', jobKey: job.jobKey })
    }
    return { status: budget.signal.aborted ? 'interrupted' : 'complete', outcomes }
  } catch { return { status: 'unavailable', outcomes } } finally { budget.dispose() }
}
