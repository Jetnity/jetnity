import 'server-only'
import { z } from 'zod'
import {
  createV3WorkIdentity, createV3CombinationDiscoveryIdentity, readV3CombinationDiscoveryJobRecord,
  readV3GlobalRuleContext, readV3ResearchJobRecord,
  OFFICIAL_TRUTH_V3_LIMITS, type V3ResearchJobRecord, type V3CombinationDiscoveryJobRecord, type V3GlobalRuleContext, type V3MethodAuthorityPort, type V3MethodRef,
} from '../contract'
import { REGEL_FAKT_ARTEN } from '@/lib/readiness/rule-claims'
import { invocationBudget, readData, readNow, same, key, operationId, jobId, leaseId, jobKey, decisionRef, discoveryJobKey, discoveryRef,
  type InvocationBudget, type BudgetResult } from './internal'

export type V3ManagedJobRecord = V3ResearchJobRecord | V3CombinationDiscoveryJobRecord
type QueueKind = 'rule_research' | 'combination_discovery'
type ConfirmationMode = 'current' | 'exact_operation'
const queueKeySchema = z.union([jobKey, discoveryJobKey])

type QueueAuditKind = 'enqueued' | 'deduplicated' | 'leased' | 'reclaimed' | 'backoff' | 'exhausted' | 'completed'
export type V3QueueCommit = Readonly<{
  operationId: string; commandKey: string; jobKey: string;
  expected: V3ManagedJobRecord | null; next: V3ManagedJobRecord;
  notAfter: string;
  audit: Readonly<{ reference: string; kind: QueueAuditKind; observedAt: string; priorRevision: number | null; nextRevision: number }>
}>
export type V3QueueConfirmation =
  | { status: 'committed'; operationId: string; commandKey: string; record: unknown }
  | { status: 'not_attempted' | 'collision' | 'unconfirmed' | 'unavailable' }
export type V3QueueAtomicClaimConfirmation =
  | { status: 'committed'; operationId: string; commandKey: string; record: unknown; replayed: boolean }
  | { status: 'collision' | 'unconfirmed' | 'unavailable' | 'not_due' | 'superseded' | 'mismatch' }
export type V3QueueAtomicMutationConfirmation =
  | { status: 'committed'; operationId: string; commandKey: string; record: unknown; replayed: boolean }
  | { status: 'collision' | 'unconfirmed' | 'unavailable' | 'superseded' | 'mismatch' }

/**
 * Future code-owned atomic adapter. CAS must atomically compare the FULL expected
 * record, consume operationId+commandKey, check notAfter/lease expiry with its
 * authoritative clock, append the audit event and commit next. not_attempted
 * is an authoritative absence from the operation ledger, never a transport error.
 * No positive adapter is bound by this module.
 */
export type V3QueueCommitAuthority = Readonly<{
  method: V3MethodRef; receipt: object;
  /** Must run at the adapter's atomic mutation point, after waits/locks. */
  reprove(signal: AbortSignal): Promise<boolean>;
}>
export interface V3QueueStoragePort {
  /** Code-owned claim transaction: original confirmation, full transition/CAS
   * and actual exact final read share one database transaction. A positive ACK
   * is returned only after COMMIT and complete transport drain. No fallback or
   * automatic retry is permitted after this capability has been selected. */
  claimAtomic?(operationId: string, commandKey: string, authority: V3QueueCommitAuthority,
    signal: AbortSignal): Promise<V3QueueAtomicClaimConfirmation>
  /** Enqueue/complete/fail retain their original operation receipt and return
   * the actual final current record. A replay may acknowledge a later revision
   * of that same job cycle. Selection never falls back to legacy RPCs. */
  mutateAtomic?(operationId: string, commandKey: string, authority: V3QueueCommitAuthority,
    signal: AbortSignal): Promise<V3QueueAtomicMutationConfirmation>
  /** The optional same-invocation receipt authorizes an actual read; it never
   * substitutes its record or freshness. It may cover a fresh claim's initial
   * read under its code-owned method, or the read after an acknowledged CAS. */
  read(jobKey: string, signal: AbortSignal, receipt?: object): Promise<{ status: 'ok'; record: unknown | null } | { status: 'unavailable' }>
  /** A code-owned drain only sequences a replay's separate authority read. It
   * supplies no receipt or result and does not replace original confirmation. */
  confirm(operationId: string, commandKey: string, signal: AbortSignal,
    beforeAuthority?: () => Promise<void>): Promise<V3QueueConfirmation>
  compareAndSwap(commit: V3QueueCommit, authority: V3QueueCommitAuthority, signal: AbortSignal): Promise<
    { status: 'committed'; operationId: string; commandKey: string; record: unknown }
    | { status: 'mismatch' | 'collision' | 'unconfirmed' | 'unavailable' }>
}

export type V3QueueResult =
  | { status: 'confirmed'; record: V3ManagedJobRecord; replayed: boolean }
  | { status: 'invalid' | 'unavailable' | 'unconfirmed' | 'collision' | 'contended' | 'not_due' | 'superseded' }
export type V3QueueOptions = Readonly<{
  storage: V3QueueStoragePort | null; methodAuthority: V3MethodAuthorityPort<object> | null; now: () => string;
  /** Optional fixed server binding, never claim input or selector custody. A
   * fresh claim obtains its own current receipt before its actual initial read. */
  claimMethod?: V3MethodRef;
  invocationMilliseconds: number; backoffBaseMilliseconds: number; backoffMaxMilliseconds: number;
}>

const context = z.unknown().transform((value, ctx): V3GlobalRuleContext => {
  const parsed = readV3GlobalRuleContext(value)
  if (!parsed.ok) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid' }); return z.NEVER }
  return parsed.value
})
const method = z.object({ methodId: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/),
  revision: z.number().int().min(1).max(2_147_483_647) }).strict()
const researchReason = z.union([
  z.object({ status: z.literal('missing') }).strict(),
  z.object({ status: z.literal('recheck_needed'), reason: z.enum(['valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']) }).strict(),
])
const enqueueSchema = z.object({ context, method, factKind: z.enum(REGEL_FAKT_ARTEN), researchReason,
  operationId, jobId, attemptLimit: z.number().int().min(1).max(OFFICIAL_TRUTH_V3_LIMITS.jobAttempts) }).strict()
export type V3EnqueueInput = z.infer<typeof enqueueSchema>
const discoveryEnqueueSchema = z.object({ destinationCountryCode: z.string(), citizenshipCountryCode: z.string(),
  method, operationId, jobId, attemptLimit: z.number().int().min(1).max(OFFICIAL_TRUTH_V3_LIMITS.jobAttempts) }).strict()
const claimSchema = z.object({ operationId, jobKey: queueKeySchema, leaseId,
  leaseMilliseconds: z.number().int().min(1).max(OFFICIAL_TRUTH_V3_LIMITS.leaseMilliseconds) }).strict()
const fenceSchema = z.object({ jobId, revision: z.number().int().positive(), leaseId,
  generation: z.number().int().positive() }).strict()
const completeSchema = z.object({ operationId, jobKey: queueKeySchema, fence: fenceSchema, decisionRef }).strict()
const discoveryCompleteSchema = z.object({ operationId, jobKey: queueKeySchema, fence: fenceSchema, discoveryRef }).strict()
const failSchema = z.object({ operationId, jobKey: queueKeySchema, fence: fenceSchema,
  reason: z.enum(['unreachable', 'invalid_proposal', 'verification_unavailable', 'commit_unconfirmed']) }).strict()
export type V3JobFence = z.infer<typeof fenceSchema>

function isActive(record: V3ManagedJobRecord): boolean { return ['queued', 'leased', 'backoff'].includes(record.state) }
function parsedRecord(value: unknown, expectedKey: string): V3ManagedJobRecord | null {
  if (jobKey.safeParse(expectedKey).success) {
    const parsed = readV3ResearchJobRecord(value)
    return parsed.ok && parsed.value.jobKey === expectedKey ? parsed.value : null
  }
  const parsed = readV3CombinationDiscoveryJobRecord(value)
  return parsed.ok && parsed.value.identity.jobKey === expectedKey ? parsed.value : null
}
function matchesNamespace(value: string, kind: QueueKind): boolean {
  return (kind === 'rule_research' ? jobKey : discoveryJobKey).safeParse(value).success
}
function jobMethod(record: V3ManagedJobRecord): V3MethodRef {
  return record.kind === 'research_job_record' ? record.method : record.identity.method
}
function ownsLease(record: V3ManagedJobRecord, fence: V3JobFence, now: string): boolean {
  return record.state === 'leased' && record.jobId === fence.jobId && record.revision === fence.revision
    && record.lease?.leaseId === fence.leaseId && record.lease.generation === fence.generation
    && record.lease.expiresAt > now
}

/** Composition seam for later reviewed server adapters; not a public endpoint. */
function createQueueCoordinator(options: V3QueueOptions, kind: QueueKind) {
  const storage = options.storage
  const parsedClaimMethod = options.claimMethod === undefined ? undefined : readData(options.claimMethod, method)
  const claimMethod = parsedClaimMethod ? Object.freeze(parsedClaimMethod) : parsedClaimMethod
  type FreshCommitAuthority = Readonly<{
    operationId: string; commandKey: string; jobKey: string; signal: AbortSignal; authority: V3QueueCommitAuthority;
  }>
  const configValid = Number.isInteger(options.invocationMilliseconds) && options.invocationMilliseconds >= 1
    && options.invocationMilliseconds <= 10_000 && Number.isInteger(options.backoffBaseMilliseconds)
    && options.backoffBaseMilliseconds >= 1 && Number.isInteger(options.backoffMaxMilliseconds)
    && options.backoffMaxMilliseconds >= options.backoffBaseMilliseconds && options.backoffMaxMilliseconds <= 86_400_000

  async function authorize(record: V3ManagedJobRecord, budget: InvocationBudget,
    retained?: V3QueueCommitAuthority, initialReadReceipt?: object): Promise<V3QueueCommitAuthority | null> {
    const methodPort = options.methodAuthority, methodRef = jobMethod(record), now = readNow(options.now)
    if (!methodPort || !now || record.updatedAt > now) return null
    if (retained !== undefined) {
      if (!same(retained.method, methodRef)) return null
      return await retained.reprove(budget.signal) ? retained : null
    }
    let acquired = initialReadReceipt
    if (acquired === undefined) {
      const result = await budget.call(() => methodPort.resolveCurrent(methodRef, now))
      if (!result.ok || result.value.status !== 'approved') return null
      acquired = result.value.receipt
    }
    const receipt = acquired
    const authority: V3QueueCommitAuthority = Object.freeze({
      method: methodRef, receipt,
      async reprove(signal) {
        const at = readNow(options.now)
        if (!at || signal.aborted || budget.signal.aborted) return false
        const checked = await budget.call(() => methodPort.reproveAtCommit(receipt, methodRef, at))
        return checked.ok && checked.value.status === 'current' && !signal.aborted
      },
    })
    return await authority.reprove(budget.signal) ? authority : null
  }

  async function load(keyValue: string, budget: InvocationBudget, receipt?: object) {
    if (!storage) return { status: 'unavailable' as const }
    const result = await budget.call((signal) => receipt === undefined
      ? storage.read(keyValue, signal) : storage.read(keyValue, signal, receipt))
    if (!result.ok || result.value.status !== 'ok') return { status: 'unavailable' as const }
    if (result.value.record === null) return { status: 'ok' as const, record: null }
    const record = parsedRecord(result.value.record, keyValue)
    return record ? { status: 'ok' as const, record } : { status: 'invalid' as const }
  }

  async function confirmed(value: Extract<V3QueueConfirmation, { status: 'committed' }>, op: string,
    command: string, keyValue: string, budget: InvocationBudget, replayed: boolean, mode: ConfirmationMode,
    fresh?: FreshCommitAuthority): Promise<V3QueueResult> {
    if (value.operationId !== op || value.commandKey !== command) return { status: 'collision' }
    const result = parsedRecord(value.record, keyValue)
    if (!result) return { status: 'invalid' }
    if (fresh !== undefined && (replayed || fresh.operationId !== op || fresh.commandKey !== command
      || fresh.jobKey !== keyValue || fresh.signal !== budget.signal || fresh.signal.aborted
      || !same(fresh.authority.method, jobMethod(result)))) return { status: 'unavailable' }
    const current = await load(keyValue, budget, fresh?.authority.receipt)
    if (current.status !== 'ok') return current
    if (current.record === null || current.record.jobId !== result.jobId) return { status: 'superseded' }
    // A Claim receipt owns its original acquisition, never a later generation
    // that happens to reuse the lease ID. Enqueue still returns current ACKs.
    if (mode === 'exact_operation' && !same(result, current.record)) return { status: 'superseded' }
    const acknowledged = mode === 'exact_operation' ? result : current.record
    return await authorize(acknowledged, budget, fresh?.authority)
      ? { status: 'confirmed', record: acknowledged, replayed } : { status: 'unavailable' }
  }

  async function claimAtomic(input: z.infer<typeof claimSchema>, signal?: AbortSignal): Promise<V3QueueResult> {
    if (!matchesNamespace(input.jobKey, kind)) return { status: 'invalid' }
    const methodPort = options.methodAuthority
    if (!storage?.claimAtomic || !configValid || !claimMethod || !methodPort) return { status: 'unavailable' }
    const budget = invocationBudget(options.invocationMilliseconds, signal)
    // A deadline cancels admission; it does not turn an outstanding database or
    // method promise into settled work. Drain every started child before return.
    async function callAndDrain<T>(run: (s: AbortSignal) => Promise<T>): Promise<BudgetResult<T>> {
      let pending: Promise<T> | undefined
      const answer = await budget.call(s => { pending = Promise.resolve().then(() => run(s)); return pending })
      if (pending) await Promise.allSettled([pending])
      return budget.signal.aborted ? { ok: false } : answer
    }
    try {
      const checkedAt = readNow(options.now)
      if (!checkedAt) return { status: 'unavailable' }
      const acquired = await callAndDrain(() => methodPort.resolveCurrent(claimMethod, checkedAt))
      if (!acquired.ok || acquired.value.status !== 'approved') return { status: 'unavailable' }
      const receipt = acquired.value.receipt
      const authority: V3QueueCommitAuthority = Object.freeze({ method: claimMethod, receipt,
        async reprove(s) {
          const at = readNow(options.now)
          if (!at || s.aborted || budget.signal.aborted) return false
          const checked = await callAndDrain(() => methodPort.reproveAtCommit(receipt, claimMethod, at))
          return checked.ok && checked.value.status === 'current' && !s.aborted && !budget.signal.aborted
        },
      })
      if (!await authority.reprove(budget.signal)) return { status: 'unavailable' }
      const commandKey = key('queue-command', { action: 'claim', input })
      const written = await callAndDrain(s => storage.claimAtomic!(input.operationId, commandKey, authority, s))
      if (!written.ok) return { status: 'unconfirmed' }
      if (written.value.status !== 'committed') return written.value.status === 'mismatch'
        ? { status: 'contended' } : { status: written.value.status }
      if (written.value.operationId !== input.operationId || written.value.commandKey !== commandKey)
        return { status: 'collision' }
      const record = parsedRecord(written.value.record, input.jobKey), now = readNow(options.now)
      if (!record || typeof written.value.replayed !== 'boolean' || !now || record.updatedAt > now
        || !same(jobMethod(record), claimMethod)) return { status: 'invalid' }
      if (record.state !== 'exhausted' && (record.state !== 'leased' || !record.lease
        || record.lease.leaseId !== input.leaseId || record.lease.generation !== record.revision
        || record.lease.acquiredAt !== record.updatedAt || record.lease.expiresAt <= now
        || Date.parse(record.lease.expiresAt) - Date.parse(record.lease.acquiredAt) !== input.leaseMilliseconds))
        return { status: 'superseded' }
      if (!await authority.reprove(budget.signal)) return { status: 'unavailable' }
      const finalNow = readNow(options.now)
      if (!finalNow || record.updatedAt > finalNow || (record.lease && record.lease.expiresAt <= finalNow))
        return { status: 'superseded' }
      return { status: 'confirmed', record, replayed: written.value.replayed }
    } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
  }

  async function mutateAtomic(op: string, keyValue: string, command: string, methodRef: V3MethodRef | null | undefined,
    signal: AbortSignal | undefined, validRecord: (record: V3ManagedJobRecord, replayed: boolean) => boolean): Promise<V3QueueResult> {
    if (!matchesNamespace(keyValue, kind)) return { status: 'invalid' }
    const methodPort = options.methodAuthority, parsedMethod = methodRef && readData(methodRef, method)
    if (!storage?.mutateAtomic || !configValid || !parsedMethod || !methodPort
      || options.backoffBaseMilliseconds !== 1000 || options.backoffMaxMilliseconds !== 60000) return { status: 'unavailable' }
    const fixedMethod = Object.freeze(parsedMethod), budget = invocationBudget(options.invocationMilliseconds, signal)
    // All real children, including a lost/late ACK or rejected method read,
    // retain their original deadline and are joined before this call returns.
    async function callAndDrain<T>(run: (s: AbortSignal) => Promise<T>): Promise<BudgetResult<T>> {
      let pending: Promise<T> | undefined
      const answer = await budget.call(s => { pending = Promise.resolve().then(() => run(s)); return pending })
      if (pending) await Promise.allSettled([pending])
      return budget.signal.aborted ? { ok: false } : answer
    }
    try {
      const checkedAt = readNow(options.now)
      if (!checkedAt) return { status: 'unavailable' }
      const acquired = await callAndDrain(() => methodPort.resolveCurrent(fixedMethod, checkedAt))
      if (!acquired.ok || acquired.value.status !== 'approved') return { status: 'unavailable' }
      const receipt = acquired.value.receipt
      if (!receipt || typeof receipt !== 'object') return { status: 'unavailable' }
      const authority: V3QueueCommitAuthority = Object.freeze({ method: fixedMethod, receipt,
        async reprove(s) {
          const at = readNow(options.now)
          if (!at || s.aborted || budget.signal.aborted) return false
          const checked = await callAndDrain(() => methodPort.reproveAtCommit(receipt, fixedMethod, at))
          return checked.ok && checked.value.status === 'current' && !s.aborted && !budget.signal.aborted
        },
      })
      if (!await authority.reprove(budget.signal)) return { status: 'unavailable' }
      const written = await callAndDrain(s => storage.mutateAtomic!(op, command, authority, s))
      if (!written.ok) return { status: 'unconfirmed' }
      if (written.value.status !== 'committed') return written.value.status === 'mismatch'
        ? { status: 'contended' } : { status: written.value.status }
      if (written.value.operationId !== op || written.value.commandKey !== command) return { status: 'collision' }
      const record = parsedRecord(written.value.record, keyValue), now = readNow(options.now)
      if (!record || typeof written.value.replayed !== 'boolean' || !now || record.updatedAt > now
        || !same(jobMethod(record), fixedMethod)) return { status: 'invalid' }
      if (!validRecord(record, written.value.replayed)) return { status: 'superseded' }
      if (!await authority.reprove(budget.signal)) return { status: 'unavailable' }
      const finalNow = readNow(options.now)
      if (!finalNow || record.updatedAt > finalNow) return { status: 'superseded' }
      return { status: 'confirmed', record, replayed: written.value.replayed }
    } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
  }

  async function perform(op: string, keyValue: string, command: string, signal: AbortSignal | undefined,
    prepare: (current: V3ManagedJobRecord | null, now: string) =>
      { next: V3ManagedJobRecord; kind: QueueAuditKind; leaseDeadline?: string } | Exclude<V3QueueResult, { status: 'confirmed' }>,
    confirmationMode: ConfirmationMode = 'current',
  ): Promise<V3QueueResult> {
    if (!matchesNamespace(keyValue, kind)) return { status: 'invalid' }
    if (!storage || !configValid) return { status: 'unavailable' }
    const budget = invocationBudget(options.invocationMilliseconds, signal)
    try {
      let checked: BudgetResult<V3QueueConfirmation>
      let initialAcquisition: BudgetResult<Awaited<ReturnType<V3MethodAuthorityPort<object>['resolveCurrent']>>> | undefined
      const methodPort = options.methodAuthority
      const checkedAt = confirmationMode === 'exact_operation' && claimMethod ? readNow(options.now) : null
      if (checkedAt && claimMethod && methodPort) {
        // These independent reads share the original invocation deadline. Join
        // their actual promises, including rejection/abort cleanup, before using
        // either result. A positive method read cannot prove ledger absence.
        // A historical confirmation may need its OWN subsequent method read;
        // sequence only that read behind the actual speculative read's drain.
        let drained!: () => void
        const acquisitionDrained = new Promise<void>(resolve => { drained = resolve })
        const [confirmation, acquisition] = await Promise.allSettled([
          Promise.resolve().then(() => {
            if (budget.signal.aborted) throw new Error('aborted')
            return storage.confirm(op, command, budget.signal, () => acquisitionDrained)
          }),
          Promise.resolve().then(() => {
            if (budget.signal.aborted) throw new Error('aborted')
            return methodPort.resolveCurrent(claimMethod, checkedAt)
          }).finally(drained),
        ])
        checked = !budget.signal.aborted && confirmation.status === 'fulfilled'
          ? { ok: true, value: confirmation.value } : { ok: false }
        initialAcquisition = !budget.signal.aborted && acquisition.status === 'fulfilled'
          ? { ok: true, value: acquisition.value } : { ok: false }
      } else checked = await budget.call((s) => storage.confirm(op, command, s))
      if (!checked.ok) return { status: 'unconfirmed' }
      // Historical/uncertain confirmation never receives the speculative receipt.
      if (checked.value.status === 'committed') return await confirmed(checked.value, op, command, keyValue, budget, true, confirmationMode)
      if (checked.value.status !== 'not_attempted') return { status: checked.value.status }
      for (let attempt = 0; attempt < 3; attempt++) {
        let initialReadReceipt: object | undefined
        if (confirmationMode === 'exact_operation' && claimMethod !== undefined) {
          const methodPort = options.methodAuthority, checkedAt = readNow(options.now)
          if (!claimMethod || !methodPort || !checkedAt) return { status: 'unavailable' }
          const acquired = attempt === 0 && initialAcquisition !== undefined ? initialAcquisition
            : await budget.call(() => methodPort.resolveCurrent(claimMethod, checkedAt))
          if (!acquired.ok || acquired.value.status !== 'approved') return { status: 'unavailable' }
          initialReadReceipt = acquired.value.receipt
        }
        const before = await load(keyValue, budget, initialReadReceipt)
        if (before.status !== 'ok') return before
        if (initialReadReceipt !== undefined && before.record && !same(jobMethod(before.record), claimMethod)) return { status: 'unavailable' }
        const now = readNow(options.now)
        if (!now || (before.record && before.record.updatedAt > now)) return { status: 'invalid' }
        const change = prepare(before.record, now)
        if ('status' in change) return change
        const next = parsedRecord(change.next, keyValue)
        if (!next) return { status: 'invalid' }
        const wallDeadline = new Date(Date.parse(now) + options.invocationMilliseconds).toISOString()
        const commit: V3QueueCommit = {
          operationId: op, commandKey: command, jobKey: keyValue, expected: before.record, next,
          notAfter: change.leaseDeadline && change.leaseDeadline < wallDeadline ? change.leaseDeadline : wallDeadline,
          audit: { reference: key('queue-event', { op, command }), kind: change.kind, observedAt: now,
            priorRevision: before.record?.revision ?? null, nextRevision: next.revision },
        }
        if (initialReadReceipt !== undefined && !same(jobMethod(next), claimMethod)) return { status: 'unavailable' }
        const authority = await authorize(next, budget, undefined, initialReadReceipt)
        if (!authority) return { status: 'unavailable' }
        const written = await budget.call((s) => storage.compareAndSwap(commit, authority, s))
        if (!written.ok) return { status: 'unconfirmed' }
        if (written.value.status === 'committed') {
          // Only this acknowledged CAS can lend its unchanged private receipt to
          // the actual final read. Replay and uncertain outcomes never enter here.
          const fresh = Object.freeze({ operationId: op, commandKey: command, jobKey: keyValue, signal: budget.signal, authority })
          return await confirmed(written.value, op, command, keyValue, budget, false, confirmationMode, fresh)
        }
        if (written.value.status !== 'mismatch') return { status: written.value.status }
        // mismatch is authoritative non-commit, so a bounded fresh read is safe.
      }
      return { status: 'contended' }
    } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
  }

  return {
    async read(keyValue: unknown, signal?: AbortSignal): Promise<V3QueueResult> {
      const valid = readData(keyValue, kind === 'rule_research' ? jobKey : discoveryJobKey)
      if (!valid) return { status: 'invalid' }
      if (!storage || !configValid) return { status: 'unavailable' }
      const budget = invocationBudget(options.invocationMilliseconds, signal)
      try {
        const value = await load(valid, budget)
        if (value.status !== 'ok') return value
        if (!value.record) return { status: 'not_due' }
        return await authorize(value.record, budget) ? { status: 'confirmed', record: value.record, replayed: false } : { status: 'unavailable' }
      } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
    },
    async enqueue(value: unknown, signal?: AbortSignal): Promise<V3QueueResult> {
      const input = kind === 'rule_research' ? readData(value, enqueueSchema) : readData(value, discoveryEnqueueSchema)
      if (!input) return { status: 'invalid' }
      const identity = 'context' in input
        ? createV3WorkIdentity({ context: input.context, method: input.method, factKind: input.factKind, researchReason: input.researchReason })
        : createV3CombinationDiscoveryIdentity({ destinationCountryCode: input.destinationCountryCode,
          citizenshipCountryCode: input.citizenshipCountryCode, method: input.method })
      if (!identity.ok) return { status: 'invalid' }
      // Canonical country/context identity, not raw casing, owns idempotency.
      const normalized = 'context' in input ? input : { ...input,
        ...('kind' in identity.value ? { destinationCountryCode: identity.value.destinationCountryCode,
          citizenshipCountryCode: identity.value.citizenshipCountryCode } : {}) }
      const command = key('queue-command', { action: 'enqueue', kind, input: normalized })
      if (storage?.mutateAtomic !== undefined) return mutateAtomic(input.operationId, identity.value.jobKey, command,
        input.method, signal, (record, replayed) => replayed || isActive(record))
      return perform(input.operationId, identity.value.jobKey, command, signal, (current, now) => {
        if (current && isActive(current)) return { next: current, kind: 'deduplicated' }
        if (current && current.jobId === input.jobId) return { status: 'collision' }
        const lifecycle = { schema: 3 as const, jobId: input.jobId, operationId: input.operationId,
          revision: (current?.revision ?? 0) + 1, predecessorRevision: current?.revision ?? null,
          state: 'queued' as const, createdAt: now, updatedAt: now, attempt: 0, attemptLimit: input.attemptLimit,
          lease: null, nextAttemptAt: null, lastFailure: null }
        const next = 'kind' in identity.value ? readV3CombinationDiscoveryJobRecord({ ...lifecycle,
          kind: 'combination_discovery_job_record', identity: identity.value, resultDiscoveryRef: null })
          : 'context' in input ? readV3ResearchJobRecord({ ...lifecycle, kind: 'research_job_record',
            jobKey: identity.value.jobKey, context: input.context, contextKey: identity.value.contextKey,
            research: identity.value.research, method: input.method, resultDecisionRef: null }) : null
        return next?.ok ? { next: next.value, kind: 'enqueued' } : { status: 'invalid' }
      })
    },
    async claim(value: unknown, signal?: AbortSignal): Promise<V3QueueResult> {
      const input = readData(value, claimSchema)
      if (!input) return { status: 'invalid' }
      if (storage?.claimAtomic !== undefined) return claimAtomic(input, signal)
      const result = await perform(input.operationId, input.jobKey, key('queue-command', { action: 'claim', input }), signal,
        (current, now) => {
          if (!current || !isActive(current)) return { status: 'not_due' }
          if (current.state === 'backoff' && current.nextAttemptAt! > now) return { status: 'not_due' }
          if (current.state === 'leased' && current.lease!.expiresAt > now) return { status: 'not_due' }
          if (current.attempt >= current.attemptLimit) {
            return { next: { ...current, revision: current.revision + 1, predecessorRevision: current.revision,
              updatedAt: now, state: 'exhausted', lease: null, nextAttemptAt: null,
              lastFailure: current.lastFailure ?? 'verification_unavailable' }, kind: 'exhausted' }
          }
          const revision = current.revision + 1
          return { next: { ...current, revision, predecessorRevision: current.revision,
            state: 'leased', updatedAt: now, attempt: current.attempt + 1, nextAttemptAt: null,
            lease: { leaseId: input.leaseId, generation: revision, acquiredAt: now,
              expiresAt: new Date(Date.parse(now) + input.leaseMilliseconds).toISOString() } },
          kind: current.state === 'leased' ? 'reclaimed' : 'leased' }
        }, 'exact_operation')
      if (result.status !== 'confirmed' || result.record.state === 'exhausted') return result
      const now = readNow(options.now)
      return now && result.record.state === 'leased' && result.record.lease?.leaseId === input.leaseId
        && result.record.lease.expiresAt > now ? result : { status: 'superseded' }
    },
    async complete(value: unknown, signal?: AbortSignal): Promise<V3QueueResult> {
      const input = kind === 'rule_research' ? readData(value, completeSchema) : readData(value, discoveryCompleteSchema)
      if (!input) return { status: 'invalid' }
      if (storage?.mutateAtomic !== undefined) return mutateAtomic(input.operationId, input.jobKey,
        key('queue-command', { action: 'complete', kind, input }), claimMethod, signal, (record, replayed) => {
          if (record.jobId !== input.fence.jobId || input.fence.generation !== input.fence.revision
            || record.revision <= input.fence.revision) return false
          if (replayed) return true
          return record.revision === input.fence.revision + 1 && record.predecessorRevision === input.fence.revision
            && record.state === 'succeeded' && record.lastFailure === null && (record.kind === 'research_job_record'
              ? 'decisionRef' in input && record.resultDecisionRef === input.decisionRef
              : 'discoveryRef' in input && record.resultDiscoveryRef === input.discoveryRef)
        })
      return perform(input.operationId, input.jobKey, key('queue-command', { action: 'complete', kind, input }), signal,
        (current, now) => {
          if (!current || !ownsLease(current, input.fence, now)) return { status: 'superseded' }
          const next = { ...current, revision: current.revision + 1, predecessorRevision: current.revision,
            updatedAt: now, state: 'succeeded' as const, lease: null, lastFailure: null }
          if (next.kind === 'research_job_record' && 'decisionRef' in input) {
            return { next: { ...next, resultDecisionRef: input.decisionRef }, kind: 'completed', leaseDeadline: current.lease!.expiresAt }
          }
          if (next.kind === 'combination_discovery_job_record' && 'discoveryRef' in input) {
            return { next: { ...next, resultDiscoveryRef: input.discoveryRef }, kind: 'completed', leaseDeadline: current.lease!.expiresAt }
          }
          return { status: 'invalid' }
        })
    },
    async fail(value: unknown, signal?: AbortSignal): Promise<V3QueueResult> {
      const input = readData(value, failSchema)
      if (!input) return { status: 'invalid' }
      if (storage?.mutateAtomic !== undefined) return mutateAtomic(input.operationId, input.jobKey,
        key('queue-command', { action: 'fail', input }), claimMethod, signal, (record, replayed) => {
          if (record.jobId !== input.fence.jobId || input.fence.generation !== input.fence.revision
            || record.revision <= input.fence.revision) return false
          if (replayed) return true
          const exhausted = record.attempt === record.attemptLimit
          const delay = Math.min(60000, 1000 * 2 ** (record.attempt - 1))
          return record.revision === input.fence.revision + 1 && record.predecessorRevision === input.fence.revision
            && record.state === (exhausted ? 'exhausted' : 'backoff') && record.lastFailure === input.reason
            && record.nextAttemptAt === (exhausted ? null : new Date(Date.parse(record.updatedAt) + delay).toISOString())
        })
      return perform(input.operationId, input.jobKey, key('queue-command', { action: 'fail', input }), signal,
        (current, now) => {
          if (!current || !ownsLease(current, input.fence, now)) return { status: 'superseded' }
          const exhausted = current.attempt === current.attemptLimit
          const delay = Math.min(options.backoffMaxMilliseconds, options.backoffBaseMilliseconds * 2 ** (current.attempt - 1))
          return { next: { ...current, revision: current.revision + 1, predecessorRevision: current.revision,
            updatedAt: now, state: exhausted ? 'exhausted' : 'backoff', lease: null, lastFailure: input.reason,
            nextAttemptAt: exhausted ? null : new Date(Date.parse(now) + delay).toISOString() },
          kind: exhausted ? 'exhausted' : 'backoff', leaseDeadline: current.lease!.expiresAt }
        })
    },
  }
}

export function createV3QueueCoordinator(options: V3QueueOptions) { return createQueueCoordinator(options, 'rule_research') }
export function createV3DiscoveryQueueCoordinator(options: V3QueueOptions) { return createQueueCoordinator(options, 'combination_discovery') }
export type V3QueueCoordinator = ReturnType<typeof createQueueCoordinator>
