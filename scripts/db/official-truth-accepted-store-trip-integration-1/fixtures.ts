/** Explicit local infrastructure; never imported by a production module. */
import assert from 'node:assert/strict'
import { readFileSync, existsSync,statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname, relative } from 'node:path'
import ts from 'typescript'
import { createHash } from 'node:crypto'
import { createContentIdentityGraph, contentIdentityBinding, type ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { provenanceCanonical } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import * as extractors from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { decideOfficialTruthServerOwnedRetrieval } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { quellenKatalogSnapshotAntwort } from '@/lib/readiness/official-truth-source-catalog-server'
import type { AcceptedStoreContract, AcceptedStoreOriginal } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/canonical-server'

const sourceId = 'synthetic-accepted-trip-authority'
export const fixtureUrl = 'https://accepted-trip.example/official/ch-de-visa'
const item = { sourceId, contentItemId: 'synthetic-ch-de-visa', contentItemVersion: 1, current: true,
  externalIdNamespace: 'synthetic', externalContentId: 'ch-de-visa', expectedPublisherIds: ['synthetic'], expectedAuthorityIds: ['synthetic'] }
const representation = { sourceId, contentItemId: item.contentItemId, contentItemVersion: 1,
  representationId: 'synthetic-json', representationVersion: 1, current: true, requestUrls: [fixtureUrl], expectedFinalUrl: fixtureUrl,
  expectedMediaType: 'application/json', identityProfileId: 'synthetic-accepted-trip-whole-json', identityProfileVersion: 1,
  expectedLocale: null, expectedSchema: 'synthetic-accepted-store-trip-v1' }
export function fixtureBody(successor = false): string {
  return provenanceCanonical({ schema: 'synthetic-accepted-store-trip-v1', source: 'SYNTHETIC LOCAL TEST ONLY — NOT A LEGAL STATEMENT',
    destination: 'DE', citizenship: 'CH', document: 'ordinary_passport', purpose: 'tourism', route: ['CH', 'DE'],
    effect: successor ? 'required' : 'not_required', visaMode: successor ? 'electronic_visa' : 'visa_exempt',
    validity: { from: '2026-11-01', until: '2026-12-31' } })!
}
function parse(text: string) {
  if (text !== fixtureBody(false) && text !== fixtureBody(true)) return null
  return JSON.parse(text) as { effect: 'required' | 'not_required'; visaMode: 'electronic_visa' | 'visa_exempt'; validity: { from: string; until: string } }
}
export const fixtureProfile: ContentIdentityProfileDefinition = {
  identityProfileId: representation.identityProfileId, identityProfileVersion: 1, current: true,
  verify: ({ responseText, finalUrl, mediaType, representation: r }) => parse(responseText) && finalUrl === fixtureUrl && mediaType === 'application/json'
    ? { ok: true, identity: contentIdentityBinding(r) } : { ok: false, reason: 'invalid_response' },
}
const authority = quellenRegistryErstellen([{ sourceId, sourceClass: 'official_authority',
  publisherName: 'SYNTHETIC LOCAL TEST ONLY', authorityName: 'SYNTHETIC LOCAL TEST ONLY', domains: ['accepted-trip.example'] }])
assert(authority.ok)
const graph = createContentIdentityGraph(authority.registry, [item], [representation], [fixtureProfile])
assert(graph.ok)
export const fixtureRegistry = { ...graph.value.authorityRegistry, contentIdentity: graph.value }
const scope = regelScopeAusEvidenceScope({ destinationCountryCode: 'DE', transitCountryCode: null,
  citizenship: { mode: 'required', countryCodes: ['CH'] },
  credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
  residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'travel_date', travelDate: '2026-11-20' } })
assert(scope.ok)
export const fixtureExtractor: extractors.OfficialTruthExtractorDefinition = {
  extractorId: 'otx_accepted_store_trip_fixture', extractorVersion: 1, current: true,
  factKind: 'requirement_effect', sourceFamilyId: 'otf_accepted_store_trip_fixture', contentItemRefs: [{ sourceId, contentItemId: item.contentItemId }],
  representations: [contentIdentityBinding(representation)], urlAllowlist: [{ kind: 'exact', canonicalUrl: fixtureUrl }],
  contentTypes: ['application/json'], schemaFamily: 'ots_accepted_store_trip_fixture', policyId: null, policyVersion: null, requiredFieldPaths: [],
  match: context => context.supports.length === 1 && parse(context.supports[0]!.sourceSnapshot)
    ? { ok: true } : { ok: false, reason: 'structure_not_recognized' },
  extract: context => {
    const parsed = context.supports.length === 1 ? parse(context.supports[0]!.sourceSnapshot) : null
    return parsed ? { ok: true, fact: { kind: 'requirement_effect', effect: parsed.effect, visaMode: parsed.visaMode } }
      : { ok: false, reason: 'structure_not_recognized' }
  },
}

const require = createRequire(import.meta.url)
export const productRoot = resolve('lib/readiness/official-truth-accepted-store-trip-integration-1')
/** Execute actual current product modules. Only compiled external registry selection
 * is replaced; extraction and its one-use execution context remain the real code. */
export function fixtureProductModules() {
  const cache = new Map<string, { exports: unknown }>()
  const fixtureExtraction = { ...extractors, officialTruthTrustedFactExtrahieren: (input: unknown) =>
    extractors.officialTruthTrustedFactExtrahierenMitDefinitionen(input, [fixtureExtractor]),
    OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY:Object.freeze([fixtureExtractor]) }
  function load(path: string): unknown {
    path = resolve(path)
    if (!path.endsWith('.ts')) path += '.ts'
    if (cache.has(path)) return cache.get(path)!.exports
    const module = { exports: {} as unknown }; cache.set(path, module)
    const output = ts.transpileModule(readFileSync(path, 'utf8'), { fileName: path,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    new Function('require', 'module', 'exports', output)((name: string) => {
      const target = name.startsWith('@/') ? resolve(name.slice(2)) : name.startsWith('.') ? resolve(dirname(path), name) : null
      if (target === resolve('lib/readiness/official-truth-trusted-fact-extractor-registry')) return fixtureExtraction
      return target?.startsWith(productRoot + '/') ? load(target) : require(target ?? name)
    }, module, module.exports)
    return module.exports
  }
  return {
    canonical: load(resolve(productRoot, 'canonical-server.ts')) as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/canonical-server'),
    provenance: load(resolve(productRoot, 'provenance-server.ts')) as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/provenance-server'),
  }
}

/** Current source bytes of the executed canonical chain, not an invented code pin. */
function implementationSources() {
  const files = new Map<string, string>()
  function visit(path: string) {
    path = resolve(path)
    if(existsSync(path)&&statSync(path).isDirectory())path=resolve(path,'index.ts')
    else if (!existsSync(path)) path += '.ts'
    if (files.has(path)) return
    const text = readFileSync(path, 'utf8'); files.set(path, text)
    const imports = /(?:from\s*|import\s*)['"]([^'"]+)['"]/g
    for (const match of text.matchAll(imports)) {
      const name = match[1]!
      if (name.startsWith('@/')) visit(resolve(name.slice(2)))
      else if (name.startsWith('.')) visit(resolve(dirname(path), name))
    }
  }
  visit(resolve(productRoot, 'producer-server.ts'))
  visit(resolve(productRoot, 'reader-server.ts'))
  visit(resolve('scripts/db/official-truth-accepted-store-trip-integration-1/fixtures.ts'))
  return [...files].map(([path, utf8]) => ({ path: relative(resolve('.'), path), utf8 })).sort((a, b) => a.path.localeCompare(b.path))
}

export function fixtureContract(): AcceptedStoreContract {
  assert(scope.ok)
  const contract:AcceptedStoreContract={ id: 'synthetic-accepted-trip-v1', digest: '0'.repeat(64), applicationScope: 'ch-ordinary-tourism-direct-de-v1',
    cellId: 'synthetic-ch-de-2026-11-20', cellVersion: 1, scope: scope.scope, implementationSources: implementationSources(),
    travelDates: { from: '2026-11-20', through: '2026-11-25' },
    source: { sourceId, url: fixtureUrl, binding: contentIdentityBinding(representation), coverage: { destinationCountryCodes: ['DE'],
      transitCountryCodes: [], requirementTypes: ['visa'], citizenship: { mode: 'exact', countryCodes: ['CH'] },
      residence: { mode: 'not_applicable' }, documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] } } },
    extractorId: fixtureExtractor.extractorId, extractorVersion: fixtureExtractor.extractorVersion,
    validity: text => { const p = parse(text); return p ? { validFrom: p.validity.from, validUntil: p.validity.until } : null },
    validityOrigin: text => { const p = parse(text); return p ? { validFrom: p.validity.from, validUntil: p.validity.until,
      validFromBasis: { kind: 'qualified_locator', locator: { kind: 'json_pointer', pointer: '/validity/from' }, value: p.validity.from },
      validUntilBasis: { kind: 'qualified_locator', locator: { kind: 'json_pointer', pointer: '/validity/until' }, value: p.validity.until } } : null },
  }
  const {digest,validity,validityOrigin,implementationSources:files,...definition}=contract;void digest;void validity;void validityOrigin;void files
  return {...contract,digest:createHash('sha256').update(provenanceCanonical({...definition,codeDigest:fixtureCodeDigest(contract)})!).digest('hex')}
}
export function fixtureCodeDigest(contract:AcceptedStoreContract):string {
  return createHash('sha256').update(JSON.stringify(contract.implementationSources.map(f=>({path:f.path,sha256:createHash('sha256').update(f.utf8).digest('hex')})))).digest('hex')
}

export async function freshFixtureOriginal(successor = false): Promise<{ original: AcceptedStoreOriginal; startedAt: string }> {
  const startedAt = new Date().toISOString()
  const result = await decideOfficialTruthServerOwnedRetrieval({ sourceId, url: fixtureUrl }, {
    now: () => new Date(), resolve: async () => [{ address: '93.184.216.34', family: 4 }],
    catalog: { identityProfiles: [fixtureProfile], transport: { aufrufen: async payload => {
      assert.deepEqual(payload, { operation: 'read_registry' })
      return { ok: true, antwort: quellenKatalogSnapshotAntwort(fixtureRegistry)! }
    } } },
    http: async request => {
      assert.equal(request.url, fixtureUrl)
      await new Promise<void>((yes, no) => request.lookup('accepted-trip.example', { all: true }, error => error ? no(error) : yes()))
      assert(!Object.keys(request.headers).some(k => /authorization|cookie/i.test(k)))
      const body = Buffer.from(fixtureBody(successor), 'utf8')
      return { ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json', 'content-length': String(body.byteLength) }),
        body: (async function* () { yield body })() }
    },
  })
  assert.equal(result.status, 'server_owned_official_retrieval')
  assert(result.status === 'server_owned_official_retrieval')
  return { original: result, startedAt }
}
