import 'server-only'
import { hrs1PublicReadMilliseconds } from '../result/contract'

import type { Lesung } from '@/lib/api/datenbank-lesen'
import { sha256Hex } from '@/lib/readiness/digest'
import { civilDateOrdinalLesen, schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { RegelFaktArt } from '@/lib/readiness/rule-claims'
import { leereQuellenRegistry, type QuellenRegistry } from '@/lib/readiness/source-registry'
import {
  createV3CombinationDiscoveryIdentity, createV3WorkIdentity, OFFICIAL_TRUTH_V3_LIMITS,
  readV3CombinationDiscoveryJobRecord,
  readV3GlobalRuleContext, readV3PublicProjectionRecord, readV3PublicResponseRecord,
  readV3ResearchJobRecord, readV3RuleVersionRecord, readV3VisitorInput, resolveV3PublicSourceDisplay,
  type V3CombinationDiscoveryIdentity, type V3GlobalRuleContext, type V3MethodAuthorityPort, type V3MethodRef,
  type V3PublicProjectionRecord, type V3PublicResponseRecord, type V3PublicSourceDisplay,
  type V3ReadClock, type V3ResearchIdentity, type V3VisitorInput,
} from '../contract'

type Result = V3PublicResponseRecord['cells'][number]['results'][number]
type Target = Readonly<{ context: V3GlobalRuleContext; factKind: RegelFaktArt }>
type Work = Target & Readonly<{ method: V3MethodRef; researchReason: V3ResearchIdentity['researchReason'] }>

/** A cache cell is global. No visitor, trip, passport or session key is stored. */
export type V3VisitorCacheKey = Readonly<{
  destinationCountryCode: string; citizenshipCountryCode: string;
  contextKey: string; factKind: RegelFaktArt; method: V3MethodRef
}>
/** This binding identifies bytes; it is not an authority or a receipt. */
export type V3ProjectionBinding = Readonly<{
  projectionRef: string; projectionHash: string; versionRef: string; revision: number;
  contextKey: string; factKind: RegelFaktArt; method: V3MethodRef;
  sourceDecisionRef: string; evidenceVersionId: string; sourceFreshUntil: string
}>
export type V3VisitorAnswer = Readonly<{
  response: V3PublicResponseRecord;
  sources: Readonly<Record<string, V3PublicSourceDisplay>>;
}>
export type V3VisitorQueryResult =
  | Readonly<{ ok: true; answer: V3VisitorAnswer }>
  | Readonly<{ ok: false; reason: 'invalid_input' | 'aborted' | 'temporary_failure' }>

/**
 * Only a later reviewed server-owned composition may bind these functions.
 * Nothing accepts a serialized approval/receipt. Current positive adapters live
 * in isolated tests; the production entry below has no binding or enable flag.
 */
export interface V3VisitorPorts<MethodReceipt extends object, ProjectionReceipt extends object> {
  readonly registry: QuellenRegistry
  readonly method: V3MethodRef
  readonly methodAuthority: V3MethodAuthorityPort<MethodReceipt>
  readonly clock: () => V3ReadClock
  readonly dataMode: 'synthetic_test' | 'official_projection'
  readonly coverage: {
    /** Explicit known global contexts, never guessed from a visitor's citizenship. */
    targets(input: Readonly<{ destinationCountryCode: string; citizenshipCountryCode: string }>, signal: AbortSignal): Promise<Lesung<Target>>
  }
  readonly cache: {
    read(key: V3VisitorCacheKey, signal: AbortSignal): Promise<Lesung<unknown>>
  }
  readonly current: {
    reprove(binding: V3ProjectionBinding, signal: AbortSignal): Promise<
      | { status: 'current'; binding: V3ProjectionBinding; receipt: ProjectionReceipt }
      | { status: 'withdrawn' | 'unavailable' }
      | { status: 'conflict'; decisionRef: string; reason: 'comparable_conflict' | 'primary_unclear' }>
    /**
     * Adapter must atomically reprove actual accepted pointer, exact projection
     * custody AND current method approval. This is not a pair of optimistic flags.
     * Receipt identity/custody belongs to the adapter, not the DTO parser.
     */
    confirmBatch(items: readonly { receipt: ProjectionReceipt; binding: V3ProjectionBinding }[], methodReceipt: MethodReceipt,
      clock: V3ReadClock, signal: AbortSignal): Promise<
        { status: 'confirmed'; currentProjectionRefs: readonly string[] } | { status: 'not_current' | 'unavailable' }>
  }
  readonly queue: null | {
    enqueue(input: Work & { jobId: string; operationId: string; attemptLimit: number }, signal: AbortSignal): Promise<
      { status: 'confirmed'; record: unknown } | { status: 'unavailable' | 'unconfirmed' | 'conflict' }>
  }
  readonly discoveryQueue: null | {
    /** A neutral country pair, deliberately without guessed rule or document context. */
    enqueue(input: Pick<V3CombinationDiscoveryIdentity, 'destinationCountryCode' | 'citizenshipCountryCode' | 'method'>
      & { jobId: string; operationId: string; attemptLimit: number }, signal: AbortSignal): Promise<
      { status: 'confirmed'; record: unknown } | { status: 'unavailable' | 'unconfirmed' | 'conflict' }>
  }
  readonly ids: () => { jobId: string; operationId: string }
}

const ERROR: Result = Object.freeze({ status: 'error', code: 'temporary_failure', retryable: true })
const INVALID: Result = Object.freeze({ status: 'error', code: 'invalid_data', retryable: false })
const UNBOUND: Result = Object.freeze({ status: 'unavailable', reason: 'unbound' })
const EXPIRED: Result = Object.freeze({ status: 'unavailable', reason: 'expired' })

function bindingFor(projection: V3PublicProjectionRecord): V3ProjectionBinding {
  return Object.freeze({
    projectionRef: projection.reference, projectionHash: sha256Hex(schema2Kanonisch(projection)),
    versionRef: projection.rule.reference, revision: projection.rule.revision,
    contextKey: projection.rule.subject.contextKey, factKind: projection.rule.subject.fact.fact.kind,
    method: projection.rule.method, sourceDecisionRef: projection.rule.sourceDecisionRef,
    evidenceVersionId: projection.rule.subject.evidence.versionId, sourceFreshUntil: projection.sourceFreshUntil,
  })
}
function same(left: unknown, right: unknown): boolean {
  return schema2Kanonisch(left) === schema2Kanonisch(right)
}
function clockValid(clock: V3ReadClock): boolean {
  return civilDateOrdinalLesen(clock.legalDate) !== null
    && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(clock.now)
    && Number.isFinite(Date.parse(clock.now)) && new Date(clock.now).toISOString() === clock.now
}

/**
 * Pure preparatory work for an already reproved producer. No cache publication,
 * method approval or current-store proof is created by this function.
 */
export function prepareV3VisitorProjection(input: {
  rule: unknown; decision: unknown; builtAt: string; expiresAt: string; sourceFreshUntil: string;
}, registry: QuellenRegistry, clock: V3ReadClock):
  | { status: 'prepared'; projection: V3PublicProjectionRecord; source: V3PublicSourceDisplay }
  | { status: 'invalid' } {
  const rule = readV3RuleVersionRecord(input.rule, registry, input.decision)
  if (!rule.ok || rule.value.state !== 'accepted') return { status: 'invalid' }
  const fields = { schema: 3, kind: 'public_projection_record', rule: rule.value,
    sourceCheckedAt: rule.value.subject.evidence.retrievedAt, sourceFreshUntil: input.sourceFreshUntil,
    builtAt: input.builtAt, expiresAt: input.expiresAt }
  const projection = readV3PublicProjectionRecord({ ...fields,
    reference: `rule-projection:v3:${sha256Hex(schema2Kanonisch(fields))}`,
  }, registry, clock)
  if (!projection.ok) return { status: 'invalid' }
  const source = resolveV3PublicSourceDisplay(rule.value.subject.evidence.source, registry)
  return source.ok ? { status: 'prepared', projection: projection.value, source: source.value } : { status: 'invalid' }
}

function finish(input: V3VisitorInput, cells: V3PublicResponseRecord['cells'], registry: QuellenRegistry,
  clock: V3ReadClock, dataMode: V3VisitorPorts<object, object>['dataMode'], sources: Record<string, V3PublicSourceDisplay>): V3VisitorQueryResult {
  const result = readV3PublicResponseRecord({ schema: 3, kind: 'conditional_rule_overview_record',
    dataMode, notice: dataMode === 'synthetic_test' ? 'SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE' : null,
    input, generatedAt: clock.now, cells,
  }, registry, clock)
  if (!result.ok) return { ok: false, reason: 'temporary_failure' }
  const retained = new Set(result.value.cells.flatMap((cell) => cell.results.flatMap((item) =>
    item.status === 'accepted' ? [item.projection.reference] : [])))
  return Object.freeze({ ok: true, answer: Object.freeze({ response: result.value,
    sources: Object.freeze(Object.fromEntries(Object.entries(sources).filter(([key]) => retained.has(key)))) }) })
}

/** Public production seam remains closed, independently of environment variables. */
export async function queryOfficialTruthVisitorV3(input: unknown): Promise<V3VisitorQueryResult> {
  const parsed = readV3VisitorInput(input)
  if (!parsed.ok) return { ok: false, reason: 'invalid_input' }
  const now = new Date().toISOString()
  // No rule is evaluated here; the date is only for this honest unavailable response.
  return finish(parsed.value, parsed.value.citizenshipCountryCodes.map((country) => ({
    citizenshipCountryCode: country, results: [UNBOUND],
  })), leereQuellenRegistry(), { now, legalDate: now.slice(0, 10) }, 'official_projection', {})
}

/** Dormant reusable orchestration; production composition is intentionally absent. */
export function createV3VisitorQuery<MethodReceipt extends object, ProjectionReceipt extends object>(
  ports: V3VisitorPorts<MethodReceipt, ProjectionReceipt>,
) {
  return async (rawInput: unknown, callerSignal?: AbortSignal): Promise<V3VisitorQueryResult> => {
    const input = readV3VisitorInput(rawInput)
    if (!input.ok) return { ok: false, reason: 'invalid_input' }
    if (callerSignal?.aborted) return { ok: false, reason: 'aborted' }
    const abort = new AbortController()
    const aborted = () => abort.abort()
    callerSignal?.addEventListener('abort', aborted, { once: true })
    // Bounded read/queue coordination, not a source-fetch or scheduler deadline.
    const timer = setTimeout(aborted, hrs1PublicReadMilliseconds(ports.dataMode))
    let clock: V3ReadClock
    const sources: Record<string, V3PublicSourceDisplay> = {}
    const receipts: Array<{ result: Extract<Result, { status: 'accepted' }>; receipt: ProjectionReceipt; binding: V3ProjectionBinding }> = []
    const within = async <T>(operation: () => Promise<T>): Promise<T> => {
      if (abort.signal.aborted) throw new Error('cancelled')
      let onAbort: (() => void) | undefined
      const cancelled = new Promise<never>((_, reject) => {
        onAbort = () => reject(new Error('cancelled'))
        abort.signal.addEventListener('abort', onAbort, { once: true })
      })
      try { return await Promise.race([operation(), cancelled]) }
      finally { if (onAbort) abort.signal.removeEventListener('abort', onAbort) }
    }
    try {
      clock = ports.clock()
      if (!clockValid(clock)) return { ok: false, reason: 'temporary_failure' }
      const approved = await within(() => ports.methodAuthority.resolveCurrent(ports.method, clock.now))
      if (approved.status !== 'approved') return finish(input.value, input.value.citizenshipCountryCodes.map((country) => ({
        citizenshipCountryCode: country, results: [UNBOUND],
      })), ports.registry, ports.clock(), ports.dataMode, sources)

      const discover = async (country: V3VisitorInput['citizenshipCountryCodes'][number]): Promise<Result> => {
        if (ports.discoveryQueue === null) return UNBOUND
        const pair = { destinationCountryCode: input.value.destinationCountryCode, citizenshipCountryCode: country, method: ports.method }
        const identity = createV3CombinationDiscoveryIdentity(pair)
        if (!identity.ok) return INVALID
        const currentMethod = await within(() => ports.methodAuthority.reproveAtCommit(approved.receipt, ports.method, ports.clock().now))
        if (currentMethod.status !== 'current') return UNBOUND
        const queued = await within(() => ports.discoveryQueue!.enqueue({ ...pair, ...ports.ids(), attemptLimit: 3 }, abort.signal))
        if (queued.status !== 'confirmed') return queued.status === 'unavailable' ? UNBOUND : ERROR
        const job = readV3CombinationDiscoveryJobRecord(queued.record)
        const now = ports.clock().now
        if (!job.ok || !['queued', 'leased', 'backoff'].includes(job.value.state)
          || !same(job.value.identity, identity.value) || job.value.updatedAt > now
          || (job.value.lease !== null && job.value.lease.expiresAt <= now)) return INVALID
        return { status: 'pending', jobKind: 'combination_discovery', jobKey: identity.value.jobKey, identity: identity.value }
      }

      const one = async (target: Target, country: string): Promise<Result> => {
        const context = readV3GlobalRuleContext(target.context)
        if (!context.ok || context.value.scope.destinationCountryCode !== input.value.destinationCountryCode
          || context.value.scope.citizenship.countryCodes[0] !== country) return INVALID
        const work: Work = { context: context.value, factKind: target.factKind, method: ports.method, researchReason: { status: 'missing' } }
        const identity = createV3WorkIdentity(work)
        if (!identity.ok) return INVALID
        const key: V3VisitorCacheKey = { destinationCountryCode: input.value.destinationCountryCode,
          citizenshipCountryCode: country, contextKey: identity.value.contextKey, factKind: target.factKind, method: ports.method }
        const read = await within(() => ports.cache.read(key, abort.signal))
        if (read.problem !== null) return ERROR // Never reclassify a failed read as a miss.
        if (!Array.isArray(read.zeilen) || read.zeilen.length > 1) return INVALID
        if (read.zeilen.length === 0) {
          if (ports.queue === null) return UNBOUND
          const currentMethod = await within(() => ports.methodAuthority.reproveAtCommit(approved.receipt, ports.method, ports.clock().now))
          if (currentMethod.status !== 'current') return UNBOUND
          const queued = await within(() => ports.queue!.enqueue({ ...work, ...ports.ids(), attemptLimit: 3 }, abort.signal))
          if (queued.status !== 'confirmed') return queued.status === 'unavailable' ? UNBOUND : ERROR
          const job = readV3ResearchJobRecord(queued.record)
          if (!job.ok || !['queued', 'leased', 'backoff'].includes(job.value.state)
            || job.value.jobKey !== identity.value.jobKey || job.value.contextKey !== identity.value.contextKey
            || job.value.research.factKind !== target.factKind || !same(job.value.method, ports.method)
            || job.value.updatedAt > ports.clock().now
            || (job.value.lease !== null && job.value.lease.expiresAt <= ports.clock().now)) return INVALID
          // This ACK is from the bound queue operation, not a visitor-supplied status.
          return { status: 'pending', jobKey: job.value.jobKey }
        }
        const projection = readV3PublicProjectionRecord(read.zeilen[0], ports.registry, ports.clock())
        // S0 deliberately combines shape and initial time validation. Do not
        // mislabel corrupt data as an expired, previously trustworthy rule.
        if (!projection.ok) return INVALID
        const value = projection.value
        if (value.rule.subject.contextKey !== identity.value.contextKey || value.rule.subject.fact.fact.kind !== target.factKind
          || !same(value.rule.method, ports.method)) return INVALID
        const binding = bindingFor(value)
        const proof = await within(() => ports.current.reprove(binding, abort.signal))
        if (proof.status === 'withdrawn') return { status: 'unavailable', reason: 'withdrawn' }
        if (proof.status === 'unavailable') return UNBOUND
        if (proof.status === 'conflict') return { status: 'conflict', decisionRef: proof.decisionRef, reason: proof.reason }
        if (proof.status !== 'current') return UNBOUND
        if (!same(proof.binding, binding)) return INVALID
        const source = resolveV3PublicSourceDisplay(value.rule.subject.evidence.source, ports.registry)
        if (!source.ok) return UNBOUND
        const result: Extract<Result, { status: 'accepted' }> = { status: 'accepted', projection: value }
        receipts.push({ result, receipt: proof.receipt, binding })
        sources[value.reference] = source.value
        return result
      }

      const cells = await Promise.all(input.value.citizenshipCountryCodes.map(async (country) => {
        try {
          const planned = await within(() => ports.coverage.targets({
            destinationCountryCode: input.value.destinationCountryCode, citizenshipCountryCode: country,
          }, abort.signal))
          if (planned.problem !== null) return { citizenshipCountryCode: country, results: [ERROR] }
          if (!Array.isArray(planned.zeilen) || planned.zeilen.length > OFFICIAL_TRUTH_V3_LIMITS.resultsPerCitizenship) {
            return { citizenshipCountryCode: country, results: [INVALID] }
          }
          if (planned.zeilen.length === 0) return { citizenshipCountryCode: country, results: [await discover(country)] }
          const identities = planned.zeilen.map((target) => createV3WorkIdentity({ ...target, method: ports.method, researchReason: { status: 'missing' } }))
          if (identities.some((identity) => !identity.ok) || new Set(identities.map((identity) => identity.ok ? identity.value.jobKey : '')).size !== identities.length) {
            return { citizenshipCountryCode: country, results: [INVALID] }
          }
          const results: Result[] = []
          // Up to five citizenship cells in parallel; one target at a time per cell.
          for (const target of planned.zeilen) {
            try { results.push(await one(target, country)) } catch { results.push(ERROR) }
          }
          return { citizenshipCountryCode: country, results }
        } catch { return { citizenshipCountryCode: country, results: [ERROR] } }
      }))

      if (callerSignal?.aborted) return { ok: false, reason: 'aborted' }
      const methodCurrent = await within(() => ports.methodAuthority.reproveAtCommit(approved.receipt, ports.method, ports.clock().now))
      const rejected = new Map<Result, Result>()
      for (const entry of receipts) {
        if (methodCurrent.status !== 'current') { rejected.set(entry.result, UNBOUND); continue }
        const now = ports.clock()
        if (!readV3PublicProjectionRecord(entry.result.projection, ports.registry, now).ok) {
          rejected.set(entry.result, EXPIRED); continue
        }
      }
      const candidates = receipts.filter((entry) => !rejected.has(entry.result))
      let finalMethodConfirmed = methodCurrent.status === 'current'
      // One final atomic read snapshot for all positive cells and this method.
      // Sequential per-cell confirmations could revive a cell invalidated while
      // another citizenship awaited its confirmation.
      if (candidates.length > 0) {
        const confirmed = await within(() => ports.current.confirmBatch(candidates.map(({ receipt, binding }) => ({ receipt, binding })),
          approved.receipt, ports.clock(), abort.signal))
        if (confirmed.status !== 'confirmed') finalMethodConfirmed = false
        const refs = confirmed.status === 'confirmed' ? confirmed.currentProjectionRefs : []
        const validRefs = Array.isArray(refs) && new Set(refs).size === refs.length
          && refs.every((ref) => candidates.some((entry) => entry.binding.projectionRef === ref))
        for (const entry of candidates) if (!validRefs || !refs.includes(entry.binding.projectionRef)) rejected.set(entry.result, UNBOUND)
      }
      clock = ports.clock()
      for (const cell of cells) cell.results = cell.results.map((result) => {
        if (!finalMethodConfirmed) return UNBOUND
        if (rejected.has(result)) return rejected.get(result)!
        if (result.status === 'accepted' && !readV3PublicProjectionRecord(result.projection, ports.registry, clock).ok) return EXPIRED
        return result
      })
      return finish(input.value, cells, ports.registry, clock, ports.dataMode, sources)
    } catch {
      return callerSignal?.aborted ? { ok: false, reason: 'aborted' } : { ok: false, reason: 'temporary_failure' }
    } finally {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', aborted)
      abort.abort()
    }
  }
}
