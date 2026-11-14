// HRS1 dormant wire contracts. Shape and hashes never create source or method authority.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { ownRecord, immutable } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { civilDateOrdinalLesen } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { readContentIdentityBinding, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { createV3ContextIdentity, readV3GlobalRuleContext, resolveV3PublicSourceDisplay,
  type V3GlobalRuleContext, type V3ReadClock, type V3SourceObservationRecord, type V3SourceDecisionRecord,
  type V3ConflictArchiveRecord, type V3MethodRef } from '../contract'
import type { V3ImportVerificationRequest, V3ImportHistory } from '../import/service-server'
import { readMa1FixedBinding, type Ma1MethodBinding } from '../method/contract'
import type { Hrs1SourceCustodyIssuer } from './source-proof'

export const HRS1_LIMITS = Object.freeze({
  originalBytes: 131072, originals: 8, sources: 8, recordBytes: 65536,
  wireBytes: 2097152, wireNodes: 65536, wireDepth: 32, fixedCalls: 256,
  concurrentEffects: 2, effectMilliseconds: 5000, publicMilliseconds: 750,
  workerMilliseconds: 30000, monitorTargets: 8, batchProjections: 16,
})
/** The fixed CI allowance belongs only to synthetic, server-owned queries.
 * Real projections retain 750ms even inside CI; no request/env number is accepted. */
export function hrs1PublicReadMilliseconds(dataMode: Hrs1Binding['dataMode']): number {
  return dataMode === 'synthetic_test' && process.env.GITHUB_ACTIONS === 'true' ? 2000 : HRS1_LIMITS.publicMilliseconds
}
export type Hrs1SourceBinding = Readonly<{
  source: ContentIdentityBinding; canonicalUrl: string; contentType: 'text/html' | 'application/pdf' | 'text/plain' | 'application/json';
  executableDigest: string; qualificationDigest: string; role: 'primary' | 'counter';
}>
export type Hrs1Binding = Ma1MethodBinding & Readonly<{
  schema: 1; qualificationScope: 'global_context';
  context: V3GlobalRuleContext; contextKey: string; factKind: 'requirement_effect';
  dataMode: 'synthetic_test' | 'official_projection'; legalTimeZone: string;
  activeFrom: string; activeUntilExclusive: string;
  sourceMaxAgeMilliseconds: number; projectionMaxAgeMilliseconds: number;
  monitorIntervalMilliseconds: number; monitorLeaseMilliseconds: number; attemptLimit: number;
  sources: readonly Hrs1SourceBinding[];
}>
export type Hrs1Ambiguity = Readonly<{
  context: V3GlobalRuleContext; contextKey: string; evidence: V3SourceObservationRecord['evidence'];
  reason: 'ambiguous_statement' | 'unqualified_destination_authority' | 'invalid_or_unknown_validity';
}>
type Hrs1OriginalCommon = Readonly<{
  bodyText: string; rawDigest: string;
  qualification: Readonly<{ qualificationDigest: string; source: ContentIdentityBinding; contextKey: string;
    method: V3MethodRef; checkedAt: string; role: 'primary' | 'counter' }>;
}>
/** Ambiguous original source material has evidence and a qualified ambiguity;
 * it deliberately has no manufactured fact/observation. */
export type Hrs1Original = Hrs1OriginalCommon & (
  Readonly<{ observation: V3SourceObservationRecord;
    extraction: Readonly<{ executableDigest: string; observation: V3SourceObservationRecord }> }>
  | Readonly<{ observation: null; ambiguity: Hrs1Ambiguity;
    extraction: Readonly<{ executableDigest: string; observation: null; ambiguity: Hrs1Ambiguity }> }>
)
export function hrs1OriginalEvidence(original: Hrs1Original): V3SourceObservationRecord['evidence'] {
  return original.observation === null ? original.ambiguity.evidence : original.observation.evidence
}
export type Hrs1Verification = Readonly<{
  reference: string; request: V3ImportVerificationRequest; decision: V3SourceDecisionRecord;
  previousDecision: V3SourceDecisionRecord | null; archiveAppend: V3ConflictArchiveRecord | null;
  originals: readonly Hrs1Original[]; history: V3ImportHistory;
  stickyDecision: V3SourceDecisionRecord | null; suppressionEpoch: number; validUntilExclusive: string;
}>

export function hrs1Canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(hrs1Canonical).join(',') + ']'
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + hrs1Canonical((value as Record<string, unknown>)[k])).join(',') + '}'
}
export function hrs1Hash(value: unknown): string { return sha256Hex(hrs1Canonical(value)) }
export function hrs1Ref(kind: string, value: unknown): string { return kind + ':v3:' + hrs1Hash(value) }
export function hrs1Same(a: unknown, b: unknown): boolean { return hrs1Canonical(a) === hrs1Canonical(b) }
export function hrs1Time(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)
    && civilDateOrdinalLesen(v.slice(0, 10)) !== null && Number.isFinite(Date.parse(v))
    && new Date(v).toISOString() === v
}
export function hrs1Method(binding: Hrs1Binding): V3MethodRef {
  return Object.freeze({ methodId: binding.methodId, revision: binding.revision })
}
/** The selected calendar is explicit. Neither UTC substring nor a cached legal date substitutes for it. */
export function hrs1Clock(now: string, legalTimeZone: string): V3ReadClock | null {
  if (!hrs1Time(now) || typeof legalTimeZone !== 'string' || legalTimeZone.length > 64
    || !/^[A-Za-z][A-Za-z0-9_+/-]*$/.test(legalTimeZone)) return null
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: legalTimeZone, calendar: 'iso8601',
      numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now))
    const field = (kind: string) => parts.find(p => p.type === kind)?.value
    const date = field('year') + '-' + field('month') + '-' + field('day')
    return civilDateOrdinalLesen(date) === null ? null : Object.freeze({ now, legalDate: date })
  } catch { return null }
}
/** A finite data-only preflight, before getters, stringification or shared record readers. */
export function hrs1Data(value: unknown, byteLimit: number = HRS1_LIMITS.wireBytes): boolean {
  let nodes = 0, characters = 0
  const active = new Set<object>()
  function visit(v: unknown, depth: number): boolean {
    if (++nodes > HRS1_LIMITS.wireNodes || depth > HRS1_LIMITS.wireDepth) return false
    if (v === null || typeof v === 'boolean') return true
    if (typeof v === 'number') return Number.isSafeInteger(v) && !Object.is(v, -0)
    if (typeof v === 'string') {
      characters += v.length
      if (characters > byteLimit || v.includes('\u0000')) return false
      return new TextDecoder('utf-8', { fatal: true }).decode(new TextEncoder().encode(v)) === v
    }
    if (!v || typeof v !== 'object' || active.has(v)) return false
    const array = Array.isArray(v), prototype = Object.getPrototypeOf(v)
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) return false
    active.add(v)
    const keys = Reflect.ownKeys(v)
    if (array && (keys.length !== v.length + 1 || v.length > HRS1_LIMITS.wireNodes)) return false
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string' || !/^[\x20-\x7e]+$/.test(key) || (characters += key.length) > byteLimit) return false
      const d = Object.getOwnPropertyDescriptor(v, key)
      if (!d || !('value' in d) || !d.enumerable || (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= v.length))
        || !visit(d.value, depth + 1)) return false
    }
    active.delete(v)
    return true
  }
  try { return visit(value, 0) && new TextEncoder().encode(hrs1Canonical(value)).byteLength <= byteLimit } catch { return false }
}
export function readHrs1Binding(raw: unknown, registry: QuellenRegistry): Hrs1Binding | null {
  try {
    if (!hrs1Data(raw, HRS1_LIMITS.recordBytes)) return null
    const row = ownRecord(raw, ['schema','qualificationScope','context','contextKey','factKind','methodId','revision',
      'methodDigest','packageDigest','dataMode','legalTimeZone','activeFrom','activeUntilExclusive',
      'sourceMaxAgeMilliseconds','projectionMaxAgeMilliseconds','monitorIntervalMilliseconds','monitorLeaseMilliseconds','attemptLimit','sources'])
    if (!row || row.schema !== 1 || row.qualificationScope !== 'global_context' || row.factKind !== 'requirement_effect'
      || !['synthetic_test','official_projection'].includes(String(row.dataMode))) return null
    const method = readMa1FixedBinding({ methodId: row.methodId, revision: row.revision, methodDigest: row.methodDigest, packageDigest: row.packageDigest })
    const context = readV3GlobalRuleContext(row.context), identity = createV3ContextIdentity(row.context)
    if (!method.ok || !context.ok || !identity.ok || !hrs1Same(context.value, row.context) || identity.value.contextKey !== row.contextKey
      || context.value.scope.destinationCountryCode !== 'DE' || context.value.scope.citizenship.countryCodes[0] !== 'CH'
      || context.value.scope.requirementType !== 'visa' || context.value.route === 'unresolved'
      || context.value.conditions.status === 'unresolved' || (context.value.scope.credentialOption.mode === 'option'
        && (context.value.scope.credentialOption.documentType === 'unknown'
          || context.value.scope.credentialOption.relatedCitizenshipCountryCode !== 'CH'))
      || !hrs1Time(row.activeFrom) || !hrs1Time(row.activeUntilExclusive) || row.activeUntilExclusive <= row.activeFrom
      || typeof row.legalTimeZone !== 'string' || !hrs1Clock(row.activeFrom, row.legalTimeZone)) return null
    for (const field of ['sourceMaxAgeMilliseconds','projectionMaxAgeMilliseconds','monitorIntervalMilliseconds','monitorLeaseMilliseconds','attemptLimit']) {
      if (!Number.isSafeInteger(row[field]) || (row[field] as number) < 1) return null
    }
    if ((row.sourceMaxAgeMilliseconds as number) > 86400000 || (row.projectionMaxAgeMilliseconds as number) > Math.min(3600000, row.sourceMaxAgeMilliseconds as number)
      || (row.monitorIntervalMilliseconds as number) > (row.sourceMaxAgeMilliseconds as number)
      || (row.monitorLeaseMilliseconds as number) > HRS1_LIMITS.workerMilliseconds || (row.attemptLimit as number) > 16
      || !Array.isArray(row.sources) || row.sources.length < 1 || row.sources.length > HRS1_LIMITS.sources) return null
    const seen = new Set<string>(); let primary = 0
    for (const candidate of row.sources) {
      const s = ownRecord(candidate, ['source','canonicalUrl','contentType','executableDigest','qualificationDigest','role'])
      if (!s || !readContentIdentityBinding(s.source).ok || !/^[a-f0-9]{64}$/.test(String(s.executableDigest))
        || !/^[a-f0-9]{64}$/.test(String(s.qualificationDigest)) || !['primary','counter'].includes(String(s.role))
        || !['text/html','application/pdf','text/plain','application/json'].includes(String(s.contentType)) || typeof s.canonicalUrl !== 'string') return null
      const display = resolveV3PublicSourceDisplay(s.source, registry)
      if (!display.ok || display.value.href !== s.canonicalUrl) return null
      const url = new URL(s.canonicalUrl)
      if (url.protocol !== 'https:' || url.username || url.password || url.hash
        || (row.dataMode === 'synthetic_test' && !url.hostname.endsWith('.example'))) return null
      const key = hrs1Hash(s.source)
      if (seen.has(key)) return null
      seen.add(key); if (s.role === 'primary') primary++
    }
    if (primary !== 1) return null
    // This is a shape/configuration result. Genuine qualification still requires
    // private source issuance; it cannot be inferred from qualificationScope.
    return immutable(JSON.parse(hrs1Canonical(row)) as Hrs1Binding)
  } catch { return null }
}

export const HRS1_FIELDS = Object.freeze({
  attest: ['kind','verification'],
  history: ['contextKey','factKind'],
  evidence: ['reference'],
  head: ['contextKey','factKind'],
  version_confirm: ['operationId','operationKey'],
  transition: ['operationKey','prepared','expectedHead','verificationRef','intake'],
  transition_current: ['operationKey','prepared','expectedHead','verificationRef','intake'],
  publication: ['operationId','operationKey','prepared','projection','verificationRef','intake'],
  publication_confirm: ['operationId','operationKey','prepared','projection','verificationRef','intake'],
  escalation: ['operationId','operationKey','upload','outcome','verificationRef','intake'],
  escalation_confirm: ['operationId','operationKey','upload','outcome','verificationRef','intake'],
  coverage: ['destinationCountryCode','citizenshipCountryCode'],
  projection: ['key'],
  projection_current: ['binding'],
  projection_batch: ['bindings'],
  ch_de_snapshot: [],
  plan: [],
  plan_reprove: ['generation','target'],
  suppress: ['effect','generation','observationRef'],
  suppression_confirm: ['operationId','auditRef'],
  monitor_claim: ['operationId','claimId'],
  monitor_finish: ['operationId','claimId','generation','outcomes'],
} as const)
export type Hrs1Operation = keyof typeof HRS1_FIELDS
export type Hrs1Command = Readonly<{ schema: 1; operation: Hrs1Operation; bindingHash: string; body: Readonly<Record<string, unknown>> }>
export type Hrs1Channel = 'attest' | 'execute' | 'read'
export function hrs1Channel(operation: Hrs1Operation): Hrs1Channel {
  return operation === 'attest' ? 'attest'
    : ['transition','publication','escalation','suppress','monitor_claim','monitor_finish'].includes(operation) ? 'execute' : 'read'
}
export function readHrs1Command(raw: unknown, binding: Hrs1Binding): Hrs1Command | null {
  if (!hrs1Data(raw)) return null
  const r = ownRecord(raw, ['schema','operation','bindingHash','body'])
  if (!r || r.schema !== 1 || r.bindingHash !== hrs1Hash(binding) || typeof r.operation !== 'string'
    || !Object.hasOwn(HRS1_FIELDS, r.operation) || !ownRecord(r.body, HRS1_FIELDS[r.operation as Hrs1Operation])) return null
  return immutable(JSON.parse(hrs1Canonical(r)) as Hrs1Command)
}
declare const fixedInvocation: unique symbol
export type Hrs1FixedRequest = Readonly<{ [fixedInvocation]: true;
  channel: Hrs1Channel; operationText: string; bindingHash: string;
  methodId: string; revision: number; methodDigest: string; packageDigest: string;
  epoch: number; budget: Readonly<{ deadline: number }>; notAfter: string; legalDate: string;
}>
/** Own acquisition, fixed SQL, actual COMMIT acknowledgement, abort and terminal
 * drain. A callback or rows-before-COMMIT result cannot satisfy this contract.
 * The executor must use the original shrinking cap for commit protection. */
export interface Hrs1TerminalExecutor {
  executeFixed(request: Hrs1FixedRequest, signal: AbortSignal): Promise<
    Readonly<{ status: 'acknowledged'; rows: unknown }> | Readonly<{ status: 'unavailable' | 'unconfirmed' }>
    /** All owned local children are settled/closed; remote outcome remains unknown.
     * The physical pair stays poisoned, with no replay, reconnect or reuse. */
    | Readonly<{ status: 'blocked_remote_unknown' }>>
}
export type Hrs1Reply = Readonly<{ status:
  'unavailable' | 'unconfirmed' | 'not_attempted' | 'collision' | 'not_current' | 'stale_head'
  | 'recorded' | 'snapshot' | 'inspected' | 'current' | 'committed' | 'confirmed' | 'reported'
  | 'missing' | 'conflict' | 'claimed' | 'busy' | 'finished';
  value?: unknown;
}>
export type Hrs1FixedOperation = (command: Hrs1Command, signal: AbortSignal, methodReceipt?: object, notAfter?: string) => Promise<Hrs1Reply>
export function readHrs1Reply(rows: unknown): Hrs1Reply | null {
  try {
    if (!Array.isArray(rows) || rows.length !== 1) return null
    const row = ownRecord(rows[0], ['result'])
    if (!row || typeof row.result !== 'string' || row.result.length > HRS1_LIMITS.wireBytes) return null
    const v: unknown = JSON.parse(row.result)
    if (!hrs1Data(v)) return null
    const r = ownRecord(v, ['status']) ?? ownRecord(v, ['status','value'])
    if (!r || !['unavailable','unconfirmed','not_attempted','collision','not_current','stale_head',
      'recorded','snapshot','inspected','current','committed','confirmed','reported','missing','conflict','claimed','busy','finished'].includes(String(r.status))) return null
    return immutable(v as Hrs1Reply)
  } catch { return null }
}
export const HRS1_SQL = Object.freeze({
  attest: 'SELECT official_v3_result_api.attest_v1($1::jsonb,$2::text,$3::text,$4::integer,$5::text,$6::text,$7::integer,$8::integer,$9::text,$10::text) AS result',
  execute: 'SELECT official_v3_result_api.execute_v1($1::jsonb,$2::text,$3::text,$4::integer,$5::text,$6::text,$7::integer,$8::integer,$9::text,$10::text) AS result',
  read: 'SELECT official_v3_result_api.read_v1($1::jsonb,$2::text,$3::text,$4::integer,$5::text,$6::text,$7::integer,$8::integer,$9::text,$10::text) AS result',
})
export type Hrs1Config = Readonly<{
  binding: Hrs1Binding | null;
  writerExecutor: Hrs1TerminalExecutor; readerExecutor: Hrs1TerminalExecutor; verifierExecutor: Hrs1TerminalExecutor;
  /** Consulted only by the literal synthetic/.example branch. No exported issuer constructor. */
  fixtureIssuer?: Hrs1SourceCustodyIssuer | null;
  ids(): Readonly<{ jobId: string; operationId: string }>;
}>
