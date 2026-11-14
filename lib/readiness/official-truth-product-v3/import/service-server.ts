import 'server-only'
import { performance } from 'node:perf_hooks'

import { sha256Hex } from '@/lib/readiness/digest'
import { civilDateOrdinalLesen, schema2DatenPruefen, schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { ownRecord, immutable } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import type { RepresentationRef } from '@/lib/readiness/official-truth-content-identity'
import {
  createV3WorkIdentity, readV3SourceDecisionRecord, readV3RuleVersionRecord, readV3TransitionPlan,
  readV3ConflictArchiveRecord, type V3ReadClock, type V3MethodRef, type V3MethodAuthorityPort,
  type V3SourceDecisionRecord, type V3RuleVersionRecord, type V3TransitionPlan, type V3ConflictArchiveRecord,
  type V3ResearchProposal,
} from '../contract'
import { readV3ProposalUpload, type V3ProposalUpload } from './interface'
import { traceDevDiagnosticStage, withDevDiagnosticBudget } from '../runtime/dev-diagnostics'

type Primary = V3SourceDecisionRecord['primary']
type DecisionParts = Pick<V3SourceDecisionRecord, 'primary' | 'counterCheck' | 'knownConflicts' | 'historyArchive'>
type Pointer = V3TransitionPlan['expected']

/** Kept separate from all researcher-supplied facts, dates, roles and policy hints. */
export type V3ImportVerificationRequest = Readonly<{
  context: V3ResearchProposal['context']; contextKey: string;
  factKind: V3ResearchProposal['research']['factKind']; references: readonly RepresentationRef[];
  method: V3MethodRef; clock: V3ReadClock; previousDecision: V3SourceDecisionRecord | null; decisionRef: string;
}>

/**
 * A future code-owned adapter must qualify actual jurisdiction, fetch/custody and
 * extract originals through the existing canonical chain, and verify comparisons
 * and resolutions under the approved method. The service never constructs its
 * Receipt. DTO fields/IDs are not a substitute for that adapter or its reproof.
 */
export interface V3ImportEvidencePort<Receipt extends object> {
  inspect(request: V3ImportVerificationRequest, signal: AbortSignal): Promise<
    { status: 'inspected'; receipt: Receipt; parts: DecisionParts; archiveAppend: V3ConflictArchiveRecord | null; validUntilExclusive: string }
    | { status: 'unavailable' }>
  reprove(receipt: Receipt, request: V3ImportVerificationRequest, decision: V3SourceDecisionRecord,
    archive: V3ConflictArchiveRecord | null, clock: V3ReadClock, signal: AbortSignal): Promise<
    { status: 'current' } | { status: 'changed' | 'unavailable' }>
}

export type V3ImportHistory = Readonly<{
  pointer: Pointer; version: V3RuleVersionRecord | null;
  decision: V3SourceDecisionRecord | null; decisionPredecessor: V3SourceDecisionRecord | null;
  decisionArchiveAppend: V3ConflictArchiveRecord | null;
  invalidatedProjectionRefs: readonly string[];
}>
export interface V3ImportHistoryPort<Receipt extends object> {
  read(contextKey: string, factKind: V3ResearchProposal['research']['factKind'], signal: AbortSignal): Promise<
    { status: 'snapshot'; receipt: Receipt; history: V3ImportHistory } | { status: 'unavailable' }>
  reprove(receipt: Receipt, history: V3ImportHistory, signal: AbortSignal): Promise<
    { status: 'current' } | { status: 'changed' | 'unavailable' }>
}

export type V3ImportPrepared = Readonly<{
  proposalDigest: string; decision: V3SourceDecisionRecord;
  previousDecision: V3SourceDecisionRecord | null; archiveAppend: V3ConflictArchiveRecord | null;
  version: V3RuleVersionRecord; transition: V3TransitionPlan;
  proposalDisposition: 'matched' | 'superseded_by_source';
  acceptance: 'not_committed'; reproof: 'required_before_commit';
}>
export type V3ImportOutcome =
  | Readonly<{ status: 'prepared'; value: V3ImportPrepared }>
  | Readonly<{ status: 'escalation'; key: string; reason: 'primary_unclear' | 'comparable_conflict';
    decision: V3SourceDecisionRecord; previousDecision: V3SourceDecisionRecord | null; archiveAppend: V3ConflictArchiveRecord | null }>
  | Readonly<{ status: 'quarantined'; reason: 'conditions_unresolved' | 'invalid_verification' | 'history_changed' | 'method_not_current' }>
  | Readonly<{ status: 'unavailable'; reason: 'method_not_approved' | 'method_unavailable' | 'verification_unavailable' | 'history_unavailable' | 'aborted' | 'temporary_failure' }>
export type V3ImportResult =
  | Readonly<{ status: 'completed'; replayed: boolean; outcome: V3ImportOutcome }>
  | Readonly<{ status: 'rejected'; reason: 'invalid_upload' | 'bound_exceeded' | 'invalid_proposal' | 'operation_collision' }>
  | Readonly<{ status: 'busy' }>
  | Readonly<{ status: 'unavailable'; reason: 'unbound' | 'invalid_configuration' | 'aborted' | 'temporary_failure' }>
  | Readonly<{ status: 'outcome_unknown'; operationId: string }>

export type V3ImportAudit = Readonly<{
  schema: 3; kind: 'import_attempt_record'; operationId: string; proposalDigest: string;
  jobId: string; contextKey: string; method: V3MethodRef; recordedAt: string;
  result: V3ImportOutcome['status']; decisionRef: string | null; escalationKey: string | null;
}>

/**
 * Atomic acquisition/finish; no in-memory production implementation or blind replay.
 * A durable adapter must retain the operation/digest and use a bounded lease and
 * fenced ticket bound to a monotonically advancing reservation revision for
 * crash recovery. Reclaim never changes the digest or permits an expired worker
 * or obsolete revision to finish. Unknown responses are reconciled on that same
 * operation; the caller must not create a replacement operation to bypass it.
 * Completed replay returns the full confirmed outcome, including the exact
 * previousDecision/archiveAppend bound to an escalation, never only references.
 */
export interface V3ImportQuarantinePort<Ticket extends object> {
  reserve(upload: V3ProposalUpload, signal: AbortSignal): Promise<
    { status: 'acquired'; ticket: Ticket } | { status: 'completed'; outcome: V3ImportOutcome }
    | { status: 'collision' | 'busy' | 'unavailable' }>
  /** Full outcome (decision/predecessor/archive), audit and outbox key are atomic. */
  finish(ticket: Ticket, outcome: V3ImportOutcome, audit: V3ImportAudit, signal: AbortSignal): Promise<
    { status: 'recorded' } | { status: 'unconfirmed' }>
}

export interface V3ImportPorts<MethodReceipt extends object, EvidenceReceipt extends object, HistoryReceipt extends object, Ticket extends object> {
  readonly registry: QuellenRegistry;
  readonly method: V3MethodRef;
  readonly clock: () => V3ReadClock;
  readonly methodAuthority: V3MethodAuthorityPort<MethodReceipt>;
  readonly evidence: V3ImportEvidencePort<EvidenceReceipt>;
  readonly history: V3ImportHistoryPort<HistoryReceipt>;
  readonly quarantine: V3ImportQuarantinePort<Ticket>;
}

function same(a: unknown, b: unknown): boolean { return schema2Kanonisch(a) === schema2Kanonisch(b) }
function ref(kind: string, value: unknown): string { return `${kind}:v3:${sha256Hex(schema2Kanonisch(value))}` }
function clockRead(value: V3ReadClock): V3ReadClock | null {
  if (schema2DatenPruefen(value) || Object.keys(value).sort().join(',') !== 'legalDate,now') return null
  if (typeof value.now !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.now)
    || civilDateOrdinalLesen(value.now.slice(0, 10)) === null || civilDateOrdinalLesen(value.legalDate) === null) return null
  const ms = Date.parse(value.now)
  return Number.isFinite(ms) && new Date(ms).toISOString() === value.now ? Object.freeze({ ...value }) : null
}
function partsRead(value: DecisionParts): DecisionParts | null {
  if (schema2DatenPruefen(value) || !value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== 'counterCheck,historyArchive,knownConflicts,primary') return null
  if (!value.primary || typeof value.primary !== 'object' || !['clear', 'unclear'].includes(value.primary.status)
    || !Array.isArray(value.knownConflicts) || value.knownConflicts.length > 8
    || value.knownConflicts.some((item) => !item || typeof item !== 'object' || !Object.hasOwn(item, 'resolution'))) return null
  // Detach before later awaits. Complete strict shape/binding checks follow in S0.
  return JSON.parse(JSON.stringify(value)) as DecisionParts
}
function conclusion(parts: DecisionParts, proposal: V3ResearchProposal): V3SourceDecisionRecord['conclusion'] {
  if (parts.knownConflicts.some((item) => item.resolution === null)) return 'comparable_conflict'
  if (parts.primary.status !== 'clear') return 'primary_unclear'
  const context = proposal.context, option = context.scope.credentialOption
  return context.route === 'unresolved' || context.conditions.status === 'unresolved'
    || (option.mode === 'option' && (option.documentType === 'unknown'
      || option.relatedCitizenshipCountryCode !== context.scope.citizenship.countryCodes[0]))
    ? 'conditions_unresolved' : 'clear_primary'
}

function historyRead(input: V3ImportHistory, proposal: V3ResearchProposal, registry: QuellenRegistry): V3ImportHistory | null {
  const row = ownRecord(input, ['decision', 'decisionPredecessor', 'decisionArchiveAppend', 'invalidatedProjectionRefs', 'pointer', 'version'])
  // Each S0 record is independently bounded; an immediate predecessor plus its
  // archive may legitimately exceed the single-record byte budget together.
  if (!row || Object.values(row).some((value) => schema2DatenPruefen(value))) return null
  const history = JSON.parse(JSON.stringify(input)) as V3ImportHistory
  const pointer = history.pointer
  if (!ownRecord(pointer, ['revision', 'state', 'versionRef']) || !Array.isArray(history.invalidatedProjectionRefs) || history.invalidatedProjectionRefs.length > 64
    || new Set(history.invalidatedProjectionRefs).size !== history.invalidatedProjectionRefs.length
    || history.invalidatedProjectionRefs.some((item) => typeof item !== 'string' || !/^rule-projection:v3:[a-f0-9]{64}$/.test(item))) return null
  if (pointer.state === 'missing') return pointer.revision === 0 && pointer.versionRef === null
    && Object.keys(pointer).sort().join(',') === 'revision,state,versionRef'
    && history.version === null && history.decision === null && history.decisionPredecessor === null && history.decisionArchiveAppend === null
    && history.invalidatedProjectionRefs.length === 0 ? immutable(history) : null
  const decision = readV3SourceDecisionRecord(history.decision, registry, history.decisionPredecessor, history.decisionArchiveAppend)
  if (!decision.ok || decision.value.contextKey !== proposal.contextKey || decision.value.factKind !== proposal.research.factKind) return null
  const version = readV3RuleVersionRecord(history.version, registry, decision.value)
  if (!version.ok || version.value.reference !== pointer.versionRef || version.value.state !== pointer.state
    || version.value.revision !== pointer.revision) return null
  return immutable({ ...history, decision: decision.value, version: version.value })
}

async function boundedInvocation(
  external: AbortSignal, milliseconds: number, operationId: string,
  run: (signal: AbortSignal) => Promise<V3ImportResult>,
): Promise<V3ImportResult> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  external.addEventListener('abort', abort, { once: true })
  let rejectAbort: () => void = () => {}
  const stopped = new Promise<never>((_resolve, reject) => { rejectAbort = () => reject(new Error('import_stopped')) })
  controller.signal.addEventListener('abort', rejectAbort, { once: true })
  const budgetStart = performance.now()
  const timer = setTimeout(abort, milliseconds)
  if (external.aborted) abort()
  try {
    if (controller.signal.aborted) await stopped
    return await withDevDiagnosticBudget('i1', budgetStart, budgetStart + milliseconds,
      () => Promise.race([run(controller.signal), stopped]))
  } catch {
    // run begins with a mutating reservation. A racing/late response leaves its
    // outcome unknown; the durable adapter must reconcile the same operation.
    return { status: 'outcome_unknown', operationId }
  } finally {
    clearTimeout(timer)
    external.removeEventListener('abort', abort)
    controller.signal.removeEventListener('abort', rejectAbort)
    controller.abort() // A late read must never start a later side effect.
  }
}

/** No transport, source or acceptance authority can be enabled through this entry. */
export function importV3ResearchProposalProduction(): V3ImportResult {
  return Object.freeze({ status: 'unavailable', reason: 'unbound' })
}

/**
 * Explicit orchestration seam for reviewed code-owned adapters and isolated
 * tests. Supplying ports is not source/method authority; no production caller is
 * wired here. Only the separately closed production entry is application-facing.
 */
export function createV3ImportCoordinator<M extends object, E extends object, H extends object, T extends object>(
  ports: V3ImportPorts<M, E, H, T>,
  options: Readonly<{ budgetMilliseconds?: number }> = {},
) {
  const budget = options.budgetMilliseconds ?? 30_000
  return Object.freeze({
    async submit(input: unknown, signal = new AbortController().signal): Promise<V3ImportResult> {
      if (signal.aborted) return { status: 'unavailable', reason: 'aborted' }
      const upload = readV3ProposalUpload(input, ports.registry)
      if (!upload.ok) return { status: 'rejected', reason: upload.reason }
      const proposal = upload.value.proposal
      const identity = createV3WorkIdentity({ context: proposal.context, method: ports.method,
        factKind: proposal.research.factKind, researchReason: proposal.research.researchReason })
      let start: V3ReadClock | null
      try { start = clockRead(ports.clock()) } catch { start = null }
      if (!identity.ok || !start || !Number.isInteger(budget) || budget < 1 || budget > 30_000) {
        return { status: 'unavailable', reason: 'invalid_configuration' }
      }
      const checkedStart = start
      return boundedInvocation(signal, budget, proposal.operationId, async (signal) => {
        let ticket: T | null = null
        let uncertain = false
        try {
          uncertain = true // reserve can write successfully and lose its reply.
          const acquired = await traceDevDiagnosticStage('i1_reserve', signal, () => ports.quarantine.reserve(upload.value, signal))
          if (signal.aborted) return { status: 'outcome_unknown', operationId: proposal.operationId }
          if (acquired.status === 'collision') return { status: 'rejected', reason: 'operation_collision' }
          if (acquired.status === 'busy') return { status: 'busy' }
          if (acquired.status === 'unavailable') return { status: 'unavailable', reason: 'temporary_failure' }
          if (acquired.status === 'completed') return { status: 'completed', replayed: true, outcome: acquired.outcome }
          if (acquired.status !== 'acquired') return { status: 'unavailable', reason: 'temporary_failure' }
          const acquiredTicket = acquired.ticket
          ticket = acquiredTicket
          const outcome = await traceDevDiagnosticStage('i1_prepare', signal, () => prepare(ports, upload.value, checkedStart, signal))
          if (signal.aborted) return { status: 'outcome_unknown', operationId: proposal.operationId }
          const finishClock = clockRead(ports.clock())
          if (!finishClock || finishClock.now < checkedStart.now) return { status: 'outcome_unknown', operationId: proposal.operationId }
          const decisionRef = outcome.status === 'prepared' ? outcome.value.decision.reference
            : outcome.status === 'escalation' ? outcome.decision.reference : null
          const audit: V3ImportAudit = Object.freeze({
            schema: 3, kind: 'import_attempt_record', operationId: proposal.operationId,
            proposalDigest: upload.value.digest, jobId: proposal.jobId, contextKey: proposal.contextKey,
            method: ports.method, recordedAt: finishClock.now, result: outcome.status,
            decisionRef, escalationKey: outcome.status === 'escalation' ? outcome.key : null,
          })
          uncertain = true
          const saved = await traceDevDiagnosticStage('i1_finish', signal, () => ports.quarantine.finish(acquiredTicket, outcome, audit, signal))
          if (signal.aborted || saved.status !== 'recorded') return { status: 'outcome_unknown', operationId: proposal.operationId }
          return Object.freeze({ status: 'completed', replayed: false, outcome })
        } catch {
          // A lost reserve/finish response cannot safely be called "not written".
          if (ticket !== null || uncertain) return { status: 'outcome_unknown', operationId: proposal.operationId }
          return { status: 'unavailable', reason: 'temporary_failure' }
        }
      })
    },
  })
}

async function prepare<M extends object, E extends object, H extends object, T extends object>(
  ports: V3ImportPorts<M, E, H, T>, upload: V3ProposalUpload, start: V3ReadClock, signal: AbortSignal,
): Promise<V3ImportOutcome> {
  const proposal = upload.proposal
  const unavailable = (reason: Extract<V3ImportOutcome, { status: 'unavailable' }>['reason']): V3ImportOutcome => ({ status: 'unavailable', reason })
  const quarantined = (reason: Extract<V3ImportOutcome, { status: 'quarantined' }>['reason']): V3ImportOutcome => ({ status: 'quarantined', reason })
  try {
    const method = await traceDevDiagnosticStage('i1_method_resolve', signal, () => ports.methodAuthority.resolveCurrent(ports.method, start.now))
    if (signal.aborted) return unavailable('aborted')
    if (method.status !== 'approved') return unavailable(method.status === 'not_approved' ? 'method_not_approved' : 'method_unavailable')
    const found = await traceDevDiagnosticStage('i1_history_read', signal, () => ports.history.read(proposal.contextKey, proposal.research.factKind, signal))
    if (signal.aborted) return unavailable('aborted')
    if (found.status !== 'snapshot') return unavailable('history_unavailable')
    const history = historyRead(found.history, proposal, ports.registry)
    if (!history) return quarantined('invalid_verification')
    const request: V3ImportVerificationRequest = Object.freeze({ context: proposal.context, contextKey: proposal.contextKey,
      factKind: proposal.research.factKind, references: Object.freeze(proposal.references.map((item) => item.source)),
      method: Object.freeze({ ...ports.method }), clock: start, previousDecision: history.decision,
      decisionRef: ref('source-decision', { operationId: proposal.operationId, proposalDigest: upload.digest,
        contextKey: proposal.contextKey, method: ports.method, predecessor: history.decision?.reference ?? null }) })
    const inspected = await traceDevDiagnosticStage('i1_evidence_inspect', signal, () => ports.evidence.inspect(request, signal))
    if (signal.aborted) return unavailable('aborted')
    if (inspected.status !== 'inspected') return unavailable('verification_unavailable')
    const parts = partsRead(inspected.parts)
    const checked = clockRead(ports.clock())
    if (!parts || !checked || checked.now < start.now) return quarantined('invalid_verification')
    if (!clockRead({ now: inspected.validUntilExclusive, legalDate: checked.legalDate })
      || inspected.validUntilExclusive <= checked.now) return unavailable('verification_unavailable')
    const rawDecision = { schema: 3, kind: 'source_decision_record',
      reference: request.decisionRef,
      predecessor: history.decision?.reference ?? null, method: ports.method,
      context: proposal.context, contextKey: proposal.contextKey, factKind: proposal.research.factKind,
      evaluatedAt: checked.now, legalAsOfDate: checked.legalDate, ...parts, conclusion: conclusion(parts, proposal) }
    const decision = readV3SourceDecisionRecord(rawDecision, ports.registry, history.decision, inspected.archiveAppend)
    if (!decision.ok) return quarantined('invalid_verification')
    const archive = inspected.archiveAppend === null ? null : readV3ConflictArchiveRecord(inspected.archiveAppend, ports.registry)
    if (archive !== null && !archive.ok) return quarantined('invalid_verification')
    const archiveValue = archive?.ok ? archive.value : null
    const evidence = await traceDevDiagnosticStage('i1_evidence_reproof', signal,
      () => ports.evidence.reprove(inspected.receipt, request, decision.value, archiveValue, checked, signal))
    if (signal.aborted) return unavailable('aborted')
    if (evidence.status !== 'current') return unavailable('verification_unavailable')
    const currentHistory = await traceDevDiagnosticStage('i1_history_reproof', signal, () => ports.history.reprove(found.receipt, history, signal))
    if (signal.aborted) return unavailable('aborted')
    if (currentHistory.status !== 'current') return quarantined('history_changed')
    const end = clockRead(ports.clock())
    if (!end || end.now < checked.now || end.legalDate !== checked.legalDate) return quarantined('invalid_verification')
    const approval = await traceDevDiagnosticStage('i1_method_reproof', signal, () => ports.methodAuthority.reproveAtCommit(method.receipt, ports.method, end.now))
    if (signal.aborted) return unavailable('aborted')
    if (approval.status !== 'current') return quarantined('method_not_current')
    const done = clockRead(ports.clock())
    if (!done || done.now < end.now || done.legalDate !== end.legalDate) return quarantined('invalid_verification')
    if (done.now >= inspected.validUntilExclusive) return unavailable('verification_unavailable')
    const value = decision.value
    if (value.conclusion === 'primary_unclear' || value.conclusion === 'comparable_conflict') {
      const key = ref('source-escalation', { contextKey: value.contextKey, factKind: value.factKind, method: value.method,
        reason: value.conclusion, conflicts: value.knownConflicts.filter((item) => item.resolution === null).map((item) => item.reference).sort() })
      return Object.freeze({ status: 'escalation', key, reason: value.conclusion, decision: value,
        previousDecision: history.decision, archiveAppend: archiveValue })
    }
    if (value.conclusion !== 'clear_primary' || value.primary.status !== 'clear') return quarantined('conditions_unresolved')
    return prepareVersion(value, value.primary, history, archiveValue, upload, done, ports.registry)
  } catch { return unavailable('temporary_failure') }
}

function prepareVersion(decision: V3SourceDecisionRecord, primary: Extract<Primary, { status: 'clear' }>,
  history: V3ImportHistory, archive: V3ConflictArchiveRecord | null, upload: V3ProposalUpload,
  clock: V3ReadClock, registry: QuellenRegistry): V3ImportOutcome {
  const version = readV3RuleVersionRecord({ schema: 3, kind: 'rule_version_record',
    reference: ref('rule-version', { decisionRef: decision.reference, operationId: upload.proposal.operationId,
      predecessor: history.pointer.versionRef, revision: history.pointer.revision + 1 }),
    revision: history.pointer.revision + 1, predecessor: history.pointer.versionRef, state: 'accepted',
    method: decision.method, subject: primary.observation, sourceDecisionRef: decision.reference,
    operationId: upload.proposal.operationId, recordedAt: clock.now,
  }, registry, decision)
  if (!version.ok) return { status: 'quarantined', reason: 'invalid_verification' }
  const transition = readV3TransitionPlan({ schema: 3, protocolRevision: 1,
    operationId: upload.proposal.operationId, contextKey: decision.contextKey, method: decision.method,
    factKind: decision.factKind, action: ['withdrawn', 'conflicted'].includes(history.pointer.state) ? 'reaccept' : 'accept',
    expected: history.pointer, next: { revision: version.value.revision, state: 'accepted', versionRef: version.value.reference },
    primaryEvidenceVersionId: primary.observation.evidence.versionId, sourceDecisionRef: decision.reference,
    resolutionRefs: decision.knownConflicts.flatMap((item) => item.resolution ? [item.resolution.reference] : []),
    recoverFromVersionRef: null, invalidatedProjectionRefs: history.invalidatedProjectionRefs,
    reproof: 'required_before_commit', commitConfirmation: 'required',
  })
  if (!transition.ok) return { status: 'quarantined', reason: 'invalid_verification' }
  return Object.freeze({ status: 'prepared', value: Object.freeze({
    proposalDigest: upload.digest, decision, previousDecision: history.decision, archiveAppend: archive,
    version: version.value, transition: transition.value,
    proposalDisposition: same(upload.proposal.proposedFact, primary.observation.fact) ? 'matched' : 'superseded_by_source',
    acceptance: 'not_committed', reproof: 'required_before_commit',
  }) })
}
