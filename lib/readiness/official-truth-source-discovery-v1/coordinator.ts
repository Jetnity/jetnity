// Offline synthetic seam only. A future live entry must obtain its catalog at
// the established server-held boundary; this module grants no caller authority.
import { isDeepStrictEqual, types } from 'node:util'
import type { OfficialTruthAbdeckung } from '../official-truth-coverage'
import { createContentIdentityGraph, type ContentIdentityProfileDefinition } from '../official-truth-content-identity'
import { officialTruthEntdeckteUrlKandidatenPruefen, type OfficialTruthUrlKandidat } from '../official-truth-discovered-url-candidates'
import { officialTruthRechercheAusfuehrungsplan } from '../official-truth-research-execution-plan'
import { officialTruthRechercheEntscheiden } from '../official-truth-research-request'
import type { RegelFaktArt, RegelScope } from '../rule-claims'
import type { QuellenRegistry } from '../source-registry'
import { discoveryQueryIntents, type DiscoveryQueryIntent } from './query-intents'

type Unqualified = Readonly<{ officialResult: 'unknown'; sourceQualified: false }>
type Identity = Readonly<{ requestKey: string; ruleScopeKey: string; factKind: RegelFaktArt }>
export type SourceDiscoveryResult = Unqualified & (
  | Readonly<{ status: 'no_research'; reason: 'current' }>
  | Readonly<{ status: 'blocked_invalid'; reason: string }>
  | (Identity & Readonly<{
      status: 'gap_unqualified'
      reason: 'no_eligible_official_source' | 'no_candidate_hits'
      intents: readonly DiscoveryQueryIntent[]
      candidates: readonly []
    }>)
  | (Identity & Readonly<{
      status: 'ready_candidate_urls'; reason: 'candidate_only'
      intents: readonly DiscoveryQueryIntent[]
      candidates: readonly OfficialTruthUrlKandidat[]
    }>)
)

const UNQUALIFIED = Object.freeze({ officialResult: 'unknown', sourceQualified: false } as const)
const EMPTY = Object.freeze([]) as readonly []
function blocked(reason: string): SourceDiscoveryResult {
  return Object.freeze({ ...UNQUALIFIED, status: 'blocked_invalid', reason })
}

/**
 * Data-shape boundary, not a source/URL/identity validator. Reject proxies before
 * reflection (including revoked proxies), accessors before reads, and executable
 * dependencies before any canonical code. Limits cover the entire envelope.
 */
function boundedData(value: unknown): boolean {
  let nodes = 0, bytes = 0
  const active = new Set<object>(), encoder = new TextEncoder()
  function text(value: string): boolean {
    if (value.length > 4096) return false
    bytes += encoder.encode(value).length
    return bytes <= 65_536
  }
  function visit(value: unknown, depth: number): boolean {
    if (++nodes > 8192 || depth > 16 || (bytes += 8) > 65_536) return false
    if (value === null || typeof value === 'boolean') return true
    if (typeof value === 'string') return text(value)
    if (typeof value === 'number') return Number.isSafeInteger(value) && !Object.is(value, -0)
    if (typeof value !== 'object' || types.isProxy(value) || active.has(value)) return false
    const array = Array.isArray(value)
    if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype)) return false
    const keys = Reflect.ownKeys(value)
    if (keys.length > 129 || (array && (value.length > 128 || keys.length !== value.length + 1))) return false
    active.add(value)
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) || !text(key)) return false
      if (array && !/^(0|[1-9][0-9]*)$/.test(key)) return false
      const property = Object.getOwnPropertyDescriptor(value, key)
      if (!property || !('value' in property) || !property.enumerable || !visit(property.value, depth + 1)) return false
    }
    active.delete(value)
    return true
  }
  try { return visit(value, 0) } catch { return false }
}

function record(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key))
}

/** Close shapes that the existing router reads permissively; semantics stay there. */
function descriptorShape(value: unknown): boolean {
  if (!record(value, ['source', 'coverage']) || !record(value.source,
    ['sourceId', 'sourceClass', 'publisherName', 'authorityName', 'domains'])) return false
  const c = value.coverage
  if (!record(c, ['destinationCountryCodes', 'transitCountryCodes', 'requirementTypes', 'citizenship', 'residence', 'documents'])) return false
  for (const axis of [c.citizenship, c.residence]) {
    if (!record(axis, ['mode']) && !record(axis, ['mode', 'countryCodes'])) return false
    if (!record(axis, axis.mode === 'exact' ? ['mode', 'countryCodes'] : ['mode'])) return false
  }
  const d = c.documents
  if (record(d, ['mode'])) return d.mode === 'independent' || d.mode === 'not_applicable'
  return record(d, ['mode', 'options']) && d.mode === 'exact' && Array.isArray(d.options)
    && d.options.every(option => record(option, ['documentType', 'issuingCountryCode']))
}

function rebuiltRegistry(value: unknown): QuellenRegistry | null {
  if (!record(value, ['sources', 'blockedDomains', 'contentIdentity'])) return null
  const graph = value.contentIdentity
  if (!record(graph, ['authorityRegistry', 'items', 'representations', 'profiles']) || !Array.isArray(graph.profiles)) return null
  if (!graph.profiles.every(pin => record(pin, ['identityProfileId', 'identityProfileVersion', 'current']))) return null
  // The constructor requires code profiles but retains only their pins. This
  // locally owned rejecting function cannot verify a body or perform any I/O.
  // No caller-supplied verifier is accepted, called or registered.
  const pins = graph.profiles as Omit<ContentIdentityProfileDefinition, 'verify'>[]
  const profiles = pins.map(pin => ({ ...pin,
    verify: () => ({ ok: false as const, reason: 'invalid_response' as const }),
  }))
  const rebuilt = createContentIdentityGraph(graph.authorityRegistry as QuellenRegistry, graph.items, graph.representations, profiles)
  if (!rebuilt.ok) return null
  const authority = { sources: value.sources, blockedDomains: value.blockedDomains }
  if (!isDeepStrictEqual(authority, rebuilt.value.authorityRegistry)
    || !isDeepStrictEqual(graph.authorityRegistry, rebuilt.value.authorityRegistry)) return null
  return Object.freeze({ ...rebuilt.value.authorityRegistry, contentIdentity: rebuilt.value })
}

/**
 * Exact data envelope: {coverage, scope, factKind, registry, descriptors, candidates}.
 * Pass [] candidates to inspect prepared intents, then replay with synthetic
 * pairs. No callback, ready plan, clock, caller trust flag, state or live transport.
 * Bad batches fail atomically without echoing a rejected URL or caller metadata.
 */
export function discoverOfficialTruthSourcesOffline(input: unknown): SourceDiscoveryResult {
  if (!boundedData(input)) return blocked('invalid_data')
  if (!record(input, ['coverage', 'scope', 'factKind', 'registry', 'descriptors', 'candidates'])) return blocked('invalid_envelope')
  try {
    const coverage = input.coverage as OfficialTruthAbdeckung
    const decision = officialTruthRechercheEntscheiden(coverage, input.scope as RegelScope)
    if (decision.action === 'blocked_invalid') return blocked(decision.reason)
    if (input.factKind !== coverage.factKind) return blocked('fact_kind_mismatch')
    if (!Array.isArray(input.candidates) || input.candidates.length > 16
      || !input.candidates.every(pair => record(pair, ['sourceId', 'url'])
        && typeof pair.sourceId === 'string' && typeof pair.url === 'string')) return blocked('invalid_candidates')
    if (!Array.isArray(input.descriptors) || !input.descriptors.every(descriptorShape)) return blocked('invalid_source_plan')
    const registry = rebuiltRegistry(input.registry)
    if (!registry) return blocked('invalid_identity_graph')
    if (decision.action === 'none') return Object.freeze({ ...UNQUALIFIED, status: 'no_research', reason: 'current' })
    const request = decision.request
    const plan = officialTruthRechercheAusfuehrungsplan(request, registry, input.descriptors)
    if (plan.status === 'blocked_invalid') return blocked(plan.reason)
    const identity = { requestKey: plan.requestKey, ruleScopeKey: plan.ruleScopeKey, factKind: plan.factKind }
    if (plan.status === 'no_eligible_official_source') return Object.freeze({ ...UNQUALIFIED, ...identity,
      status: 'gap_unqualified', reason: 'no_eligible_official_source', intents: EMPTY, candidates: EMPTY })
    const intents = discoveryQueryIntents(request, plan)
    if (!intents) return blocked('query_budget_exceeded')
    const checked = officialTruthEntdeckteUrlKandidatenPruefen({ request, registry, descriptors: input.descriptors, candidates: input.candidates })
    if (checked.status === 'blocked') return blocked(checked.reason)
    if (checked.candidates.length === 0) return Object.freeze({ ...UNQUALIFIED, ...identity,
      status: 'gap_unqualified', reason: 'no_candidate_hits', intents, candidates: EMPTY })
    return Object.freeze({ ...UNQUALIFIED, ...identity, status: 'ready_candidate_urls', reason: 'candidate_only',
      intents, candidates: checked.candidates })
  } catch { return blocked('invalid_data') }
}
