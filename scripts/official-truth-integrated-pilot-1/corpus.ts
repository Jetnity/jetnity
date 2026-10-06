// Explicitly synthetic developer corpus. Never imported by a shipped application root.
// Only DNS/HTTP/clock/authority are simulated. All legal parsing and selection run normally.
import { immutable, provenanceCanonical } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { contentIdentityBinding, createContentIdentityGraph, type ContentIdentityProfileDefinition,
  type ContentItemDescriptor, type RepresentationDescriptor } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { officialTruthCompositionCitationKey, type OfficialTruthCompositionPolicy } from '@/lib/readiness/official-truth-composition-policy-registry'
import type { OfficialTruthExtractorDefinition, OfficialTruthExtractorKontext } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'

export const PILOT_SOURCE = 'synthetic-pilot-authority'
export const PILOT_ORIGIN_TIME = '2026-10-06T12:00:00.000Z'
export const PILOT_REFERENCE_TIME = '2026-10-06T12:01:00.000Z'
export const PILOT_COMPLETION_TIME = '2026-10-06T12:01:01.000Z'
export const PILOT_ITEMS = ['composed_effect', 'composed_mode', 'primary_rule'] as const
export type PilotMode = 'primary' | 'composed'
export type PilotItem = typeof PILOT_ITEMS[number]
export const pilotUrl = (item: PilotItem) => `https://regulations.example/rules/${item}`
export const pilotStartUrl = (item: PilotItem) => `https://regulations.example/start/${item}`
export const PILOT_SCOPE = immutable({ destinationCountryCode: 'GB', transitCountryCode: null,
  citizenship: { mode: 'required', countryCodes: ['CH'] },
  credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
  residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } } as const)

// Finite whole-response language: an unknown/unused key cannot be ignored.
// Values are fictional conformance law, explicitly not a statement about GB/CH.
export function pilotBody(item: PilotItem): string {
  return provenanceCanonical({ schema: 'synthetic-public-regulation-v1', publication: item,
    ...(item !== 'composed_mode' ? { effect: 'required' } : {}),
    ...(item !== 'composed_effect' ? { visaMode: 'electronic_visa' } : {}),
    validity: { from: null, until: null } })!
}
function parse(item: PilotItem, text: string) {
  if (text !== pilotBody(item)) return null
  return JSON.parse(text) as { effect?: 'required'; visaMode?: 'electronic_visa' }
}
const profiles: readonly ContentIdentityProfileDefinition[] = immutable([{
  identityProfileId: 'synthetic-pilot-whole-response', identityProfileVersion: 1, current: true,
  verify: ({ item, representation, responseText, finalUrl, mediaType }) => {
    if (!PILOT_ITEMS.includes(item.contentItemId as PilotItem) || finalUrl !== pilotUrl(item.contentItemId as PilotItem)
      || mediaType !== 'application/json' || !parse(item.contentItemId as PilotItem, responseText)) return { ok: false, reason: 'invalid_response' }
    return { ok: true, identity: contentIdentityBinding(representation) }
  },
}])

function sourceRegistry() {
  const source = quellenRegistryErstellen([{ sourceId: PILOT_SOURCE, sourceClass: 'official_authority',
    publisherName: 'Synthetic conformance authority', authorityName: 'Synthetic conformance authority', domains: ['regulations.example'] }])
  if (!source.ok) throw Error('synthetic_source_invalid')
  const items: ContentItemDescriptor[] = PILOT_ITEMS.map(contentItemId => ({ sourceId: PILOT_SOURCE,
    contentItemId, contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic-publication',
    externalContentId: contentItemId, expectedPublisherIds: ['synthetic-publisher'], expectedAuthorityIds: ['synthetic-authority'] }))
  const representations: RepresentationDescriptor[] = items.map(item => ({ sourceId: item.sourceId,
    contentItemId: item.contentItemId, contentItemVersion: 1, representationId: 'json', representationVersion: 1,
    current: true, requestUrls: [pilotStartUrl(item.contentItemId as PilotItem)], expectedFinalUrl: pilotUrl(item.contentItemId as PilotItem),
    expectedMediaType: 'application/json', identityProfileId: profiles[0]!.identityProfileId, identityProfileVersion: 1,
    expectedLocale: null, expectedSchema: 'synthetic-public-regulation-v1' }))
  const graph = createContentIdentityGraph(source.registry, items, representations, profiles)
  if (!graph.ok) throw Error(`synthetic_graph_${graph.reason}`)
  return immutable({ ...graph.value.authorityRegistry, contentIdentity: graph.value })
}
const registry = sourceRegistry()
const ref = (item: PilotItem) => ({ sourceId: PILOT_SOURCE, contentItemId: item })
const binding = (item: PilotItem) => contentIdentityBinding(registry.contentIdentity!.representations.find(r => r.contentItemId === item)!)
const policy: OfficialTruthCompositionPolicy = immutable({ policyId: 'otp_integrated_pilot', policyVersion: 1, current: true,
  factKind: 'requirement_effect', requirementType: 'visa', contentItemRefs: [ref('composed_effect'), ref('composed_mode')],
  sourceFamilyId: 'otf_integrated_pilot', schemaFamily: 'ots_integrated_pilot', applicabilitySchema: null,
  completeness: 'joint_complete_fact', assignments: [
    { target: { kind: 'fact_field', fieldPath: 'effect' }, contentItemRefs: [ref('composed_effect')], relation: 'single_content_item', role: 'complementary_part' },
    { target: { kind: 'fact_field', fieldPath: 'visaMode' }, contentItemRefs: [ref('composed_mode')], relation: 'single_content_item', role: 'complementary_part' },
  ] })
function extract(context: OfficialTruthExtractorKontext) {
  const observations: { targetKey: string; sourceId: string; contentItemId: string; canonical: string }[] = []
  let effect: 'required' | undefined, visaMode: 'electronic_visa' | undefined
  for (const support of context.supports) {
    const value = parse(support.contentItemId as PilotItem, support.sourceSnapshot)
    if (!value) return { ok: false, reason: 'structure_not_recognized' }
    for (const field of ['effect', 'visaMode'] as const) {
      if (value[field] === undefined) continue
      observations.push({ targetKey: officialTruthCompositionCitationKey({ kind: 'fact_field', fieldPath: field }),
        sourceId: support.sourceId, contentItemId: support.contentItemId, canonical: provenanceCanonical(value[field])! })
    }
    effect ??= value.effect; visaMode ??= value.visaMode
  }
  if (!effect || !visaMode) return { ok: false, reason: 'fact_incomplete' }
  const fact = { kind: 'requirement_effect', effect, visaMode }
  return context.evidenceQuality === 'explicit_primary_statement' ? { ok: true, fact } : { ok: true, fact, observations }
}
function definition(mode: PilotMode): OfficialTruthExtractorDefinition {
  const items: PilotItem[] = mode === 'primary' ? ['primary_rule'] : ['composed_effect', 'composed_mode']
  return immutable({ extractorId: `otx_integrated_${mode}`, extractorVersion: 1, current: true,
    factKind: 'requirement_effect', sourceFamilyId: 'otf_integrated_pilot', contentItemRefs: items.map(ref),
    representations: items.map(binding), urlAllowlist: items.map(item => ({ kind: 'exact' as const, canonicalUrl: pilotUrl(item) })),
    contentTypes: ['application/json'], schemaFamily: 'ots_integrated_pilot',
    policyId: mode === 'composed' ? policy.policyId : null, policyVersion: mode === 'composed' ? 1 : null,
    requiredFieldPaths: mode === 'primary' ? [] : ['effect', 'visaMode'],
    match: context => ({ ok: context.supports.every(s => parse(s.contentItemId as PilotItem, s.sourceSnapshot) !== null) }), extract })
}
const scope = regelScopeAusEvidenceScope(PILOT_SCOPE)
if (!scope.ok) throw Error('synthetic_scope_invalid')
export const PILOT_CORPUS = immutable({ registry, profiles, policy, scope: scope.scope, ruleScopeKey: scope.key,
  extractors: [definition('composed'), definition('primary')] })
