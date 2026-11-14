import 'server-only'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { readV3PublicProjectionRecord, readV3PublicResponseRecord, readV3VisitorInput,
  resolveV3PublicSourceDisplay, type V3MethodAuthorityPort, type V3ReadClock,
  type V3PublicResponseRecord, type V3PublicSourceDisplay } from '../contract'
import { hrs1Clock, hrs1Data, hrs1Hash, hrs1Same, hrs1Time, type Hrs1Binding, type Hrs1FixedOperation } from '../result/contract'
import type { V3VisitorQueryResult } from './query'

type Result = V3PublicResponseRecord['cells'][number]['results'][number]
const unavailable = (): V3VisitorQueryResult => ({ ok: false, reason: 'temporary_failure' })

/** Fixed real CH→DE only. Synthetic and generic composition keeps its contract.
 * A parsed DTO is never reused as an approval or a private method receipt. */
export function createChDeSnapshotQuery(input: Readonly<{
  binding: Hrs1Binding; registry: QuellenRegistry; clock(): V3ReadClock;
  authority: V3MethodAuthorityPort<object>; fixed: Hrs1FixedOperation;
}>) {
  const b = input.binding
  const selected = b.dataMode === 'official_projection' && b.methodId === 'jetnity-destination-primary-ch-de-visa'
    && b.revision === 1 && b.contextKey === 'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    && b.methodDigest === '44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3'
    && b.packageDigest === '0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9'
  const horizons = new WeakMap<object, Readonly<{ observedAt: string; validUntil: string; legalDate: string }>>()
  const method = Object.freeze({ methodId: b.methodId, revision: b.revision })
  function matches(raw: unknown): boolean {
    const request = readV3VisitorInput(raw)
    return selected && request.ok && request.value.destinationCountryCode === 'DE'
      && hrs1Same(request.value.citizenshipCountryCodes, ['CH'])
  }
  function current(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false
    const h = horizons.get(value)
    if (!h) return false
    const at = input.clock()
    return hrs1Same(at, hrs1Clock(at.now, b.legalTimeZone)) && at.legalDate === h.legalDate
      && at.now >= h.observedAt && at.now < h.validUntil
      && 'ok' in value && value.ok === true
      && readV3PublicResponseRecord((value as Extract<V3VisitorQueryResult, { ok: true }>).answer.response, input.registry, at).ok
  }
  async function query(raw: unknown, signal: AbortSignal): Promise<V3VisitorQueryResult> {
    const request = readV3VisitorInput(raw)
    if (!matches(raw) || !request.ok) return { ok: false, reason: 'invalid_input' }
    try {
      const at = input.clock()
      if (signal.aborted || !hrs1Same(at, hrs1Clock(at.now, b.legalTimeZone))) return unavailable()
      const approved = await input.authority.resolveCurrent(method, at.now)
      if (approved.status !== 'approved' || signal.aborted) return unavailable()
      // The executor owns acknowledgement and full native drain. No deadline
      // race detaches it. The enclosing invocation retains its original 750ms.
      const reply = await input.fixed({ schema: 1, operation: 'ch_de_snapshot', bindingHash: hrs1Hash(b), body: {} }, signal, approved.receipt)
      if (reply.status !== 'snapshot' || !hrs1Data(reply.value, 65536) || signal.aborted) return unavailable()
      const common = ['schema', 'status', 'observedAt', 'validUntil'] as const
      const row = ownRecord(reply.value, common) ?? ownRecord(reply.value, [...common, 'projection'])
        ?? ownRecord(reply.value, [...common, 'decisionRef', 'reason'])
      const end = input.clock()
      if (!row || row.schema !== 1 || !hrs1Time(row.observedAt) || !hrs1Time(row.validUntil)
        || row.observedAt < at.now || row.observedAt > end.now || row.validUntil <= end.now
        || !hrs1Same(end, hrs1Clock(end.now, b.legalTimeZone)) || end.legalDate !== at.legalDate) return unavailable()
      let result: Result
      const sources: Record<string, V3PublicSourceDisplay> = {}
      if (row.status === 'accepted') {
        if (!ownRecord(reply.value, [...common, 'projection'])) return unavailable()
        const projection = readV3PublicProjectionRecord(row.projection, input.registry, end)
        if (!projection.ok || projection.value.rule.subject.contextKey !== b.contextKey
          || !hrs1Same(projection.value.rule.subject.context, b.context) || !hrs1Same(projection.value.rule.method, method)
          || projection.value.rule.subject.fact.fact.kind !== b.factKind) return unavailable()
        const source = resolveV3PublicSourceDisplay(projection.value.rule.subject.evidence.source, input.registry)
        if (!source.ok) return unavailable()
        result = { status: 'accepted', projection: projection.value }
        sources[projection.value.reference] = source.value
      } else if (row.status === 'missing' && ownRecord(reply.value, common)) {
        result = { status: 'unavailable', reason: 'no_qualified_primary' }
      } else if (row.status === 'unavailable' && ownRecord(reply.value, common)) {
        result = { status: 'unavailable', reason: 'withdrawn' }
      } else if (row.status === 'conflict' && ownRecord(reply.value, [...common, 'decisionRef', 'reason'])
        && typeof row.decisionRef === 'string' && /^source-decision:v3:[a-f0-9]{64}$/.test(row.decisionRef)
        && (row.reason === 'comparable_conflict' || row.reason === 'primary_unclear')) {
        result = { status: 'conflict', decisionRef: row.decisionRef, reason: row.reason }
      } else return unavailable()
      const response = readV3PublicResponseRecord({ schema: 3, kind: 'conditional_rule_overview_record',
        dataMode: 'official_projection', notice: null, input: request.value, generatedAt: end.now,
        cells: [{ citizenshipCountryCode: 'CH', results: [result] }] }, input.registry, end)
      if (!response.ok) return unavailable()
      const answer = Object.freeze({ ok: true as const, answer: Object.freeze({ response: response.value, sources: Object.freeze(sources) }) })
      horizons.set(answer, Object.freeze({ observedAt: row.observedAt, validUntil: row.validUntil, legalDate: end.legalDate }))
      return current(answer) ? answer : unavailable()
    } catch { return signal.aborted ? { ok: false, reason: 'aborted' } : unavailable() }
  }
  return Object.freeze({ matches, query, current })
}
