// SYNTHETIC READER FIXTURES ONLY. No runtime import, publication or travel advice.
// The detailed samples cross the fictional trusted-extractor/I1 fixture. The
// additional legacy examples exercise canonical response parsing, not authority.
import assert from 'node:assert/strict'
import { sha256Hex } from '@/lib/readiness/digest'
import { contentEvidenceLookupV3 } from '@/lib/readiness/official-truth-content-identity'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { OfficialRequirementType } from '@/types/trips'
import { createV3WorkIdentity, readV3PublicProjectionRecord, resolveV3PublicSourceDisplay,
  type V3GlobalRuleContext, type V3PublicProjectionRecord, type V3PublicResponseRecord, type V3RuleFact } from '../contract'
import { CUSTOMER_DETAIL_SAMPLES, customerInformationFixture } from '../customer-information/test-support/fixture'
import { V3_CUSTOMER_INFORMATION_TOPICS } from '../customer-information/topics'
import { v3CanonicalInformationTopic } from '../customer-information/canonical-topic'
import type { V3VisitorAnswer } from './query'

const legacy: readonly (readonly [OfficialRequirementType, V3RuleFact['fact']])[] = [
  ['visa', { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }],
  ['electronic_travel_authorization', { kind: 'requirement_effect', effect: 'not_required', visaMode: null }],
  ['visa', { kind: 'stay_limit', perVisit: { value: 30, unit: 'days' }, rollingWindow: null,
    initialGrant: null, extension: null, borderDiscretion: 'fixed' }],
  ['passport', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
  ['passport_validity', { kind: 'passport_validity', semantics: 'minimum_remaining_from_planned_departure', duration: { value: 3, unit: 'months' } }],
  ['blank_passport_pages', { kind: 'blank_passport_pages', minimumPages: 2 }],
  ['health_document', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
  ['insurance', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
  ['booking_or_travel_document', { kind: 'requirement_effect', effect: 'required', visaMode: null }],
  ['transit', { kind: 'transit_conditions', paths: [{ crossesBorderControl: false, leavesTransitArea: false,
    transitAirportCodes: null, maxTransitDurationMinutes: 120, arrivalMode: 'air', departureMode: 'air',
    thirdCountryRequired: true, sameFlightRequired: false, onwardTicketRequired: true }] }],
]

export function publicResponseMeasure(value: unknown) {
  let nodes = 0, depth = 0
  function visit(item: unknown, level: number) {
    nodes++; depth = Math.max(depth, level)
    if (item && typeof item === 'object') for (const child of Object.values(item)) visit(child, level + 1)
  }
  visit(value, 1)
  return { bytes: Buffer.byteLength(JSON.stringify(value)), nodes, depth }
}

type Country = V3GlobalRuleContext['scope']['citizenship']['countryCodes'][number]

export async function publicResponseFixture(citizenships: Country[] = ['CH']) {
  const f = customerInformationFixture(), registry = f.originals.registry, clock = f.synthetic.clock()
  const detailed = await Promise.all(CUSTOMER_DETAIL_SAMPLES.map((detail, index) =>
    customerInformationFixture(detail, 'synthetic_rule', `response-${index}`).projection()))
  const source = detailed[0]!.rule.subject.evidence.source
  const sourceRef = { sourceId: source.sourceId, contentItemId: source.contentItemId, representationId: source.representationId }
  const originalContext = f.originals.context('CH', 'DE')
  function projectionFor(context: V3GlobalRuleContext, fact: V3RuleFact, country: Country, extra?: number) {
    const normalized = structuredClone(context)
    normalized.scope.citizenship.countryCodes = [country]
    normalized.scope.credentialOption = { mode: 'option', documentType: 'passport', issuingCountryCode: country,
      relatedCitizenshipCountryCode: country }
    if (extra !== undefined) normalized.conditions = { status: 'specified', expression: { op: 'atomic',
      predicate: { kind: 'age_on_travel_date', comparison: 'at_least', years: extra } } }
    const identity = createV3WorkIdentity({ context: normalized, method: f.method,
      factKind: fact.fact.kind, researchReason: { status: 'missing' } })
    assert.ok(identity.ok)
    const lookup = contentEvidenceLookupV3(normalized.scope, sourceRef); assert.ok(lookup.ok)
    const seed = schema2Kanonisch([normalized, fact]), base = detailed[0]!
    const fields = { ...base, rule: { ...base.rule,
      reference: `rule-version:v3:${sha256Hex('version' + seed)}`, operationId: `op3_${sha256Hex(seed).slice(0, 32)}`,
      sourceDecisionRef: `source-decision:v3:${sha256Hex('decision' + seed)}`,
      subject: { context: normalized, contextKey: identity.value.contextKey, fact,
        evidence: { ...base.rule.subject.evidence, lookupKey: lookup.value.key,
          versionId: `ev2_${sha256Hex('evidence' + seed).slice(0, 32)}` } } } }
    const read = readV3PublicProjectionRecord({ ...fields,
      reference: `rule-projection:v3:${sha256Hex(schema2Kanonisch(fields))}` }, registry, clock)
    assert.ok(read.ok, fact.fact.kind)
    return read.value
  }
  const rows = [
    ...detailed.map(projection => ({ context: projection.rule.subject.context, fact: projection.rule.subject.fact })),
    ...legacy.map(([requirementType, fact]) => ({ context: { ...originalContext, scope: { ...originalContext.scope, requirementType } },
      fact: { schema: 1 as const, fact } as V3RuleFact })),
  ]
  function responseWith(projections: readonly V3PublicProjectionRecord[][]): V3VisitorAnswer {
    const response: V3PublicResponseRecord = { schema: 3, kind: 'conditional_rule_overview_record', dataMode: 'synthetic_test',
      notice: 'SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE', input: { destinationCountryCode: 'DE', citizenshipCountryCodes: citizenships },
      generatedAt: clock.now, cells: projections.map((items, index) => ({ citizenshipCountryCode: citizenships[index]!,
        results: items.map(projection => ({ status: 'accepted', projection })) })) }
    const sources = Object.fromEntries(projections.flat().map(projection => {
      const found = resolveV3PublicSourceDisplay(projection.rule.subject.evidence.source, registry); assert.ok(found.ok)
      return [projection.reference, found.value]
    }))
    return { response, sources }
  }
  const projections = citizenships.map(country => rows.map(row => projectionFor(row.context, row.fact, country)))
  const answer = responseWith(projections)
  const proposals = projections.flat().map(projection => {
    const { context, fact } = projection.rule.subject
    const identity = createV3WorkIdentity({ context, method: f.method, factKind: fact.fact.kind, researchReason: { status: 'missing' } })
    assert.ok(identity.ok)
    return { schema: 3, kind: 'untrusted_research_proposal', jobId: `job3_${sha256Hex(projection.reference).slice(0, 32)}`,
      operationId: projection.rule.operationId, context, contextKey: identity.value.contextKey, research: identity.value.research,
      proposedFact: fact, references: [{ source: sourceRef, claimedRetrievedAt: clock.now,
        claimedValidity: { status: 'specified', validFrom: null, validUntil: null } }] }
  })
  const plan = { schema: 1, kind: 'official_source_onboarding_plan', classification: 'RESEARCH_ONLY',
    ...answer.response.input, primary: { source: sourceRef, representedCountryCode: 'DE', role: 'destination_authority' },
    counterSources: [], knownConflicts: [], coverage: citizenships.flatMap(citizenshipCountryCode =>
      V3_CUSTOMER_INFORMATION_TOPICS.map(topic => {
        const matches = proposals.filter(proposal => proposal.context.scope.citizenship.countryCodes[0] === citizenshipCountryCode
          && v3CanonicalInformationTopic(proposal.context, proposal.proposedFact) === topic.id)
        return matches.length ? { topic: topic.id, citizenshipCountryCode, status: 'canonical_proposals', proposals: matches }
          : { topic: topic.id, citizenshipCountryCode, status: 'unavailable', reason: 'not_researched' }
      })) }
  return { registry, clock, answer, plan, rows, projectionFor, responseWith }
}
