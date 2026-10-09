// Pure developer diagnostics: no retrieval, truth evaluator, registry or store calls.
import { z } from 'zod'
import { regelScopeAusEvidenceScope, type RegelScope } from '../../lib/readiness/rule-claims'
import { schema2DatenPruefen, schema2Kanonisch, civilDateOrdinalLesen, ZIEL_ERLAUBNIS_KLASSEN } from '../../lib/readiness/regulierungs-anwendbarkeit'
import { ANCHORS, COVERAGE_CASES, PREDICATES, QUESTION_IDS, QUESTIONS, SOURCE_LABELS, URLS, freeze } from './catalog'

const UTC = z.string().length(24).refine(value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && civilDateOrdinalLesen(value.slice(0, 10)) !== null && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString() === value)
const coverageState = z.enum(['MISSING', 'USER_ASSERTED', 'UNREVIEWED_RECORD'])
export const CONTEXT_FACTS = [
  'DOCUMENT_CLASS', 'NATIONAL_PASSPORT', 'IRELAND_ACTUAL_RESIDENCE', 'IRELAND_ENTITLEMENT',
  'IRELAND_MINISTER_RESTRICTION', 'INBOUND_CTA_ORIGIN', 'AGE_AND_PROOF_DUTY', 'VISITOR_PURPOSE',
  'BOTC_BNO_STATUS', 'SCHOOL_STUDY_ORGANISER_RELATION', 'SCHOOL_PUPIL_COUNT',
  'SCHOOL_FORM_LISTING', 'SCHOOL_FORM_AUTHORITY', 'SCHOOL_ADULT_CUSTODY',
] as const

const observationSchema = z.object({
  source: z.enum(SOURCE_LABELS), url: z.enum([URLS.ETA_APPENDIX, URLS.NATIONAL_LIST, URLS.IRISH_GUIDANCE]),
  origin: z.enum(['HISTORICAL_AUDIT', 'RESEARCH_READ', 'SYNTHETIC']),
  retrievedAt: UTC.nullable(), publishedAt: UTC.nullable(),
  interpretation: z.enum(['UNRESOLVED', 'AMBIGUOUS', 'CONFLICTING', 'CLARIFICATION_LOCATED']),
}).strict().refine(value => value.url === URLS[value.source])

const inputSchema = z.object({
  schemaVersion: z.literal(1), intent: z.literal('UK_ETA_LEGAL_PROOF_GAPS'), observedAt: UTC,
  scope: z.unknown(),
  journey: z.enum(['INBOUND_DESTINATION', 'UNKNOWN', 'AIRSIDE_TRANSIT', 'LANDSIDE_TRANSIT', 'DOMESTIC']),
  applicationScenario: z.enum(['NEVER_APPLIED', 'APPLICATION_ASSERTED', 'UNKNOWN']),
  contextCoverage: z.array(z.object({ fact: z.enum(CONTEXT_FACTS), state: coverageState }).strict()).max(CONTEXT_FACTS.length),
  permissionCoverage: z.array(z.object({ permissionClass: z.enum(ZIEL_ERLAUBNIS_KLASSEN), state: coverageState }).strict()).max(ZIEL_ERLAUBNIS_KLASSEN.length),
  observations: z.array(observationSchema).max(SOURCE_LABELS.length),
}).strict().refine(value => Object.hasOwn(value, 'scope'))
  .refine(value => new Set(value.contextCoverage.map(row => row.fact)).size === value.contextCoverage.length)
  .refine(value => new Set(value.permissionCoverage.map(row => row.permissionClass)).size === value.permissionCoverage.length)
  .refine(value => new Set(value.observations.map(row => row.source)).size === value.observations.length)
export type ResearchIntent = z.infer<typeof inputSchema>

export const GAP_CATEGORIES = [
  'SOURCE_PRIVACY', 'CONTENT_IDENTITY_AND_SUPPORT', 'LEGAL_EFFECTIVE_INTERVAL',
  'EXEMPTION_COVERAGE', 'IRELAND_INTERPRETATION', 'UK_PERMISSION_NEGATIVE_KNOWLEDGE',
  'CASE_SPECIFIC_EXEMPTIONS', 'CREDENTIAL_AND_ROUTE', 'CONTEXT_PROOF', 'CUSTODY_AND_GOVERNANCE',
] as const
const REASONS = [
  'OPAQUE_PUBLISHING_METADATA', 'DISTINCT_CONTENT_ITEMS_UNQUALIFIED', 'SOURCE_REVISION_UNKNOWN',
  'COMMENCEMENT_UNPROVEN', 'EFFECTIVE_INTERVAL_UNKNOWN', 'TRAVEL_DATE_MISSING',
  'ABSENT_SOURCE', 'HISTORICAL_NOT_CURRENT', 'RESEARCH_STALE', 'RETRIEVAL_TIME_MISSING',
  'SOURCE_TIME_CONFLICT', 'AMBIGUOUS_SOURCE', 'CONFLICTING_SOURCE', 'CLARIFICATION_UNREVIEWED',
  'SYNTHETIC_NOT_AUTHORITY', 'EXEMPTION_SET_NON_EXHAUSTIVE', 'NO_RESIDUAL_NEGATIVE_PROOF',
  'QUALIFIER_TARGET_UNRESOLVED', 'NEVER_APPLIED_EVENT_UNRESOLVED', 'REFERENCE_EVENT_UNRESOLVED',
  'PERMISSION_CLASS_MISSING', 'CLASS_WIDE_ABSENCE_UNPROVEN', 'ASSERTION_NOT_OFFICIAL_PROOF',
  'UNREVIEWED_CONTEXT', 'CONTEXT_MISSING', 'SELECTED_CREDENTIAL_MISSING', 'CITIZENSHIP_LINK_MISSING',
  'JOURNEY_KIND_MISSING', 'OFFICIAL_INTERPRETATION_UNRESOLVED', 'SAME_REQUEST_CUSTODY_ABSENT',
  'ACCEPTED_EVIDENCE_RULE_ABSENT', 'REGISTRY_NOT_ACTIVATED', 'F8_NOT_AUTHORIZED', 'HOSTED_IMPORT_NOT_AUTHORIZED',
] as const
const SCOPE_REASONS = ['SCOPE_MISSING', 'INVALID_SCOPE', 'DESTINATION_OUT_OF_SCOPE', 'CITIZENSHIP_OUT_OF_SCOPE',
  'REQUIREMENT_OUT_OF_SCOPE', 'CREDENTIAL_OUT_OF_SCOPE', 'JOURNEY_OUT_OF_SCOPE'] as const
const anchorId = z.enum(Object.keys(ANCHORS) as [keyof typeof ANCHORS, ...(keyof typeof ANCHORS)[]])
const gapSchema = z.object({
  category: z.enum(GAP_CATEGORIES), layer: z.enum(['OFFICIAL_SOURCE', 'LEGAL_SEMANTICS', 'PERSONAL_CONTEXT', 'PLATFORM_PO_GATE']),
  phase: z.enum(['SOURCE_QUALIFICATION', 'LEGAL_RESEARCH', 'CONTEXT_BINDING', 'ACCEPTANCE_ACTIVATION']),
  reason: z.enum(REASONS), subject: z.union([z.enum(SOURCE_LABELS), z.enum(CONTEXT_FACTS), z.enum(ZIEL_ERLAUBNIS_KLASSEN), z.enum(QUESTION_IDS)]).nullable(),
}).strict()
type Gap = z.infer<typeof gapSchema>
const sourceDiagnosticSchema = z.object({
  source: z.enum(SOURCE_LABELS), url: z.enum([URLS.ETA_APPENDIX, URLS.NATIONAL_LIST, URLS.IRISH_GUIDANCE]),
  phase: z.literal('RESEARCH_ONLY'), retrievedAt: UTC.nullable(), publishedAt: UTC.nullable(),
  sourceRevision: z.null(), validFrom: z.null(), validUntil: z.null(),
  observation: z.enum(['ABSENT', 'HISTORICAL', 'SYNTHETIC', 'RESEARCH_OBSERVED']), reasons: z.array(z.enum(REASONS)).max(8),
}).strict().refine(row => row.url === URLS[row.source])
const base = {
  schemaVersion: z.literal(1), kind: z.literal('UK_ETA_LEGAL_PROOF_GAP_PACKET'),
  legalProofReadiness: z.literal('NOT_READY'), authority: z.literal('DEVELOPER_RESEARCH_ONLY'),
}
// Public output reader rejects unknown fields at every level. No legal-result field exists.
export const packetSchema = z.discriminatedUnion('ok', [
  z.object({ ...base, ok: z.literal(false), status: z.enum(['BLOCKED', 'NOT_READY']),
    reason: z.enum(['INVALID_INPUT', ...SCOPE_REASONS]), observedAt: UTC.nullable() }).strict(),
  z.object({ ...base, ok: z.literal(true), status: z.literal('BLOCKED'), reason: z.literal('OPAQUE_PUBLISHING_METADATA'),
    observedAt: UTC, applicationScenario: z.enum(['NEVER_APPLIED', 'APPLICATION_ASSERTED', 'UNKNOWN']),
    scopeAssessment: z.literal('EXPLICIT_CH_GB_RESEARCH_SCOPE_ONLY'),
    sources: z.array(sourceDiagnosticSchema).length(3), gaps: z.array(gapSchema).min(1).max(100),
    questions: z.array(z.object({ id: z.enum(QUESTION_IDS), status: z.literal('UNRESOLVED'),
      unsatisfiedPredicates: z.array(z.enum(PREDICATES)).min(1).max(2), references: z.array(anchorId).min(1).max(6) }).strict()).length(6),
    coverage: z.array(z.object({ case: z.enum(COVERAGE_CASES), disposition: z.enum(['UNRESOLVED', 'EXCLUDED_BY_EXPLICIT_RESEARCH_SCOPE', 'APPLICATION_USE_ONLY']) }).strict()).length(COVERAGE_CASES.length),
  }).strict(),
])
export type LegalProofPacket = z.infer<typeof packetSchema>
const BASE = { schemaVersion: 1, kind: 'UK_ETA_LEGAL_PROOF_GAP_PACKET', legalProofReadiness: 'NOT_READY', authority: 'DEVELOPER_RESEARCH_ONLY' } as const
function refusal(reason: Extract<LegalProofPacket, { ok: false }>['reason'], observedAt: string | null = null): LegalProofPacket {
  return freeze({ ...BASE, ok: false, status: reason === 'INVALID_INPUT' ? 'BLOCKED' : 'NOT_READY', reason, observedAt })
}

function scopeReason(scope: RegelScope, journey: ResearchIntent['journey']): typeof SCOPE_REASONS[number] | null {
  if (scope.destinationCountryCode !== 'GB') return 'DESTINATION_OUT_OF_SCOPE'
  if (scope.citizenship.mode !== 'required' || scope.citizenship.countryCodes.length !== 1 || scope.citizenship.countryCodes[0] !== 'CH') return 'CITIZENSHIP_OUT_OF_SCOPE'
  if (scope.requirementType !== 'electronic_travel_authorization') return 'REQUIREMENT_OUT_OF_SCOPE'
  if (scope.transitCountryCode !== null || !['INBOUND_DESTINATION', 'UNKNOWN'].includes(journey)) return 'JOURNEY_OUT_OF_SCOPE'
  const credential = scope.credentialOption
  if (credential.mode === 'option' && (credential.documentType !== 'passport' || credential.issuingCountryCode !== 'CH')) return 'CREDENTIAL_OUT_OF_SCOPE'
  return null
}

function construct(input: ResearchIntent, scope: RegelScope): LegalProofPacket {
  const gaps: Gap[] = []
  const add = (category: Gap['category'], layer: Gap['layer'], phase: Gap['phase'], reason: Gap['reason'], subject: Gap['subject'] = null) => gaps.push({ category, layer, phase, reason, subject })
  const legal = (category: Gap['category'], reason: Gap['reason'], subject: Gap['subject'] = null) => add(category, 'LEGAL_SEMANTICS', 'LEGAL_RESEARCH', reason, subject)
  add('SOURCE_PRIVACY', 'OFFICIAL_SOURCE', 'SOURCE_QUALIFICATION', 'OPAQUE_PUBLISHING_METADATA')
  add('CONTENT_IDENTITY_AND_SUPPORT', 'OFFICIAL_SOURCE', 'SOURCE_QUALIFICATION', 'DISTINCT_CONTENT_ITEMS_UNQUALIFIED')
  const sources = SOURCE_LABELS.map(source => {
    const row = input.observations.find(row => row.source === source)
    const reasons: Gap['reason'][] = []
    if (!row) reasons.push('ABSENT_SOURCE')
    else {
      if (row.origin === 'HISTORICAL_AUDIT') reasons.push('HISTORICAL_NOT_CURRENT')
      if (row.origin === 'SYNTHETIC') reasons.push('SYNTHETIC_NOT_AUTHORITY')
      // Missing retrieval is not substituted with publication or observation.
      if (!row.retrievedAt) reasons.push('RETRIEVAL_TIME_MISSING')
      if (row.publishedAt && row.publishedAt > input.observedAt) reasons.push('SOURCE_TIME_CONFLICT')
      if (row.retrievedAt) {
        const age = Date.parse(input.observedAt) - Date.parse(row.retrievedAt)
        if ((age < 0 || (row.publishedAt && row.publishedAt > row.retrievedAt)) && !reasons.includes('SOURCE_TIME_CONFLICT')) reasons.push('SOURCE_TIME_CONFLICT')
        // Diagnostic observation age only; this does not define legal freshness/validity.
        if (age > 86_400_000) reasons.push('RESEARCH_STALE')
      }
      if (row.interpretation === 'CONFLICTING') reasons.push('CONFLICTING_SOURCE')
      if (row.interpretation === 'AMBIGUOUS') reasons.push('AMBIGUOUS_SOURCE')
      if (row.interpretation === 'CLARIFICATION_LOCATED') reasons.push('CLARIFICATION_UNREVIEWED')
    }
    for (const reason of reasons) add('CONTENT_IDENTITY_AND_SUPPORT', 'OFFICIAL_SOURCE', 'LEGAL_RESEARCH', reason, source)
    return { source, url: URLS[source], phase: 'RESEARCH_ONLY' as const, retrievedAt: row?.retrievedAt ?? null, publishedAt: row?.publishedAt ?? null,
      sourceRevision: null, validFrom: null, validUntil: null,
      observation: !row ? 'ABSENT' as const : row.origin === 'HISTORICAL_AUDIT' ? 'HISTORICAL' as const : row.origin === 'SYNTHETIC' ? 'SYNTHETIC' as const : 'RESEARCH_OBSERVED' as const, reasons }
  })
  for (const reason of ['SOURCE_REVISION_UNKNOWN', 'COMMENCEMENT_UNPROVEN', 'EFFECTIVE_INTERVAL_UNKNOWN'] as const) legal('LEGAL_EFFECTIVE_INTERVAL', reason)
  if (scope.validity.mode !== 'travel_date') legal('LEGAL_EFFECTIVE_INTERVAL', 'TRAVEL_DATE_MISSING')
  legal('EXEMPTION_COVERAGE', 'EXEMPTION_SET_NON_EXHAUSTIVE')
  legal('EXEMPTION_COVERAGE', 'NO_RESIDUAL_NEGATIVE_PROOF')
  legal('IRELAND_INTERPRETATION', 'QUALIFIER_TARGET_UNRESOLVED', 'R1')
  legal('IRELAND_INTERPRETATION', input.applicationScenario === 'NEVER_APPLIED' ? 'NEVER_APPLIED_EVENT_UNRESOLVED' : 'REFERENCE_EVENT_UNRESOLVED', 'R1')
  for (const question of QUESTION_IDS.slice(1)) legal('CASE_SPECIFIC_EXEMPTIONS', 'OFFICIAL_INTERPRETATION_UNRESOLVED', question)
  for (const fact of CONTEXT_FACTS) {
    const state = input.contextCoverage.find(row => row.fact === fact)?.state ?? 'MISSING'
    const category = fact === 'NATIONAL_PASSPORT' || fact === 'INBOUND_CTA_ORIGIN' || fact === 'DOCUMENT_CLASS' ? 'CREDENTIAL_AND_ROUTE' : 'CONTEXT_PROOF'
    add(category, 'PERSONAL_CONTEXT', 'CONTEXT_BINDING', state === 'MISSING' ? 'CONTEXT_MISSING' : state === 'USER_ASSERTED' ? 'ASSERTION_NOT_OFFICIAL_PROOF' : 'UNREVIEWED_CONTEXT', fact)
  }
  for (const permissionClass of ZIEL_ERLAUBNIS_KLASSEN) {
    const state = input.permissionCoverage.find(row => row.permissionClass === permissionClass)?.state ?? 'MISSING'
    add('UK_PERMISSION_NEGATIVE_KNOWLEDGE', 'PERSONAL_CONTEXT', 'CONTEXT_BINDING', state === 'MISSING' ? 'PERMISSION_CLASS_MISSING' : state === 'USER_ASSERTED' ? 'ASSERTION_NOT_OFFICIAL_PROOF' : 'UNREVIEWED_CONTEXT', permissionClass)
  }
  // ETA in the canonical class vocabulary concerns use/satisfaction, not an exemption.
  legal('UK_PERMISSION_NEGATIVE_KNOWLEDGE', 'CLASS_WIDE_ABSENCE_UNPROVEN')
  if (scope.credentialOption.mode !== 'option') add('CREDENTIAL_AND_ROUTE', 'PERSONAL_CONTEXT', 'CONTEXT_BINDING', 'SELECTED_CREDENTIAL_MISSING')
  else if (scope.credentialOption.relatedCitizenshipCountryCode !== 'CH') add('CREDENTIAL_AND_ROUTE', 'PERSONAL_CONTEXT', 'CONTEXT_BINDING', 'CITIZENSHIP_LINK_MISSING')
  if (input.journey === 'UNKNOWN') add('CREDENTIAL_AND_ROUTE', 'PERSONAL_CONTEXT', 'CONTEXT_BINDING', 'JOURNEY_KIND_MISSING')
  for (const reason of ['SAME_REQUEST_CUSTODY_ABSENT', 'ACCEPTED_EVIDENCE_RULE_ABSENT', 'REGISTRY_NOT_ACTIVATED', 'F8_NOT_AUTHORIZED', 'HOSTED_IMPORT_NOT_AUTHORIZED'] as const) add('CUSTODY_AND_GOVERNANCE', 'PLATFORM_PO_GATE', 'ACCEPTANCE_ACTIVATION', reason)
  const coverage = COVERAGE_CASES.map(value => ({ case: value,
    disposition: value === 'BRITISH_IRISH_CITIZENSHIP' || (input.journey === 'INBOUND_DESTINATION' && (value === 'AIRSIDE_TRANSIT' || value === 'LANDSIDE_TRANSIT'))
      ? 'EXCLUDED_BY_EXPLICIT_RESEARCH_SCOPE' as const : value === 'ETA_APPLICATION_AND_USE' || value === 'CROWN_DEPENDENCY_ETA_RECOGNITION' ? 'APPLICATION_USE_ONLY' as const : 'UNRESOLVED' as const }))
  return freeze(packetSchema.parse({ ...BASE, ok: true, status: 'BLOCKED', reason: 'OPAQUE_PUBLISHING_METADATA', observedAt: input.observedAt,
    applicationScenario: input.applicationScenario, scopeAssessment: 'EXPLICIT_CH_GB_RESEARCH_SCOPE_ONLY', sources, gaps,
    questions: QUESTIONS.map(q => ({ id: q.id, status: 'UNRESOLVED', unsatisfiedPredicates: [...q.predicates], references: [...q.anchors] })), coverage }))
}

export function createLegalProofPacket(raw: unknown): LegalProofPacket {
  try {
    // Reuse #857's public descriptor-based bounds/PII/prototype/accessor scanner.
    // Clone only AFTER preflight: prevents getters, rejects nested proxies and isolates mutation.
    if (schema2DatenPruefen(raw)) return refusal('INVALID_INPUT')
    const snapshot: unknown = structuredClone(raw)
    const parsed = inputSchema.safeParse(snapshot)
    if (!parsed.success) return refusal('INVALID_INPUT')
    const input = parsed.data
    if (input.scope === null) return refusal('SCOPE_MISSING', input.observedAt)
    // Canonical validator accepts an optional sourceId; this source-neutral intent does not.
    if (typeof input.scope === 'object' && input.scope && Object.hasOwn(input.scope, 'sourceId')) return refusal('INVALID_SCOPE', input.observedAt)
    const checked = regelScopeAusEvidenceScope(input.scope)
    if (!checked.ok) return refusal('INVALID_SCOPE', input.observedAt)
    const reason = scopeReason(checked.scope, input.journey)
    if (reason) return refusal(reason, input.observedAt)
    // The existing reader may normalize/omit fields from inactive union branches.
    // This intent requires an already canonical scope: never silently discard input.
    if (schema2Kanonisch(input.scope) !== schema2Kanonisch(checked.scope)) return refusal('INVALID_SCOPE', input.observedAt)
    return construct(input, checked.scope)
  } catch { return refusal('INVALID_INPUT') }
}

/** Accepts an intent, never a caller-built packet or an accepted-evidence carrier. */
export function serializeLegalProofIntent(raw: unknown): string {
  return JSON.stringify(createLegalProofPacket(raw), null, 2) + '\n'
}
