import 'server-only'
import { z } from 'zod'
import {
  createV3WorkIdentity, createV3CombinationDiscoveryIdentity, readV3CombinationDiscoveryJobRecord,
  readV3GlobalRuleContext, readV3ResearchJobRecord,
  OFFICIAL_TRUTH_V3_LIMITS, type V3ResearchJobRecord, type V3CombinationDiscoveryJobRecord, type V3GlobalRuleContext, type V3MethodAuthorityPort, type V3MethodRef,
} from '../contract'
import { REGEL_FAKT_ARTEN } from '@/lib/readiness/rule-claims'
import { invocationBudget, readData, readNow, same, key, operationId, jobId, leaseId, jobKey, decisionRef, discoveryJobKey, discoveryRef,
  type InvocationBudget } from './internal'

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
  read(jobKey: string, signal: AbortSignal): Promise<{ status: 'ok'; record: unknown | null } | { status: 'unavailable' }>
  confirm(operationId: string, commandKey: string, signal: AbortSignal): Promise<V3QueueConfirmation>
  compareAndSwap(commit: V3QueueCommit, authority: V3QueueCommitAuthority, signal: AbortSignal): Promise<
    { status: 'committed'; operationId: string; commandKey: string; record: unknown }
    | { status: 'mismatch' | 'collision' | 'unconfirmed' | 'unavailable' }>
}

export type V3QueueResult =
  | { status: 'confirmed'; record: V3ManagedJobRecord; replayed: boolean }
  | { status: 'invalid' | 'unavailable' | 'unconfirmed' | 'collision' | 'contended' | 'not_due' | 'superseded' }
export type V3QueueOptions = Readonly<{
  storage: V3QueueStoragePort | null; methodAuthority: V3MethodAuthorityPort<object> | null; now: () => string;
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
  const configValid = Number.isInteger(options.invocationMilliseconds) && options.invocationMilliseconds >= 1
    && options.invocationMilliseconds <= 10_000 && Number.isInteger(options.backoffBaseMilliseconds)
    && options.backoffBaseMilliseconds >= 1 && Number.isInteger(options.backoffMaxMilliseconds)
    && options.backoffMaxMilliseconds >= options.backoffBaseMilliseconds && options.backoffMaxMilliseconds <= 86_400_000

  async function authorize(record: V3ManagedJobRecord, budget: InvocationBudget): Promise<V3QueueCommitAuthority | null> {
    const methodPort = options.methodAuthority, methodRef = jobMethod(record), now = readNow(options.now)
    if (!methodPort || !now || record.updatedAt > now) return null
    const result = await budget.call(() => methodPort.resolveCurrent(methodRef, now))
    if (!result.ok || result.value.status !== 'approved') return null
    const receipt = result.value.receipt
    const authority: V3QueueCommitAuthority = {
      method: methodRef, receipt,
      async reprove(signal) {
        const at = readNow(options.now)
        if (!at || signal.aborted || budget.signal.aborted) return false
        const checked = await budget.call(() => methodPort.reproveAtCommit(receipt, methodRef, at))
        return checked.ok && checked.value.status === 'current' && !signal.aborted
      },
    }
    return await authority.reprove(budget.signal) ? authority : null
  }

  async function load(keyValue: string, budget: InvocationBudget) {
    if (!storage) return { status: 'unavailable' as const }
    const result = await budget.call((signal) => storage.read(keyValue, signal))
    if (!result.ok || result.value.status !== 'ok') return { status: 'unavailable' as const }
    if (result.value.record === null) return { status: 'ok' as const, record: null }
    const record = parsedRecord(result.value.record, keyValue)
    return record ? { status: 'ok' as const, record } : { status: 'invalid' as const }
  }

  async function confirmed(value: Extract<V3QueueConfirmation, { status: 'committed' }>, op: string,
    command: string, keyValue: string, budget: InvocationBudget, replayed: boolean, mode: ConfirmationMode): Promise<V3QueueResult> {
    if (value.operationId !== op || value.commandKey !== command) return { status: 'collision' }
    const result = parsedRecord(value.record, keyValue)
    if (!result) return { status: 'invalid' }
    const current = await load(keyValue, budget)
    if (current.status !== 'ok') return current
    if (current.record === null || current.record.jobId !== result.jobId) return { status: 'superseded' }
    // A Claim receipt owns its original acquisition, never a later generation
    // that happens to reuse the lease ID. Enqueue still returns current ACKs.
    if (mode === 'exact_operation' && !same(result, current.record)) return { status: 'superseded' }
    const acknowledged = mode === 'exact_operation' ? result : current.record
    return await authorize(acknowledged, budget) ? { status: 'confirmed', record: acknowledged, replayed } : { status: 'unavailable' }
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
      const checked = await budget.call((s) => storage.confirm(op, command, s))
      if (!checked.ok) return { status: 'unconfirmed' }
      if (checked.value.status === 'committed') return await confirmed(checked.value, op, command, keyValue, budget, true, confirmationMode)
      if (checked.value.status !== 'not_attempted') return { status: checked.value.status }
      for (let attempt = 0; attempt < 3; attempt++) {
        const before = await load(keyValue, budget)
        if (before.status !== 'ok') return before
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
        const authority = await authorize(next, budget)
        if (!authority) return { status: 'unavailable' }
        const written = await budget.call((s) => storage.compareAndSwap(commit, authority, s))
        if (!written.ok) return { status: 'unconfirmed' }
        if (written.value.status === 'committed') return await confirmed(written.value, op, command, keyValue, budget, false, confirmationMode)
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
