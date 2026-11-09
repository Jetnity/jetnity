// Dormant V3 wire contracts. Reading a record proves its shape and internal
// bindings only: never origin, acceptance, authority, current custody or a receipt.
// No database, fetch, provider, scheduler, production registry or runtime wiring.
import { z } from 'zod'
import { istKatalogLand } from '@/lib/country/katalog'
import { landescodeLesen } from '@/lib/readiness/domain'
import { sha256Hex } from '@/lib/readiness/digest'
import {
  contentEvidenceLookupV3,
  contentIdentityMatches,
  contentRepresentationFromRegistry,
  readContentIdentityBinding,
  readRepresentationRef,
  type ContentIdentityBinding,
  type RepresentationRef,
} from '@/lib/readiness/official-truth-content-identity'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
} from '@/lib/readiness/official-truth-research-request'
import {
  civilDateOrdinalLesen,
  regulierungsAusdruckV2Lesen,
  regulierungsAusdruckV2StrukturSchluessel,
  schema2DatenPruefen,
  schema2Kanonisch,
  type RegulierungsAusdruckV2,
} from '@/lib/readiness/regulierungs-anwendbarkeit'
import {
  REGEL_FAKT_ARTEN,
  regelFaktKanonischLesen,
  regelScopeAusEvidenceScope,
  type RegelFakt,
  type RegelFaktV2,
} from '@/lib/readiness/rule-claims'
import { quellenUrlAufloesen, type QuellenRegistry } from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'

const OFFICIAL_TRUTH_V3_SCHEMA = 3 as const
/** Technical input bounds, not an approved operating method or freshness SLO. */
export const OFFICIAL_TRUTH_V3_LIMITS = Object.freeze({
  citizenships: 5,
  sourceReferences: 8,
  crossChecks: 8,
  conflicts: 8,
  resultsPerCitizenship: 16,
  payloadBytes: 65_536,
  payloadDepth: 16,
  payloadNodes: 8192,
  jobAttempts: 16,
  leaseMilliseconds: 900_000,
})

export type V3ContractFailure =
  | 'invalid_data' | 'bound_exceeded' | 'personal_data_forbidden'
  | 'unexpected_fields' | 'invalid_contract' | 'reference_mismatch'
export type V3ReadResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: V3ContractFailure }>
type Schema<T> = z.ZodType<T, z.ZodTypeDef, unknown>

const EXTRA_PRIVATE_KEYS = new Set([
  'sessionid', 'sessionkey', 'visitorid', 'ipaddress', 'passportphoto', 'documentphoto',
  'photo', 'image', 'file', 'rawtext', 'rawhtml', 'screenshot', 'address', 'streetaddress',
  'firstname', 'lastname', 'fullname', 'name', 'email', 'phone', 'passportnumber',
  'documentnumber', 'mrz', 'userid', 'accountid', 'tripid', 'travellerid', 'dateofbirth',
  'dob', 'biometrics', 'note', 'notes', 'comment', 'freetext',
])

function privateKeyPresent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(privateKeyPresent)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) =>
    EXTRA_PRIVATE_KEYS.has(key.replaceAll('_', '').toLowerCase()) || privateKeyPresent(child))
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(context: z.RefinementCtx): void {
  context.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid_contract' })
}

/** Preflight precedes field reads; no getters, exotic objects, cycles or huge JSON. */
function read<T>(value: unknown, schema: Schema<T>): V3ReadResult<T> {
  const preflight = schema2DatenPruefen(value)
  if (preflight) return Object.freeze({ ok: false, reason:
    preflight === 'bound_exceeded' ? 'bound_exceeded'
      : preflight === 'personal_identifier_forbidden' ? 'personal_data_forbidden' : 'invalid_data' })
  try {
    if (privateKeyPresent(value)) return Object.freeze({ ok: false, reason: 'personal_data_forbidden' })
    // Safe after the shared bounded-data preflight. Detach before any parser or
    // deep freeze: a caller cannot mutate a record, and its input is not frozen.
    const detached: unknown = JSON.parse(JSON.stringify(value))
    const parsed = schema.safeParse(detached)
    if (!parsed.success) return Object.freeze({ ok: false, reason:
      parsed.error.issues.some((issue) => issue.code === 'unrecognized_keys')
        ? 'unexpected_fields' : 'invalid_contract' })
    return freeze({ ok: true, value: parsed.data })
  } catch {
    return Object.freeze({ ok: false, reason: 'invalid_data' })
  }
}

function external<T>(reader: (value: unknown) => T | null): Schema<T> {
  return z.unknown().transform((value, context) => {
    const result = reader(value)
    if (result === null) { invalid(context); return z.NEVER }
    return result
  })
}

const countrySchema = z.string().max(8).transform((value, context) => {
  const code = landescodeLesen(value)
  if (code === null || !istKatalogLand(code)) { invalid(context); return z.NEVER }
  return code
})
const idSchema = z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/)
const revisionSchema = z.number().int().min(1).max(2_147_483_647)
const operationIdSchema = z.string().regex(/^op3_[a-f0-9]{32}$/)
const jobIdSchema = z.string().regex(/^job3_[a-f0-9]{32}$/)
const evidenceIdSchema = z.string().regex(/^ev2_[a-f0-9]{32}$/)
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/)
const reference = (prefix: string) => z.string().regex(new RegExp(`^${prefix}:[a-f0-9]{64}$`))
const contextKeySchema = reference('official-truth-context:v3')
const ruleScopeKeySchema = reference('rule-scope:v1')
const decisionRefSchema = reference('source-decision:v3')
const conflictRefSchema = reference('source-conflict:v3')
const resolutionRefSchema = reference('conflict-resolution:v3')
const archiveRefSchema = reference('conflict-archive:v3')
const versionRefSchema = reference('rule-version:v3')
const projectionRefSchema = reference('rule-projection:v3')
const jobKeySchema = reference('research-job:v3')
const discoveryJobKeySchema = reference('combination-discovery-job:v3')

const dateSchema = z.string().refine((value) => civilDateOrdinalLesen(value) !== null)
const timestampSchema = z.string().refine((value) => {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value)) return false
  if (civilDateOrdinalLesen(value.slice(0, 10)) === null) return false
  const ms = Date.parse(value)
  return Number.isFinite(ms) && new Date(ms).toISOString() === value
})

const visitorSchema = z.object({
  destinationCountryCode: countrySchema,
  citizenshipCountryCodes: z.array(countrySchema).min(1).max(OFFICIAL_TRUTH_V3_LIMITS.citizenships)
    .transform((values) => [...new Set(values)].sort()),
}).strict()
export type V3VisitorInput = z.infer<typeof visitorSchema>
export function readV3VisitorInput(value: unknown): V3ReadResult<V3VisitorInput> {
  return read(value, visitorSchema)
}

const credentialSchema = z.union([
  z.object({ mode: z.literal('not_applicable') }).strict(),
  z.object({
    mode: z.literal('option'), documentType: z.enum(TRAVELLER_DOCUMENT_TYPES),
    issuingCountryCode: countrySchema, relatedCitizenshipCountryCode: countrySchema.nullable(),
  }).strict(),
])
const scopeSchema = z.object({
  destinationCountryCode: countrySchema,
  transitCountryCode: countrySchema.nullable(),
  citizenship: z.object({ mode: z.literal('required'), countryCodes: z.array(countrySchema).length(1) }).strict(),
  credentialOption: credentialSchema,
  residence: z.union([
    z.object({ mode: z.literal('not_applicable') }).strict(),
    z.object({ mode: z.literal('required'), countryCode: countrySchema }).strict(),
  ]),
  requirementType: z.enum(OFFICIAL_REQUIREMENT_TYPES),
  // Legal date ranges live on evidence. No visitor's travel date is collected.
  validity: z.object({ mode: z.literal('not_applicable') }).strict(),
}).strict().superRefine((scope, context) => {
  if (!regelScopeAusEvidenceScope(scope).ok) invalid(context)
  const option = scope.credentialOption
  if (option.mode === 'option' && option.relatedCitizenshipCountryCode !== null
    && option.relatedCitizenshipCountryCode !== scope.citizenship.countryCodes[0]) invalid(context)
})

function countriesInConditionsValid(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(countriesInConditionsValid)
  if (!value || typeof value !== 'object') return true
  return Object.entries(value).every(([key, child]) => {
    if (key === 'countryCode' || key.endsWith('CountryCode')) {
      return child === null || (typeof child === 'string' && istKatalogLand(child))
    }
    return countriesInConditionsValid(child)
  })
}

const expressionSchema = external<RegulierungsAusdruckV2>((value) => {
  const result = regulierungsAusdruckV2Lesen(value)
  return result.ok && countriesInConditionsValid(result.wert) ? result.wert : null
})
const missingConditionSchema = z.enum([
  'document_class', 'travel_purpose', 'planned_stay_duration', 'transit', 'other_rule_conditions',
])
const conditionsSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('specified'), expression: expressionSchema }).strict(),
  z.object({ status: z.literal('unconditional') }).strict(),
  z.object({ status: z.literal('unresolved'), missing: z.array(missingConditionSchema).min(1).max(5)
    .refine((items) => new Set(items).size === items.length).transform((items) => items.sort()) }).strict(),
])
const contextSchema = z.object({
  scope: scopeSchema,
  route: z.enum(['direct_entry', 'transit', 'unresolved']),
  conditions: conditionsSchema,
}).strict().superRefine((value, context) => {
  if (value.route === 'direct_entry' && value.scope.transitCountryCode !== null) invalid(context)
  if (value.route === 'transit' && value.scope.transitCountryCode === null) invalid(context)
})
export type V3GlobalRuleContext = z.infer<typeof contextSchema>
export function readV3GlobalRuleContext(value: unknown): V3ReadResult<V3GlobalRuleContext> {
  return read(value, contextSchema)
}

function contextIdentity(value: V3GlobalRuleContext): { contextKey: string; ruleScopeKey: string } {
  const scope = regelScopeAusEvidenceScope(value.scope)
  if (!scope.ok) throw new Error('invalid_contract')
  const conditions = value.conditions.status === 'specified'
    ? { status: 'specified', expression: regulierungsAusdruckV2StrukturSchluessel(value.conditions.expression) }
    : value.conditions
  return {
    ruleScopeKey: scope.key,
    contextKey: `official-truth-context:v3:${sha256Hex(schema2Kanonisch({ scope: scope.scope, route: value.route, conditions }))}`,
  }
}

function contextResolved(value: V3GlobalRuleContext): boolean {
  const option = value.scope.credentialOption
  return value.route !== 'unresolved' && value.conditions.status !== 'unresolved'
    && (option.mode === 'not_applicable' || (option.documentType !== 'unknown'
      && option.relatedCitizenshipCountryCode === value.scope.citizenship.countryCodes[0]))
}

const methodRefSchema = z.object({ methodId: idSchema, revision: revisionSchema }).strict()
export type V3MethodRef = z.infer<typeof methodRefSchema>
const researchReasonSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('missing') }).strict(),
  z.object({ status: z.literal('recheck_needed'), reason: z.enum([
    'valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded',
  ]) }).strict(),
])
const researchIdentitySchema = z.object({
  key: reference('research-request:v1'), ruleScopeKey: ruleScopeKeySchema,
  factKind: z.enum(REGEL_FAKT_ARTEN), researchReason: researchReasonSchema,
}).strict()
export type V3ResearchIdentity = Pick<OfficialTruthRechercheAnfrage, 'key' | 'ruleScopeKey' | 'factKind' | 'researchReason'>

const workInputSchema = z.object({
  context: contextSchema, method: methodRefSchema,
  factKind: z.enum(REGEL_FAKT_ARTEN), researchReason: researchReasonSchema,
}).strict()
function workIdentity(value: z.infer<typeof workInputSchema>) {
  const identity = contextIdentity(value.context)
  const result = officialTruthRechercheEntscheiden({
    ...value.researchReason, ruleScopeKey: identity.ruleScopeKey, factKind: value.factKind,
  }, value.context.scope)
  if (result.action !== 'research') throw new Error('invalid_contract')
  const { key, ruleScopeKey, factKind, researchReason } = result.request
  const research: V3ResearchIdentity = { key, ruleScopeKey, factKind, researchReason }
  return {
    ...identity, research,
    // Missing/recheck/individual visitors and operation IDs deliberately do not
    // create parallel active jobs for the same context, fact and method.
    jobKey: `research-job:v3:${sha256Hex(schema2Kanonisch({ contextKey: identity.contextKey, method: value.method, factKind }))}`,
  }
}
export type V3WorkIdentity = ReturnType<typeof workIdentity>
/** Identity/checksum only; no request is enqueued and no authority is issued. */
export function createV3WorkIdentity(value: unknown): V3ReadResult<V3WorkIdentity> {
  return read(value, workInputSchema.transform(workIdentity))
}

const combinationDiscoveryInputSchema = z.object({
  destinationCountryCode: countrySchema, citizenshipCountryCode: countrySchema, method: methodRefSchema,
}).strict()
function combinationDiscoveryIdentity(value: z.infer<typeof combinationDiscoveryInputSchema>) {
  return {
    kind: 'combination_discovery' as const, ...value,
    jobKey: `combination-discovery-job:v3:${sha256Hex(schema2Kanonisch(value))}`,
  }
}
const combinationDiscoveryIdentitySchema = combinationDiscoveryInputSchema.extend({
  kind: z.literal('combination_discovery'), jobKey: discoveryJobKeySchema,
}).strict().superRefine((value, context) => {
  const { destinationCountryCode, citizenshipCountryCode, method } = value
  if (combinationDiscoveryIdentity({ destinationCountryCode, citizenshipCountryCode, method }).jobKey !== value.jobKey) invalid(context)
})
export type V3CombinationDiscoveryIdentity = z.infer<typeof combinationDiscoveryIdentitySchema>
/** Neutral pair/method identity only: no RuleContext, enqueue or discovered rule. */
export function createV3CombinationDiscoveryIdentity(value: unknown): V3ReadResult<V3CombinationDiscoveryIdentity> {
  return read(value, combinationDiscoveryInputSchema.transform(combinationDiscoveryIdentity))
}

const representationSchema = external<RepresentationRef>((value) => {
  const result = readRepresentationRef(value)
  return result.ok ? result.value : null
})
const contentBindingSchema = external<ContentIdentityBinding>((value) => {
  const result = readContentIdentityBinding(value)
  return result.ok ? result.value : null
})
const validitySchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('specified'), validFrom: dateSchema.nullable(), validUntil: dateSchema.nullable() }).strict(),
  z.object({ status: z.literal('unresolved') }).strict(),
]).superRefine((value, context) => {
  if (value.status === 'specified' && value.validFrom !== null && value.validUntil !== null
    && value.validFrom > value.validUntil) invalid(context)
})
export type V3LegalValidity = z.infer<typeof validitySchema>
function validityContains(value: V3LegalValidity, day: string): boolean {
  return value.status === 'specified' && (value.validFrom === null || value.validFrom <= day)
    && (value.validUntil === null || value.validUntil >= day)
}
function validityOverlaps(a: V3LegalValidity, b: V3LegalValidity): boolean {
  return a.status === 'specified' && b.status === 'specified'
    && (a.validFrom === null || b.validUntil === null || a.validFrom <= b.validUntil)
    && (b.validFrom === null || a.validUntil === null || b.validFrom <= a.validUntil)
}

const rawFactSchema = z.object({ schema: z.union([z.literal(1), z.literal(2)]), fact: z.unknown() }).strict()
export type V3RuleFact = { schema: 1; fact: RegelFakt } | { schema: 2; fact: RegelFaktV2 }
function factRead(value: z.infer<typeof rawFactSchema>, context: V3GlobalRuleContext, registry: QuellenRegistry): V3RuleFact | null {
  const candidate = value.fact
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null
  const kind = z.enum(REGEL_FAKT_ARTEN).safeParse(Reflect.get(candidate, 'kind'))
  if (!kind.success) return null
  if (value.schema === 2) {
    const result = regelFaktKanonischLesen(kind.data, context.scope.requirementType, candidate, registry,
      { schema: 2, jurisdictionCountryCode: context.scope.destinationCountryCode })
    return result.ok && countriesInConditionsValid(result.fact) ? { schema: 2, fact: result.fact } : null
  }
  const result = regelFaktKanonischLesen(kind.data, context.scope.requirementType, candidate, registry)
  if (!result.ok || !countriesInConditionsValid(result.fact)) return null
  // An official host alone must not turn an arbitrary personal URL path/query
  // into a retained global action. Only exact registered publication URLs pass.
  if (result.fact.kind === 'official_actions' && result.fact.actions.some((action) => {
    const url = quellenUrlAufloesen(registry, action.href)
    return !url.ok || !registry.contentIdentity?.representations.some((representation) =>
      representation.sourceId === action.actionSourceId && representation.current
      && (representation.expectedFinalUrl === action.href || representation.requestUrls.includes(action.href)))
  })) return null
  return { schema: 1, fact: result.fact }
}

function same(a: unknown, b: unknown): boolean { return schema2Kanonisch(a) === schema2Kanonisch(b) }
function registeredOfficial(registry: QuellenRegistry, sourceId: string): boolean {
  return registry.sources.filter((source) => source.sourceId === sourceId && source.sourceClass === 'official_authority').length === 1
}
function researchMatches(context: V3GlobalRuleContext, research: V3ResearchIdentity): boolean {
  const identity = contextIdentity(context)
  const result = officialTruthRechercheEntscheiden({
    ...research.researchReason, ruleScopeKey: identity.ruleScopeKey, factKind: research.factKind,
  }, context.scope)
  return result.action === 'research' && research.key === result.request.key && research.ruleScopeKey === identity.ruleScopeKey
}

function proposalSchema(registry: QuellenRegistry) {
  return z.object({
    schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('untrusted_research_proposal'),
    jobId: jobIdSchema, operationId: operationIdSchema,
    context: contextSchema, contextKey: contextKeySchema, research: researchIdentitySchema,
    proposedFact: rawFactSchema,
    references: z.array(z.object({ source: representationSchema,
      claimedRetrievedAt: timestampSchema.nullable(), claimedValidity: validitySchema }).strict())
      .min(1).max(OFFICIAL_TRUTH_V3_LIMITS.sourceReferences),
  }).strict().transform((value, context) => {
    const fact = factRead(value.proposedFact, value.context, registry)
    if (!fact || fact.fact.kind !== value.research.factKind
      || value.contextKey !== contextIdentity(value.context).contextKey
      || !researchMatches(value.context, value.research)
      || new Set(value.references.map((item) => schema2Kanonisch(item.source))).size !== value.references.length
      || value.references.some((item) => !registeredOfficial(registry, item.source.sourceId))) {
      invalid(context); return z.NEVER
    }
    return { ...value, proposedFact: fact }
  })
}
export type V3ResearchProposal = z.infer<ReturnType<typeof proposalSchema>>
/** Remains untrusted even after successful parsing. No acceptance call here. */
export function readV3ResearchProposal(value: unknown, registry: QuellenRegistry): V3ReadResult<V3ResearchProposal> {
  return read(value, proposalSchema(registry))
}

const methodSchema = z.object({
  schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), method: methodRefSchema, predecessor: methodRefSchema.nullable(),
  status: z.enum(['DRAFT', 'NOT_APPROVED']), createdAt: timestampSchema,
  primaryPolicy: z.literal('one_clear_qualified_destination_primary'),
  counterCheckPolicy: z.literal('when_available'),
  conflictPolicy: z.literal('positive_method_valid_resolution'),
  operatingProposal: z.object({
    primaryMaxAgeSeconds: z.number().int().min(1).max(604_800),
    checkIntervalSeconds: z.number().int().min(1).max(604_800),
    optionalAttemptLimit: z.number().int().min(1).max(OFFICIAL_TRUTH_V3_LIMITS.crossChecks),
    optionalTimeBudgetMilliseconds: z.number().int().min(1).max(120_000),
    attemptPlanRevision: revisionSchema,
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.predecessor && (value.predecessor.methodId !== value.method.methodId
    || value.predecessor.revision + 1 !== value.method.revision)) invalid(context)
  if (value.predecessor === null && value.method.revision !== 1) invalid(context)
})
export type V3MethodRevisionDraft = z.infer<typeof methodSchema>
export function readV3MethodRevisionDraft(value: unknown): V3ReadResult<V3MethodRevisionDraft> {
  return read(value, methodSchema)
}

/**
 * The adapter owns the receipt type/custody. It must resolve actual approval and
 * reprove it at commit; JSON readers cannot construct or authenticate Receipt.
 * A bound code-owned adapter is itself a later reviewed authority boundary.
 */
export interface V3MethodAuthorityPort<Receipt extends object> {
  resolveCurrent(method: V3MethodRef, checkedAt: string): Promise<
    { status: 'approved'; receipt: Receipt } | { status: 'not_approved' | 'unavailable' }>
  reproveAtCommit(receipt: Receipt, method: V3MethodRef, checkedAt: string): Promise<
    { status: 'current' } | { status: 'revoked' | 'expired' | 'unavailable' }>
}
/** These are closed seams, not a configurable production enablement switch. */
export const OFFICIAL_TRUTH_V3_BINDINGS = Object.freeze({
  methodStatus: 'NOT_APPROVED', methodAuthority: null, sourceQualification: null,
  acceptedStore: null, conflictArchive: null, publicProjection: null, research: null, scheduler: null,
} as const)

const evidenceReferenceSchema = z.object({
  versionId: evidenceIdSchema,
  lookupKey: reference('evidence-key:v3'),
  source: contentBindingSchema,
  sourceFingerprintProtocol: z.union([z.literal(1), z.literal(2)]),
  sourceContentHash: checksumSchema,
  retrievedAt: timestampSchema,
  legalValidity: validitySchema,
}).strict()
/** A reference into existing evidence custody; not a reconstructed EvidenceVersion. */
export type V3EvidenceReference = z.infer<typeof evidenceReferenceSchema>

function supportIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(supportIds)
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) =>
    key === 'supportVersionIds' && Array.isArray(child)
      ? child.filter((id): id is string => typeof id === 'string') : supportIds(child))
}
function withoutSupport(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSupport)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'supportVersionIds')
    .map(([key, child]) => [key, withoutSupport(child)]))
}
function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}
/** Only encoding-equivalent unconditional wrappers are erased, not conditions. */
function semanticFact(value: V3RuleFact): unknown {
  const fact = asRecord(withoutSupport(value.fact))!
  function unconditional(record: Record<string, unknown>): Record<string, unknown> {
    const applicability = asRecord(record.applicability)
    if (applicability?.kind !== 'unconditional') return record
    const { schema: _schema, applicability: _applicability, ...outcome } = record
    // These fields have no legal content in the existing unconditional form.
    void _schema; void _applicability
    return outcome
  }
  if (fact.kind === 'requirement_effect') return unconditional(fact)
  if (fact.kind === 'visa_options' && Array.isArray(fact.options)) {
    const { schema: _schema, ...rest } = fact
    void _schema
    return { ...rest, options: fact.options.map((item) => unconditional(asRecord(item)!)) }
  }
  return fact
}
/**
 * Narrow structural safeguards, not a legal comparison engine. Unclassified
 * differences need a method-bound compatible/conflicting comparison record.
 */
function factRelation(a: V3RuleFact, b: V3RuleFact): 'equal' | 'compatible' | 'incompatible' | 'unclassified' {
  const left = asRecord(semanticFact(a))!, right = asRecord(semanticFact(b))!
  if (same(left, right)) return 'equal'
  if (left.kind === 'requirement_effect' && right.kind === left.kind
    && ['required', 'not_required'].includes(String(left.effect))
    && ['required', 'not_required'].includes(String(right.effect)) && left.effect !== right.effect) return 'incompatible'
  if (left.kind === 'blank_passport_pages' && right.kind === left.kind) return 'incompatible'
  if (left.kind !== 'visa_options' || right.kind !== left.kind || !Array.isArray(left.options) || !Array.isArray(right.options)) return 'unclassified'
  const l = left.options.map(asRecord), r = right.options.map(asRecord)
  if (l.some((item) => !item || 'applicability' in item) || r.some((item) => !item || 'applicability' in item)) return 'unclassified'
  const leftOptions = l.filter((item): item is Record<string, unknown> => item !== null)
  const rightOptions = r.filter((item): item is Record<string, unknown> => item !== null)
  const shared = leftOptions.flatMap((item) => rightOptions.filter((other) => other.visaMode === item.visaMode).map((other) => [item, other] as const))
  if (shared.some(([x, y]) => (x.eligibility === 'allowed' && y.eligibility === 'not_allowed')
    || (x.eligibility === 'not_allowed' && y.eligibility === 'allowed')
    || (x.mandate === 'mandatory' && y.mandate === 'not_mandatory')
    || (x.mandate === 'not_mandatory' && y.mandate === 'mandatory'))) return 'incompatible'
  const additions = [...leftOptions.filter((item) => !rightOptions.some((other) => other.visaMode === item.visaMode)),
    ...rightOptions.filter((item) => !leftOptions.some((other) => other.visaMode === item.visaMode))]
  return shared.length > 0 && shared.every(([x, y]) => same(x, y)) && additions.length > 0
    && additions.every((item) => item.eligibility === 'allowed' && item.mandate === 'not_mandatory') ? 'compatible' : 'unclassified'
}

function observationSchema(registry: QuellenRegistry) {
  return z.object({
    context: contextSchema, contextKey: contextKeySchema,
    fact: rawFactSchema, evidence: evidenceReferenceSchema,
  }).strict().transform((value, context) => {
    const fact = factRead(value.fact, value.context, registry)
    const { sourceId, contentItemId, representationId } = value.evidence.source
    const lookup = contentEvidenceLookupV3(value.context.scope, { sourceId, contentItemId, representationId })
    if (!fact || value.contextKey !== contextIdentity(value.context).contextKey
      || !lookup.ok || lookup.value.key !== value.evidence.lookupKey
      || !registeredOfficial(registry, value.evidence.source.sourceId)
      || supportIds([value.context.conditions, fact]).some((id) => id !== value.evidence.versionId)) {
      invalid(context); return z.NEVER
    }
    return { ...value, fact }
  })
}
export type V3SourceObservationRecord = z.infer<ReturnType<typeof observationSchema>>

function independent(a: V3SourceObservationRecord, b: V3SourceObservationRecord): boolean {
  return a.evidence.source.sourceId !== b.evidence.source.sourceId
    || a.evidence.source.contentItemId !== b.evidence.source.contentItemId
}
function comparable(a: V3SourceObservationRecord, b: V3SourceObservationRecord): boolean {
  return a.contextKey === b.contextKey && contextResolved(a.context) && contextResolved(b.context)
    && a.fact.fact.kind === b.fact.fact.kind
    && validityOverlaps(a.evidence.legalValidity, b.evidence.legalValidity)
}

function conflictSchema(registry: QuellenRegistry) {
  const observation = observationSchema(registry)
  const resolution = z.object({
    reference: resolutionRefSchema, predecessor: resolutionRefSchema.nullable(), conflictRef: conflictRefSchema, method: methodRefSchema,
    resolvedAt: timestampSchema, legalAsOfDate: dateSchema,
    basis: z.enum(['corrected_publication', 'context_distinguished', 'legal_validity_changed']),
    observations: z.array(observation).min(1).max(2),
  }).strict()
  return z.object({
    reference: conflictRefSchema, detectedDecisionRef: decisionRefSchema, detectedAt: timestampSchema,
    primary: observation, counter: observation, resolution: resolution.nullable(),
  }).strict().superRefine((conflict, context) => {
    const relation = factRelation(conflict.primary.fact, conflict.counter.fact)
    if (!independent(conflict.primary, conflict.counter) || !comparable(conflict.primary, conflict.counter)
      || relation === 'equal' || relation === 'compatible'
      || conflict.primary.evidence.retrievedAt > conflict.detectedAt
      || conflict.counter.evidence.retrievedAt > conflict.detectedAt) invalid(context)
    const resolved = conflict.resolution
    if (!resolved) return
    if (resolved.reference === resolved.predecessor || resolved.conflictRef !== conflict.reference
      || resolved.resolvedAt < conflict.detectedAt
      || resolved.observations.some((item) => item.fact.fact.kind !== conflict.primary.fact.fact.kind
        || item.evidence.retrievedAt < conflict.detectedAt || item.evidence.retrievedAt > resolved.resolvedAt
        // Historical proof is evaluated on its own legal date. It is not an
        // optional source that must stay applicable to every later decision.
        || (resolved.basis !== 'legal_validity_changed' && !validityContains(item.evidence.legalValidity, resolved.legalAsOfDate)))
      || !resolved.observations.some((item) => [conflict.primary, conflict.counter].some((old) =>
        item.evidence.source.sourceId === old.evidence.source.sourceId
        && item.evidence.source.contentItemId === old.evidence.source.contentItemId
        && item.evidence.versionId !== old.evidence.versionId))) invalid(context)
  })
}

const archivePointerSchema = z.object({
  reference: archiveRefSchema, revision: revisionSchema,
  totalConflicts: z.number().int().min(1).max(2_147_483_647),
}).strict()
export type V3ConflictArchivePointer = z.infer<typeof archivePointerSchema>
function archiveSchema(registry: QuellenRegistry) {
  return z.object({
    schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('resolved_conflict_archive_record'),
    head: archivePointerSchema, predecessor: archivePointerSchema.nullable(),
    contextKey: contextKeySchema, factKind: z.enum(REGEL_FAKT_ARTEN),
    fromDecisionRef: decisionRefSchema, archivedAt: timestampSchema,
    entries: z.array(conflictSchema(registry)).min(1).max(OFFICIAL_TRUTH_V3_LIMITS.conflicts),
  }).strict().superRefine((value, context) => {
    if (value.head.reference === value.predecessor?.reference
      || value.head.revision !== (value.predecessor?.revision ?? 0) + 1
      || value.head.totalConflicts !== (value.predecessor?.totalConflicts ?? 0) + value.entries.length
      || new Set(value.entries.map((entry) => entry.reference)).size !== value.entries.length
      || value.entries.some((entry) => entry.primary.contextKey !== value.contextKey
        || entry.primary.fact.fact.kind !== value.factKind || entry.resolution === null
        || entry.resolution.resolvedAt > value.archivedAt)) invalid(context)
  })
}
export type V3ConflictArchiveRecord = z.infer<ReturnType<typeof archiveSchema>>
/** Bounded append page, not deletion or an authenticated archive receipt. */
export function readV3ConflictArchiveRecord(value: unknown, registry: QuellenRegistry): V3ReadResult<V3ConflictArchiveRecord> {
  return read(value, archiveSchema(registry))
}

function sourceDecisionSchema(registry: QuellenRegistry) {
  const observation = observationSchema(registry)
  const qualification = z.object({
    reference: reference('destination-qualification:v3'),
    representedCountryCode: countrySchema,
    role: z.enum(['destination_authority', 'destination_border_police', 'destination_embassy']),
    method: methodRefSchema, evidenceVersionId: evidenceIdSchema, checkedAt: timestampSchema,
  }).strict()
  const primary = z.discriminatedUnion('status', [
    z.object({ status: z.literal('clear'), observation, qualification }).strict(),
    z.object({ status: z.literal('unclear'), reason: z.enum([
      'missing', 'ambiguous_statement', 'unqualified_destination_authority', 'invalid_or_unknown_validity',
    ]), evidence: evidenceReferenceSchema.nullable() }).strict(),
  ])
  const attempt = z.discriminatedUnion('status', [
    z.object({ status: z.literal('not_found'), attemptedAt: timestampSchema,
      source: representationSchema.nullable() }).strict(),
    z.object({ status: z.literal('unreachable'), attemptedAt: timestampSchema, source: representationSchema }).strict(),
    z.object({ status: z.literal('unclear'), attemptedAt: timestampSchema, source: representationSchema }).strict(),
    z.object({ status: z.literal('not_applicable'), attemptedAt: timestampSchema, source: representationSchema }).strict(),
    z.object({ status: z.literal('agrees'), attemptedAt: timestampSchema,
      comparisonRef: reference('source-comparison:v3'), observation }).strict(),
    z.object({ status: z.literal('compatible'), attemptedAt: timestampSchema,
      comparisonRef: reference('source-comparison:v3'), method: methodRefSchema,
      reproof: z.literal('required_before_acceptance'), observation }).strict(),
    z.object({ status: z.literal('conflicts'), attemptedAt: timestampSchema,
      comparisonRef: reference('source-comparison:v3'), conflictRef: conflictRefSchema, observation }).strict(),
    z.object({ status: z.literal('not_comparable'), attemptedAt: timestampSchema,
      comparisonRef: reference('source-comparison:v3'), observation }).strict(),
  ])
  return z.object({
    schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('source_decision_record'),
    reference: decisionRefSchema, predecessor: decisionRefSchema.nullable(),
    method: methodRefSchema, context: contextSchema, contextKey: contextKeySchema,
    factKind: z.enum(REGEL_FAKT_ARTEN), evaluatedAt: timestampSchema,
    // Explicit legal calendar date, supplied by the later method. Never inferred
    // from UTC or collected as a personal travel date.
    legalAsOfDate: dateSchema,
    primary,
    counterCheck: z.object({ attemptPlanRevision: revisionSchema,
      attempts: z.array(attempt).min(1).max(OFFICIAL_TRUTH_V3_LIMITS.crossChecks) }).strict(),
    knownConflicts: z.array(conflictSchema(registry)).max(OFFICIAL_TRUTH_V3_LIMITS.conflicts),
    historyArchive: archivePointerSchema.nullable(),
    conclusion: z.enum(['clear_primary', 'primary_unclear', 'conditions_unresolved', 'comparable_conflict']),
  }).strict().superRefine((value, context) => {
    if (value.contextKey !== contextIdentity(value.context).contextKey
      || value.reference === value.predecessor
      || new Set(value.knownConflicts.map((item) => item.reference)).size !== value.knownConflicts.length) invalid(context)
    const clear = value.primary.status === 'clear' ? value.primary : null
    if (clear) {
      if (clear.observation.contextKey !== value.contextKey || clear.observation.fact.fact.kind !== value.factKind
        || !same(clear.qualification.method, value.method)
        || clear.qualification.representedCountryCode !== value.context.scope.destinationCountryCode
        || clear.qualification.evidenceVersionId !== clear.observation.evidence.versionId
        || clear.qualification.checkedAt < clear.observation.evidence.retrievedAt
        || clear.qualification.checkedAt > value.evaluatedAt
        || !validityContains(clear.observation.evidence.legalValidity, value.legalAsOfDate)) invalid(context)
    } else if (value.primary.status === 'unclear' && value.primary.evidence
      && (value.primary.reason === 'missing' || value.primary.evidence.retrievedAt > value.evaluatedAt)) invalid(context)

    for (const check of value.counterCheck.attempts) {
      if (check.attemptedAt > value.evaluatedAt) invalid(context)
      if (!('observation' in check)) {
        if (check.source && !registeredOfficial(registry, check.source.sourceId)) invalid(context)
        continue // An unsuccessful attempt contains no invented content evidence.
      }
      if (check.observation.evidence.retrievedAt > check.attemptedAt) invalid(context)
      if (!clear) { if (check.status !== 'not_comparable') invalid(context); continue }
      const canCompare = independent(clear.observation, check.observation) && comparable(clear.observation, check.observation)
      const relation = factRelation(clear.observation.fact, check.observation.fact)
      if (check.status === 'not_comparable' && canCompare) invalid(context)
      if (check.status === 'agrees' && (!canCompare || relation !== 'equal')) invalid(context)
      if (check.status === 'compatible' && (!canCompare || relation === 'equal' || relation === 'incompatible'
        || !same(check.method, value.method))) invalid(context)
      if (check.status === 'conflicts') {
        // Difference alone is not legal incompatibility: comparisonRef must be
        // independently reproved by I1 under the approved method before use.
        const known = value.knownConflicts.find((item) => item.reference === check.conflictRef)
        if (!canCompare || relation === 'equal' || relation === 'compatible' || !known
          || !same(known.primary, clear.observation) || !same(known.counter, check.observation)) invalid(context)
      }
    }
    for (const conflict of value.knownConflicts) {
      if (conflict.primary.contextKey !== value.contextKey || conflict.primary.fact.fact.kind !== value.factKind
        || conflict.detectedAt > value.evaluatedAt) invalid(context)
      if (conflict.resolution === null) continue
      const resolved = conflict.resolution
      if (!same(resolved.method, value.method) || resolved.resolvedAt > value.evaluatedAt
        || !resolved.observations.some((item) => item.contextKey === value.contextKey && item.fact.fact.kind === value.factKind)) invalid(context)
    }
    const expected = value.knownConflicts.some((item) => item.resolution === null) ? 'comparable_conflict'
      : !clear ? 'primary_unclear' : !contextResolved(value.context) ? 'conditions_unresolved' : 'clear_primary'
    if (value.conclusion !== expected) invalid(context)
    const evidence = [
      ...(clear ? [clear.observation.evidence] : value.primary.status === 'unclear' && value.primary.evidence ? [value.primary.evidence] : []),
      ...value.counterCheck.attempts.flatMap((item) => 'observation' in item ? [item.observation.evidence] : []),
      ...value.knownConflicts.flatMap((item) => [item.primary.evidence, item.counter.evidence,
        ...(item.resolution?.observations.map((observed) => observed.evidence) ?? [])]),
    ]
    const bindings = new Map<string, string>()
    for (const item of evidence) {
      const binding = schema2Kanonisch(item), previous = bindings.get(item.versionId)
      if (previous !== undefined && previous !== binding) invalid(context)
      bindings.set(item.versionId, binding)
    }
  })
}
export type V3SourceDecisionRecord = z.infer<ReturnType<typeof sourceDecisionSchema>>

/**
 * One immediate predecessor is required on refresh. This checks the supplied
 * history link, not whether that predecessor is the actual current store head.
 * I1/M1 must reprove head/custody at CAS/commit, including all resolution refs.
 */
export function readV3SourceDecisionRecord(
  value: unknown, registry: QuellenRegistry, previous: unknown = null, archiveAppend: unknown = null,
): V3ReadResult<V3SourceDecisionRecord> {
  const result = read(value, sourceDecisionSchema(registry))
  if (!result.ok) return result
  if (result.value.predecessor === null) return previous === null && result.value.historyArchive === null && archiveAppend === null
    ? result : { ok: false, reason: 'reference_mismatch' }
  const prior = read(previous, sourceDecisionSchema(registry))
  if (!prior.ok || prior.value.reference !== result.value.predecessor
    || prior.value.contextKey !== result.value.contextKey || prior.value.factKind !== result.value.factKind
    || prior.value.evaluatedAt > result.value.evaluatedAt) return { ok: false, reason: 'reference_mismatch' }
  const removed: V3ConflictArchiveRecord['entries'] = []
  for (const conflict of prior.value.knownConflicts) {
    const retained = result.value.knownConflicts.find((item) => item.reference === conflict.reference)
    if (!retained) {
      if (conflict.resolution === null) return { ok: false, reason: 'reference_mismatch' }
      removed.push(conflict)
      continue
    }
    if (!same({ ...conflict, resolution: null }, { ...retained, resolution: null })
      || (conflict.resolution !== null && !same(conflict.resolution, retained.resolution)
        && (retained.resolution === null || retained.resolution.predecessor !== conflict.resolution.reference
          || retained.resolution.reference === conflict.resolution.reference
          || retained.resolution.resolvedAt < conflict.resolution.resolvedAt))) {
      return { ok: false, reason: 'reference_mismatch' }
    }
  }
  if (archiveAppend === null) {
    if (removed.length !== 0 || !same(result.value.historyArchive, prior.value.historyArchive)) return { ok: false, reason: 'reference_mismatch' }
  } else {
    const archive = readV3ConflictArchiveRecord(archiveAppend, registry)
    if (!archive.ok || !same(archive.value.head, result.value.historyArchive)
      || !same(archive.value.predecessor, prior.value.historyArchive)
      || archive.value.fromDecisionRef !== prior.value.reference
      || archive.value.contextKey !== result.value.contextKey || archive.value.factKind !== result.value.factKind
      || archive.value.archivedAt < prior.value.evaluatedAt || archive.value.archivedAt > result.value.evaluatedAt
      || archive.value.entries.length !== removed.length
      || archive.value.entries.some((entry) => !removed.some((item) => same(item, entry)))) {
      return { ok: false, reason: 'reference_mismatch' }
    }
  }
  return result
}

function versionSchema(registry: QuellenRegistry) {
  return z.object({
    schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('rule_version_record'),
    reference: versionRefSchema, revision: revisionSchema, predecessor: versionRefSchema.nullable(),
    state: z.enum(['accepted', 'withdrawn', 'conflicted']),
    method: methodRefSchema, subject: observationSchema(registry),
    sourceDecisionRef: decisionRefSchema, operationId: operationIdSchema, recordedAt: timestampSchema,
  }).strict().superRefine((value, context) => {
    if (value.reference === value.predecessor || (value.predecessor === null) !== (value.revision === 1)
      || value.subject.evidence.retrievedAt > value.recordedAt) invalid(context)
    if (value.state === 'accepted' && (!contextResolved(value.subject.context)
      || value.subject.evidence.legalValidity.status !== 'specified')) invalid(context)
  })
}
export type V3RuleVersionRecord = z.infer<ReturnType<typeof versionSchema>>
/** A matching decision record is required; neither record is an accepted receipt. */
export function readV3RuleVersionRecord(
  value: unknown, registry: QuellenRegistry, decision: unknown,
): V3ReadResult<V3RuleVersionRecord> {
  const result = read(value, versionSchema(registry))
  if (!result.ok) return result
  const source = read(decision, sourceDecisionSchema(registry))
  if (!source.ok || source.value.reference !== result.value.sourceDecisionRef
    || source.value.contextKey !== result.value.subject.contextKey
    || source.value.factKind !== result.value.subject.fact.fact.kind
    || !same(source.value.method, result.value.method)
    || source.value.evaluatedAt > result.value.recordedAt) return { ok: false, reason: 'reference_mismatch' }
  if (result.value.state === 'accepted' && (source.value.conclusion !== 'clear_primary'
    || source.value.primary.status !== 'clear'
    || !same(source.value.primary.observation, result.value.subject))) return { ok: false, reason: 'reference_mismatch' }
  if (result.value.state === 'conflicted' && source.value.conclusion !== 'comparable_conflict') {
    return { ok: false, reason: 'reference_mismatch' }
  }
  return result
}

const pointerSchema = z.object({
  revision: z.number().int().min(0).max(2_147_483_646),
  state: z.enum(['missing', 'accepted', 'withdrawn', 'conflicted']), versionRef: versionRefSchema.nullable(),
}).strict().superRefine((value, context) => {
  if (value.state === 'missing' ? value.revision !== 0 || value.versionRef !== null
    : value.revision === 0 || value.versionRef === null) invalid(context)
})
const transitionSchema = z.object({
  schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), protocolRevision: z.literal(1),
  operationId: operationIdSchema, contextKey: contextKeySchema, method: methodRefSchema,
  factKind: z.enum(REGEL_FAKT_ARTEN),
  action: z.enum(['accept', 'withdraw', 'conflict', 'reaccept', 'recover']),
  expected: pointerSchema,
  next: z.object({ revision: revisionSchema, state: z.enum(['accepted', 'withdrawn', 'conflicted']),
    versionRef: versionRefSchema }).strict(),
  primaryEvidenceVersionId: evidenceIdSchema, sourceDecisionRef: decisionRefSchema,
  resolutionRefs: z.array(resolutionRefSchema).max(OFFICIAL_TRUTH_V3_LIMITS.conflicts),
  recoverFromVersionRef: versionRefSchema.nullable(),
  invalidatedProjectionRefs: z.array(projectionRefSchema).max(64),
  reproof: z.literal('required_before_commit'), commitConfirmation: z.literal('required'),
}).strict().superRefine((value, context) => {
  if (value.next.revision !== value.expected.revision + 1 || value.next.versionRef === value.expected.versionRef
    || new Set(value.resolutionRefs).size !== value.resolutionRefs.length
    || new Set(value.invalidatedProjectionRefs).size !== value.invalidatedProjectionRefs.length) invalid(context)
  if (value.action === 'accept' && (!['missing', 'accepted'].includes(value.expected.state) || value.next.state !== 'accepted')) invalid(context)
  if (value.action === 'reaccept' && (!['withdrawn', 'conflicted'].includes(value.expected.state) || value.next.state !== 'accepted')) invalid(context)
  if (value.action === 'withdraw' && (value.expected.state !== 'accepted' || value.next.state !== 'withdrawn')) invalid(context)
  if (value.action === 'conflict' && (value.expected.state !== 'accepted' || value.next.state !== 'conflicted')) invalid(context)
  if (value.action === 'recover' && (value.expected.state === 'missing' || value.next.state !== 'accepted'
    || value.recoverFromVersionRef === null || value.recoverFromVersionRef === value.next.versionRef)) invalid(context)
  if (value.action !== 'recover' && value.recoverFromVersionRef !== null) invalid(context)
  if (value.expected.state === 'conflicted' && value.next.state === 'accepted' && value.resolutionRefs.length === 0) invalid(context)
})
export type V3TransitionPlan = z.infer<typeof transitionSchema>
/** Describes a CAS/reproof/confirm obligation. Executes no transition or rollback. */
export function readV3TransitionPlan(value: unknown): V3ReadResult<V3TransitionPlan> {
  return read(value, transitionSchema)
}
export function createV3TransitionIdempotencyKey(value: unknown): V3ReadResult<string> {
  return read(value, transitionSchema.transform((plan) => `rule-operation:v3:${sha256Hex(schema2Kanonisch(plan))}`))
}

const leaseSchema = z.object({
  leaseId: z.string().regex(/^lease3_[a-f0-9]{32}$/),
  generation: revisionSchema, acquiredAt: timestampSchema, expiresAt: timestampSchema,
}).strict()
const jobLifecycleSchema = z.object({
  jobId: jobIdSchema, operationId: operationIdSchema,
  revision: revisionSchema, predecessorRevision: z.number().int().min(1).max(2_147_483_646).nullable(),
  state: z.enum(['queued', 'leased', 'backoff', 'succeeded', 'exhausted']),
  createdAt: timestampSchema, updatedAt: timestampSchema,
  attempt: z.number().int().min(0).max(OFFICIAL_TRUTH_V3_LIMITS.jobAttempts),
  attemptLimit: z.number().int().min(1).max(OFFICIAL_TRUTH_V3_LIMITS.jobAttempts),
  lease: leaseSchema.nullable(), nextAttemptAt: timestampSchema.nullable(),
  lastFailure: z.enum(['unreachable', 'invalid_proposal', 'verification_unavailable', 'commit_unconfirmed']).nullable(),
}).strict()
function checkJobLifecycle(
  value: z.infer<typeof jobLifecycleSchema>, resultRef: string | null, context: z.RefinementCtx,
): void {
  if ((value.predecessorRevision === null ? value.revision !== 1 : value.predecessorRevision + 1 !== value.revision)
    || value.createdAt > value.updatedAt || value.attempt > value.attemptLimit) invalid(context)
  if (value.state === 'leased') {
    const lease = value.lease
    if (!lease || value.attempt < 1) invalid(context)
    else if (lease.generation > value.revision || lease.acquiredAt < value.createdAt
      || lease.acquiredAt > value.updatedAt || lease.expiresAt <= value.updatedAt
      || Date.parse(lease.expiresAt) - Date.parse(lease.acquiredAt) > OFFICIAL_TRUTH_V3_LIMITS.leaseMilliseconds) invalid(context)
  } else if (value.lease !== null) invalid(context)
  if (value.state === 'backoff') {
    if (value.nextAttemptAt === null || value.nextAttemptAt <= value.updatedAt
      || value.lastFailure === null || value.attempt < 1 || value.attempt >= value.attemptLimit) invalid(context)
  } else if (value.nextAttemptAt !== null) invalid(context)
  if (value.state === 'queued' && (value.attempt !== 0 || value.lastFailure !== null)) invalid(context)
  if (value.state === 'succeeded' ? resultRef === null || value.attempt < 1 : resultRef !== null) invalid(context)
  if (value.state === 'exhausted' && (value.attempt !== value.attemptLimit || value.lastFailure === null)) invalid(context)
}
const jobSchema = jobLifecycleSchema.extend({
  schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('research_job_record'),
  jobKey: jobKeySchema, context: contextSchema, contextKey: contextKeySchema,
  research: researchIdentitySchema, method: methodRefSchema, resultDecisionRef: decisionRefSchema.nullable(),
}).strict().superRefine((value, context) => {
  const expected = workIdentity({ context: value.context, method: value.method,
    factKind: value.research.factKind, researchReason: value.research.researchReason })
  if (!same(expected.research, value.research) || expected.contextKey !== value.contextKey || expected.jobKey !== value.jobKey) invalid(context)
  checkJobLifecycle(value, value.resultDecisionRef, context)
})
export type V3ResearchJobRecord = z.infer<typeof jobSchema>
/** Expired leases remain readable for recovery; a reader does not acquire one. */
export function readV3ResearchJobRecord(value: unknown): V3ReadResult<V3ResearchJobRecord> {
  return read(value, jobSchema)
}

const combinationDiscoveryJobSchema = jobLifecycleSchema.extend({
  schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('combination_discovery_job_record'),
  identity: combinationDiscoveryIdentitySchema,
  resultDiscoveryRef: reference('combination-discovery-result:v3').nullable(),
}).strict().superRefine((value, context) => checkJobLifecycle(value, value.resultDiscoveryRef, context))
export type V3CombinationDiscoveryJobRecord = z.infer<typeof combinationDiscoveryJobSchema>
/** Shape/lifecycle only. A result reference is neither enqueue proof nor an accepted rule. */
export function readV3CombinationDiscoveryJobRecord(value: unknown): V3ReadResult<V3CombinationDiscoveryJobRecord> {
  return read(value, combinationDiscoveryJobSchema)
}

function projectionSchema(registry: QuellenRegistry) {
  return z.object({
    schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('public_projection_record'),
    reference: projectionRefSchema, rule: versionSchema(registry),
    sourceCheckedAt: timestampSchema, sourceFreshUntil: timestampSchema,
    builtAt: timestampSchema, expiresAt: timestampSchema,
  }).strict().superRefine((value, context) => {
    if (value.rule.state !== 'accepted' || value.sourceCheckedAt !== value.rule.subject.evidence.retrievedAt
      || value.rule.recordedAt > value.builtAt || value.sourceFreshUntil <= value.sourceCheckedAt
      || value.expiresAt <= value.builtAt || value.expiresAt > value.sourceFreshUntil) invalid(context)
  })
}
export type V3PublicProjectionRecord = z.infer<ReturnType<typeof projectionSchema>>
const clockSchema = z.object({ now: timestampSchema, legalDate: dateSchema }).strict()
export type V3ReadClock = z.infer<typeof clockSchema>

function projectionCurrent(value: V3PublicProjectionRecord, clock: V3ReadClock): boolean {
  return value.builtAt <= clock.now && value.expiresAt > clock.now && value.sourceFreshUntil > clock.now
    && validityContains(value.rule.subject.evidence.legalValidity, clock.legalDate)
}
/**
 * Shape/time validation only. U1 must also obtain the actual current accepted
 * pointer and authentic projection from its later bound, reproving read port.
 */
export function readV3PublicProjectionRecord(
  value: unknown, registry: QuellenRegistry, clock: unknown,
): V3ReadResult<V3PublicProjectionRecord> {
  const time = read(clock, clockSchema)
  if (!time.ok) return time
  const result = read(value, projectionSchema(registry))
  return !result.ok || projectionCurrent(result.value, time.value) ? result : { ok: false, reason: 'invalid_contract' }
}

export type V3PublicSourceDisplay = Readonly<{
  source: ContentIdentityBinding; publisherName: string; authorityName: string; href: string
}>
/**
 * Synchronous display lookup in the already loaded canonical registry snapshot.
 * An exact current identity match is required; no remote fetch, source discovery
 * or second display registry. This supplies labels/URL, never origin proof.
 */
export function resolveV3PublicSourceDisplay(
  value: unknown, registry: QuellenRegistry,
): V3ReadResult<V3PublicSourceDisplay> {
  return read(value, contentBindingSchema.transform((source, context) => {
    const matches = registry.contentIdentity?.representations.filter((item) =>
      item.current && contentIdentityMatches(item, source)) ?? []
    if (matches.length !== 1) { invalid(context); return z.NEVER }
    const representation = contentRepresentationFromRegistry(registry, matches[0].expectedFinalUrl)
    if (!representation.ok || !contentIdentityMatches(representation.value, source)) { invalid(context); return z.NEVER }
    const url = quellenUrlAufloesen(registry, representation.value.expectedFinalUrl)
    if (!url.ok || url.source.sourceId !== source.sourceId || url.source.sourceClass !== 'official_authority'
      || url.source.authorityName === null) { invalid(context); return z.NEVER }
    return { source, publisherName: url.source.publisherName, authorityName: url.source.authorityName, href: url.canonicalUrl }
  }))
}

function responseSchema(registry: QuellenRegistry) {
  const discoveryPendingSchema = z.object({
    status: z.literal('pending'), jobKind: z.literal('combination_discovery'),
    jobKey: discoveryJobKeySchema, identity: combinationDiscoveryIdentitySchema,
  }).strict().superRefine((value, context) => {
    if (value.jobKey !== value.identity.jobKey) invalid(context)
  })
  const resultSchema = z.union([z.discriminatedUnion('status', [
    z.object({ status: z.literal('accepted'), projection: projectionSchema(registry) }).strict(),
    z.object({ status: z.literal('pending'), jobKind: z.literal('rule_research').optional(), jobKey: jobKeySchema }).strict(),
    z.object({ status: z.literal('conflict'), decisionRef: decisionRefSchema,
      reason: z.enum(['comparable_conflict', 'primary_unclear']) }).strict(),
    z.object({ status: z.literal('unavailable'), reason: z.enum([
      'unbound', 'no_qualified_primary', 'conditions_unresolved', 'withdrawn', 'expired',
    ]) }).strict(),
    z.object({ status: z.literal('error'), code: z.enum(['temporary_failure', 'invalid_data']), retryable: z.boolean() }).strict(),
  ]), discoveryPendingSchema])
  return z.object({
    schema: z.literal(OFFICIAL_TRUTH_V3_SCHEMA), kind: z.literal('conditional_rule_overview_record'),
    dataMode: z.enum(['synthetic_test', 'official_projection']),
    notice: z.literal('SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE').nullable(),
    input: visitorSchema, generatedAt: timestampSchema,
    cells: z.array(z.object({
      citizenshipCountryCode: countrySchema,
      // No overall "accepted" state, score, ranking or selected credential.
      // Every citizenship and every returned condition/result stays visible.
      results: z.array(resultSchema).min(1).max(OFFICIAL_TRUTH_V3_LIMITS.resultsPerCitizenship),
    }).strict()).min(1).max(OFFICIAL_TRUTH_V3_LIMITS.citizenships),
  }).strict().superRefine((value, context) => {
    if ((value.dataMode === 'synthetic_test') !== (value.notice !== null)) invalid(context)
    const countries = value.cells.map((cell) => cell.citizenshipCountryCode).sort()
    if (new Set(countries).size !== countries.length || !same(countries, value.input.citizenshipCountryCodes)) invalid(context)
    const versionIds = new Set<string>()
    const projectionIds = new Set<string>()
    const evidenceBindings = new Map<string, string>()
    for (const cell of value.cells) {
      const subjects = new Set<string>()
      for (const result of cell.results) {
        if (result.status === 'pending' && result.jobKind === 'combination_discovery'
          && (result.identity.destinationCountryCode !== value.input.destinationCountryCode
            || result.identity.citizenshipCountryCode !== cell.citizenshipCountryCode)) invalid(context)
        if (result.status !== 'accepted') continue
        const projection = result.projection, rule = projection.rule
        if (rule.subject.context.scope.destinationCountryCode !== value.input.destinationCountryCode
          || rule.subject.context.scope.citizenship.countryCodes[0] !== cell.citizenshipCountryCode
          || projection.builtAt > value.generatedAt || versionIds.has(rule.reference) || projectionIds.has(projection.reference)) invalid(context)
        versionIds.add(rule.reference)
        projectionIds.add(projection.reference)
        const subject = `${rule.subject.contextKey}|${rule.subject.fact.fact.kind}`
        if (subjects.has(subject)) invalid(context)
        subjects.add(subject)
        // Existing ev2 identity covers a publication/scope observation. The
        // same original can legitimately support several structured conditions.
        const binding = schema2Kanonisch(rule.subject.evidence)
        const previous = evidenceBindings.get(rule.subject.evidence.versionId)
        if (previous !== undefined && previous !== binding) invalid(context)
        evidenceBindings.set(rule.subject.evidence.versionId, binding)
      }
    }
  }).transform((value) => ({ ...value, cells: [...value.cells].sort((a, b) =>
    a.citizenshipCountryCode < b.citizenshipCountryCode ? -1 : a.citizenshipCountryCode > b.citizenshipCountryCode ? 1 : 0) }))
}
export type V3PublicResponseRecord = z.infer<ReturnType<typeof responseSchema>>
export function readV3PublicResponseRecord(
  value: unknown, registry: QuellenRegistry, clock: unknown,
): V3ReadResult<V3PublicResponseRecord> {
  const time = read(clock, clockSchema)
  if (!time.ok) return time
  const result = read(value, responseSchema(registry))
  if (!result.ok) return result
  if (result.value.generatedAt > time.value.now || result.value.cells.some((cell) =>
    cell.results.some((item) => item.status === 'accepted' && !projectionCurrent(item.projection, time.value)))) {
    return { ok: false, reason: 'invalid_contract' }
  }
  return result
}
