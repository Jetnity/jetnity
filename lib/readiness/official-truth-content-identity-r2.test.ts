// Synthetic coordination fixtures and end-to-end R2 regressions. No live transport.
// Other in-scope tests reuse these fixtures; this file registers its tests only
// when run as a test entry, so imports do not duplicate the coordination suite.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  contentEvidenceLookupV3, contentEvidenceVersionV2, createContentIdentityGraph, contentIdentityBinding, contentRepresentationFromRegistry,
  type ContentIdentityProfileDefinition, type ContentItemDescriptor, type RepresentationDescriptor,
} from './official-truth-content-identity'
import { quellenUrlAufloesen, quellenRegistryErstellen, type QuellenRegistry } from './source-registry'
import { evidenceKandidatAusModell, evidenceKandidatAkzeptieren, evidenceQuellenFingerprint } from './evidence'
import { quellenKatalogSnapshotAntwort } from './official-truth-source-catalog-server'

export const r2Profiles: readonly ContentIdentityProfileDefinition[] = Object.freeze([Object.freeze({
  identityProfileId: 'synthetic_identity', identityProfileVersion: 1, current: true,
  verify: ({ representation, responseText }: Parameters<ContentIdentityProfileDefinition['verify']>[0]) =>
    responseText === 'SYNTHETIC_WRONG_IDENTITY'
      ? { ok: false as const, reason: 'identity_mismatch' as const }
      : { ok: true as const, identity: contentIdentityBinding(representation) },
})])

export type R2FixturePublication = {
  url: string; itemId?: string; representationId?: string; mediaType?: string
  requestUrls?: readonly string[]
}

export function r2Registry(authorities: QuellenRegistry, publications: readonly (string | R2FixturePublication)[]): QuellenRegistry {
  const items: ContentItemDescriptor[] = []
  const representations: RepresentationDescriptor[] = []
  const urls = new Set<string>()
  for (const [index, raw] of publications.entries()) {
    const fixture = typeof raw === 'string' ? { url: raw } : raw
    const resolved = quellenUrlAufloesen(authorities, fixture.url)
    // Authority-negative fixtures intentionally have no content registration.
    if (!resolved.ok || resolved.source.sourceClass !== 'official_authority') continue
    const address = new URL(resolved.canonicalUrl)
    if (address.port) continue
    address.hash = ''
    const url = address.toString()
    if (urls.has(url)) continue
    urls.add(url)
    const ref = { sourceId: resolved.source.sourceId, contentItemId: fixture.itemId ?? `fixture_item_${index}` }
    if (!items.some((item) => item.sourceId === ref.sourceId && item.contentItemId === ref.contentItemId)) {
      items.push({ ...ref, contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic_namespace',
        externalContentId: ref.contentItemId, expectedPublisherIds: ['synthetic_publisher'], expectedAuthorityIds: ['synthetic_authority'] })
    }
    representations.push({ ...ref, representationId: fixture.representationId ?? 'fixture_representation',
      contentItemVersion: 1, representationVersion: 1, current: true,
      requestUrls: fixture.requestUrls ?? [url], expectedFinalUrl: url, expectedMediaType: fixture.mediaType ?? 'text/plain',
      identityProfileId: 'synthetic_identity', identityProfileVersion: 1, expectedLocale: null, expectedSchema: null })
  }
  const graph = createContentIdentityGraph(authorities, items, representations, r2Profiles)
  assert.equal(graph.ok, true, graph.ok ? undefined : graph.reason)
  if (!graph.ok) throw new Error('invalid synthetic fixture')
  return Object.freeze({ ...graph.value.authorityRegistry, contentIdentity: graph.value })
}

export function r2Binding(registry: QuellenRegistry, url: string) {
  const rep = contentRepresentationFromRegistry(registry, url)
  assert.equal(rep.ok, true, rep.ok ? undefined : rep.reason)
  if (!rep.ok) throw new Error('invalid synthetic fixture')
  return contentIdentityBinding(rep.value)
}

export function r2Ref(registry: QuellenRegistry, url: string) {
  const { sourceId, contentItemId } = r2Binding(registry, url)
  return { sourceId, contentItemId }
}

function r2Evidence(registry: QuellenRegistry, scope: unknown, url: string, sourceSnapshot: string, retrievedAt: string) {
  const representation = contentRepresentationFromRegistry(registry, url)
  assert.ok(representation.ok)
  if (!representation.ok) throw new Error('invalid synthetic fixture')
  const candidate = evidenceKandidatAusModell({ scope }, {
    canonicalUrl: url, sourceSnapshot, retrievedAt, contentType: representation.value.expectedMediaType,
  }, registry)
  assert.ok(candidate.ok, candidate.ok ? undefined : candidate.reason)
  if (!candidate.ok) throw new Error('invalid synthetic fixture')
  const accepted = evidenceKandidatAkzeptieren(candidate.evidence, registry)
  assert.ok(accepted.ok)
  if (!accepted.ok) throw new Error('invalid synthetic fixture')
  return accepted.evidence
}

function r2Catalog(registry: QuellenRegistry): Record<string, unknown> {
  const response = quellenKatalogSnapshotAntwort(registry)
  assert.ok(response)
  return response
}

export function r2CatalogRows(sources: unknown, publications: readonly (string | R2FixturePublication)[]) {
  if (Array.isArray(sources)) {
    const registry = quellenRegistryErstellen(sources.map((row) => ({ sourceId: row?.source_id, sourceClass: row?.source_class,
      publisherName: row?.publisher_name, authorityName: row?.authority_name, domains: row?.domains })))
    if (registry.ok) return r2Catalog(r2Registry(registry.registry, publications))
  }
  return { ok: true, operation: 'read_registry', identity_schema: 2, sources,
    blocked_domains: [], content_items: [], item_versions: [], representations: [], representation_urls: [], url_reservations: [] }
}

// Canonical identities for structural coverage/grammar fixtures, with a fixed
// regulatory cell and clock. Callers deliberately vary only their tested projection.
export function r2IdentityFixture(token: string) {
  const binding = { sourceId: 'example-border-authority', contentItemId: `synthetic_item_${token}`,
    contentItemVersion: 1, representationId: 'synthetic_representation', representationVersion: 1,
    identityProfileId: 'synthetic_identity', identityProfileVersion: 1 }
  const lookup = contentEvidenceLookupV3({ destinationCountryCode: 'JP', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } },
    { sourceId: binding.sourceId, contentItemId: binding.contentItemId, representationId: binding.representationId })
  assert.ok(lookup.ok)
  const identity = { ...binding, identitySchema: 2 as const, lookupKey: lookup.value.key,
    canonicalUrl: `https://gov.example/${token}`, contentType: 'text/plain', sourceContentHash: evidenceQuellenFingerprint(`synthetic identity ${token}`)!,
    retrievedAt: '2026-10-01T00:00:00.000Z', validFrom: null, validUntil: null }
  const version = contentEvidenceVersionV2(identity)
  assert.ok(version.ok)
  return { ...identity, versionId: version.value.versionId }
}


// This suite exercises the complete dormant runtime with ONE synthetic authority.
// Its two renderings of item_a intentionally share authority and publication identity.
if (process.argv[1] === fileURLToPath(import.meta.url)) describe('R2 coordinated dormant runtime', async () => {
  const { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } = await import('./official-truth-content-identity')
  const { akzeptierteEvidenceLesen, evidenceQuellenFingerprint } = await import('./evidence')
  const { quellenKatalogLesen, OFFICIAL_TRUTH_SOURCE_CATALOG_V2 } = await import('./official-truth-source-catalog-server')
  const { decideOfficialTruthServerOwnedRetrieval } = await import('./official-truth-server-owned-retrieval')
  const { decideOfficialTruthSameRequestProof } = await import('./official-truth-same-request-proof-server')
  const { decideOfficialTruthSameRequestTrustedFactExtraction } = await import('./official-truth-same-request-extraction-server')
  const { officialTruthTrustedFactExtrahierenMitDefinitionen, OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } = await import('./official-truth-trusted-fact-extractor-registry')
  const { OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY, officialTruthCompositionCitationKey, isOfficialTruthCompositionSeal, officialTruthCompositionSealView } = await import('./official-truth-composition-policy-registry')
  const { REGULIERUNGS_REGION_PINS } = await import('./regulierungs-anwendbarkeit')
  const { officialTruthRechercheEntscheiden } = await import('./official-truth-research-request')
  const { regelScopeAusEvidenceScope, regelKandidatAkzeptieren } = await import('./rule-claims')
  const { officialTruthRegelKandidatAusEvidence } = await import('./official-truth-rule-candidate')
  const { officialTruthRegelReviewPacketFingerprint } = await import('./official-truth-rule-review-fingerprint')
  const { officialTruthRegelReviewEntscheidungsabsicht } = await import('./official-truth-rule-review-decision-intent')
  const { officialTruthAkzeptierteEvidenceAuffrischungVergleichen } = await import('./official-truth-refresh-diff')
  const { akzeptierteEvidenceSpeichern, OFFICIAL_TRUTH_STORE_ACCEPTED_V2 } = await import('./official-truth-store-server')
  const { decideOfficialTruthAutonomousPreacceptanceWitness } = await import('./official-truth-autonomous-preacceptance-witness-server')
  const { quellenInhaltRouten } = await import('./source-router')
  const NOW = '2026-10-04T12:00:00.000Z'
  const SOURCE = 'synthetic-authority'
  const A = 'https://authority.example/item-a'
  const API = 'https://authority.example/api/item-a'
  const B = 'https://authority.example/item-b'
  const SIBLING = 'https://authority.example/unregistered'
  const authority = quellenRegistryErstellen([{ sourceId: SOURCE, sourceClass: 'official_authority',
    publisherName: 'Synthetic Publisher', authorityName: 'Synthetic Authority', domains: ['authority.example'] }],
  { blockedDomains: ['blocked.example'] })
  assert.ok(authority.ok)
  const registry = r2Registry(authority.registry, [
    { url: A, itemId: 'item_a', representationId: 'html_a', mediaType: 'text/html' },
    { url: API, itemId: 'item_a', representationId: 'api_a', mediaType: 'application/json' },
    { url: B, itemId: 'item_b', representationId: 'html_b', mediaType: 'text/html' },
  ])
  const profiles: readonly ContentIdentityProfileDefinition[] = [{ ...r2Profiles[0]!, verify: ({ item, representation, responseText }) => {
    try {
      const body = JSON.parse(responseText.replace(/^<pre>|<\/pre>$/g, '')) as Record<string, unknown>
      if (body.item !== item.externalContentId || body.publisher !== item.expectedPublisherIds[0]
        || body.authority !== item.expectedAuthorityIds[0] || body.representation !== representation.representationId) {
        return { ok: false, reason: 'identity_mismatch' }
      }
      return { ok: true, identity: contentIdentityBinding(representation) }
    } catch { return { ok: false, reason: 'invalid_response' } }
  } }]
  const scope = { sourceId: SOURCE, destinationCountryCode: 'JP', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } }
  const cell = regelScopeAusEvidenceScope(scope)
  assert.ok(cell.ok)
  const research = officialTruthRechercheEntscheiden({ status: 'missing', ruleScopeKey: cell.key, factKind: 'requirement_effect' }, cell.scope)
  assert.equal(research.action, 'research')
  if (research.action !== 'research') throw new Error('synthetic request')
  const request = research.request
  const proposal = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const
  const metadata = (composed = false) => ({ factKind: 'requirement_effect',
    evidenceQuality: composed ? 'composed_from_multiple_primary_sources' : 'explicit_primary_statement', proposal })
  const body = (url: string) => {
    const rep = contentRepresentationFromRegistry(registry, url)
    assert.ok(rep.ok)
    const text = JSON.stringify({ item: rep.value.contentItemId, representation: rep.value.representationId,
      publisher: 'synthetic_publisher', authority: 'synthetic_authority' })
    return rep.value.expectedMediaType === 'text/html' ? `<pre>${text}</pre>` : text
  }
  const envelope = (url: string) => ({ request, sourceId: SOURCE,
    descriptors: [{ source: registry.sources[0]!, coverage: { destinationCountryCodes: ['JP'], transitCountryCodes: [],
      requirementTypes: ['visa'], citizenship: { mode: 'exact', countryCodes: ['CH'] }, residence: { mode: 'not_applicable' },
      documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] } } }],
    material: { canonicalUrl: url, retrievedAt: NOW, sourceSnapshot: body(url), contentType: url === API ? 'application/json' : 'text/html' } })
  const input = (urls: readonly string[]) => ({ supports: urls.map((url) => ({ umschlag: envelope(url),
    uhr: () => new Date(NOW), extraktion: null })), metadata: metadata(urls.length > 1) })
  const packetInput = (urls: readonly string[]) => ({ ...input(urls), supports: input(urls).supports.map((support) => ({
    ...support, umschlag: { ...support.umschlag, registry } })) })
  const catalog = (response: unknown = r2Catalog(registry), identityProfiles = profiles) => {
    const calls: unknown[] = []
    return { calls, identityProfiles, transport: { async aufrufen(payload: Record<string, unknown>) {
      calls.push(payload)
      assert.deepEqual(payload, { operation: 'read_registry' })
      return { ok: true as const, antwort: response }
    } } }
  }
  const proofDependencies = (cat = catalog()) => ({ catalog: cat, now: () => NOW,
    loadAuthority: async () => ({ status: 'authorized' as const, grant: 'role' as const, capability: 'official-truth-freigeben' as const }) })
  type Reply = { text?: string; media?: string; location?: string }
  function retrievalDependencies(cat: import('./official-truth-source-catalog-server').OfficialTruthSourceCatalogAbhaengigkeiten = catalog(), reply: (url: string) => Reply = () => ({})) {
    const calls: string[] = []
    const resolveCalls: string[] = []
    return { calls, resolveCalls, catalog: cat, now: () => new Date(NOW),
      resolve: async (hostname: string) => { resolveCalls.push(hostname); return [{ address: '8.8.8.8', family: 4 as const }] },
      http: async (req: Parameters<import('./official-truth-server-owned-retrieval').OfficialTruthServerOwnedRetrievalHttpClient>[0]) => {
        calls.push(req.url)
        await new Promise<void>((resolve, reject) => req.lookup(new URL(req.url).hostname, { all: false }, (error) => error ? reject(error) : resolve()))
        const response = reply(req.url)
        const headers: Record<string, string> = response.location ? { location: response.location }
          : { 'content-type': response.media ?? (req.url === API ? 'application/json' : 'text/html') }
        return { ok: true as const, status: response.location ? 302 : 200, headers: { get: (key: string) => headers[key] ?? null },
          body: (async function* () { yield new TextEncoder().encode(response.text ?? body(req.url)) })() }
      } }
  }
  const policy: import('./official-truth-composition-policy-registry').OfficialTruthCompositionPolicy = {
    policyId: 'otp_synthetic_r2', policyVersion: 1, current: true, factKind: 'requirement_effect', requirementType: 'visa',
    contentItemRefs: [r2Ref(registry, A), r2Ref(registry, B)], sourceFamilyId: 'otf_synthetic_r2', schemaFamily: 'ots_synthetic_r2',
    applicabilitySchema: null, completeness: 'joint_complete_fact', assignments: [
      { target: { kind: 'fact_field', fieldPath: 'effect' }, contentItemRefs: [r2Ref(registry, A)], relation: 'single_content_item', role: 'complementary_part' },
      { target: { kind: 'fact_field', fieldPath: 'visaMode' }, contentItemRefs: [r2Ref(registry, B)], relation: 'single_content_item', role: 'complementary_part' },
    ] }
  const extractor = (urls: readonly string[], counts: { match: number; extract: number }): import('./official-truth-trusted-fact-extractor-registry').OfficialTruthExtractorDefinition => ({
    extractorId: 'otx_synthetic_r2', extractorVersion: 1, current: true, factKind: 'requirement_effect',
    sourceFamilyId: 'otf_synthetic_r2', schemaFamily: 'ots_synthetic_r2', contentItemRefs: urls.map((url) => r2Ref(registry, url)),
    representations: urls.map((url) => r2Binding(registry, url)), urlAllowlist: urls.map((canonicalUrl) => ({ kind: 'exact', canonicalUrl })),
    contentTypes: ['application/json', 'text/html'], policyId: urls.length > 1 ? policy.policyId : null,
    policyVersion: urls.length > 1 ? 1 : null, requiredFieldPaths: urls.length > 1 ? ['effect', 'visaMode'] : [],
    match: () => { counts.match++; return { ok: true } },
    extract: () => { counts.extract++; return { ok: true, fact: proposal,
      ...(urls.length > 1 ? { observations: policy.assignments.flatMap((assignment) => assignment.contentItemRefs.map((ref) => ({
        ...ref, targetKey: officialTruthCompositionCitationKey(assignment.target), canonical: `synthetic:${officialTruthCompositionCitationKey(assignment.target)}` }))) } : {}) } },
  })
  async function extract(urls: readonly string[], options: { profiles?: readonly ContentIdentityProfileDefinition[]; reply?: (url: string) => Reply;
    mutateRetrieval?: (result: Awaited<ReturnType<typeof decideOfficialTruthServerOwnedRetrieval>>) => Awaited<ReturnType<typeof decideOfficialTruthServerOwnedRetrieval>> } = {}) {
    const counts = { match: 0, extract: 0, http: 0 }
    const external = catalog()
    const definition = extractor(urls, counts)
    const result = await decideOfficialTruthSameRequestTrustedFactExtraction(input(urls), {
      loadProof: (value) => decideOfficialTruthSameRequestProof(value, proofDependencies(external)),
      retrieve: async (value, transport) => {
        const deps = retrievalDependencies({ ...catalog(undefined, options.profiles ?? profiles), transport }, options.reply)
        const result = await decideOfficialTruthServerOwnedRetrieval(value, deps)
        counts.http += deps.calls.length
        return options.mutateRetrieval?.(result) ?? result
      },
      extract: (value) => officialTruthTrustedFactExtrahierenMitDefinitionen(value, [definition]),
      compositionPolicies: [policy], compositionExtractors: [definition],
    })
    return { result, counts, catalogCalls: external.calls }
  }

  test('R2 runtime imports perform no DB or network call with production registries empty', async () => {
    const { execFileSync } = await import('node:child_process')
    const script = `
      const assert = require('node:assert/strict');
      let calls = 0;
      const forbidden = () => { calls++; throw new Error('unexpected import network'); };
      globalThis.fetch = forbidden;
      require('node:https').request = forbidden;
      require('node:http').request = forbidden;
      require('node:net').connect = forbidden;
      require('node:net').createConnection = forbidden;
      for (const name of ['official-truth-source-catalog-server', 'official-truth-store-server',
        'official-truth-same-request-proof-server', 'official-truth-same-request-extraction-server',
        'official-truth-autonomous-preacceptance-witness-server']) require('./lib/readiness/' + name + '.ts');
      setImmediate(() => { assert.equal(calls, 0); process.stdout.write('imports_no_network'); });
    `
    const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://database.example', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key' }
    const output = execFileSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '-e', script],
      { encoding: 'utf8', env })
    assert.equal(output, 'imports_no_network')
  })
  test('R2 caller proof and profile witnesses cannot replace server-held authority', async () => {
    for (const injected of [{ proof: Object.freeze({ identitySchema: 2 }) }, { identityProfileId: 'synthetic_identity' },
      { contentItemId: 'item_b' }, { seal: Object.freeze({}) }]) {
      const cat = catalog()
      const result = await decideOfficialTruthSameRequestProof({ ...input([A]), ...injected }, proofDependencies(cat))
      assert.equal(result.status, 'blocked'); assert.equal(cat.calls.length, 0)
    }
  })
  test('R2 production registries remain frozen and exactly empty', () => {
    for (const list of [OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY, OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY,
      OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY, REGULIERUNGS_REGION_PINS]) {
      assert.deepEqual(list, []); assert.ok(Object.isFrozen(list))
    }
  })
  test('R2 exact registered URLs route to separate renderings; authority sibling is ineligible', () => {
    for (const url of [A, API, B]) {
      const route = quellenInhaltRouten(registry, SOURCE, url)
      assert.ok(route.ok); assert.deepEqual(contentIdentityBinding(route.representation), r2Binding(registry, url))
    }
    assert.equal(quellenInhaltRouten(registry, SOURCE, SIBLING).ok, false)
    assert.deepEqual(r2Ref(registry, A), r2Ref(registry, API))
    assert.notDeepEqual(r2Ref(registry, A), r2Ref(registry, B))
  })
  test('R2 catalog reads one complete frozen snapshot and round-trips blocked domains', async () => {
    const cat = catalog(); const read = await quellenKatalogLesen(cat)
    assert.ok(read.ok); assert.equal(cat.calls.length, 1); assert.deepEqual(read.registry.blockedDomains, ['blocked.example'])
    assert.ok(Object.isFrozen(read.registry.contentIdentity?.representations[0]?.requestUrls))
    const replay = await quellenKatalogLesen(catalog(r2Catalog(read.registry)))
    assert.deepEqual(replay, read)
  })
  test('R2 explicit empty catalog is valid, but cannot make an item eligible', async () => {
    const empty = r2Registry({ sources: [], blockedDomains: [] }, [])
    const read = await quellenKatalogLesen(catalog(r2Catalog(empty), [])); assert.ok(read.ok)
    assert.equal(quellenInhaltRouten(read.registry, SOURCE, A).ok, false)
  })
  test('R2 malformed, missing, v1 and inconsistent catalog responses are unavailable', async () => {
    const good = r2Catalog(registry)
    const broken = [null, {}, { ok: true, operation: 'read_registry', sources: [] }, { ...good, identity_schema: 1 },
      { ...good, blocked_domains: undefined }, { ...good, representations: [] }, { ...good, url_reservations: [] },
      { ...good, item_versions: [...good.item_versions as unknown[], ...(good.item_versions as unknown[])] },
      { ...good, sources: [...good.sources as unknown[], ...good.sources as unknown[]] },
      { ...good, unexpected: true }]
    for (const response of broken) assert.deepEqual(await quellenKatalogLesen(catalog(response)), { ok: false, reason: 'catalog_failed' })
  })
  test('R2 fresh retrieval verifies exact body identity before any legal extractor', async () => {
    const cat = catalog(); const deps = retrievalDependencies(cat)
    const result = await decideOfficialTruthServerOwnedRetrieval({ sourceId: SOURCE, url: A }, deps)
    assert.equal(result.status, 'server_owned_official_retrieval')
    if (result.status !== 'server_owned_official_retrieval') return
    assert.deepEqual(contentIdentityBinding(result), r2Binding(registry, A)); assert.equal(result.identitySchema, 2)
    assert.equal(cat.calls.length, 1); assert.deepEqual(deps.resolveCalls, ['authority.example']); assert.deepEqual(deps.calls, [A])
  })
  test('R2 replay starts at an exact registered request URL when the final URL is final-only', async () => {
    const start = 'https://authority.example/request-item-a'
    const finalOnly = r2Registry(authority.registry, [{ url: A, itemId: 'item_a', representationId: 'html_a',
      mediaType: 'text/html', requestUrls: [start] }])
    const external = catalog(r2Catalog(finalOnly))
    const counts = { match: 0, extract: 0 }
    const definition = extractor([A], counts)
    const httpCalls: string[] = []
    assert.equal(quellenInhaltRouten(finalOnly, SOURCE, A).ok, false)
    const result = await decideOfficialTruthSameRequestTrustedFactExtraction(input([A]), {
      loadProof: (value) => decideOfficialTruthSameRequestProof(value, proofDependencies(external)),
      retrieve: async (value, transport) => {
        assert.deepEqual(value, { sourceId: SOURCE, url: start })
        const deps = retrievalDependencies({ transport, identityProfiles: profiles }, (url) => url === start ? { location: A } : {})
        const retrieved = await decideOfficialTruthServerOwnedRetrieval(value, deps)
        httpCalls.push(...deps.calls)
        return retrieved
      },
      extract: (value) => officialTruthTrustedFactExtrahierenMitDefinitionen(value, [definition]),
    })
    assert.equal(result.status, 'same_request_trusted_fact_material', JSON.stringify(result))
    assert.deepEqual(httpCalls, [start, A]); assert.equal(external.calls.length, 1)
    assert.deepEqual(counts, { match: 1, extract: 1 })
  })
  test('R2 caller-invented item/profile binding is rejected before catalog or HTTP', async () => {
    for (const extra of [{ contentItemId: 'invented' }, { identityProfileId: 'invented' }, { representationId: 'invented' }]) {
      const cat = catalog(); const deps = retrievalDependencies(cat)
      const result = await decideOfficialTruthServerOwnedRetrieval({ sourceId: SOURCE, url: A, ...extra }, deps)
      assert.equal(result.status, 'blocked'); assert.equal(cat.calls.length, 0); assert.equal(deps.calls.length, 0)
    }
  })
  test('R2 same-host redirects cannot cross to another item or unregistered sibling', async () => {
    for (const location of [B, API, SIBLING]) {
      const deps = retrievalDependencies(catalog(), () => ({ location }))
      assert.deepEqual(await decideOfficialTruthServerOwnedRetrieval({ sourceId: SOURCE, url: A }, deps),
        { status: 'blocked', reason: 'representation_url_mismatch' })
      assert.deepEqual(deps.calls, [A])
    }
  })
  test('R2 absent or wrong profile version fails before HTTP and legal selection', async () => {
    for (const definitions of [[], [{ ...profiles[0]!, identityProfileVersion: 2 }]]) {
      const { result, counts } = await extract([A], { profiles: definitions })
      assert.equal(result.status, 'blocked'); assert.deepEqual(counts, { http: 0, match: 0, extract: 0 })
    }
  })
  test('R2 response item/publisher/authority/representation mismatch blocks before legal selection', async () => {
    for (const [field, value] of [['item', 'item_b'], ['publisher', 'other'], ['authority', 'other'], ['representation', 'api_a']]) {
      const parsed = JSON.parse(body(A).replace(/^<pre>|<\/pre>$/g, '')) as Record<string, unknown>
      parsed[field!] = value
      const { result, counts } = await extract([A], { reply: () => ({ text: `<pre>${JSON.stringify(parsed)}</pre>` }) })
      assert.deepEqual(result, { status: 'blocked', reason: 'content_identity_mismatch' })
      assert.deepEqual(counts, { http: 1, match: 0, extract: 0 })
    }
  })
  test('R2 canonical ev2/v3 identity is deterministic and distinguishes items and representations with identical text', () => {
    const a = r2Evidence(registry, scope, A, 'same synthetic text', NOW)
    const again = r2Evidence(registry, scope, A, 'same synthetic text', NOW)
    const api = r2Evidence(registry, scope, API, 'same synthetic text', NOW)
    const b = r2Evidence(registry, scope, B, 'same synthetic text', NOW)
    assert.deepEqual(a, again); assert.match(a.versionId, /^ev2_[a-f0-9]{32}$/); assert.match(a.lookupKey, /^evidence-key:v3:/)
    assert.equal(new Set([a.versionId, api.versionId, b.versionId]).size, 3)
    assert.equal(new Set([a.lookupKey, api.lookupKey, b.lookupKey]).size, 3)
    assert.equal(a.sourceContentHash, b.sourceContentHash); assert.equal(a.sourceContentHash, evidenceQuellenFingerprint('same synthetic text'))
  })
  test('R2 old ev1/lookup-v2 and every substituted identity field fail accepted Evidence reproof', () => {
    const accepted = r2Evidence(registry, scope, A, body(A), NOW)
    const changes = [{ versionId: accepted.versionId.replace('ev2_', 'ev1_') }, { lookupKey: accepted.lookupKey.replace(':v3:', ':v2:') },
      { identitySchema: 1 }, { contentItemId: 'item_b' }, { contentItemVersion: 2 }, { representationId: 'api_a' },
      { representationVersion: 2 }, { identityProfileId: 'other_profile' }, { identityProfileVersion: 2 }, { contentType: 'application/json' }]
    for (const change of changes) assert.equal(akzeptierteEvidenceLesen({ ...accepted, ...change } as typeof accepted, registry), null)
  })
  test('R2 two distinct items under one authority reach proof, extraction and composition seal', async () => {
    const { result, counts, catalogCalls } = await extract([A, B])
    assert.equal(result.status, 'same_request_composition_bound', JSON.stringify(result))
    assert.deepEqual(counts, { http: 2, match: 1, extract: 1 }); assert.equal(catalogCalls.length, 1)
    if (result.status !== 'same_request_composition_bound') return
    assert.ok(isOfficialTruthCompositionSeal(result.seal)); assert.ok(officialTruthCompositionSealView(result.seal))
    assert.equal(isOfficialTruthCompositionSeal(Object.freeze({ ...result.seal })), false)
    assert.equal(isOfficialTruthCompositionSeal(JSON.parse(JSON.stringify(result.seal))), false)
  })
  test('R2 HTML/API of one item and hidden larger-set duplicates never inflate supports', async () => {
    for (const urls of [[A, API], [A, API, B]]) {
      const { result, counts } = await extract(urls)
      assert.equal(result.status, 'blocked')
      if (result.status === 'blocked') assert.ok(['same_content_item_composition', 'support_mismatch', 'ambiguous_structure'].includes(result.reason))
      assert.deepEqual(counts, { http: 0, match: 0, extract: 0 })
    }
  })
  test('R2 Rule acceptance counts content items, preserving ev2 support version ids', () => {
    const evidence = [A, B].map((url) => r2Evidence(registry, scope, url, body(url), NOW))
    const candidate = officialTruthRegelKandidatAusEvidence(evidence, registry, metadata(true))
    assert.ok(candidate.ok)
    const accepted = regelKandidatAkzeptieren({ kandidat: candidate.kandidat, evidenceVersions: evidence, registry, trustedRuleFact: proposal })
    assert.ok(accepted.ok, JSON.stringify(accepted))
    const duplicate = officialTruthRegelKandidatAusEvidence([evidence[0], r2Evidence(registry, scope, API, body(API), NOW)], registry, metadata(true))
    assert.deepEqual(duplicate, { ok: false, reason: 'same_content_item_composition' })
  })
  test('R2 replay rejects every substituted item/representation/profile binding before extraction', async () => {
    for (const change of [{ contentItemId: 'item_b' }, { contentItemVersion: 2 }, { representationId: 'api_a' },
      { representationVersion: 2 }, { identityProfileId: 'other_profile' }, { identityProfileVersion: 2 }]) {
      const { result, counts } = await extract([A], { mutateRetrieval: (result) => result.status === 'blocked' ? result : { ...result, ...change } })
      assert.deepEqual(result, { status: 'blocked', reason: 'support_binding_mismatch' }); assert.equal(counts.extract, 0)
    }
  })
  test('R2 single-item extraction retains exact identity in evidence, proof, retrieval and provenance', async () => {
    const { result, counts } = await extract([A]); assert.equal(result.status, 'same_request_trusted_fact_material', JSON.stringify(result))
    assert.deepEqual(counts, { http: 1, match: 1, extract: 1 })
    if (result.status !== 'same_request_trusted_fact_material') return
    for (const entry of [...result.evidenceVersions, ...result.provenance, ...result.retrievals]) assert.deepEqual(contentIdentityBinding(entry), r2Binding(registry, A))
    assert.equal(JSON.stringify(result).includes(body(A)), false)
  })
  test('R2 refresh cannot cross content items or HTML/API streams', () => {
    const first = { ...envelope(A), registry }
    for (const url of [B, API]) assert.deepEqual(officialTruthAkzeptierteEvidenceAuffrischungVergleichen(first, () => new Date(NOW), null,
      { ...envelope(url), registry }, () => new Date(NOW)), { status: 'blocked', reason: 'different_content_identity' })
  })
  test('R2 review format changes and old review identity cannot authorize an R2 packet', () => {
    const packet = packetInput([A]); const fingerprint = officialTruthRegelReviewPacketFingerprint(packet)
    assert.equal(fingerprint.status, 'rule_review_packet_fingerprint')
    if (fingerprint.status !== 'rule_review_packet_fingerprint') return
    assert.match(fingerprint.reviewPacketKey, /^review-packet:v3:/)
    const decision = { packetInput: packet, decision: 'proceed_to_trusted_fact_entry', reviewPacketKey: fingerprint.reviewPacketKey }
    assert.equal(officialTruthRegelReviewEntscheidungsabsicht(decision).status, 'rule_review_decision_intent')
    assert.deepEqual(officialTruthRegelReviewEntscheidungsabsicht({ ...decision, reviewPacketKey: fingerprint.reviewPacketKey.replace(':v3:', ':v2:') }),
      { status: 'blocked', reason: 'review_packet_key_mismatch' })
    assert.deepEqual(officialTruthRegelReviewEntscheidungsabsicht({ ...decision, packetInput: packetInput([API]) }),
      { status: 'blocked', reason: 'review_packet_key_mismatch' })
  })
  test('R2 store sends the entire identity tuple through v2 only and missing RPC fails closed', async () => {
    assert.equal(OFFICIAL_TRUTH_SOURCE_CATALOG_V2, 'official_truth_source_catalog_v2')
    assert.equal(OFFICIAL_TRUTH_STORE_ACCEPTED_V2, 'official_truth_store_accepted_v2')
    const cat = catalog(); const payloads: Record<string, unknown>[] = []
    const stored = await akzeptierteEvidenceSpeichern(envelope(A), () => new Date(NOW), null, { katalog: cat,
      transport: { async aufrufen(payload) { payloads.push(payload); const evidence = payload.evidence as Record<string, unknown>
        return { ok: true, antwort: { ok: true, identity_schema: 2, operation: 'accepted_evidence', outcome: 'inserted', version_id: evidence.version_id } } } } })
    assert.ok(stored.ok, JSON.stringify(stored)); assert.equal(payloads.length, 1); assert.equal(cat.calls.length, 1)
    const payload = payloads[0]!.evidence as Record<string, unknown>
    assert.deepEqual(Object.fromEntries(['identity_schema', 'source_id', 'content_item_id', 'content_item_version', 'representation_id',
      'representation_version', 'identity_profile_id', 'identity_profile_version', 'content_type'].map((key) => [key, payload[key]])),
    { identity_schema: 2, source_id: SOURCE, content_item_id: 'item_a', content_item_version: 1, representation_id: 'html_a',
      representation_version: 1, identity_profile_id: 'synthetic_identity', identity_profile_version: 1, content_type: 'text/html' })
    let writes = 0
    const missing = await akzeptierteEvidenceSpeichern(envelope(A), () => new Date(NOW), null, { katalog: catalog(),
      transport: { async aufrufen() { writes++; return { ok: false } } } })
    assert.deepEqual(missing, { ok: false, reason: 'store_failed' }); assert.equal(writes, 1)
    let reads = 0
    assert.deepEqual(await quellenKatalogLesen({ transport: { async aufrufen() { reads++; throw new Error('missing v2 RPC') } } }),
      { ok: false, reason: 'catalog_failed' }); assert.equal(reads, 1)
  })
  test('R2 witness public projection stays narrow and supplies no item/profile authority', async () => {
    const witness = await decideOfficialTruthAutonomousPreacceptanceWitness(input([A]), proofDependencies())
    assert.equal(witness.status, 'authorized_preacceptance_witness')
    assert.deepEqual(Object.keys(witness).sort(), ['status', 'reviewPacketKey', 'ruleScopeKey', 'factKind', 'supportVersionIds',
      'serverReferenceTime', 'freshness', 'grant', 'capability'].sort())
  })
})
