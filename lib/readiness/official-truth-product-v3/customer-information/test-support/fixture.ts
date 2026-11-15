// FICTIONAL TEST DATA ONLY. No runtime imports, network or country rule claims.
import 'server-only'
import assert from 'node:assert/strict'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { contentEvidenceLookupV3 } from '@/lib/readiness/official-truth-content-identity'
import { officialTruthTrustedFactExtrahierenMitDefinitionen, consumeOfficialTruthTrustedFactExecutionContext,
  type OfficialTruthExtractorDefinition } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'
import { createV3WorkIdentity, readV3GlobalRuleContext, type V3SourceObservationRecord } from '../../contract'
import { makeSyntheticOriginals, METHOD, source, id, must } from '../../integration/test-support/originals'
import { makeSyntheticStore } from '../../integration/test-support/store'
import { createV3ImportCoordinator } from '../../import/service-server'
import { prepareV3VisitorProjection } from '../../visitor/query'
import { prepareV3CustomerInformationProposal } from '../source-onboarding'
import { v3CustomerDetailRequirementMatches, type V3CustomerInformationDetail } from '../details'
import { v3CustomerDetailTopic } from '../detail-topic'

const sourceRef = { sourceId: 'synthetic-primary', contentItemId: 'synthetic-publication', representationId: 'synthetic-json' }
const action = { source: sourceRef, purpose: 'form' as const, href: 'https://synthetic-primary.example/synthetic-rules' }
const amount = { value: '12.50', currency: 'CHF', basis: 'per_person' as const }
export const CUSTOMER_DETAIL_SAMPLES: readonly V3CustomerInformationDetail[] = [
  { kind: 'vaccination_details', classification: 'required', vaccines: [{ vaccineLabel: 'Synthetic vaccine', diseaseLabel: 'Synthetic disease',
    minimumDoses: null, beforeEntry: { value: 7, unit: 'days' }, certificateRequired: true }] },
  { kind: 'vaccination_details', classification: 'recommended', vaccines: [{ vaccineLabel: 'Synthetic vaccine', diseaseLabel: 'Synthetic disease',
    minimumDoses: 2, beforeEntry: null, certificateRequired: null }] },
  { kind: 'health_measures', measures: [{ measure: 'test', classification: 'required', measureLabel: 'Synthetic health test', duration: null, proofRequired: true }] },
  { kind: 'entry_form_details', formTitle: 'Synthetic arrival form', completion: 'required', cost: { status: 'specified', amount }, action,
    due: { relation: 'before_entry', offset: { value: 2, unit: 'days' } } },
  ...(['visa', 'electronic_travel_authorization', 'entry_form', 'arrival'] as const).map(purpose => ({
    kind: 'fee_details' as const, feeLabel: 'Synthetic fee', purpose, cost: { status: 'specified' as const, amount }, paymentTiming: 'on_arrival' as const })),
  { kind: 'fraud_warning', warning: 'imitation_website', officialAction: { ...action, purpose: 'information' } },
  { kind: 'ticket_details', effect: 'required', ticket: 'return_or_onward' },
  { kind: 'financial_means_details', effect: 'required', minimum: amount, acceptedProofs: ['cash', 'bank_statement'] },
  { kind: 'minor_travel_details', appliesBelowAge: 18, documents: ['own_travel_document', 'birth_certificate', 'parental_consent'] },
  { kind: 'parental_consent_details', effect: 'required', signatories: 'all_legal_guardians', notarisationRequired: null,
    translationRequired: false, officialForm: action },
  { kind: 'customs_details', category: 'cash', disposition: 'declaration_required', allowance: null, monetaryThreshold: amount, officialAction: action },
  { kind: 'document_alternative_details', acceptedDocument: 'national_id', replacesPassport: true, documentClass: 'ordinary' },
  { kind: 'dual_national_details', destinationNationalityHeld: true, entryDocument: 'destination_passport', departureDocument: null },
  { kind: 'change_notice', changedOn: '2026-11-08', effectiveFrom: null, change: 'form_changed', changedTopic: 'Synthetic form',
    priorRuleReference: null, announcement: { ...action, purpose: 'information' } },
]

export function customerInformationFixture(detail: V3CustomerInformationDetail = CUSTOMER_DETAIL_SAMPLES[3]!, informationItem = 'arrival_form', seed = 'customer-info') {
  const originals = makeSyntheticOriginals(), base = originals.context('CH', 'DE')
  const requirement = OFFICIAL_REQUIREMENT_TYPES.find(value => v3CustomerDetailRequirementMatches(detail, value))
  assert.ok(requirement)
  const context = must(readV3GlobalRuleContext({ ...base, scope: { ...base.scope, requirementType: requirement },
    contextRevision: 3, informationTopic: v3CustomerDetailTopic(detail), informationItem }))
  const identity = must(createV3WorkIdentity({ context, method: METHOD, factKind: 'entry_information', researchReason: { status: 'missing' } }))
  // Use the actual trusted-extractor seam on a fixed fictional publication,
  // preserving the independently produced snapshot hash and evidence custody.
  originals.extract = (value, sourceId): V3SourceObservationRecord => {
    const rawFact = { kind: 'entry_information', detail }, original = JSON.stringify({ synthetic: true, fact: rawFact })
    const fingerprint = evidenceQuellenFingerprint(original); assert.ok(fingerprint)
    const work = must(createV3WorkIdentity({ context: value, method: METHOD, factKind: 'entry_information', researchReason: { status: 'missing' } }))
    const url = `https://${sourceId}.example/synthetic-rules`, versionId = id('ev2', `${sourceId}|${work.contextKey}|${original}`)
    const lookup = contentEvidenceLookupV3(value.scope, { sourceId, contentItemId: 'synthetic-publication', representationId: 'synthetic-json' })
    assert.ok(lookup.ok)
    const definition: OfficialTruthExtractorDefinition = { extractorId: 'otx_ci_synthetic', extractorVersion: 1, current: true,
      factKind: 'entry_information', sourceFamilyId: 'otf_synthetic', contentItemRefs: [{ sourceId, contentItemId: 'synthetic-publication' }],
      representations: [source(sourceId)], urlAllowlist: [{ kind: 'exact', canonicalUrl: url }], contentTypes: ['application/json'],
      schemaFamily: 'ots_synthetic', policyId: null, policyVersion: null, requiredFieldPaths: [], match: () => ({ ok: true }),
      extract: ({ supports }) => { const parsed = JSON.parse(supports[0].sourceSnapshot); originals.control.extracts++
        return parsed.synthetic === true ? { ok: true, fact: parsed.fact } : { ok: false, reason: 'structure_not_recognized' } } }
    const input = { factKind: 'entry_information', requirementType: requirement, scopeKey: work.ruleScopeKey, scope: value.scope,
      evidenceQuality: 'explicit_primary_statement', policy: null, registry: originals.registry,
      supports: [{ versionId, sourceId, retrieval: { ...source(sourceId), identitySchema: 2,
        status: 'server_owned_official_retrieval', canonicalUrl: url, retrievedAt: originals.control.retrievedAt,
        contentType: 'application/json', sourceSnapshot: original, sourceContentHash: fingerprint, redirectCount: 0 } }] }
    const execution = officialTruthTrustedFactExtrahierenMitDefinitionen(input, [definition])
    assert.equal(execution.status, 'trusted_fact_extracted')
    const held = consumeOfficialTruthTrustedFactExecutionContext(execution, input); assert.ok(held)
    return { context: value, contextKey: work.contextKey, fact: { schema: 1, fact: held.fact }, evidence: {
      versionId, lookupKey: lookup.value.key, source: source(sourceId), sourceFingerprintProtocol: 1, sourceContentHash: fingerprint,
      retrievedAt: originals.control.retrievedAt, legalValidity: { status: 'specified', validFrom: '2026-11-01', validUntil: '2026-12-31' } } }
  }
  const synthetic = makeSyntheticStore(originals)
  const proposal = must(prepareV3CustomerInformationProposal({ jobId: id('job3', seed), operationId: id('op3', seed),
    context, method: METHOD, researchReason: { status: 'missing' }, detail,
    references: [{ source: sourceRef, claimedRetrievedAt: originals.control.retrievedAt,
      claimedValidity: { status: 'specified', validFrom: null, validUntil: null } }] }, originals.registry))
  async function completion() {
    const result = await createV3ImportCoordinator(synthetic.importPorts).submit(JSON.stringify(proposal))
    assert.equal(result.status, 'completed')
    if (result.status !== 'completed') assert.fail('fictional customer information completion')
    return { outcome: result.outcome, audit: synthetic.importAudits.at(-1)! }
  }
  async function projection() {
    const { outcome } = await completion()
    if (outcome.status !== 'prepared') assert.fail(`fictional detail outcome: ${outcome.status}`)
    const prepared = prepareV3VisitorProjection({ rule: outcome.value.version, decision: outcome.value.decision,
      builtAt: synthetic.clock().now, expiresAt: '2026-11-09T08:10:00.000Z', sourceFreshUntil: '2026-11-09T08:15:00.000Z' },
    originals.registry, synthetic.clock())
    assert.equal(prepared.status, 'prepared')
    if (prepared.status !== 'prepared') assert.fail('fictional detail projection')
    return prepared.projection
  }
  return { originals, synthetic, context, identity, detail, proposal, completion, projection, method: METHOD }
}
