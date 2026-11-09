import { sha256Hex } from '@/lib/readiness/digest'
import { immutable, ownRecord, provenanceCanonical } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { createV3WorkIdentity, readV3ConflictArchiveRecord, readV3ResearchProposal, readV3RuleVersionRecord,
  readV3SourceDecisionRecord, readV3TransitionPlan, type V3ReadResult, type V3SourceDecisionRecord } from '../contract'
import type { V3ProposalUpload } from '../import/interface'
import type { V3ImportAudit, V3ImportOutcome } from '../import/service-server'
import { readV3IntakeBinding, type V3IntakeBinding } from './intake-contract'
import { s1RetentionShapeAllows } from './retention-shape'

const V3_QUARANTINE_OUTCOME_BYTES = 524_288
export type V3DecodedCompletion = Readonly<{ outcome: V3ImportOutcome; audit: V3ImportAudit }>
const fail = (): V3ReadResult<never> => ({ ok: false, reason: 'invalid_contract' })
const same = (a: unknown, b: unknown) => schema2Kanonisch(a) === schema2Kanonisch(b)
const reference = (kind: string, value: unknown) => `${kind}:v3:${sha256Hex(schema2Kanonisch(value))}`
const oneOf = <T extends string>(value: unknown, choices: readonly T[]): value is T =>
  typeof value === 'string' && choices.includes(value as T)
function timestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
}

/**
 * Full closed replay decoder. This checks data and cross-record bindings only.
 * It issues no source/acceptance receipt and never refreshes old proof lifetimes.
 */
export function readV3QuarantineCompletion(
  input: unknown, auditInput: unknown, upload: V3ProposalUpload, expectedBinding: V3IntakeBinding, registry: QuellenRegistry,
): V3ReadResult<V3DecodedCompletion> {
  try {
    const binding = readV3IntakeBinding(expectedBinding), uploaded = ownRecord(upload, ['proposal', 'digest', 'bytes'])
    if (!binding.ok || !uploaded || typeof uploaded.digest !== 'string' || !/^[a-f0-9]{64}$/.test(uploaded.digest)
      || typeof uploaded.bytes !== 'number' || !Number.isInteger(uploaded.bytes) || uploaded.bytes < 1 || uploaded.bytes > 65_536) return fail()
    const proposal = readV3ResearchProposal(uploaded.proposal, registry)
    if (!proposal.ok || proposal.value.operationId !== binding.value.operationId || proposal.value.jobId !== binding.value.jobId
      || proposal.value.contextKey !== binding.value.contextKey) return fail()
    const identity = createV3WorkIdentity({ context: proposal.value.context, method: binding.value.method,
      factKind: proposal.value.research.factKind, researchReason: proposal.value.research.researchReason })
    if (!identity.ok || identity.value.contextKey !== binding.value.contextKey) return fail()
    const bytes = provenanceCanonical(input, V3_QUARANTINE_OUTCOME_BYTES)
    const auditBytes = provenanceCanonical(auditInput, 8192)
    if (bytes === null || auditBytes === null) return fail()
    // Canonical preflight rejects getters/prototypes/cycles before JSON detaches.
    const raw: unknown = JSON.parse(bytes), auditRaw: unknown = JSON.parse(auditBytes)
    if (!s1RetentionShapeAllows(raw, 'outcome') || !s1RetentionShapeAllows(auditRaw, 'audit')) return fail()
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail()
    const status = Object.getOwnPropertyDescriptor(raw, 'status')?.value
    let outcome: V3ImportOutcome
    let decisionRef: string | null = null, escalationKey: string | null = null, notBefore: string | null = null
    if (status === 'unavailable' || status === 'quarantined') {
      const row = ownRecord(raw, ['status', 'reason'])
      if (!row) return fail()
      if (status === 'unavailable') {
        if (!oneOf(row.reason, ['method_not_approved', 'method_unavailable', 'verification_unavailable', 'history_unavailable', 'aborted', 'temporary_failure'] as const)) return fail()
        outcome = { status, reason: row.reason }
      } else {
        if (!oneOf(row.reason, ['conditions_unresolved', 'invalid_verification', 'history_changed', 'method_not_current'] as const)) return fail()
        outcome = { status, reason: row.reason }
      }
    } else if (status === 'prepared' || status === 'escalation') {
      const outer = status === 'prepared' ? ownRecord(raw, ['status', 'value'])
        : ownRecord(raw, ['status', 'key', 'reason', 'decision', 'previousDecision', 'archiveAppend'])
      if (!outer) return fail()
      const part = status === 'prepared' ? ownRecord(outer.value, ['proposalDigest', 'decision', 'previousDecision', 'archiveAppend',
        'version', 'transition', 'proposalDisposition', 'acceptance', 'reproof']) : outer
      if (!part) return fail()
      const archive = part.archiveAppend === null ? null : readV3ConflictArchiveRecord(part.archiveAppend, registry)
      if (archive !== null && !archive.ok) return fail()
      const decision = readV3SourceDecisionRecord(part.decision, registry, part.previousDecision, part.archiveAppend)
      if (!decision.ok || decision.value.contextKey !== binding.value.contextKey
        || !same(decision.value.context, proposal.value.context) || !same(decision.value.method, binding.value.method)
        || decision.value.factKind !== proposal.value.research.factKind) return fail()
      const expectedDecision = reference('source-decision', { operationId: proposal.value.operationId, proposalDigest: uploaded.digest,
        contextKey: proposal.value.contextKey, method: binding.value.method, predecessor: decision.value.predecessor })
      if (decision.value.reference !== expectedDecision) return fail()
      // S0 just validated the FULL immediate predecessor with its closed schema,
      // linkage, conflict retention and archive semantics. This cast only records
      // that established check; it is never used instead of validation.
      const previousDecision = part.previousDecision as V3SourceDecisionRecord | null
      const archiveAppend = archive?.ok ? archive.value : null
      decisionRef = decision.value.reference
      notBefore = decision.value.evaluatedAt
      if (status === 'escalation') {
        if (!oneOf(outer.reason, ['primary_unclear', 'comparable_conflict'] as const)
          || decision.value.conclusion !== outer.reason) return fail()
        const expectedKey = reference('source-escalation', { contextKey: decision.value.contextKey, factKind: decision.value.factKind,
          method: decision.value.method, reason: decision.value.conclusion,
          conflicts: decision.value.knownConflicts.filter(item => item.resolution === null).map(item => item.reference).sort() })
        if (outer.key !== expectedKey) return fail()
        escalationKey = expectedKey
        outcome = { status, key: expectedKey, reason: outer.reason, decision: decision.value, previousDecision, archiveAppend }
      } else {
        const version = readV3RuleVersionRecord(part.version, registry, decision.value)
        const transition = readV3TransitionPlan(part.transition)
        if (!version.ok || !transition.ok || part.proposalDigest !== uploaded.digest || part.acceptance !== 'not_committed'
          || part.reproof !== 'required_before_commit' || decision.value.primary.status !== 'clear'
          || version.value.state !== 'accepted' || version.value.operationId !== proposal.value.operationId
          || !same(version.value.method, binding.value.method)) return fail()
        const v = version.value, plan = transition.value
        if (v.reference !== reference('rule-version', { decisionRef, operationId: proposal.value.operationId,
          predecessor: plan.expected.versionRef, revision: plan.expected.revision + 1 })
          || v.predecessor !== plan.expected.versionRef || v.revision !== plan.next.revision
          || plan.next.versionRef !== v.reference || plan.next.state !== 'accepted'
          || plan.operationId !== proposal.value.operationId || plan.contextKey !== binding.value.contextKey
          || plan.factKind !== proposal.value.research.factKind || !same(plan.method, binding.value.method)
          || plan.sourceDecisionRef !== decisionRef || plan.primaryEvidenceVersionId !== v.subject.evidence.versionId
          || !['accept', 'reaccept'].includes(plan.action)
          || !same(plan.resolutionRefs, decision.value.knownConflicts.flatMap(item => item.resolution ? [item.resolution.reference] : []))) return fail()
        const disposition = same(proposal.value.proposedFact, decision.value.primary.observation.fact) ? 'matched' : 'superseded_by_source'
        if (part.proposalDisposition !== disposition) return fail()
        notBefore = v.recordedAt
        outcome = { status, value: { proposalDigest: uploaded.digest, decision: decision.value, previousDecision, archiveAppend,
          version: v, transition: plan, proposalDisposition: disposition, acceptance: 'not_committed', reproof: 'required_before_commit' } }
      }
    } else return fail()
    const audit = ownRecord(auditRaw, ['schema', 'kind', 'operationId', 'proposalDigest', 'jobId', 'contextKey', 'method',
      'recordedAt', 'result', 'decisionRef', 'escalationKey'])
    if (!audit || audit.schema !== 3 || audit.kind !== 'import_attempt_record' || audit.operationId !== proposal.value.operationId
      || audit.proposalDigest !== uploaded.digest || audit.jobId !== proposal.value.jobId || audit.contextKey !== proposal.value.contextKey
      || !same(audit.method, binding.value.method) || !timestamp(audit.recordedAt) || audit.result !== outcome.status
      || audit.decisionRef !== decisionRef || audit.escalationKey !== escalationKey || (notBefore !== null && audit.recordedAt < notBefore)) return fail()
    return { ok: true, value: immutable({ outcome, audit: { schema: 3, kind: 'import_attempt_record',
      operationId: proposal.value.operationId, proposalDigest: uploaded.digest, jobId: proposal.value.jobId,
      contextKey: proposal.value.contextKey, method: binding.value.method, recordedAt: audit.recordedAt,
      result: outcome.status, decisionRef, escalationKey } }) }
  } catch { return fail() }
}
