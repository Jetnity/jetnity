// Code-owned HRS composition. Every nested promise remains owned through drain.
import 'server-only'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { createV3WorkIdentity } from '../contract'
import type { M04Config, M04Facade, M04Authority, M04FixedOperation } from '../jobs/contract'
import { composeM04ResultInvocation } from '../jobs/composition'
import type { createM04InvocationScope } from '../jobs/owned-scope'
import { createV3VisitorQuery, type V3VisitorQueryResult } from '../visitor/query'
import { runV3SourceMonitorOnce, type V3MonitorOutcome } from '../monitor/monitor'
import { createHrs1SourceConsumer, type Hrs1SourceConsumer } from './source-proof'
import { createHrs1ResultPorts, type Hrs1ResultPorts } from './postgres'
import { HRS1_LIMITS, hrs1Hash, hrs1Same, hrs1Time, type Hrs1Binding, type Hrs1Config, type Hrs1FixedOperation } from './contract'

type Scope = NonNullable<ReturnType<typeof createM04InvocationScope>>
export type Hrs1MonitorResult = Readonly<{
  status: 'complete' | 'unavailable' | 'interrupted'; outcomes: readonly V3MonitorOutcome[];
}>
export type Hrs1Facade = M04Facade & Readonly<{
  query(raw: unknown, signal?: AbortSignal): Promise<V3VisitorQueryResult>;
  monitorOnce(signal?: AbortSignal, budget?: Readonly<{ deadline: number }>): Promise<Hrs1MonitorResult>;
  workSelectedOnce(kind: 'rule_research' | 'combination_discovery', signal?: AbortSignal,
    budget?: Readonly<{ deadline: number }>): ReturnType<M04Facade['workOnce']>;
}>

/** Internal only. Neither a connection nor a proof receipt is returned by the
 * public factory; this assembly retains all queued/source/read promises. */
export function composeHrs1Invocation(input: Readonly<{
  config: M04Config; result: Hrs1Config; binding: Hrs1Binding; scope: Scope; callDeadline: number;
  authority: M04Authority; processingAuthority: M04Authority;
  fixed: M04FixedOperation; processingFixed: M04FixedOperation;
  resultFixed: Hrs1FixedOperation; processingResultFixed: Hrs1FixedOperation;
}>) {
  const pending = new Set<Promise<unknown>>()
  function owned<T>(run: () => Promise<T>): Promise<T> {
    const actual = Promise.resolve().then(run)
    pending.add(actual)
    return actual.finally(() => pending.delete(actual))
  }
  // Applied only to these locally constructed all-async method objects.
  function ownMethods<T extends object>(value: T): T {
    const copy = { ...value }
    for (const [name, method] of Object.entries(value)) {
      if (typeof method !== 'function') continue
      Object.defineProperty(copy, name, { enumerable: true, value: (...args: unknown[]) =>
        owned(() => Promise.resolve(Reflect.apply(method, value, args))) })
    }
    return Object.freeze(copy)
  }
  function source(fixed: Hrs1FixedOperation): Hrs1SourceConsumer {
    const raw = createHrs1SourceConsumer({ binding: input.binding, registry: input.config.registry,
      fixed, clock: input.config.clock, fixtureIssuer: input.result.fixtureIssuer })
    return Object.freeze({ ...raw, evidence: ownMethods(raw.evidence), sources: ownMethods(raw.sources),
      openVerification: (...args: Parameters<typeof raw.openVerification>) => owned(() => raw.openVerification(...args)),
      reproveVerification: (...args: Parameters<typeof raw.reproveVerification>) => owned(() => raw.reproveVerification(...args)),
    })
  }
  function ports(fixed: Hrs1FixedOperation): Hrs1ResultPorts {
    const raw = createHrs1ResultPorts({ binding: input.binding, registry: input.config.registry,
      fixed, clock: input.config.clock, source: source(fixed), ids: input.result.ids })
    return Object.freeze({ ...raw, history: ownMethods(raw.history), evidence: ownMethods(raw.evidence),
      versionStore: Object.freeze({ ...ownMethods(raw.versionStore),
        atomicBoundary: raw.versionStore.atomicBoundary ? ownMethods(raw.versionStore.atomicBoundary) : null }),
      versionProofs: ownMethods(raw.versionProofs), publication: ownMethods(raw.publication), escalations: ownMethods(raw.escalations),
      visitor: Object.freeze({ ...raw.visitor, coverage: ownMethods(raw.visitor.coverage),
        cache: ownMethods(raw.visitor.cache), current: ownMethods(raw.visitor.current) }),
      monitor: Object.freeze({ plans: raw.monitor.plans ? ownMethods(raw.monitor.plans) : null,
        sources: raw.monitor.sources ? ownMethods(raw.monitor.sources) : null,
        suppressions: raw.monitor.suppressions ? ownMethods(raw.monitor.suppressions) : null }),
      claimMonitor: (...args: Parameters<typeof raw.claimMonitor>) => owned(() => raw.claimMonitor(...args)),
      finishMonitor: (...args: Parameters<typeof raw.finishMonitor>) => owned(() => raw.finishMonitor(...args)),
    })
  }
  const outer = ports(input.resultFixed), processing = ports(input.processingResultFixed)
  const jobs = composeM04ResultInvocation({ config: { ...input.config, producer: ownMethods(input.config.producer) }, scope: input.scope,
    authority: input.authority, processingAuthority: input.processingAuthority,
    fixed: input.fixed, processingFixed: input.processingFixed,
    result: { outer, processing, projectionMaxAgeMilliseconds: input.binding.projectionMaxAgeMilliseconds,
      callDeadline: Math.min(input.scope.deadline, input.callDeadline) } })
  const ruleQueue = ownMethods(jobs.ruleQueue), discoveryQueue = ownMethods(jobs.discoveryQueue)
  function visitorQueue(selected: typeof ruleQueue) {
    return Object.freeze({ async enqueue(raw: unknown, signal: AbortSignal) {
      const value = await selected.enqueue(raw, signal)
      if (value.status === 'confirmed') return { status: 'confirmed' as const, record: value.record }
      if (value.status === 'unconfirmed') return { status: 'unconfirmed' as const }
      return value.status === 'collision' || value.status === 'contended' ? { status: 'conflict' as const } : { status: 'unavailable' as const }
    } })
  }
  const query = createV3VisitorQuery({ ...outer.visitor, registry: input.config.registry,
    method: { methodId: input.binding.methodId, revision: input.binding.revision },
    methodAuthority: input.authority, clock: input.config.clock, queue: visitorQueue(ruleQueue), discoveryQueue: visitorQueue(discoveryQueue) })
  function identifiers() {
    try {
      const v = ownRecord(input.result.ids(), ['jobId','operationId'])
      return v && typeof v.jobId === 'string' && /^job3_[a-f0-9]{32}$/.test(v.jobId)
        && typeof v.operationId === 'string' && /^op3_[a-f0-9]{32}$/.test(v.operationId)
        ? { jobId: v.jobId, operationId: v.operationId } : null
    } catch { return null }
  }
  return Object.freeze({
    ...jobs.facade,
    query: (raw: unknown, signal?: AbortSignal) => owned(() => query(raw, signal)),
    async monitorOnce(signal?: AbortSignal): Promise<Hrs1MonitorResult> {
      const activeSignal = signal ?? input.scope.signal, initial = identifiers()
      if (!initial || activeSignal.aborted) return { status: 'unavailable', outcomes: [] }
      const claimId = 'hrsclaim1_' + hrs1Hash(initial).slice(0, 32)
      const claimed = await outer.claimMonitor(initial.operationId, claimId, activeSignal)
      if (claimed.status === 'busy') return { status: 'complete', outcomes: [] }
      const claim = claimed.status === 'claimed' && ownRecord(claimed.value, ['claimId','generation','leaseUntil','planGeneration','plan','initialResearch'])
      if (!claim || claim.claimId !== claimId || !Number.isSafeInteger(claim.generation) || (claim.generation as number) < 1
        || !Number.isSafeInteger(claim.planGeneration) || (claim.planGeneration as number) < 0 || !hrs1Time(claim.leaseUntil)
        || typeof claim.initialResearch !== 'boolean') {
        return { status: 'unavailable', outcomes: [] }
      }
      const plan = outer.monitor.plans
      if (!plan) return { status: 'unavailable', outcomes: [] }
      // The M1 plan port still obtains its genuine own receipt. Claim bytes are
      // compared with that actual read; a stored JSON claim is never the receipt.
      const claimBoundPlans = { ...plan, async load(s: AbortSignal) {
        const read = await plan.load(s)
        return read.status === 'available' && hrs1Same(read.plan, claim.plan) ? read : { status: 'unavailable' as const }
      } }
      let result: Hrs1MonitorResult
      if (claim.initialResearch) {
        // A missing accepted head has no M1 version target. Reconfirm the actual
        // same durable claim/head before enqueueing the existing Research queue.
        const current = await outer.claimMonitor(initial.operationId, claimId, activeSignal)
        const primary = input.binding.sources.find(s => s.role === 'primary')
        const research = { context: input.binding.context,
          method: { methodId: input.binding.methodId, revision: input.binding.revision },
          factKind: input.binding.factKind, researchReason: { status: 'missing' as const } }
        const identity = createV3WorkIdentity(research)
        if (current.status !== 'claimed' || !hrs1Same(current.value, claim) || !primary || !identity.ok || activeSignal.aborted) {
          return { status: activeSignal.aborted ? 'interrupted' : 'unavailable', outcomes: [] }
        }
        const seed = { binding: hrs1Hash(input.binding), claimId, generation: claim.generation, jobKey: identity.value.jobKey }
        const enqueued = await ruleQueue.enqueue({ ...research, attemptLimit: input.binding.attemptLimit,
          jobId: 'job3_' + hrs1Hash({ kind: 'hrs1-initial-research-cycle', ...seed }).slice(0, 32),
          operationId: 'op3_' + hrs1Hash({ kind: 'hrs1-initial-research-enqueue', ...seed }).slice(0, 32) }, activeSignal)
        const confirmed = enqueued.status === 'confirmed' && enqueued.record.kind === 'research_job_record'
          && enqueued.record.jobKey === identity.value.jobKey
        result = { status: confirmed ? 'complete' : activeSignal.aborted ? 'interrupted' : 'unavailable',
          outcomes: [{ contextKey: input.binding.contextKey, sourceId: primary.source.sourceId,
            status: confirmed ? 'research_queued' : enqueued.status === 'unconfirmed' ? 'unconfirmed' : 'unavailable',
            jobKey: identity.value.jobKey, ruleChange: 'not_asserted' }] }
      } else {
        result = await owned(() => runV3SourceMonitorOnce({ ...outer.monitor, plans: claimBoundPlans,
          queue: ruleQueue, methodAuthority: input.authority, now: () => input.config.clock().now,
          invocationMilliseconds: HRS1_LIMITS.workerMilliseconds }, activeSignal))
      }
      if (activeSignal.aborted) return { status: 'interrupted', outcomes: result.outcomes }
      const final = identifiers()
      if (!final) return { status: 'unavailable', outcomes: result.outcomes }
      const finished = await outer.finishMonitor(final.operationId, claimId, claim.generation as number, result.outcomes, activeSignal)
      const completion = finished.status === 'finished' && ownRecord(finished.value, ['generation','nextCheckAt'])
      if (!completion || completion.generation !== claim.generation || !hrs1Time(completion.nextCheckAt)) {
        return { status: 'unavailable', outcomes: result.outcomes }
      }
      return result
    },
    async drain() {
      // Actual settlement, not a deadline race or detached cleanup.
      while (pending.size) await Promise.allSettled([...pending])
      await input.scope.drainNative()
    },
  })
}
