// SYNTHETIC TEST ORIGINALS ONLY. No runtime imports this module. No network.
import assert from 'node:assert/strict'
import { sha256Hex } from '@/lib/readiness/digest'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { contentEvidenceLookupV3, createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { officialTruthTrustedFactExtrahierenMitDefinitionen, consumeOfficialTruthTrustedFactExecutionContext,
  type OfficialTruthExtractorDefinition } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { createV3WorkIdentity, readV3GlobalRuleContext, type V3GlobalRuleContext, type V3SourceObservationRecord,
  type V3ReadResult } from '../../contract'

export const METHOD = Object.freeze({ methodId: 'synthetic-e1-method', revision: 1 })
export const ref = (kind: string, seed: string) => `${kind}:v3:${sha256Hex(seed)}`
export const id = (kind: 'op3' | 'job3' | 'lease3' | 'ev2', seed: string) => `${kind}_${sha256Hex(seed).slice(0, 32)}`
export function must<T>(value: V3ReadResult<T>): T { if (!value.ok) assert.fail(value.reason); return value.value }
const SOURCE_IDS = ['synthetic-primary', 'synthetic-counter'] as const
export const source = (sourceId: typeof SOURCE_IDS[number]) => ({ sourceId, contentItemId: 'synthetic-publication',
  representationId: 'synthetic-json', contentItemVersion: 1, representationVersion: 1,
  identityProfileId: 'synthetic-e1-profile', identityProfileVersion: 1 })
const sourceUrl = (sourceId: string) => `https://${sourceId}.example/synthetic-rules`

export function makeSyntheticOriginals() {
  const created = quellenRegistryErstellen(SOURCE_IDS.map((sourceId) => ({ sourceId, sourceClass: 'official_authority',
    publisherName: 'Fiktiver E1-Testverlag', authorityName: 'Fiktive E1-Testbehörde', domains: [`${sourceId}.example`] })))
  assert.equal(created.ok, true); if (!created.ok) assert.fail('synthetic registry')
  const graph = createContentIdentityGraph(created.registry,
    SOURCE_IDS.map((sourceId) => ({ sourceId, contentItemId: 'synthetic-publication', contentItemVersion: 1, current: true,
      externalIdNamespace: 'synthetic', externalContentId: 'synthetic-rules', expectedPublisherIds: ['synthetic'], expectedAuthorityIds: ['synthetic'] })),
    SOURCE_IDS.map((sourceId) => ({ ...source(sourceId), current: true, requestUrls: [sourceUrl(sourceId)],
      expectedFinalUrl: sourceUrl(sourceId), expectedMediaType: 'application/json', expectedLocale: null, expectedSchema: null })),
    [{ identityProfileId: 'synthetic-e1-profile', identityProfileVersion: 1, current: true,
      verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  assert.equal(graph.ok, true); if (!graph.ok) assert.fail('synthetic graph')
  const registry = { ...created.registry, contentIdentity: graph.value }
  const control = { primaryPages: 9, counterPages: 8, epoch: 1, retrievedAt: '2026-11-09T08:00:00.000Z',
    primaryUnclear: false, counter: 'not_found' as 'not_found' | 'unreachable' | 'conflicts' | 'agrees',
    resolve: false, archive: false, extracts: 0 }
  function context(country = 'CH', destination = 'AQ') {
    return must(readV3GlobalRuleContext({ scope: { destinationCountryCode: destination, transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: [country] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: country, relatedCitizenshipCountryCode: country },
      residence: { mode: 'not_applicable' }, requirementType: 'blank_passport_pages', validity: { mode: 'not_applicable' } },
    route: 'direct_entry', conditions: { status: 'specified', expression: { op: 'atomic',
      predicate: { kind: 'travel_purpose', purpose: 'visitor' } } } }))
  }
  function extract(context: V3GlobalRuleContext, sourceId: typeof SOURCE_IDS[number]): V3SourceObservationRecord {
    const pages = sourceId === 'synthetic-primary' ? control.primaryPages : control.counterPages
    const original = JSON.stringify({ synthetic: true, epoch: control.epoch, fact: { kind: 'blank_passport_pages', minimumPages: pages } })
    const fingerprint = evidenceQuellenFingerprint(original); assert.ok(fingerprint)
    const identity = must(createV3WorkIdentity({ context, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }))
    const versionId = id('ev2', `${sourceId}|${context.scope.citizenship.countryCodes[0]}|${original}`)
    const lookup = contentEvidenceLookupV3(context.scope, { sourceId, contentItemId: 'synthetic-publication', representationId: 'synthetic-json' }); assert.ok(lookup.ok)
    if (!lookup.ok) assert.fail('lookup')
    const definition: OfficialTruthExtractorDefinition = { extractorId: `otx_e1_${sourceId.replaceAll('-', '_')}`,
      extractorVersion: 1, current: true, factKind: 'blank_passport_pages', sourceFamilyId: 'otf_synthetic',
      contentItemRefs: [{ sourceId, contentItemId: 'synthetic-publication' }], representations: [source(sourceId)],
      urlAllowlist: [{ kind: 'exact', canonicalUrl: sourceUrl(sourceId) }], contentTypes: ['application/json'], schemaFamily: 'ots_synthetic',
      policyId: null, policyVersion: null, requiredFieldPaths: [], match: () => ({ ok: true }),
      extract: ({ supports }) => { control.extracts++; const parsed = JSON.parse(supports[0].sourceSnapshot)
        return parsed.synthetic === true ? { ok: true, fact: parsed.fact } : { ok: false, reason: 'structure_not_recognized' } } }
    const input = { factKind: 'blank_passport_pages', requirementType: 'blank_passport_pages', scopeKey: identity.ruleScopeKey,
      scope: context.scope, evidenceQuality: 'explicit_primary_statement', policy: null, registry,
      supports: [{ versionId, sourceId, retrieval: { ...source(sourceId), identitySchema: 2,
        status: 'server_owned_official_retrieval', canonicalUrl: sourceUrl(sourceId), retrievedAt: control.retrievedAt,
        contentType: 'application/json', sourceSnapshot: original, sourceContentHash: fingerprint, redirectCount: 0 } }] }
    const execution = officialTruthTrustedFactExtrahierenMitDefinitionen(input, [definition])
    if (execution.status !== 'trusted_fact_extracted') assert.fail(execution.reason)
    assert.equal(consumeOfficialTruthTrustedFactExecutionContext({ ...execution }, input), null)
    const held = consumeOfficialTruthTrustedFactExecutionContext(execution, input); assert.ok(held)
    return { context, contextKey: identity.contextKey, fact: { schema: 1, fact: held.fact }, evidence: {
      versionId, lookupKey: lookup.value.key, source: source(sourceId), sourceFingerprintProtocol: 1,
      sourceContentHash: fingerprint, retrievedAt: control.retrievedAt,
      legalValidity: { status: 'specified', validFrom: '2026-11-01', validUntil: '2026-12-31' } } }
  }
  function proposal(seed: string, country = 'CH', jobId = id('job3', 'direct-upload'), destination = 'AQ') {
    const value = context(country, destination)
    const identity = must(createV3WorkIdentity({ context: value, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }))
    return { schema: 3, kind: 'untrusted_research_proposal', jobId, operationId: id('op3', seed), context: value,
      contextKey: identity.contextKey, research: identity.research,
      // Deliberately untrusted and different from original: only the extractor may decide.
      proposedFact: { schema: 1, fact: { kind: 'blank_passport_pages', minimumPages: 1 } },
      references: [{ source: { sourceId: 'synthetic-primary', contentItemId: 'synthetic-publication', representationId: 'synthetic-json' },
        claimedRetrievedAt: '2026-11-09T00:00:00.000Z', claimedValidity: { status: 'specified', validFrom: null, validUntil: null } }] }
  }
  return { registry, control, context, extract, proposal }
}
