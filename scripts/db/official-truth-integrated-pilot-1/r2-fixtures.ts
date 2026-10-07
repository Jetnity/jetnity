// Historical adversarial fixtures only. Recompute canonical identities and all
// ancestor Pins; these values never reconstruct a live origin or executable.
import assert from 'node:assert/strict'
import { createIntegratedPilotArtifact, type LocalIntegratedPilotEnvelope, type IntegratedPilotArtifactInput } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { provenanceCanonical, type Pin } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { contentEvidenceVersionV2 } from '../../../lib/readiness/official-truth-content-identity'
import { evidenceSuchschluessel } from '../../../lib/readiness/evidence'
import { regelScopeAusEvidenceScope } from '../../../lib/readiness/rule-claims'
import { officialTruthReviewIdentityV3 } from '../../../lib/readiness/official-truth-rule-review-fingerprint'
import { rewriteIntegratedFixture } from './integrated-proof'

type Value = Record<string, unknown>
const parse = (bytes: Uint8Array): Value => JSON.parse(Buffer.from(bytes).toString('utf8'))
const bytes = (value: unknown): Uint8Array => { const text = provenanceCanonical(value); assert.notEqual(text, null); return Buffer.from(text!) }
const good = <T>(result: { ok: true; value: T } | { ok: false; reason: string }): T => {
  assert.equal(result.ok, true, JSON.stringify(result)); if (!result.ok) throw Error('r2_fixture_prerequisite'); return result.value
}
export function r2DescriptorFixture(envelope: LocalIntegratedPilotEnvelope, patch: Value, id = 'otx_integrated_primary') {
  return rewriteIntegratedFixture(envelope, id, value => {
    const content = value.content as Value
    return { ...value, content: { ...content, descriptor: { ...(content.descriptor as Value), ...patch } } }
  })
}
export function r2RepresentationFixture(envelope: LocalIntegratedPilotEnvelope, count: number) {
  const definition = envelope.bundle.artifacts.find(a => a.pin.id === 'otx_integrated_primary')!
  const descriptor = (parse(definition.canonicalBytes).content as Value).descriptor as Value
  const original = (descriptor.representations as Value[])[0]!
  return r2DescriptorFixture(envelope, { representations: [original, ...Array.from({ length: count - 1 }, (_, i) => ({ ...original, representationId: `r2_alternative_${String(i + 1).padStart(2, '0')}` }))] })
}

export function r2SemanticFixtures(primary: LocalIntegratedPilotEnvelope) {
  const definition = primary.bundle.artifacts.find(a => a.pin.id === 'otx_integrated_primary')!
  const descriptor = (parse(definition.canonicalBytes).content as Value).descriptor as Value
  const extraPath = (path: string) => r2DescriptorFixture(primary, { urlAllowlist: [...descriptor.urlAllowlist as Value[], { kind: 'path', host: 'authority.example', path }] })
  const validity = primary.bundle.artifacts.find(a => a.artifactType === 'validity_origin')!
  const locator = (pointer: string) => rewriteIntegratedFixture(primary, validity.pin.id, value => {
    const c = value.content as Value, basis = c.validFromBasis as Value
    return { ...value, content: { ...c, validFromBasis: { ...basis, locator: { kind: 'json_pointer', pointer } } } }
  })
  const catalog = primary.bundle.artifacts.find(a => a.artifactType === 'catalog_snapshot')!
  const displayName = (name: string) => rewriteIntegratedFixture(primary, catalog.pin.id, value => {
    const c = value.content as Value, registry = c.registry as Value, graph = registry.contentIdentity as Value
    const sources = (registry.sources as Value[]).map(source => ({ ...source, publisherName: name, authorityName: name }))
    return { ...value, content: { ...c, registry: { ...registry, sources, contentIdentity: { ...graph, authorityRegistry: { ...(graph.authorityRegistry as Value), sources } } } } }
  })
  const implementation = primary.bundle.artifacts.find(a => a.artifactType === 'implementation_bundle')!
  const sourceText = (utf8: string) => rewriteIntegratedFixture(primary, implementation.pin.id, value => ({ ...value,
    content: { ...(value.content as Value), bundleBase64: Buffer.from(bytes({ schema: 'implementation-source-bundle-v1', files: [{ path: 'r2-text.txt', utf8 }] })).toString('base64') } }))
  return {
    positive: [
      ['unchanged_rehashed', r2ScopeFixture(primary, {})],
      ['travel_date_with_plan', r2ScopeFixture(primary, { travelDate: true, evaluationPlan: true })],
      ['representations_9', r2RepresentationFixture(primary, 9)],
      ['representations_16', r2RepresentationFixture(primary, 16)],
      ['canonical_extra_mime', r2DescriptorFixture(primary, { contentTypes: ['application/json', 'application/x-r2!#$&^_.+'] })],
      ['canonical_path_200', extraPath('/' + 'a'.repeat(199))],
      ['canonical_locator_utf16_256', locator('/a' + '😀'.repeat(127))],
      ['canonical_display_name_utf16_80', displayName('😀'.repeat(40))],
      ['canonical_implementation_text_utf16_524288', sourceText('a'.repeat(524_286) + '😀')],
    ] as const,
    negative: [
      ['candidate_scope_mismatch', r2ScopeFixture(primary, { requirementType: 'passport' })],
      ['selected_invalid_mime', r2DescriptorFixture(primary, { contentTypes: ['application/json', 'not-a-mime-type'] })],
      ['unselected_invalid_mime', r2DescriptorFixture(primary, { contentTypes: ['application/json', 'not-a-mime-type'] }, 'otx_integrated_composed')],
      ['unasserted_date_with_plan', r2ScopeFixture(primary, { evaluationPlan: true })],
      ['travel_date_without_plan', r2ScopeFixture(primary, { travelDate: true })],
      ['representations_17', r2RepresentationFixture(primary, 17)],
      ['path_dot_segments', extraPath('/a/../b')],
      ['path_noncanonical_characters', extraPath('/bad path')],
      ['path_201', extraPath('/' + 'a'.repeat(200))],
      ['validity_locator_257', locator('/' + 'a'.repeat(256))],
      ['validity_locator_utf16_257', locator('/' + '😀'.repeat(128))],
      ['display_name_utf16_81', displayName('😀'.repeat(40) + 'a')],
      ['display_name_noncanonical_whitespace', displayName('Authority\u00a0')],
      ['implementation_text_utf16_524289', sourceText('a'.repeat(524_287) + '😀')],
    ] as const,
  }
}

/** Scope mutations preserve the candidate namespace, recomputing Evidence v2,
 * review-v3, selection/proof/candidate hashes, complete role edges, B and K. */
export function r2ScopeFixture(envelope: LocalIntegratedPilotEnvelope, options: Readonly<{
  requirementType?: 'visa' | 'passport'; travelDate?: boolean; evaluationPlan?: boolean
}>) {
  const payload = parse(envelope.bundle.receiptBytes), global = payload.globalCell as Value
  const previousScope = global.scope as Value
  const scopeResult = regelScopeAusEvidenceScope({ ...previousScope,
    requirementType: options.requirementType ?? previousScope.requirementType,
    validity: options.travelDate ? { mode: 'travel_date', travelDate: '2026-10-06' } : { mode: 'not_applicable' } })
  assert.ok(scopeResult.ok)
  const scope = scopeResult.scope, identities = new Map<string, Value>(), replacements = new Map<string, string>()
  replacements.set(global.ruleScopeKey as string, scopeResult.key)
  const all = envelope.bundle.artifacts.map(a => parse(a.canonicalBytes))
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(collect); return }
    if (!value || typeof value !== 'object') return
    const v = value as Value
    if (v.identitySchema === 2 && typeof v.lookupKey === 'string' && typeof v.versionId === 'string') {
      assert.equal(typeof v.sourceId, 'string'); assert.equal(typeof v.contentItemId, 'string'); assert.equal(typeof v.representationId, 'string')
      const lookup = evidenceSuchschluessel({ ...scope, sourceId: v.sourceId }, { sourceId: v.sourceId as string, contentItemId: v.contentItemId as string, representationId: v.representationId as string })
      assert.ok(lookup.ok)
      const { versionId, ...preimage } = v
      const identity = good(contentEvidenceVersionV2({ ...preimage, lookupKey: lookup.key }))
      identities.set(versionId as string, { ...identity.identity, versionId: identity.versionId })
      replacements.set(versionId as string, identity.versionId)
    }
    Object.values(v).forEach(collect)
  }
  all.forEach(collect)
  let plan: IntegratedPilotArtifactInput | null = null
  if (options.evaluationPlan) {
    const contract = envelope.bundle.artifacts.find(a => a.artifactType === 'semantic_contract')!
    const c = parse(contract.canonicalBytes).content as { implementation: Pin }
    plan = good(createIntegratedPilotArtifact('semantic_contract', 'r2-evaluation-date-plan', 1,
      { contract: 'evaluation_date_plan', implementation: c.implementation, implementationDependencies: [] }))
  }
  const transform = (value: unknown): unknown => {
    if (typeof value === 'string') return replacements.get(value) ?? value
    if (Array.isArray(value)) return value.map(transform)
    if (!value || typeof value !== 'object') return value
    const v = value as Value
    if (v.identitySchema === 2 && typeof v.sourceId === 'string' && typeof v.versionId === 'string' && identities.has(v.versionId)) {
      const identity = identities.get(v.versionId)!
      if ('lookupKey' in v) return identity
      const { lookupKey, ...compact } = identity; void lookupKey; return compact
    }
    if ('destinationCountryCode' in v && 'credentialOption' in v && typeof v.requirementType === 'string' && 'validity' in v) return { ...scope, ...('sourceId' in v ? { sourceId: v.sourceId } : {}) }
    const next = Object.fromEntries(Object.entries(v).map(([key, child]) => [key, transform(child)]))
    if ('dimensionBasis' in next) {
      const dimensions = next.dimensionBasis as Value
      for (const [key, category] of Object.entries(scope)) dimensions[key] = { ...(dimensions[key] as Value), category }
      next.evaluationDatePlan = plan?.pin ?? null
    }
    return next
  }
  let rewritten = all.map(transform) as Value[]
  for (const value of rewritten) if (value.kind === 'AutonomousReviewConstructionV1') {
    const v = value.value as Value, preimage = v.safePreimage as Value
    const review = officialTruthReviewIdentityV3(preimage.candidate as Parameters<typeof officialTruthReviewIdentityV3>[0], preimage.supports as Parameters<typeof officialTruthReviewIdentityV3>[1])
    assert.ok(review.ok)
    replacements.set(v.reviewPacketKey as string, `review-packet:v3:${review.digest}`)
  }
  rewritten = rewritten.map(transform) as Value[]
  const artifacts = envelope.bundle.artifacts.map((a, i) => ({ ...a, canonicalBytes: bytes(rewritten[i]) }))
  if (plan) artifacts.push(plan)
  const pending = { profile: envelope.profile, bundle: { ...envelope.bundle, artifacts,
    receiptBytes: bytes(transform(payload)), custodyBindingBytes: bytes(transform(parse(envelope.bundle.custodyBindingBytes))) } }
  return rewriteIntegratedFixture(pending, '__rehash_all__', value => value)
}
