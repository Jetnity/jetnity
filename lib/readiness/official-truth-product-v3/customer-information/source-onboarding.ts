/** Repeatable, provider-neutral source preparation over the existing V3 seam.
 * This module performs no IO, grants no authority and creates no new intake.
 * A returned proposal must still traverse the ordinary bound V3 intake, source
 * qualification, approved method, import, publication and background guard.
 */
import { z } from 'zod'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2DatenPruefen, schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { contentRepresentationFromRegistry, readRepresentationRef, type RepresentationRef } from '@/lib/readiness/official-truth-content-identity'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import {
  createV3WorkIdentity, readV3ResearchProposal, readV3VisitorInput,
  OFFICIAL_TRUTH_V3_LIMITS,
  type V3GlobalRuleContext, type V3ResearchProposal, type V3ReadResult,
} from '../contract'
import { V3_CUSTOMER_INFORMATION_TOPICS, V3_CUSTOMER_INFORMATION_TOPIC_IDS, type V3CustomerInformationTopic } from './topics'
import { v3CanonicalInformationTopic } from './canonical-topic'

const MAXIMUM_PROPOSALS = 64
// A plan contains separately bounded original proposals and one metadata frame.
// Collection wrappers never consume an individual proposal's original budget.
// At most 64 additional commas join proposals in their existing topic arrays.
export const V3_SOURCE_ONBOARDING_PLAN_LIMITS = Object.freeze({
  proposals: MAXIMUM_PROPOSALS,
  proposalsPerTopic: 8,
  payloadBytes: (MAXIMUM_PROPOSALS + 1) * OFFICIAL_TRUTH_V3_LIMITS.payloadBytes + MAXIMUM_PROPOSALS,
  payloadNodes: (MAXIMUM_PROPOSALS + 1) * OFFICIAL_TRUTH_V3_LIMITS.payloadNodes,
  // plan -> coverage -> slot -> proposals -> standalone proposal
  payloadDepth: OFFICIAL_TRUTH_V3_LIMITS.payloadDepth + 4,
})
const topic = z.custom<V3CustomerInformationTopic>(value => typeof value === 'string'
  && V3_CUSTOMER_INFORMATION_TOPIC_IDS.includes(value as V3CustomerInformationTopic))
const country = z.string().regex(/^[A-Z]{2}$/)
const ref = z.unknown().transform((value, context): RepresentationRef => {
  const result = readRepresentationRef(value)
  if (!result.ok) { context.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid_source' }); return z.NEVER }
  return result.value
})
const base = { topic, citizenshipCountryCode: country }
const slot = z.discriminatedUnion('status', [
  z.object({ ...base, status: z.literal('unavailable'),
    reason: z.enum(['not_researched', 'source_missing', 'source_unclear', 'conflict', 'method_not_qualified']) }).strict(),
  z.object({ ...base, status: z.literal('canonical_proposals'),
    proposals: z.array(z.unknown()).min(1).max(V3_SOURCE_ONBOARDING_PLAN_LIMITS.proposalsPerTopic) }).strict(),
])
const planSchema = z.object({
  schema: z.literal(1), kind: z.literal('official_source_onboarding_plan'), classification: z.literal('RESEARCH_ONLY'),
  destinationCountryCode: country, citizenshipCountryCodes: z.array(country).min(1).max(5),
  // The declared role is a research claim; only the normal destination-source
  // qualification can prove its country and authority in the acceptance path.
  primary: z.object({ source: ref, representedCountryCode: country,
    role: z.enum(['destination_authority', 'destination_border_police', 'destination_embassy']) }).strict().nullable(),
  counterSources: z.array(ref).max(8),
  coverage: z.array(slot).min(1).max(V3_CUSTOMER_INFORMATION_TOPICS.length * 5),
  knownConflicts: z.array(z.object({ topic, citizenshipCountryCode: country,
    primary: ref, counter: ref }).strict()).max(32),
}).strict()

type ParsedPlan = z.infer<typeof planSchema>
export type V3SourceOnboardingSlot =
  | Extract<ParsedPlan['coverage'][number], { status: 'unavailable' }>
  | Readonly<{ topic: V3CustomerInformationTopic; citizenshipCountryCode: string; status: 'canonical_proposals'; proposals: readonly V3ResearchProposal[] }>
export type V3SourceOnboardingPlan = Omit<ParsedPlan, 'coverage'> & Readonly<{ coverage: readonly V3SourceOnboardingSlot[] }>
export type V3SourceOnboardingFailure = 'invalid_data' | 'invalid_plan' | 'incomplete_coverage'
  | 'invalid_source' | 'invalid_context' | 'invalid_proposal' | 'topic_mismatch' | 'invalid_conflict'
export type V3SourceOnboardingResult =
  | Readonly<{ ok: false; reason: V3SourceOnboardingFailure }>
  | Readonly<{ ok: true; value: V3SourceOnboardingPlan; digest: string;
    publicationAuthority: 'none'; intake: 'existing_v3_only';
    rows: readonly Readonly<{ topic: V3CustomerInformationTopic; citizenshipCountryCode: string;
      status: 'unavailable' | 'blocked_conflict' | 'requires_primary_source' | 'proposal_prepared' }>[];
    // These remain untrusted proposals. No row is automatically dispatched.
    proposals: readonly V3ResearchProposal[] }>

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value) }
  return value
}
const fail = (reason: V3SourceOnboardingFailure): V3SourceOnboardingResult => Object.freeze({ ok: false, reason })
const key = (value: { topic: V3CustomerInformationTopic; citizenshipCountryCode: string }) => `${value.citizenshipCountryCode}:${value.topic}`
const sourceKey = (value: RepresentationRef) => `${value.sourceId}:${value.contentItemId}:${value.representationId}`
const itemKey = (value: RepresentationRef) => `${value.sourceId}:${value.contentItemId}`

function registeredSource(source: RepresentationRef, registry: QuellenRegistry): boolean {
  if (registry.sources.filter(item => item.sourceId === source.sourceId && item.sourceClass === 'official_authority').length !== 1) return false
  const representations = registry.contentIdentity?.representations.filter(item => item.current
    && item.sourceId === source.sourceId && item.contentItemId === source.contentItemId
    && item.representationId === source.representationId) ?? []
  if (representations.length !== 1) return false
  const current = contentRepresentationFromRegistry(registry, representations[0]!.expectedFinalUrl)
  return current.ok && sourceKey(current.value) === sourceKey(source)
}
function contextMatches(context: V3GlobalRuleContext, destination: string, citizenship: string): boolean {
  return context.scope.destinationCountryCode === destination
    && context.scope.citizenship.countryCodes.length === 1
    && context.scope.citizenship.countryCodes[0] === citizenship
}

/** Partition only the collection budget. Every original proposal and the full
 * metadata frame still use the unchanged shared privacy/provenance/JSON checker.
 * No raw getter runs, and the entire original subsequently enters strict schema,
 * canonical proposal, country, topic, identity and registered-source validation.
 */
function sourceOnboardingPlanDataPreflight(value: unknown): boolean {
  try {
    function record(input: unknown): Record<string, unknown> | null {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) return null
      const keys = Reflect.ownKeys(input)
      if (keys.length > OFFICIAL_TRUTH_V3_LIMITS.payloadNodes) return null
      const entries: Array<[string, unknown]> = []
      for (const key of keys) {
        if (typeof key !== 'string') return null
        const descriptor = Object.getOwnPropertyDescriptor(input, key)
        if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null
        entries.push([key, descriptor.value])
      }
      return Object.fromEntries(entries)
    }
    function array(input: unknown, maximum: number): unknown[] | null {
      if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype || input.length > maximum
        || Reflect.ownKeys(input).length !== input.length + 1) return null
      const result: unknown[] = []
      for (let index = 0; index < input.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(input, String(index))
        if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null
        result.push(descriptor.value)
      }
      return result
    }
    let bytes = MAXIMUM_PROPOSALS, nodes = 0, proposals = 0
    function countNodes(input: unknown): number {
      return 1 + (input && typeof input === 'object'
        ? Object.values(input).reduce<number>((sum, child) => sum + countNodes(child), 0) : 0)
    }
    function part(input: unknown): boolean {
      if (schema2DatenPruefen(input)) return false
      bytes += new TextEncoder().encode(JSON.stringify(input)).length
      nodes += countNodes(input)
      return bytes <= V3_SOURCE_ONBOARDING_PLAN_LIMITS.payloadBytes && nodes <= V3_SOURCE_ONBOARDING_PLAN_LIMITS.payloadNodes
    }
    const root = record(value), coverage = root && array(root.coverage,
      V3_CUSTOMER_INFORMATION_TOPICS.length * OFFICIAL_TRUTH_V3_LIMITS.citizenships)
    if (!root || !coverage) return false
    const frames: Record<string, unknown>[] = []
    for (const input of coverage) {
      const row = record(input)
      if (!row) return false
      if (Object.hasOwn(row, 'proposals')) {
        const items = array(row.proposals, V3_SOURCE_ONBOARDING_PLAN_LIMITS.proposalsPerTopic)
        if (!items || (proposals += items.length) > MAXIMUM_PROPOSALS) return false
        for (const proposal of items) if (!part(proposal)) return false
        frames.push({ ...row, proposals: [] })
      } else frames.push(row)
    }
    return part({ ...root, coverage: frames })
  } catch { return false }
}


/** Bind a reviewed semantic item to an already selected ordinary V3 work unit.
 * Caller supplies the job/operation selected by that work queue. The returned
 * object is still untrusted; this function cannot approve its method or sources.
 */
export function prepareV3CustomerInformationProposal(value: unknown, registry: QuellenRegistry): V3ReadResult<V3ResearchProposal> {
  if (schema2DatenPruefen(value)) return { ok: false, reason: 'invalid_contract' }
  try {
    const input = z.object({ jobId: z.string(), operationId: z.string(), context: z.unknown(), method: z.unknown(),
      researchReason: z.unknown(), detail: z.unknown(), references: z.unknown() }).strict().safeParse(JSON.parse(JSON.stringify(value)))
    if (!input.success) return { ok: false, reason: 'invalid_contract' }
    const row = input.data, identity = createV3WorkIdentity({ context: row.context, method: row.method,
      factKind: 'entry_information', researchReason: row.researchReason })
    if (!identity.ok) return identity
    return readV3ResearchProposal({ schema: 3, kind: 'untrusted_research_proposal', jobId: row.jobId, operationId: row.operationId,
      context: row.context, contextKey: identity.value.contextKey, research: identity.value.research,
      proposedFact: { schema: 1, fact: { kind: 'entry_information', detail: row.detail } }, references: row.references }, registry)
  } catch { return { ok: false, reason: 'invalid_contract' } }
}

/** One complete coverage inventory per country/citizenship pair. Incomplete,
 * conflicting and unsupported entries remain explicit rather than disappearing.
 * registry must be the runner's reviewed code-owned catalog, not upload data.
 */
export function prepareV3SourceOnboardingPlan(value: unknown, registry: QuellenRegistry): V3SourceOnboardingResult {
  if (!sourceOnboardingPlanDataPreflight(value)) return fail('invalid_data')
  try {
    const serialized = JSON.stringify(value)
    if (new TextEncoder().encode(serialized).byteLength > V3_SOURCE_ONBOARDING_PLAN_LIMITS.payloadBytes) return fail('invalid_data')
    const parsed = planSchema.safeParse(JSON.parse(serialized))
    if (!parsed.success) return fail('invalid_plan')
    const input = parsed.data, visitor = readV3VisitorInput({ destinationCountryCode: input.destinationCountryCode,
      citizenshipCountryCodes: input.citizenshipCountryCodes })
    if (!visitor.ok || new Set(input.citizenshipCountryCodes).size !== input.citizenshipCountryCodes.length) return fail('invalid_plan')
    const citizenships = visitor.value.citizenshipCountryCodes, citizenshipSet = new Set<string>(citizenships)
    const references = [...(input.primary ? [input.primary.source] : []), ...input.counterSources]
    if ((input.primary && input.primary.representedCountryCode !== input.destinationCountryCode)
      || new Set(references.map(sourceKey)).size !== references.length
      || new Set(references.map(itemKey)).size !== references.length
      || references.some(source => !registeredSource(source, registry))) return fail('invalid_source')
    const allowed = new Set(references.map(sourceKey))
    if (input.coverage.length !== citizenships.length * V3_CUSTOMER_INFORMATION_TOPICS.length
      || new Set(input.coverage.map(key)).size !== input.coverage.length
      || input.coverage.some(item => !citizenshipSet.has(item.citizenshipCountryCode))) return fail('incomplete_coverage')
    const conflicts = new Set<string>()
    for (const conflict of input.knownConflicts) {
      if (!citizenshipSet.has(conflict.citizenshipCountryCode) || !input.primary
        || sourceKey(conflict.primary) !== sourceKey(input.primary.source)
        || !input.counterSources.some(source => sourceKey(source) === sourceKey(conflict.counter))
        || itemKey(conflict.primary) === itemKey(conflict.counter) || conflicts.has(key(conflict))) return fail('invalid_conflict')
      conflicts.add(key(conflict))
    }
    const coverage: V3SourceOnboardingSlot[] = [], proposals: V3ResearchProposal[] = []
    const rows: Extract<V3SourceOnboardingResult, { ok: true }>['rows'][number][] = []
    const operations = new Set<string>(), jobs = new Set<string>(), subjects = new Set<string>()
    for (const item of input.coverage) {
      let normalized: V3SourceOnboardingSlot
      if (item.status === 'canonical_proposals') {
        const prepared: V3ResearchProposal[] = []
        for (const candidate of item.proposals) {
          const proposal = readV3ResearchProposal(candidate, registry)
          if (!proposal.ok) return fail('invalid_proposal')
          const subject = `${proposal.value.contextKey}|${proposal.value.research.factKind}`
          if (operations.has(proposal.value.operationId) || jobs.has(proposal.value.jobId)
            || subjects.has(subject) || subjects.size >= MAXIMUM_PROPOSALS) return fail('invalid_proposal')
          operations.add(proposal.value.operationId); jobs.add(proposal.value.jobId); subjects.add(subject)
          if (!contextMatches(proposal.value.context, input.destinationCountryCode, item.citizenshipCountryCode)) return fail('invalid_context')
          if (v3CanonicalInformationTopic(proposal.value.context, proposal.value.proposedFact) !== item.topic) return fail('topic_mismatch')
          if (proposal.value.references.some(cited => !allowed.has(sourceKey(cited.source)))) return fail('invalid_source')
          prepared.push(proposal.value)
        }
        normalized = { ...item, proposals: prepared }
      } else normalized = item
      coverage.push(normalized)
      const hasPrimary = input.primary !== null && normalized.status === 'canonical_proposals'
        && normalized.proposals.every(proposal => proposal.references.some(cited => sourceKey(cited.source) === sourceKey(input.primary!.source)))
      const blocked = conflicts.has(key(item)) || (item.status === 'unavailable' && item.reason === 'conflict')
      const status = blocked ? 'blocked_conflict' : item.status === 'unavailable' ? 'unavailable'
        : !hasPrimary ? 'requires_primary_source' : 'proposal_prepared'
      rows.push({ topic: item.topic, citizenshipCountryCode: item.citizenshipCountryCode, status })
      if (status === 'proposal_prepared' && normalized.status === 'canonical_proposals') proposals.push(...normalized.proposals)
    }
    const result: V3SourceOnboardingPlan = { ...input, citizenshipCountryCodes: citizenships, coverage }
    return freeze({ ok: true, value: result, digest: sha256Hex(schema2Kanonisch(result)),
      publicationAuthority: 'none', intake: 'existing_v3_only', rows, proposals })
  } catch { return fail('invalid_data') }
}

/** Neutral scaffold only: no default passport, primary source, rule or fact. */
export function createV3SourceOnboardingTemplate(input: unknown): V3SourceOnboardingPlan | null {
  const parsed = readV3VisitorInput(input)
  if (!parsed.ok) return null
  return freeze({ schema: 1, kind: 'official_source_onboarding_plan', classification: 'RESEARCH_ONLY',
    ...parsed.value, primary: null, counterSources: [], knownConflicts: [],
    coverage: parsed.value.citizenshipCountryCodes.flatMap(citizenshipCountryCode => V3_CUSTOMER_INFORMATION_TOPICS.map(item => ({
      topic: item.id, citizenshipCountryCode, status: 'unavailable' as const, reason: 'not_researched' as const,
    }))),
  })
}
