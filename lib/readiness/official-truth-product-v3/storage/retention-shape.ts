// S1 retention ONLY. This finite shape excludes URL-bearing official_actions.
// It does not approve methods, registry membership, source facts or context hashes.
import { ISO_3166_1_ALPHA2 } from '@/lib/country/katalog'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'
import { OFFICIAL_VISA_MODES } from '@/lib/readiness/official'
import { REGEL_FAKT_ARTEN } from '@/lib/readiness/rule-claims'
import { provenanceCanonical } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { schema2DatenPruefen, civilDateOrdinalLesen, REISEZWECKE, DOKUMENT_KLASSEN, ZIEL_ERLAUBNIS_KLASSEN,
  NATIONALITAETS_STATUS_KLASSEN, INSTITUTIONS_STATUS, REGULIERUNGS_REGIONEN } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { OFFICIAL_TEMPORAL_ANCHORS, OFFICIAL_TEMPORAL_DUE_SEMANTICS } from '@/lib/readiness/temporal'

export type S1Shape =
  | Readonly<{ ref: string }>
  | Readonly<{ type: 'literal'; value: string | number | boolean | null }>
  | Readonly<{ type: 'enum'; values: readonly string[] }>
  | Readonly<{ type: 'string'; pattern: string; maximum: number }>
  | Readonly<{ type: 'country' | 'date' | 'timestamp' | 'boolean' | 'null' }>
  | Readonly<{ type: 'integer'; minimum: number; maximum: number }>
  | Readonly<{ type: 'object'; properties: Readonly<Record<string, S1Shape>>; optional: readonly string[] }>
  | Readonly<{ type: 'array'; items: S1Shape; minimum: number; maximum: number; unique: boolean }>
  | Readonly<{ type: 'union'; choices: readonly S1Shape[] }>
const ref = (value: string): S1Shape => ({ ref: value })
const lit = (value: string | number | boolean | null): S1Shape => ({ type: 'literal', value })
const enumeration = (values: readonly string[]): S1Shape => ({ type: 'enum', values })
const text = (pattern: string, maximum: number): S1Shape => ({ type: 'string', pattern, maximum })
const integer = (minimum: number, maximum: number): S1Shape => ({ type: 'integer', minimum, maximum })
const object = (properties: Readonly<Record<string, S1Shape>>, optional: readonly string[] = []): S1Shape => ({ type: 'object', properties, optional })
const array = (items: S1Shape, minimum: number, maximum: number, unique = false): S1Shape => ({ type: 'array', items, minimum, maximum, unique })
const union = (...choices: S1Shape[]): S1Shape => ({ type: 'union', choices })
const nullable = (shape: S1Shape) => union({ type: 'null' }, shape)
const mode = (value: string) => object({ mode: lit(value) })
const kind = (value: string, fields: Readonly<Record<string, S1Shape>> = {}, optional: readonly string[] = []) => object({ kind: lit(value), ...fields }, optional)
const id = text('^[a-z][a-z0-9_-]{1,63}$', 64)
const hashRef = (prefix: string) => text(`^${prefix}:[a-f0-9]{64}$`, prefix.length + 65)
const country: S1Shape = { type: 'country' }, bool: S1Shape = { type: 'boolean' }
const supports = array(text('^ev2_[a-f0-9]{32}$', 36), 0, 8)
const compare = enumeration(['at_most', 'at_least'])
const amount = (units: readonly ['days' | 'months' | 'years', number][]) => union(...units.map(([unit, maximum]) => object({ value: integer(1, maximum), unit: lit(unit) })))
const duration = amount([['days', 3660], ['months', 120], ['years', 10]])
const quantity = amount([['days', 3660], ['months', 120]])
const effect = enumeration(['required', 'not_required']), visa = nullable(enumeration(OFFICIAL_VISA_MODES))
const concreteVisa = enumeration(OFFICIAL_VISA_MODES.filter(value => value !== 'unknown'))
const eligibility = enumeration(['allowed', 'not_allowed', 'unknown']), mandate = enumeration(['mandatory', 'not_mandatory', 'unknown'])
const effectOutcome = object({ effect, visaMode: visa })
const visaOutcome = object({ eligibility: enumeration(['allowed', 'not_allowed']), mandate })
const unconditional = (schema: 1 | 2) => object({ schema: lit(schema), kind: lit('unconditional') })
const branches = (schema: 1 | 2, outcome: S1Shape) => object({ schema: lit(schema), kind: lit('branches'), branches: array(object({
  id: text('^[a-z][a-z0-9_]{0,31}$', 32), when: union(kind('otherwise'), kind('expression', { expression: ref(`expression${schema}`) })),
  outcome, supportVersionIds: supports,
}), 1, 8) })
const effectFacts = (schema: 1 | 2) => [
  kind('requirement_effect', { schema: lit(schema), applicability: unconditional(schema), effect, visaMode: visa }),
  kind('requirement_effect', { schema: lit(schema), applicability: branches(schema, effectOutcome) }),
]
const visaFact = (schema: 1 | 2) => kind('visa_options', { schema: lit(schema), options: array(union(
  object({ visaMode: concreteVisa, applicability: unconditional(schema), eligibility, mandate }),
  object({ visaMode: concreteVisa, applicability: branches(schema, visaOutcome) }),
), 1, 4) })
const qualified = (name: string, outcome: S1Shape) => union(
  kind(name, { schema: lit(2), applicability: unconditional(2), outcome }),
  kind(name, { schema: lit(2), applicability: branches(2, outcome) }),
)
const deadline = object({ schema: lit(2), kind: lit('event_deadline'), action: lit('stay_extension_application'),
  reference: object({ event: lit('current_stay_permission_expiry'), countryCode: country }), relation: lit('before'),
  semantics: enumeration(OFFICIAL_TEMPORAL_DUE_SEMANTICS) })
const discretion = enumeration(['fixed', 'may_be_shorter', 'determined_at_border'])
const stayOutcome = object({ perVisit: nullable(quantity), initialGrant: nullable(object({ quantity, event: lit('permission_to_enter_granted') })),
  extension: nullable(object({ requiresApplication: bool, maximumTotal: quantity, applicationDeadline: nullable(deadline),
    authority: nullable(object({ countryCode: country, role: lit('immigration_authority') })) })), borderDiscretion: discretion })
const temporalPoint = (due: boolean) => union(...(['at', 'before', 'after'] as const).map(relation => object({
  anchor: enumeration(OFFICIAL_TEMPORAL_ANCHORS), relation: lit(relation), offsetMinutes: relation === 'at' ? lit(0) : integer(1, 1_051_200),
  ...(due ? { semantics: enumeration(OFFICIAL_TEMPORAL_DUE_SEMANTICS) } : {}),
})))
const legacyPredicates = [
  kind('destination_permission', { destinationCountryCode: country, permissionClass: enumeration(ZIEL_ERLAUBNIS_KLASSEN), validity: lit('valid_on_travel_date') }),
  kind('lawful_residence', { countryCode: country, entitlement: lit('entitled_to_reside'), departure: enumeration(['unrestricted', 'unspecified']) }),
  kind('journey_origin', { place: union(kind('country', { countryCode: country }), kind('region', { regionCode: enumeration(REGULIERUNGS_REGIONEN) })) }),
  kind('age_on_travel_date', { comparison: compare, years: integer(0, 120) }),
  kind('travel_purpose', { purpose: enumeration(REISEZWECKE) }), kind('document_class', { documentClass: enumeration(DOKUMENT_KLASSEN) }),
  ...['issuing_country', 'citizenship_includes', 'credential_citizenship_link'].map(name => kind(name, { countryCode: country })),
  kind('nationality_status', { status: enumeration(NATIONALITAETS_STATUS_KLASSEN) }), kind('institution_status', { status: enumeration(INSTITUTIONS_STATUS) }),
  kind('group_size_at_least', { count: integer(2, 50) }), kind('group_membership', { role: lit('traveller_included') }),
  kind('authority_confirmation', { subject: lit('institution_status') }),
]
const expression = (schema: 1 | 2) => union(
  object({ op: lit('atomic'), predicate: ref(`predicate${schema}`), supportVersionIds: supports }, ['supportVersionIds']),
  object({ op: enumeration(['all', 'any']), operands: array(ref(`expression${schema}`), 1, 8) }),
  object({ op: lit('not'), operand: ref(`expression${schema}`) }),
)
const contextFields = {
  scope: object({ destinationCountryCode: country, transitCountryCode: nullable(country),
    citizenship: object({ mode: lit('required'), countryCodes: array(country, 1, 1) }),
    credentialOption: union(mode('not_applicable'), object({ mode: lit('option'), documentType: enumeration(TRAVELLER_DOCUMENT_TYPES),
      issuingCountryCode: country, relatedCitizenshipCountryCode: nullable(country) })),
    residence: union(mode('not_applicable'), object({ mode: lit('required'), countryCode: country })),
    requirementType: enumeration(OFFICIAL_REQUIREMENT_TYPES), validity: mode('not_applicable'),
  }), route: enumeration(['direct_entry', 'transit', 'unresolved']), conditions: union(
    object({ status: lit('unconditional') }), object({ status: lit('specified'), expression: ref('expression2') }),
    object({ status: lit('unresolved'), missing: array(enumeration(['document_class', 'travel_purpose', 'planned_stay_duration', 'transit', 'other_rule_conditions']), 1, 5, true) }),
  ),
}
const definitions: Record<string, S1Shape> = {
  predicate1: union(...legacyPredicates),
  predicate2: union(...legacyPredicates,
    kind('activity_characteristic', { characteristic: enumeration(['remunerative_activity', 'income_earning_activity', 'profit_making_business_operation', 'business_contacts']) }),
    kind('national_passport_for_citizenship', { countryCode: country }),
    kind('planned_stay_duration', { comparison: enumeration(['at_most', 'more_than']), duration: quantity,
      counting: enumeration(['unspecified', 'calendar_dates_inclusive', 'calendar_dates_exit_exclusive']) })),
  expression1: expression(1), expression2: expression(2),
  // Closed custody shape only. Window ordering and context-key semantics are
  // validated by the canonical V3 reader before normal intake, not this shape.
  context: union(object(contextFields), object({ contextRevision: lit(2), ...contextFields,
    application: object({ purpose: lit('tourism'), tripStartAndEndWindow: object({ from: { type: 'date' }, through: { type: 'date' } }) }),
  })),
  research: object({ key: hashRef('research-request:v1'), ruleScopeKey: hashRef('rule-scope:v1'), factKind: enumeration(REGEL_FAKT_ARTEN),
    researchReason: union(object({ status: lit('missing') }), object({ status: lit('recheck_needed'), reason: enumeration(['valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']) })) }),
  fact1: union(kind('requirement_effect', { effect, visaMode: visa }), ...effectFacts(1),
    kind('visa_options', { options: array(object({ visaMode: concreteVisa, eligibility, mandate }), 1, 4) }), visaFact(1),
    kind('stay_limit', { perVisit: nullable(duration), rollingWindow: nullable(object({ maximum: duration, within: duration })),
      initialGrant: nullable(duration), extension: nullable(object({ requiresApplication: bool, maximumTotal: duration })), borderDiscretion: discretion }),
    kind('passport_validity', { semantics: enumeration(['valid_on_entry', 'valid_through_stay']), duration: { type: 'null' } }, ['duration']),
    kind('passport_validity', { semantics: enumeration(['minimum_remaining_from_entry', 'minimum_remaining_from_planned_departure', 'minimum_remaining_at_application', 'expired_document_exception']), duration }),
    kind('blank_passport_pages', { minimumPages: integer(1, 10) }),
    kind('transit_conditions', { paths: array(object({ crossesBorderControl: nullable(bool), leavesTransitArea: nullable(bool),
      transitAirportCodes: nullable(array(text('^[A-Z]{3}$', 3), 1, 8192)), maxTransitDurationMinutes: nullable(integer(1, 20_160)),
      arrivalMode: nullable(enumeration(['air', 'land', 'sea'])), departureMode: nullable(enumeration(['air', 'land', 'sea'])),
      thirdCountryRequired: nullable(bool), sameFlightRequired: nullable(bool), onwardTicketRequired: nullable(bool),
    }), 1, 8) }),
    kind('temporal_rule', { rule: kind('relative_duration', { availableFrom: nullable(temporalPoint(false)), dueBy: nullable(temporalPoint(true)) }, ['availableFrom', 'dueBy']) })),
  fact2: union(...effectFacts(2), visaFact(2), qualified('stay_limit', stayOutcome), qualified('temporal_rule', deadline)),
  validity: union(object({ status: lit('unresolved') }), object({ status: lit('specified'), validFrom: nullable({ type: 'date' }), validUntil: nullable({ type: 'date' }) })),
  proposal: object({ schema: lit(3), kind: lit('untrusted_research_proposal'), jobId: text('^job3_[a-f0-9]{32}$', 37),
    operationId: text('^op3_[a-f0-9]{32}$', 36), context: ref('context'), contextKey: hashRef('official-truth-context:v3'), research: ref('research'),
    proposedFact: union(object({ schema: lit(1), fact: ref('fact1') }), object({ schema: lit(2), fact: ref('fact2') })),
    references: array(object({ source: object({ sourceId: id, contentItemId: id, representationId: id }),
      claimedRetrievedAt: nullable({ type: 'timestamp' }), claimedValidity: ref('validity') }), 1, 8),
  }),
}
const revision = integer(1, 2_147_483_647), timestamp: S1Shape = { type: 'timestamp' }
const method = object({ methodId: id, revision }), checksum = text('^[a-f0-9]{64}$', 64)
const operationId = text('^op3_[a-f0-9]{32}$', 36), contextKey = hashRef('official-truth-context:v3')
const decisionRef = hashRef('source-decision:v3'), versionRef = hashRef('rule-version:v3'), resolutionRef = hashRef('conflict-resolution:v3')
const evidenceId = text('^ev2_[a-f0-9]{32}$', 36), facts = enumeration(REGEL_FAKT_ARTEN.filter(value => value !== 'official_actions'))
const source = object({ sourceId: id, contentItemId: id, representationId: id })
const fact = union(object({ schema: lit(1), fact: ref('fact1') }), object({ schema: lit(2), fact: ref('fact2') }))
const archivePointer = object({ reference: hashRef('conflict-archive:v3'), revision, totalConflicts: revision })
const commonAttempt = { attemptedAt: timestamp, comparisonRef: hashRef('source-comparison:v3'), observation: ref('observation') }
const escalationReason = enumeration(['primary_unclear', 'comparable_conflict'])
Object.assign(definitions, {
  evidence: object({ versionId: evidenceId, lookupKey: hashRef('evidence-key:v3'),
    source: object({ sourceId: id, contentItemId: id, representationId: id, contentItemVersion: revision,
      representationVersion: revision, identityProfileId: id, identityProfileVersion: revision }),
    sourceFingerprintProtocol: union(lit(1), lit(2)), sourceContentHash: checksum, retrievedAt: timestamp, legalValidity: ref('validity') }),
  observation: object({ context: ref('context'), contextKey, fact, evidence: ref('evidence') }),
  conflict: object({ reference: hashRef('source-conflict:v3'), detectedDecisionRef: decisionRef, detectedAt: timestamp,
    primary: ref('observation'), counter: ref('observation'), resolution: nullable(object({ reference: resolutionRef,
      predecessor: nullable(resolutionRef), conflictRef: hashRef('source-conflict:v3'), method, resolvedAt: timestamp,
      legalAsOfDate: { type: 'date' }, basis: enumeration(['corrected_publication', 'context_distinguished', 'legal_validity_changed']),
      observations: array(ref('observation'), 1, 2) })) }),
  archive: object({ schema: lit(3), kind: lit('resolved_conflict_archive_record'), head: archivePointer,
    predecessor: nullable(archivePointer), contextKey, factKind: facts, fromDecisionRef: decisionRef,
    archivedAt: timestamp, entries: array(ref('conflict'), 1, 8) }),
  decision: object({ schema: lit(3), kind: lit('source_decision_record'), reference: decisionRef, predecessor: nullable(decisionRef),
    method, context: ref('context'), contextKey, factKind: facts, evaluatedAt: timestamp, legalAsOfDate: { type: 'date' },
    primary: union(object({ status: lit('clear'), observation: ref('observation'), qualification: object({
      reference: hashRef('destination-qualification:v3'), representedCountryCode: country,
      role: enumeration(['destination_authority', 'destination_border_police', 'destination_embassy']), method, evidenceVersionId: evidenceId, checkedAt: timestamp,
    }) }), object({ status: lit('unclear'), reason: enumeration(['missing', 'ambiguous_statement', 'unqualified_destination_authority', 'invalid_or_unknown_validity']), evidence: nullable(ref('evidence')) })),
    counterCheck: object({ attemptPlanRevision: revision, attempts: array(union(
      object({ status: lit('not_found'), attemptedAt: timestamp, source: nullable(source) }),
      ...['unreachable', 'unclear', 'not_applicable'].map(status => object({ status: lit(status), attemptedAt: timestamp, source })),
      object({ status: lit('agrees'), ...commonAttempt }), object({ status: lit('compatible'), ...commonAttempt, method, reproof: lit('required_before_acceptance') }),
      object({ status: lit('conflicts'), ...commonAttempt, conflictRef: hashRef('source-conflict:v3') }), object({ status: lit('not_comparable'), ...commonAttempt }),
    ), 1, 8) }), knownConflicts: array(ref('conflict'), 0, 8), historyArchive: nullable(archivePointer),
    conclusion: enumeration(['clear_primary', 'primary_unclear', 'conditions_unresolved', 'comparable_conflict']),
  }),
  version: object({ schema: lit(3), kind: lit('rule_version_record'), reference: versionRef, revision, predecessor: nullable(versionRef),
    state: lit('accepted'), method, subject: ref('observation'), sourceDecisionRef: decisionRef, operationId, recordedAt: timestamp }),
  transition: object({ schema: lit(3), protocolRevision: lit(1), operationId, contextKey, method, factKind: facts,
    action: enumeration(['accept', 'reaccept']),
    expected: object({ revision: integer(0, 2_147_483_646), state: enumeration(['missing', 'accepted', 'withdrawn', 'conflicted']), versionRef: nullable(versionRef) }),
    next: object({ revision, state: lit('accepted'), versionRef }), primaryEvidenceVersionId: evidenceId, sourceDecisionRef: decisionRef,
    resolutionRefs: array(resolutionRef, 0, 8, true), recoverFromVersionRef: { type: 'null' },
    invalidatedProjectionRefs: array(hashRef('rule-projection:v3'), 0, 64, true), reproof: lit('required_before_commit'), commitConfirmation: lit('required'),
  }),
  outcome: union(object({ status: lit('prepared'), value: object({ proposalDigest: checksum, decision: ref('decision'),
    previousDecision: nullable(ref('decision')), archiveAppend: nullable(ref('archive')), version: ref('version'), transition: ref('transition'),
    proposalDisposition: enumeration(['matched', 'superseded_by_source']), acceptance: lit('not_committed'), reproof: lit('required_before_commit'),
  }) }), object({ status: lit('escalation'), key: hashRef('source-escalation:v3'), reason: escalationReason, decision: ref('decision'),
    previousDecision: nullable(ref('decision')), archiveAppend: nullable(ref('archive')) }),
  object({ status: lit('quarantined'), reason: enumeration(['conditions_unresolved', 'invalid_verification', 'history_changed', 'method_not_current']) }),
  object({ status: lit('unavailable'), reason: enumeration(['method_not_approved', 'method_unavailable', 'verification_unavailable', 'history_unavailable', 'aborted', 'temporary_failure']) })),
  audit: object({ schema: lit(3), kind: lit('import_attempt_record'), operationId, proposalDigest: checksum,
    jobId: text('^job3_[a-f0-9]{32}$', 37), contextKey, method, recordedAt: timestamp,
    result: enumeration(['prepared', 'escalation', 'quarantined', 'unavailable']), decisionRef: nullable(decisionRef), escalationKey: nullable(hashRef('source-escalation:v3')) }),
} satisfies Record<string, S1Shape>)
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value) }
  return value
}
/** Embedded in SQL by a reviewed source generator; never supplied by the caller. */
export const S1_RETENTION_SHAPE = freeze({ revision: 2, root: 'proposal', countries: [...ISO_3166_1_ALPHA2], definitions })

/** Mandatory before ORIGINAL retention, in addition to the canonical S0 parser. */
export function s1RetentionShapeAllows(input: unknown, root: 'proposal' | 'outcome' | 'audit' = 'proposal'): boolean {
  if (root === 'proposal' ? schema2DatenPruefen(input) : provenanceCanonical(input, root === 'audit' ? 8192 : 524_288) === null) return false
  const match = (value: unknown, shape: S1Shape, depth: number): boolean => {
    if (depth > (root === 'proposal' ? 16 : 24)) return false
    if ('ref' in shape) return !!definitions[shape.ref] && match(value, definitions[shape.ref]!, depth)
    switch (shape.type) {
      case 'literal': return value === shape.value
      case 'enum': return typeof value === 'string' && shape.values.includes(value)
      case 'null': return value === null
      case 'boolean': return typeof value === 'boolean'
      case 'integer': return typeof value === 'number' && Number.isInteger(value) && value >= shape.minimum && value <= shape.maximum
      case 'string': return typeof value === 'string' && value.length <= shape.maximum && new RegExp(shape.pattern).exec(value)?.[0] === value
      case 'country': return typeof value === 'string' && value.length <= 8 && S1_RETENTION_SHAPE.countries.includes(value.trim().toUpperCase() as typeof ISO_3166_1_ALPHA2[number])
      case 'date': return civilDateOrdinalLesen(value) !== null
      case 'timestamp': return typeof value === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value)
        && civilDateOrdinalLesen(value.slice(0, 10)) !== null && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
      case 'union': return shape.choices.some(choice => match(value, choice, depth))
      case 'array': return Array.isArray(value) && value.length >= shape.minimum && value.length <= shape.maximum
        && (!shape.unique || new Set(value.map(item => JSON.stringify(item))).size === value.length)
        && value.every(item => match(item, shape.items, depth + 1))
      case 'object': {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
        const row = value as Record<string, unknown>
        return Object.keys(row).every(key => Object.hasOwn(shape.properties, key))
          && Object.entries(shape.properties).every(([key, child]) => Object.hasOwn(row, key) ? match(row[key], child, depth + 1) : shape.optional.includes(key))
      }
    }
  }
  try { return match(input, ref(root), 0) } catch { return false }
}
