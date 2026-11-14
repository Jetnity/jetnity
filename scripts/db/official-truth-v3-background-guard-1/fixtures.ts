// LOCAL DATABASE FIXTURES ONLY. These bytes are invented test material, never
// official HTTP evidence. No runtime issuer, receipt or credential is created.
import assert from 'node:assert/strict'
import { sha256Hex } from '../../../lib/readiness/digest'
import { evidenceQuellenFingerprint } from '../../../lib/readiness/evidence'
import { contentEvidenceLookupV3 } from '../../../lib/readiness/official-truth-content-identity'
import { createV3WorkIdentity, readV3ResearchJobRecord, readV3SourceDecisionRecord,
  readV3RuleVersionRecord, readV3TransitionPlan,
  type V3SourceObservationRecord, type V3ResearchJobRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { hrs1Canonical, hrs1Clock, hrs1Ref, type Hrs1Original, type Hrs1Verification } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import type { V3ImportHistory, V3ImportVerificationRequest, V3ImportPrepared } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import type { V3ProposalUpload } from '../../../lib/readiness/official-truth-product-v3/import/interface'
import { prepareV3VisitorProjection } from '../../../lib/readiness/official-truth-product-v3/visitor/query'

export const fixtureId = (kind: 'op3' | 'job3' | 'lease3' | 'ev2', seed: string) => kind + '_' + sha256Hex('bg1 local:' + seed).slice(0, 32)
export function fixtureLeasedJob(at = '2026-11-14T01:00:00.000Z'): V3ResearchJobRecord {
  const identity = createV3WorkIdentity({ context: program.context, method: program.method,
    factKind: 'requirement_effect', researchReason: { status: 'missing' } }); assert.ok(identity.ok)
  const result = readV3ResearchJobRecord({ schema: 3, kind: 'research_job_record', jobKey: identity.value.jobKey,
    contextKey: identity.value.contextKey, research: identity.value.research,
    context: program.context, method: program.method, jobId: fixtureId('job3', 'rule'), operationId: fixtureId('op3', 'enqueue'),
    revision: 2, predecessorRevision: 1, state: 'leased', createdAt: at, updatedAt: at, attempt: 1, attemptLimit: 4,
    nextAttemptAt: null, lastFailure: null, resultDecisionRef: null,
    lease: { leaseId: fixtureId('lease3', 'first'), generation: 2, acquiredAt: at, expiresAt: new Date(Date.parse(at) + 30000).toISOString() } })
  assert.ok(result.ok); return result.value
}
export function fixtureVerification(at: string, decisionRef = hrs1Ref('source-decision', { fixture: at })): Hrs1Verification {
  const clock = hrs1Clock(at, program.legalTimeZone); assert.ok(clock)
  const originals: Hrs1Original[] = program.binding.sources.map(selected => {
    const bodyText = `<html><body>LOCAL BG1 DATABASE FIXTURE ONLY: ${selected.role}; Grüße Zürich.</body></html>\r\n`
    const fingerprint = evidenceQuellenFingerprint(bodyText); assert.ok(fingerprint)
    const lookup = contentEvidenceLookupV3(program.context.scope, { sourceId: selected.source.sourceId,
      contentItemId: selected.source.contentItemId, representationId: selected.source.representationId }); assert.ok(lookup.ok)
    const evidence: V3SourceObservationRecord['evidence'] = { versionId: fixtureId('ev2', selected.role + at), lookupKey: lookup.value.key,
      source: selected.source, sourceFingerprintProtocol: 1, sourceContentHash: fingerprint, retrievedAt: at,
      legalValidity: { status: 'specified', validFrom: '2026-11-12', validUntil: '2027-11-12' } }
    const observation: V3SourceObservationRecord = { context: program.context, contextKey: program.contextKey,
      fact: { schema: 1, fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' } }, evidence }
    return { bodyText, rawDigest: sha256Hex(bodyText), observation, extraction: { executableDigest: selected.executableDigest, observation },
      qualification: { qualificationDigest: selected.qualificationDigest, source: selected.source, contextKey: program.contextKey,
        method: program.method, checkedAt: at, role: selected.role } }
  })
  const primary = originals[0]!.observation, counter = originals[1]!.observation; assert.ok(primary && counter)
  const decision = readV3SourceDecisionRecord({ schema: 3, kind: 'source_decision_record', reference: decisionRef,
    predecessor: null, method: program.method, context: program.context, contextKey: program.contextKey, factKind: 'requirement_effect',
    evaluatedAt: at, legalAsOfDate: clock.legalDate, primary: { status: 'clear', observation: primary,
      qualification: { reference: hrs1Ref('destination-qualification', { fixture: decisionRef }), representedCountryCode: 'DE',
        role: 'destination_authority', method: program.method, evidenceVersionId: primary.evidence.versionId, checkedAt: at } },
    counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'agrees', observation: counter, attemptedAt: at,
      comparisonRef: hrs1Ref('source-comparison', { fixture: decisionRef }) }] }, knownConflicts: [], historyArchive: null, conclusion: 'clear_primary',
  }, program.registry, null, null); assert.ok(decision.ok)
  const history: V3ImportHistory = { pointer: { revision: 0, state: 'missing', versionRef: null }, version: null,
    decision: null, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] }
  const request: V3ImportVerificationRequest = { context: program.context, contextKey: program.contextKey,
    factKind: 'requirement_effect', references: program.binding.sources.map(s => ({ sourceId: s.source.sourceId,
      contentItemId: s.source.contentItemId, representationId: s.source.representationId })), method: program.method, clock,
    previousDecision: null, decisionRef }
  const body = { request, decision: decision.value, previousDecision: null, archiveAppend: null, originals, history,
    stickyDecision: null, suppressionEpoch: 0,
    validUntilExclusive: new Date(Math.min(Date.parse(at) + program.binding.sourceMaxAgeMilliseconds, Date.parse(program.binding.activeUntilExclusive))).toISOString() }
  return { reference: hrs1Ref('hrs1-verification', body), ...body }
}

/** Explicit local database rows; these DTOs issue no source/authority receipt. */
export function fixturePrepared(upload: V3ProposalUpload, verification: Hrs1Verification) {
  const decision = verification.decision, at = decision.evaluatedAt
  assert.equal(decision.primary.status, 'clear'); assert.ok(decision.primary.status === 'clear')
  const version = readV3RuleVersionRecord({ schema: 3, kind: 'rule_version_record',
    reference: hrs1Ref('rule-version', { decisionRef: decision.reference, operationId: upload.proposal.operationId,
      predecessor: null, revision: 1 }), revision: 1, predecessor: null, state: 'accepted', method: decision.method,
    subject: decision.primary.observation, sourceDecisionRef: decision.reference, operationId: upload.proposal.operationId,
    recordedAt: at }, program.registry, decision); assert.ok(version.ok)
  const transition = readV3TransitionPlan({ schema: 3, protocolRevision: 1, operationId: upload.proposal.operationId,
    contextKey: program.contextKey, method: program.method, factKind: 'requirement_effect', action: 'accept',
    expected: verification.history.pointer, next: { revision: 1, state: 'accepted', versionRef: version.value.reference },
    primaryEvidenceVersionId: decision.primary.observation.evidence.versionId, sourceDecisionRef: decision.reference,
    resolutionRefs: [], recoverFromVersionRef: null, invalidatedProjectionRefs: [], reproof: 'required_before_commit', commitConfirmation: 'required' })
  assert.ok(transition.ok)
  const prepared: V3ImportPrepared = { proposalDigest: upload.digest, decision, previousDecision: null, archiveAppend: null,
    version: version.value, transition: transition.value,
    proposalDisposition: hrs1Canonical(upload.proposal.proposedFact) === hrs1Canonical(decision.primary.observation.fact)
      ? 'matched' : 'superseded_by_source',
    acceptance: 'not_committed', reproof: 'required_before_commit' }
  const clock = hrs1Clock(at, program.legalTimeZone); assert.ok(clock)
  const projection = prepareV3VisitorProjection({ rule: version.value, decision, builtAt: at,
    expiresAt: new Date(Math.min(Date.parse(at) + program.binding.projectionMaxAgeMilliseconds,
      Date.parse(verification.validUntilExclusive))).toISOString(), sourceFreshUntil: verification.validUntilExclusive }, program.registry, clock)
  assert.equal(projection.status, 'prepared'); assert.ok(projection.status === 'prepared')
  return { prepared, projection: projection.projection }
}
