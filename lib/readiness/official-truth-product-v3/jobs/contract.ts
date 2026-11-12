// Dormant M04 metadata only. Valid shape/hash is never approval or execution custody.
import 'server-only'
import { z } from 'zod'
import { sha256Hex } from '@/lib/readiness/digest'
import { regelScopeAusEvidenceScope, REGEL_FAKT_ARTEN } from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { createV3WorkIdentity, createV3CombinationDiscoveryIdentity,
  readV3GlobalRuleContext, readV3ResearchJobRecord, readV3CombinationDiscoveryJobRecord,
  type V3GlobalRuleContext, type V3ReadClock, type V3MethodAuthorityPort } from '../contract'
import { readData, same, key, timestamp, operationId, jobId, leaseId, jobKey, discoveryJobKey,
  decisionRef, discoveryRef } from '../monitor/internal'
import type { V3QueueResult, V3QueueCommit, V3ManagedJobRecord, V3JobFence } from '../monitor/queue'
import type { V3IntegratedWorkerResult } from '../integration/coordinator'
import type { V3WorkerResultRecord } from '../monitor/worker'
import type { V3ImportEvidencePort, V3ImportHistoryPort } from '../import/service-server'
import type { V3IntakeSqlExecutor } from '../storage/quarantine-postgres'
import { readV3IntakeReference, type V3IntakeBinding, type V3IntakeReference } from '../storage/intake-contract'
import type { Ma1MethodBinding } from '../method/contract'
import type { Ma1MethodSqlExecutor } from '../method/authority-postgres'

export const M04_LIMITS = Object.freeze({ outerLanes: 4, nativeLanes: 4, activeNative: 8,
  totalNative: 256, terminalReserve: 16, activeCallbacks: 8, totalCallbacks: 128,
  subjects: 1024, commands: 256, starts: 64, deliveries: 16, originalBatchBytes: 1_048_576,
  transientBytes: 67_108_864, metadataBytes: 65_536, envelopeBytes: 196_608, wireBytes: 262_144,
  wireDepth: 24, wireNodes: 32_768, effectMs: 5_000, cleanupMs: 5_000, workMs: 30_000,
  backoffBaseMs: 1_000, backoffMaxMs: 60_000 })
export type M04Kind = 'rule_research' | 'combination_discovery'
export type M04Claim = Readonly<{ operationId: string; jobKey: string; leaseId: string; leaseMilliseconds: number }>
export type M04Continuation = null | Readonly<{ kind: 'prepared'; claim: M04Claim; attemptKey: string }>
  | Readonly<{ kind: 'owned_failure'; claim: M04Claim; attemptKey: string; token: string }>
export type M04Disposition = Readonly<{ kind: 'regular' }> | Readonly<{ kind: 'completed'; attemptKey: string }>
  | Readonly<{ kind: 'settled_failure'; attemptKey: string; token: string }>
export type M04SubjectIdentity = Readonly<{ kind: M04Kind; jobKey: string; subjectText: string; contextKey: string | null }>
export type M04Command = Readonly<{ value: Readonly<Record<string, unknown>>; commandText: string;
  commandKey: string; operationId: string; jobKey: string; subjectText: string | null;
  action: 'enqueue' | 'claim' | 'complete' | 'fail'; kind: M04Kind }>
export type M04Operation =
  | Readonly<{ operation: 'queue_read'; body: { jobKey: string; continuation: M04Continuation } }>
  | Readonly<{ operation: 'queue_confirm'; body: { command: M04Command['value']; continuation: M04Continuation } }>
  | Readonly<{ operation: 'queue_cas'; body: { command: M04Command['value']; commit: V3QueueCommit;
      subjectText: string; disposition: M04Disposition } }>
  | Readonly<{ operation: 'execution_read'; body: { claim: M04Claim; purpose: 'resume' | 'lookup' | 'confirm' | 'artifact' } }>
  | Readonly<{ operation: 'execution_start'; body: { claim: M04Claim; leasedJob: V3ManagedJobRecord; subjectText: string } }>
  | Readonly<{ operation: 'execution_prepare'; body: { claim: M04Claim; attemptKey: string; token: string;
      result: V3WorkerResultRecord; references: readonly V3IntakeReference[] } }>
export type M04NativeReply =
  | Readonly<{ status: 'unavailable' | 'unconfirmed' | 'requires_authority' | 'absent' | 'not_attempted' | 'blocked' | 'collision' | 'mismatch' | 'quota' }>
  | Readonly<{ status: 'present'; record: V3ManagedJobRecord }>
  | Readonly<{ status: 'committed'; record: V3ManagedJobRecord; operationId?: string; commandKey?: string; commandText?: string; envelopeText?: string }>
  | Readonly<{ status: 'reserved'; attemptKey: string; token: string; claim: M04Claim; leasedJob: V3ManagedJobRecord }>
  | Readonly<{ status: 'prepared'; attemptKey: string; result: V3WorkerResultRecord; references: readonly V3IntakeReference[];
      claim?: M04Claim; leasedJob?: V3ManagedJobRecord }>
  | Readonly<{ status: 'completed'; attemptKey: string; claim: M04Claim; leasedJob: V3ManagedJobRecord;
      job: V3ManagedJobRecord; result: V3WorkerResultRecord; references: readonly V3IntakeReference[] }>
/** A fixed internal request, created only beside actual same-instance MA1 custody.
 * The reviewed executor consumes the wire, never a returned product capability. */
declare const fixedInvocation: unique symbol
export type M04FixedRequest = Readonly<{ readonly [fixedInvocation]: true;
  operationText: string; methodId: string; revision: number; methodDigest: string; packageDigest: string;
  epoch: number | null; budget: Readonly<{ deadline: number }>; notAfter: string }>
export interface M04TerminalExecutor {
  executeFixed(request: M04FixedRequest, signal: AbortSignal): Promise<
    Readonly<{ status: 'acknowledged'; rows: unknown }> | Readonly<{ status: 'unavailable' | 'unconfirmed' }>
    /** All owned local children are settled/closed; remote outcome is unproved.
     * The physical pair remains poisoned. No replay, reconnect or slot reuse. */
    | Readonly<{ status: 'blocked_remote_unknown' }>>
}
export type M04FixedOperation = (request: M04Operation, signal: AbortSignal,
  receipt?: object, terminal?: boolean) => Promise<M04NativeReply>
export interface M04DeliveryProducer {
  /** Code-owned pure delivery: no SQL, hidden remote effects or detached children. */
  produce(input: Readonly<{ job: V3ManagedJobRecord; fence: V3JobFence }>, signal: AbortSignal): Promise<
    Readonly<{ status: 'delivered'; deliveries: readonly Readonly<{ binding: V3IntakeBinding; text: string }>[] }>
    | Readonly<{ status: 'failed'; reason: 'unreachable' | 'invalid_proposal' }>>
}
export type M04Config = Readonly<{ binding: Ma1MethodBinding; registry: QuellenRegistry; clock: () => V3ReadClock;
  methodExecutor: Ma1MethodSqlExecutor; intakeExecutor: V3IntakeSqlExecutor; jobsExecutor: M04TerminalExecutor;
  producer: M04DeliveryProducer; evidence: V3ImportEvidencePort<object>; history: V3ImportHistoryPort<object> }>
export type M04Facade = Readonly<{
  enqueueRule(raw: unknown, signal?: AbortSignal): Promise<V3QueueResult>;
  enqueueDiscovery(raw: unknown, signal?: AbortSignal): Promise<V3QueueResult>;
  workOnce(rawClaim: unknown, signal?: AbortSignal): Promise<V3IntegratedWorkerResult>;
}>
export type M04Authority = V3MethodAuthorityPort<object>

// Local closed metadata codec. No protected foundation/normalizer re-export.
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`
}
function detach(value: unknown, limit: number = M04_LIMITS.wireBytes): unknown {
  let nodes = 0, characters = 0
  const seen = new Set<object>()
  function walk(v: unknown, depth: number): unknown {
    if (++nodes > M04_LIMITS.wireNodes || depth > M04_LIMITS.wireDepth) throw Error('bounded')
    if (v === null || typeof v === 'boolean') return v
    if (typeof v === 'number') { if (!Number.isSafeInteger(v) || Object.is(v, -0)) throw Error('number'); return v }
    if (typeof v === 'string') { if ((characters += v.length) > limit || /[^\x20-\x7e]/.test(v)) throw Error('string'); return v }
    if (!v || typeof v !== 'object' || seen.has(v)) throw Error('object')
    seen.add(v)
    const array = Array.isArray(v)
    if (Object.getPrototypeOf(v) !== (array ? Array.prototype : Object.prototype) && Object.getPrototypeOf(v) !== null) throw Error('prototype')
    const keys = Reflect.ownKeys(v), out: unknown[] | Record<string, unknown> = array ? [] : {}
    if (array && (keys.length !== v.length + 1 || v.length > M04_LIMITS.wireNodes)) throw Error('array')
    for (const k of keys) {
      if (array && k === 'length') continue
      if (typeof k !== 'string' || (characters += k.length) > limit || /[^\x20-\x7e]/.test(k)) throw Error('key')
      const d = Object.getOwnPropertyDescriptor(v, k)
      if (!d || !('value' in d) || !d.enumerable) throw Error('descriptor')
      if (array && (!/^(0|[1-9][0-9]*)$/.test(k) || Number(k) >= (v as unknown[]).length)) throw Error('index')
      Object.defineProperty(out, k, { value: walk(d.value, depth + 1), enumerable: true, writable: true, configurable: true })
    }
    seen.delete(v)
    return Object.freeze(out)
  }
  const result = walk(value, 0)
  if (new TextEncoder().encode(canonical(result)).byteLength > limit) throw Error('bytes')
  return result
}
// Retain duplicate-member evidence before JSON.parse/JSONB can erase it.
function uniqueJson(text: string): unknown {
  let at = 0, count = 0
  const white = () => { while (/[ \t\r\n]/.test(text[at] ?? '') && at < text.length) at++ }
  function string(): string {
    const matched = /^"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/.exec(text.slice(at))
    if (!matched) throw Error('json_string')
    at += matched[0].length; return JSON.parse(matched[0]) as string
  }
  function value(depth: number): unknown {
    if (depth > M04_LIMITS.wireDepth || ++count > M04_LIMITS.wireNodes) throw Error('json_bound')
    white()
    const c = text[at]
    if (c === '"') return string()
    if (c === '{' || c === '[') {
      const object = c === '{', result: unknown[] | Record<string, unknown> = object ? {} : []
      const keys = new Set<string>(), end = object ? '}' : ']'
      at++; white()
      if (text[at] === end) { at++; return result }
      for (;;) {
        white()
        if (object) {
          const k = string(); white()
          if (keys.has(k) || text[at++] !== ':') throw Error('json_member')
          keys.add(k); Object.defineProperty(result, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true })
        } else (result as unknown[]).push(value(depth + 1))
        white()
        const sep = text[at++]
        if (sep === end) return result
        if (sep !== ',') throw Error('json_separator')
      }
    }
    const token = /^(?:null|true|false|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(text.slice(at))
    if (!token) throw Error('json_value')
    at += token[0].length; return JSON.parse(token[0]) as unknown
  }
  const result = value(0); white()
  if (at !== text.length) throw Error('json_end')
  return result
}

function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join('|') === [...keys].sort().join('|')
}
const method = z.object({ methodId: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/), revision: z.number().int().min(1).max(2_147_483_647) }).strict()
const reason = z.union([z.object({ status: z.literal('missing') }).strict(), z.object({ status: z.literal('recheck_needed'),
  reason: z.enum(['valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']) }).strict()])
const qkey = z.union([jobKey, discoveryJobKey])
const claim = z.object({ operationId, jobKey: qkey, leaseId, leaseMilliseconds: z.number().int().min(1).max(900_000) }).strict()
const fence = z.object({ jobId, revision: z.number().int().min(1).max(2_147_483_647), leaseId,
  generation: z.number().int().min(1).max(2_147_483_647) }).strict()
const context = z.unknown().transform((raw, ctx): V3GlobalRuleContext => {
  const value = readV3GlobalRuleContext(raw)
  if (value.ok) return value.value
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid_context' }); return z.NEVER
})
const ruleEnqueue = z.object({ context, method, factKind: z.enum(REGEL_FAKT_ARTEN), researchReason: reason,
  operationId, jobId, attemptLimit: z.number().int().min(1).max(16) }).strict()
const discoveryEnqueue = z.object({ destinationCountryCode: z.string(), citizenshipCountryCode: z.string(),
  method, operationId, jobId, attemptLimit: z.number().int().min(1).max(16) }).strict()
const ruleComplete = z.object({ operationId, jobKey: qkey, fence, decisionRef }).strict()
const discoveryComplete = z.object({ operationId, jobKey: qkey, fence, discoveryRef }).strict()
const failure = z.object({ operationId, jobKey: qkey, fence,
  reason: z.enum(['unreachable', 'invalid_proposal', 'verification_unavailable', 'commit_unconfirmed']) }).strict()
const result = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('rule_research'), jobId, operationId, jobKey, preparedAt: timestamp, decisionRef }).strict(),
  z.object({ kind: z.literal('combination_discovery'), jobId, operationId, jobKey: discoveryJobKey,
    preparedAt: timestamp, discoveryRef, proposalDigests: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(16)
      .refine(x => new Set(x).size === x.length) }).strict(),
])

/** Read actual S0 before stripping support, then read again to renormalize. */
export function createM04SubjectIdentity(kind: M04Kind, raw: unknown): M04SubjectIdentity | null {
  try {
    if (kind === 'combination_discovery') {
      const identity = createV3CombinationDiscoveryIdentity(raw)
      if (!identity.ok) return null
      const { destinationCountryCode, citizenshipCountryCode, method } = identity.value
      return Object.freeze({ kind, jobKey: identity.value.jobKey, contextKey: null,
        subjectText: canonical({ kind, destinationCountryCode, citizenshipCountryCode, method }) })
    }
    const input = readData(raw, z.object({ context, method, factKind: z.enum(REGEL_FAKT_ARTEN), researchReason: reason }).strict())
    if (!input) return null
    const identity = createV3WorkIdentity(input), scope = regelScopeAusEvidenceScope(input.context.scope)
    if (!identity.ok || !scope.ok) return null
    function strip(v: unknown): unknown {
      if (Array.isArray(v)) return v.map(strip)
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'supportVersionIds').map(([k, x]) => [k, strip(x)]))
      return v
    }
    const structural = readV3GlobalRuleContext(strip(input.context))
    if (!structural.ok) return null
    const c = structural.value
    const semantic = { ...('contextRevision' in c ? { contextRevision: c.contextRevision } : {}), scope: scope.scope,
      route: c.route, conditions: c.conditions.status === 'specified'
        ? { status: 'specified', expression: `rule-applicability-structure:v2:${canonical(c.conditions.expression)}` } : c.conditions,
      ...('application' in c ? { application: c.application } : {}) }
    // A derivation bug is closed, never a second escape bucket beside S0's locator.
    const contextKey = `official-truth-context:v3:${sha256Hex(canonical(semantic))}`
    if (contextKey !== identity.value.contextKey) return null
    return Object.freeze({ kind, jobKey: identity.value.jobKey, contextKey,
      subjectText: canonical({ kind, context: semantic, method: input.method, factKind: input.factKind }) })
  } catch { return null }
}

/** Mirrors the immutable command preimages in the unchanged queue, not its effects. */
export function readM04Command(raw: unknown): M04Command | null {
  try {
    // readData calls the unchanged S0 bounded-data preflight before reading fields.
    const root = readData(raw, z.object({ action: z.enum(['enqueue', 'claim', 'complete', 'fail']),
      kind: z.enum(['rule_research', 'combination_discovery']).optional(), input: z.unknown() }).strict())
    if (!root) return null
    const action = root.action
    if ((action === 'enqueue' || action === 'complete') !== Object.hasOwn(root, 'kind')) return null
    let input: Record<string, unknown> | null, identity: M04SubjectIdentity | null = null
    if (action === 'enqueue') {
      if (root.kind === 'rule_research') {
        const i = readData(root.input, ruleEnqueue)
        if (!i) return null
        input = i; identity = createM04SubjectIdentity(root.kind, { context: i.context, method: i.method,
          factKind: i.factKind, researchReason: i.researchReason })
      } else {
        const i = readData(root.input, discoveryEnqueue)
        if (!i) return null
        const id = createV3CombinationDiscoveryIdentity({ destinationCountryCode: i.destinationCountryCode,
          citizenshipCountryCode: i.citizenshipCountryCode, method: i.method })
        if (!id.ok) return null
        input = { ...i, destinationCountryCode: id.value.destinationCountryCode, citizenshipCountryCode: id.value.citizenshipCountryCode }
        identity = createM04SubjectIdentity('combination_discovery', { destinationCountryCode: id.value.destinationCountryCode,
          citizenshipCountryCode: id.value.citizenshipCountryCode, method: i.method })
      }
      if (!identity) return null
    } else if (action === 'claim') input = readData(root.input, claim)
    else if (action === 'fail') input = readData(root.input, failure)
    else input = root.kind === 'rule_research' ? readData(root.input, ruleComplete) : readData(root.input, discoveryComplete)
    if (!input) return null
    const locator = identity?.jobKey ?? input.jobKey as string
    const kind: M04Kind = locator.startsWith('research-job:') ? 'rule_research' : 'combination_discovery'
    if (root.kind && root.kind !== kind) return null
    const value = detach({ action, ...(root.kind ? { kind } : {}), input }, M04_LIMITS.metadataBytes) as M04Command['value']
    const commandText = canonical(value)
    return Object.freeze({ value, commandText, commandKey: key('queue-command', value), action, kind,
      operationId: input.operationId as string, jobKey: locator, subjectText: identity?.subjectText ?? null })
  } catch { return null }
}

function managed(raw: unknown): V3ManagedJobRecord | null {
  const a = readV3ResearchJobRecord(raw)
  if (a.ok && same(a.value, raw)) return a.value
  const b = readV3CombinationDiscoveryJobRecord(raw)
  return b.ok && same(b.value, raw) ? b.value : null
}
function boundedText(v: unknown, bound: number): v is string {
  return typeof v === 'string' && v.length <= bound && new TextEncoder().encode(v).byteLength <= bound
}
/** Strict result decoder below terminal transport, never a row-result ACK. */
export function readM04NativeReply(rawRows: unknown, operation: M04Operation['operation']): M04NativeReply | null {
  try {
    if (!Array.isArray(rawRows) || Object.getPrototypeOf(rawRows) !== Array.prototype || rawRows.length !== 1
      || Reflect.ownKeys(rawRows).length !== 2) return null
    const d = Object.getOwnPropertyDescriptor(rawRows, '0')
    if (!d || !('value' in d)) return null
    const row = d.value
    if (!row || typeof row !== 'object' || Reflect.ownKeys(row).length !== 1) return null
    const cell = Object.getOwnPropertyDescriptor(row, 'result')
    if (!cell || !('value' in cell) || !boundedText(cell.value, M04_LIMITS.wireBytes)) return null
    const value = detach(uniqueJson(cell.value)) as Record<string, unknown>
    if (!value || typeof value.status !== 'string') return null
    const negatives: Record<M04Operation['operation'], readonly string[]> = {
      queue_read: ['absent', 'blocked', 'requires_authority'],
      queue_confirm: ['not_attempted', 'collision', 'blocked', 'requires_authority'],
      queue_cas: ['mismatch', 'collision', 'blocked', 'quota'],
      execution_read: ['absent', 'blocked', 'requires_authority'],
      execution_start: ['blocked', 'collision', 'quota'], execution_prepare: ['blocked', 'collision', 'quota'],
    }
    if (exact(value, ['status']) && negatives[operation].includes(value.status)) return value as M04NativeReply
    if (operation === 'queue_read' && exact(value, ['status', 'record']) && value.status === 'present') {
      const record = managed(value.record); return record ? Object.freeze({ status: 'present', record }) : null
    }
    if ((operation === 'queue_cas' || operation === 'queue_confirm') && value.status === 'committed') {
      const keys = operation === 'queue_cas' ? ['status', 'record'] : ['status', 'record', 'operationId', 'commandKey', 'commandText', 'envelopeText']
      if (!exact(value, keys)) return null
      const record = managed(value.record)
      if (!record) return null
      if (operation === 'queue_confirm') {
        if (!boundedText(value.commandText, M04_LIMITS.metadataBytes) || !boundedText(value.envelopeText, M04_LIMITS.envelopeBytes)) return null
        const c = readM04Command(uniqueJson(value.commandText)), envelope = detach(uniqueJson(value.envelopeText), M04_LIMITS.envelopeBytes)
        if (!c || c.commandText !== value.commandText || c.operationId !== value.operationId || c.commandKey !== value.commandKey
          || !exact(envelope, ['operationId', 'commandKey', 'jobKey', 'expected', 'next', 'notAfter', 'audit'])
          || envelope.operationId !== c.operationId || envelope.commandKey !== c.commandKey || envelope.jobKey !== c.jobKey
          || !same(envelope.next, record) || canonical(envelope) !== value.envelopeText
          || !validEnvelope(envelope, c, record)) return null
      }
      return Object.freeze({ ...value, record }) as M04NativeReply
    }
    if (typeof value.attemptKey !== 'string' || !/^execution-attempt:v3:[a-f0-9]{64}$/.test(value.attemptKey)) return null
    if (operation === 'execution_start' && value.status === 'reserved' && exact(value, ['status', 'attemptKey', 'token', 'claim', 'leasedJob'])) {
      const original = readData(value.claim, claim), leasedJob = managed(value.leasedJob)
      return original && leasedJob && claimBinds(original, leasedJob) && typeof value.token === 'string' && /^[a-f0-9]{64}$/.test(value.token)
        ? Object.freeze({ status: 'reserved', attemptKey: value.attemptKey, token: value.token, claim: original, leasedJob }) : null
    }
    if (!['prepared', 'completed'].includes(value.status) || !Array.isArray(value.references)
      || value.references.length < 1 || value.references.length > M04_LIMITS.deliveries) return null
    const record = readData(value.result, result)
    if (!record) return null
    const references: V3IntakeReference[] = []
    for (const ref of value.references) { const r = readV3IntakeReference(ref); if (!r.ok) return null; references.push(r.value) }
    if (new Set(references.map(r => r.binding.operationId)).size !== references.length
      || new Set(references.map(r => r.proposalDigest)).size !== references.length
      || (record.kind === 'rule_research' && references.length !== 1)
      || (record.kind === 'combination_discovery' && !same([...record.proposalDigests].sort(), references.map(r => r.proposalDigest).sort()))) return null
    if (operation === 'execution_prepare' && value.status === 'prepared'
      && exact(value, ['status', 'attemptKey', 'result', 'references'])) return Object.freeze({ status: 'prepared',
        attemptKey: value.attemptKey, result: record, references: Object.freeze(references) })
    if (operation !== 'execution_read' || !exact(value, value.status === 'prepared'
      ? ['status', 'attemptKey', 'claim', 'leasedJob', 'result', 'references']
      : ['status', 'attemptKey', 'claim', 'leasedJob', 'job', 'result', 'references'])) return null
    const original = readData(value.claim, claim), leasedJob = managed(value.leasedJob)
    if (!original || !leasedJob || !claimBinds(original, leasedJob) || !resultBinds(record, references, leasedJob)) return null
    if (value.status === 'prepared') return Object.freeze({ status: 'prepared', attemptKey: value.attemptKey,
      claim: original, leasedJob, result: record, references: Object.freeze(references) })
    const job = managed(value.job)
    return job && completedBinds(job, leasedJob, record) ? Object.freeze({ status: 'completed', attemptKey: value.attemptKey, claim: original, leasedJob,
      job, result: record, references: Object.freeze(references) }) : null
  } catch { return null }
}

function claimBinds(c: M04Claim, j: V3ManagedJobRecord): boolean {
  return j.state === 'leased' && j.lease !== null && j.lease.leaseId === c.leaseId
    && j.lease.generation === j.revision && c.jobKey === (j.kind === 'research_job_record' ? j.jobKey : j.identity.jobKey)
    && Date.parse(j.lease.expiresAt) - Date.parse(j.lease.acquiredAt) === c.leaseMilliseconds
    && j.lease.acquiredAt === j.updatedAt
}
function resultBinds(r: V3WorkerResultRecord, refs: readonly V3IntakeReference[], j: V3ManagedJobRecord): boolean {
  const method = j.kind === 'research_job_record' ? j.method : j.identity.method
  return r.jobId === j.jobId && r.operationId === j.operationId
    && r.jobKey === (j.kind === 'research_job_record' ? j.jobKey : j.identity.jobKey)
    && r.kind === (j.kind === 'research_job_record' ? 'rule_research' : 'combination_discovery')
    && r.preparedAt >= j.createdAt && j.lease !== null && r.preparedAt < j.lease.expiresAt
    && refs.every(x => x.binding.jobId === j.jobId && same(x.binding.method, method)
      && (j.kind !== 'research_job_record' || x.binding.contextKey === j.contextKey))
}
function completedBinds(j: V3ManagedJobRecord, leased: V3ManagedJobRecord, r: V3WorkerResultRecord): boolean {
  if (j.state !== 'succeeded' || j.revision !== leased.revision + 1 || j.predecessorRevision !== leased.revision) return false
  const successor = { ...leased, revision: j.revision, predecessorRevision: leased.revision,
    updatedAt: j.updatedAt, state: 'succeeded', lease: null, lastFailure: null,
    ...(r.kind === 'rule_research' ? { resultDecisionRef: r.decisionRef } : { resultDiscoveryRef: r.discoveryRef }) }
  return same(j, successor)
}
function validEnvelope(e: Record<string, unknown>, c: M04Command, next: V3ManagedJobRecord): boolean {
  const expected = e.expected === null ? null : managed(e.expected)
  if (e.expected !== null && !expected) return false
  if (!readData(e.notAfter, timestamp) || !exact(e.audit, ['reference', 'kind', 'observedAt', 'priorRevision', 'nextRevision'])) return false
  const audit = e.audit
  if (!readData(audit.observedAt, timestamp) || audit.priorRevision !== (expected?.revision ?? null)
    || audit.nextRevision !== next.revision || audit.reference !== key('queue-event', { op: c.operationId, command: c.commandKey })
    || !['enqueued', 'deduplicated', 'leased', 'reclaimed', 'backoff', 'exhausted', 'completed'].includes(audit.kind as string)) return false
  if (audit.kind === 'deduplicated') { if (!expected || !same(expected, next)) return false }
  else if (next.revision !== (expected?.revision ?? 0) + 1 || next.predecessorRevision !== (expected?.revision ?? null)
    || next.updatedAt !== audit.observedAt) return false
  const k = next.kind === 'research_job_record' ? next.jobKey : next.identity.jobKey
  if (k !== c.jobKey || (expected && (expected.kind === 'research_job_record' ? expected.jobKey : expected.identity.jobKey) !== c.jobKey)) return false
  const limit = new Date(Date.parse(audit.observedAt as string) + M04_LIMITS.effectMs).toISOString()
  return e.notAfter === ((c.action === 'complete' || c.action === 'fail') && expected?.lease && expected.lease.expiresAt < limit ? expected.lease.expiresAt : limit)
}
