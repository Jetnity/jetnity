import 'server-only'
import { z } from 'zod'
import { type QuellenRegistry } from '@/lib/readiness/source-registry'
import { civilDateOrdinalLesen } from '@/lib/readiness/regulierungs-anwendbarkeit'
import {
  readV3SourceDecisionRecord, readV3RuleVersionRecord, readV3TransitionPlan, createV3TransitionIdempotencyKey,
  type V3SourceDecisionRecord, type V3RuleVersionRecord, type V3TransitionPlan, type V3ConflictArchiveRecord,
  type V3MethodAuthorityPort, type V3MethodRef,
} from '../contract'
import { invocationBudget, readData, readNow, key, same, timestamp, type InvocationBudget } from './internal'

const metadataSchema = z.object({ proposalDigest: z.string().regex(/^[a-f0-9]{64}$/),
  proposalDisposition: z.enum(['matched', 'superseded_by_source']), acceptance: z.literal('not_committed'),
  reproof: z.literal('required_before_commit') }).strict()
const envelopeKeys = ['proposalDigest', 'proposalDisposition', 'acceptance', 'reproof',
  'decision', 'previousDecision', 'archiveAppend', 'version', 'transition'] as const
function envelope(value: unknown) {
  // Each S0 record below retains its own 64KiB bound. Joining current/previous/
  // archive into one 64KiB preflight would reintroduce a lifetime history limit.
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length !== 0) return null
    const descriptors = Object.getOwnPropertyDescriptors(value)
    if (Object.keys(descriptors).length !== envelopeKeys.length
      || envelopeKeys.some((field) => !descriptors[field] || !('value' in descriptors[field]) || !descriptors[field].enumerable)) return null
    const field = (name: typeof envelopeKeys[number]): unknown => descriptors[name].value
    const metadata = readData({ proposalDigest: field('proposalDigest'), proposalDisposition: field('proposalDisposition'),
      acceptance: field('acceptance'), reproof: field('reproof') }, metadataSchema)
    return metadata ? { ...metadata, decision: field('decision'), previousDecision: field('previousDecision'),
      archiveAppend: field('archiveAppend'), version: field('version'), transition: field('transition') } : null
  } catch { return null }
}
export type V3PreparedTransition = Readonly<{
  proposalDigest: string; decision: V3SourceDecisionRecord; previousDecision: V3SourceDecisionRecord | null;
  archiveAppend: V3ConflictArchiveRecord | null; version: V3RuleVersionRecord; transition: V3TransitionPlan;
  proposalDisposition: 'matched' | 'superseded_by_source'; acceptance: 'not_committed'; reproof: 'required_before_commit';
}>
export type V3VersionHead = Readonly<{
  pointer: V3TransitionPlan['expected']; sourceDecisionRef: string | null;
  historyArchive: V3SourceDecisionRecord['historyArchive'];
}>
export type V3TransitionProofState = { status: 'current'; freshUntil: string } | { status: 'invalid' | 'unsupported' | 'unavailable' }
export interface V3TransitionProofPort<Receipt extends object> {
  inspect(prepared: V3PreparedTransition, checkedAt: string, legalDate: string, signal: AbortSignal): Promise<
    { status: 'verified'; receipt: Receipt } | { status: 'invalid' | 'unsupported' | 'unavailable' }>
  /** Re-extract original facts, qualify primary/comparison/resolutions, prove actual
   * previous head/archive custody, historical recovery source and native freshness.
   * Parsing the prepared DTO is NOT an implementation of this authority port. */
  reprove(receipt: Receipt, prepared: V3PreparedTransition, checkedAt: string, legalDate: string,
    signal: AbortSignal): Promise<V3TransitionProofState>
}
export type V3TransitionConfirmation = Readonly<{
  operationId: string; operationKey: string; versionRef: string; sourceDecisionRef: string;
  revision: number; state: 'accepted' | 'withdrawn' | 'conflicted'; auditRef: string; committedAt: string;
  historyArchive: V3SourceDecisionRecord['historyArchive']; invalidatedProjectionRefs: readonly string[];
}>
/** Opaque, code-owned receipts. A prepared JSON field cannot supply authority. */
export type V3TransitionAtomicAuthority = Readonly<{
  method: V3MethodRef; methodReceipt: object; proofReceipt: object;
}>
export type V3TransitionAtomicCommand = Readonly<{
  operationKey: string; prepared: V3PreparedTransition; expectedHead: V3VersionHead;
  authority: V3TransitionAtomicAuthority; notAfter: string;
  /** Preliminary asynchronous proof, NOT the final atomic authorization. */
  reprove(signal: AbortSignal): Promise<V3TransitionProofState>;
}>
export type V3CurrentTransitionConfirmation = Readonly<{
  operation: V3TransitionConfirmation; head: V3VersionHead; method: V3MethodRef;
  checkedAt: string; legalDate: string; freshUntil: string;
}>
export interface V3AtomicVersionBoundaryPort {
  /** Under one joint authority/store critical section, AFTER every wait, inspect
   * actual method receipt/revocation, proof/original/archive receipt state, full
   * head, operation binding and end clock/legal date. Then atomically append
   * archive/version/audit/operation and invalidate projections, with no further
   * yield between that check and publication. command.reprove alone is not enough.
   * A remote adapter needs equivalent transaction/epoch fencing; none is bound. */
  commit(command: V3TransitionAtomicCommand, signal: AbortSignal): Promise<
    { status: 'commit_reported' | 'unconfirmed' | 'stale_head' | 'unsupported' | 'unavailable' }>
  /** Same joint critical section as commit, now for the CURRENT head + consumed
   * operation. Historical confirm followed by a separate head/proof read is not
   * an implementation. A result is current at its atomic checkedAt, not forever. */
  confirmCurrent(command: V3TransitionAtomicCommand, signal: AbortSignal): Promise<
    { status: 'current'; confirmation: unknown }
    | { status: 'not_current' | 'unconfirmed' | 'unsupported' | 'unavailable' }>
}
export interface V3VersionCommitPort {
  /** Historical operation lookup only; never a current-authorization receipt. */
  confirm(operationId: string, operationKey: string, signal: AbortSignal): Promise<
    { status: 'committed'; confirmation: unknown } | { status: 'not_attempted' | 'collision' | 'unconfirmed' | 'unavailable' }>
  /** A preflight only. The final boundary must inspect its own actual head. */
  readHead(contextKey: string, factKind: V3TransitionPlan['factKind'], signal: AbortSignal): Promise<
    { status: 'current'; head: V3VersionHead } | { status: 'unavailable' }>
  atomicBoundary: V3AtomicVersionBoundaryPort | null;
}
export type V3TransitionOutcome =
  | { status: 'confirmed'; version: V3RuleVersionRecord; auditRef: string; replayed: boolean }
  | { status: 'invalid' | 'unavailable' | 'unconfirmed' | 'collision' | 'stale_head' | 'unsupported' | 'committed_not_current' }

const confirmationSchema = z.object({ operationId: z.string(), operationKey: z.string(), versionRef: z.string(),
  sourceDecisionRef: z.string(), revision: z.number().int().positive(), state: z.enum(['accepted', 'withdrawn', 'conflicted']),
  auditRef: z.string().regex(/^rule-audit:v3:[a-f0-9]{64}$/), committedAt: timestamp,
  historyArchive: z.union([z.null(), z.object({ reference: z.string(), revision: z.number().int().positive(),
    totalConflicts: z.number().int().positive() }).strict()]), invalidatedProjectionRefs: z.array(z.string()).max(64),
}).strict()
const currentConfirmationSchema = z.object({ operation: confirmationSchema, head: z.unknown(), method: z.unknown(),
  checkedAt: timestamp, legalDate: z.string(), freshUntil: timestamp }).strict()

function parsePrepared(value: unknown, registry: QuellenRegistry): V3PreparedTransition | null {
  const input = envelope(value)
  if (!input) return null
  const decision = readV3SourceDecisionRecord(input.decision, registry, input.previousDecision, input.archiveAppend)
  const plan = readV3TransitionPlan(input.transition)
  if (!decision.ok || !plan.ok) return null
  const version = readV3RuleVersionRecord(input.version, registry, decision.value)
  if (!version.ok) return null
  const record = version.value, transition = plan.value, source = decision.value
  if (record.reference !== transition.next.versionRef || record.revision !== transition.next.revision
    || record.state !== transition.next.state || record.predecessor !== transition.expected.versionRef
    || record.subject.contextKey !== transition.contextKey || record.subject.fact.fact.kind !== transition.factKind
    || record.operationId !== transition.operationId || record.sourceDecisionRef !== transition.sourceDecisionRef
    || source.reference !== transition.sourceDecisionRef || !same(record.method, transition.method)
    || record.subject.evidence.versionId !== transition.primaryEvidenceVersionId) return null
  const resolutions = source.knownConflicts.flatMap((item) => item.resolution ? [item.resolution.reference] : [])
  if (transition.resolutionRefs.some((ref) => !resolutions.includes(ref))) return null
  // readV3SourceDecisionRecord validated these exact bounded records and links.
  // Detach the already-validated prior/archive records before any asynchronous
  // call. Mutating the caller's original object cannot change the operation bytes.
  const previous = JSON.parse(JSON.stringify(input.previousDecision)) as V3SourceDecisionRecord | null
  if (record.state === 'accepted' && previous?.knownConflicts.some((item) => item.resolution === null
    && !transition.resolutionRefs.includes(source.knownConflicts.find((next) => next.reference === item.reference)?.resolution?.reference ?? ''))) return null
  return { ...input, decision: source, previousDecision: previous, archiveAppend: JSON.parse(JSON.stringify(input.archiveAppend)) as V3ConflictArchiveRecord | null,
    version: record, transition }
}

function expectedHead(input: V3PreparedTransition): V3VersionHead {
  return { pointer: input.transition.expected, sourceDecisionRef: input.previousDecision?.reference ?? null,
    historyArchive: input.previousDecision?.historyArchive ?? null }
}
function clockValid(input: V3PreparedTransition, now: string, legalDate: string): boolean {
  if (civilDateOrdinalLesen(legalDate) === null || input.version.recordedAt > now) return false
  if (input.version.state !== 'accepted') return true
  const validity = input.version.subject.evidence.legalValidity
  return input.decision.legalAsOfDate === legalDate && validity.status === 'specified'
    && (validity.validFrom === null || validity.validFrom <= legalDate)
    && (validity.validUntil === null || validity.validUntil >= legalDate)
}

/** Executes only through later code-owned proof and JOINT atomic ports. No adapter is installed here. */
export async function commitV3PreparedTransition<ProofReceipt extends object>(value: unknown, dependencies: Readonly<{
  registry: QuellenRegistry; store: V3VersionCommitPort | null; proofs: V3TransitionProofPort<ProofReceipt> | null;
  methodAuthority: V3MethodAuthorityPort<object> | null; now: () => string; legalDate: () => string; invocationMilliseconds: number;
}>, signal?: AbortSignal): Promise<V3TransitionOutcome> {
  const prepared = parsePrepared(value, dependencies.registry)
  if (!prepared) return { status: 'invalid' }
  const { store, proofs, methodAuthority } = dependencies
  if (!store || !proofs || !methodAuthority || !Number.isInteger(dependencies.invocationMilliseconds)
    || dependencies.invocationMilliseconds < 1 || dependencies.invocationMilliseconds > 30_000) return { status: 'unavailable' }
  const boundary = store.atomicBoundary
  if (!boundary || typeof boundary.commit !== 'function' || typeof boundary.confirmCurrent !== 'function') return { status: 'unsupported' }
  const identity = createV3TransitionIdempotencyKey(prepared.transition)
  if (!identity.ok) return { status: 'invalid' }
  // Bind the whole prepared content, not only self-chosen version/reference IDs.
  const operationKey = key('version-commit', { planKey: identity.value, prepared })
  const budget = invocationBudget(dependencies.invocationMilliseconds, signal)
  const now = () => readNow(dependencies.now)
  const legalDate = () => { try { return dependencies.legalDate() } catch { return '' } }
  const startedAt = now()
  if (!startedAt) { budget.dispose(); return { status: 'invalid' } }
  const invocationDeadline = new Date(Date.parse(startedAt) + dependencies.invocationMilliseconds).toISOString()
  try {
    const old = await budget.call((s) => store.confirm(prepared.transition.operationId, operationKey, s))
    if (!old.ok) return { status: 'unconfirmed' }
    if (old.value.status !== 'not_attempted' && old.value.status !== 'committed') return { status: old.value.status }
    const replayed = old.value.status === 'committed'
    const at = now(), date = legalDate()
    if (!at || !clockValid(prepared, at, date)) return { status: replayed ? 'committed_not_current' : 'invalid' }
    const approval = await budget.call(() => methodAuthority.resolveCurrent(prepared.transition.method, at))
    if (!approval.ok || approval.value.status !== 'approved') return { status: replayed ? 'committed_not_current' : 'unavailable' }
    const methodReceipt = approval.value.receipt
    const proof = await budget.call((s) => proofs.inspect(prepared, at, date, s))
    if (!proof.ok) return { status: replayed ? 'committed_not_current' : 'unavailable' }
    if (proof.value.status !== 'verified') return { status: replayed ? 'committed_not_current' : proof.value.status }
    const receipt = proof.value.receipt
    async function reprove(s: AbortSignal): Promise<V3TransitionProofState> {
      const time = now(), dateNow = legalDate()
      if (!time || !clockValid(prepared!, time, dateNow) || s.aborted) return { status: 'invalid' }
      const approved = await budget.call(() => methodAuthority!.reproveAtCommit(methodReceipt, prepared!.transition.method, time))
      if (!approved.ok || approved.value.status !== 'current') return { status: 'unavailable' }
      const actual = await budget.call((child) => proofs!.reprove(receipt, prepared!, time, dateNow, child))
      if (!actual.ok || actual.value.status !== 'current') return actual.ok ? actual.value : { status: 'unavailable' }
      const end = now(), endDate = legalDate()
      if (!end || end < time || endDate !== dateNow || !clockValid(prepared!, end, endDate)
        || !readData(actual.value.freshUntil, timestamp) || actual.value.freshUntil <= end
        || end >= invocationDeadline || s.aborted || budget.signal.aborted) return { status: 'invalid' }
      // The adapter still has to inspect ACTUAL method/proof state after this
      // await. Reordering these two async reads cannot provide atomic authority.
      return actual.value
    }
    const check = await reprove(budget.signal)
    if (check.status !== 'current') return { status: replayed ? 'committed_not_current' : check.status }
    const authority: V3TransitionAtomicAuthority = { method: prepared.transition.method, methodReceipt, proofReceipt: receipt }
    const notAfter = check.freshUntil < invocationDeadline ? check.freshUntil : invocationDeadline
    if (!replayed) {
      const head = await budget.call((s) => store.readHead(prepared.transition.contextKey, prepared.transition.factKind, s))
      if (!head.ok || head.value.status !== 'current') return { status: 'unavailable' }
      const expected = expectedHead(prepared)
      if (!same(head.value.head, expected)) return { status: 'stale_head' }
      const written = await budget.call((s) => boundary.commit({ operationKey, prepared, expectedHead: expected,
        authority, notAfter, reprove }, s))
      if (!written.ok || written.value.status === 'unconfirmed') return { status: 'unconfirmed' }
      if (written.value.status !== 'commit_reported') return { status: written.value.status }
    }
    return await confirmActual(prepared, operationKey, boundary, authority, notAfter, reprove, budget, now, legalDate, replayed)
  } catch { return { status: 'unconfirmed' } } finally { budget.dispose() }
}

async function confirmActual(prepared: V3PreparedTransition, operationKey: string, boundary: V3AtomicVersionBoundaryPort,
  authority: V3TransitionAtomicAuthority, notAfter: string, reprove: V3TransitionAtomicCommand['reprove'],
  budget: InvocationBudget, now: () => string | null, legalDate: () => string, replayed: boolean): Promise<V3TransitionOutcome> {
  const expected: V3VersionHead = { pointer: prepared.transition.next, sourceDecisionRef: prepared.decision.reference,
    historyArchive: prepared.decision.historyArchive }
  const result = await budget.call((s) => boundary.confirmCurrent({ operationKey, prepared, expectedHead: expected,
    authority, notAfter, reprove }, s))
  if (!result.ok) return { status: 'unconfirmed' }
  if (result.value.status !== 'current') return { status: result.value.status === 'not_current' ? 'committed_not_current' : result.value.status }
  const current = readData(result.value.confirmation, currentConfirmationSchema), time = now(), date = legalDate()
  if (!current || !time) return { status: 'unconfirmed' }
  const confirmation = current.operation
  if (confirmation.operationId !== prepared.transition.operationId || confirmation.operationKey !== operationKey
    || confirmation.versionRef !== prepared.version.reference || confirmation.sourceDecisionRef !== prepared.decision.reference
    || confirmation.revision !== prepared.version.revision || confirmation.state !== prepared.version.state
    || confirmation.committedAt < prepared.version.recordedAt || confirmation.committedAt > current.checkedAt
    || !same(confirmation.historyArchive, prepared.decision.historyArchive)
    || !same(confirmation.invalidatedProjectionRefs, prepared.transition.invalidatedProjectionRefs)
    || !same(current.head, expected) || !same(current.method, prepared.transition.method)) return { status: 'unconfirmed' }
  // End-clock/date check AFTER the final boundary await. The joint receipt's
  // checkedAt is its linearization point; it is never a permanent readiness flag.
  if (current.checkedAt > time || current.legalDate !== date || !clockValid(prepared, time, date)
    || current.freshUntil <= time || time >= notAfter || budget.signal.aborted) return { status: 'committed_not_current' }
  return { status: 'confirmed', version: prepared.version, auditRef: confirmation.auditRef, replayed }
}
