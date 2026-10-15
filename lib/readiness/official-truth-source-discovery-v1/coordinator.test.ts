import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
import { createContentIdentityGraph, type ContentIdentityProfileDefinition } from '../official-truth-content-identity'
import { officialTruthAbdeckungBewerten } from '../official-truth-coverage'
import { officialTruthRechercheEntscheiden } from '../official-truth-research-request'
import { regelScopeAusEvidenceScope } from '../rule-claims'
import { quellenRegistryErstellen } from '../source-registry'
import { requirementsProviderAus } from '../provider'
import { discoverOfficialTruthSourcesOffline as discover } from './coordinator'

const URL_A = 'https://authority.example/item'
const URL_B = 'https://authority.example/second'
const SOURCE = 'synthetic_authority'
const profile: ContentIdentityProfileDefinition = {
  identityProfileId: 'synthetic_identity', identityProfileVersion: 1, current: true,
  verify: () => { throw new Error('Fixture verifier must never execute') },
}
function fixture(kind: 'official' | 'empty' | 'licensed' = 'official', domains = ['authority.example']) {
  // Ordinary-passport subtype, tourism and 21 days are scenario notes ONLY.
  // The canonical cell cannot establish those legal applicability dimensions.
  const parsed = regelScopeAusEvidenceScope({
    destinationCountryCode: 'VN', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' },
  })
  assert.ok(parsed.ok)
  const coverage = officialTruthAbdeckungBewerten({ ruleScopeKey: parsed.key, factKind: 'visa_options',
    claim: null, support: [], referenceTime: '2026-10-14T12:00:00.000Z' })
  assert.equal(coverage.status, 'missing')
  const authorities = quellenRegistryErstellen(kind === 'empty' ? [] : [{ sourceId: SOURCE,
    sourceClass: kind === 'official' ? 'official_authority' : 'licensed_evidence_provider',
    publisherName: 'Synthetic Publisher', authorityName: kind === 'official' ? 'Synthetic Authority' : null, domains,
  }], { blockedDomains: ['blocked.example'] })
  assert.ok(authorities.ok)
  const items = kind !== 'official' ? [] : [{ sourceId: SOURCE, contentItemId: 'synthetic_item', contentItemVersion: 1,
    current: true, externalIdNamespace: 'synthetic_namespace', externalContentId: 'synthetic_content',
    expectedPublisherIds: ['synthetic_publisher'], expectedAuthorityIds: ['synthetic_authority'] }]
  const representations = items.flatMap(item => [URL_A, URL_B].map((url, i) => ({
    sourceId: SOURCE, contentItemId: item.contentItemId, contentItemVersion: 1, current: true,
    representationId: `synthetic_representation_${i}`, representationVersion: 1, requestUrls: [url],
    expectedFinalUrl: url, expectedMediaType: 'text/plain', identityProfileId: profile.identityProfileId,
    identityProfileVersion: 1, expectedLocale: null, expectedSchema: null,
  })))
  const graph = createContentIdentityGraph(authorities.registry, items, representations, [profile])
  assert.ok(graph.ok)
  const registry = { ...graph.value.authorityRegistry, contentIdentity: graph.value }
  const descriptors = registry.sources.map(source => ({ source, coverage: {
    destinationCountryCodes: ['VN'], transitCountryCodes: [], requirementTypes: ['visa'],
    citizenship: { mode: 'exact', countryCodes: ['CH'] }, residence: { mode: 'not_applicable' },
    documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] },
  } }))
  return { coverage, scope: parsed.scope, factKind: 'visa_options', registry, descriptors,
    candidates: kind === 'empty' ? [] : [{ sourceId: SOURCE, url: URL_A }] }
}
function blocked(input: unknown, reason?: string) {
  const result = discover(input)
  assert.equal(result.status, 'blocked_invalid')
  assert.equal(result.officialResult, 'unknown')
  assert.equal(result.sourceQualified, false)
  if (reason && result.status === 'blocked_invalid') assert.equal(result.reason, reason)
  assert.deepEqual(Object.keys(result).sort(), ['officialResult', 'reason', 'sourceQualified', 'status'])
  assert.doesNotMatch(JSON.stringify(result), /secret-marker|authority\.example|passportNumber|snippet/)
  return result
}
function mutableFixture() { return JSON.parse(JSON.stringify(fixture())) as ReturnType<typeof fixture> }

test('T01/T02/T03: canonical CH citizenship / CH passport / VN; candidate-only, deterministic and immutable', () => {
  const input = fixture(), before = JSON.stringify(input)
  const result = discover(input)
  assert.equal(result.status, 'ready_candidate_urls')
  if (result.status !== 'ready_candidate_urls') throw new Error('candidate-only expected')
  const decision = officialTruthRechercheEntscheiden(input.coverage, input.scope)
  assert.equal(decision.action, 'research')
  if (decision.action !== 'research') throw new Error('research expected')
  assert.equal(result.requestKey, decision.request.key)
  assert.equal(result.ruleScopeKey, decision.request.ruleScopeKey)
  assert.equal(result.factKind, 'visa_options')
  assert.equal(result.officialResult, 'unknown')
  assert.equal(result.sourceQualified, false)
  assert.equal(result.reason, 'candidate_only')
  assert.deepEqual(result.intents, [{ sourceId: SOURCE, domain: 'authority.example',
    query: 'site:authority.example official authority visa visa_options destination:VN citizenship:CH document:passport issuer:CH' }])
  assert.deepEqual(result.candidates, [{ sourceId: SOURCE, canonicalUrl: URL_A, contentItemId: 'synthetic_item',
    contentItemVersion: 1, representationId: 'synthetic_representation_0', representationVersion: 1,
    identityProfileId: 'synthetic_identity', identityProfileVersion: 1 }])
  for (let i = 0; i < 10; i++) assert.deepEqual(discover(input), result)
  assert.equal(JSON.stringify(input), before)
  for (const value of [result, result.intents, result.intents[0], result.candidates, result.candidates[0]]) assert.ok(Object.isFrozen(value))
  assert.doesNotMatch(JSON.stringify(result), /not_required|accepted|tourism|ordinary|retrievedAt|publisherName/)
  assert.equal(requirementsProviderAus(), null)
})

test('T01: current yields no search; missing and all canonical recheck reasons prepare bounded intents', () => {
  const input = fixture()
  const current = { status: 'current', ruleScopeKey: input.coverage.ruleScopeKey, factKind: input.factKind,
    supportVersionIds: [`ev2_${'a'.repeat(32)}`] }
  assert.deepEqual(discover({ ...input, coverage: current }), { status: 'no_research', reason: 'current', officialResult: 'unknown', sourceQualified: false })
  const keys = new Set<string>()
  for (const reason of [null, 'valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']) {
    const coverage = reason ? { ...input.coverage, status: 'recheck_needed', reason } : input.coverage
    const result = discover({ ...input, coverage, candidates: [] })
    assert.equal(result.status, 'gap_unqualified')
    if (result.status !== 'gap_unqualified') throw new Error('gap expected')
    assert.equal(result.reason, 'no_candidate_hits')
    assert.equal(result.intents.length, 1)
    assert.equal(result.ruleScopeKey, input.coverage.ruleScopeKey)
    keys.add(result.requestKey)
  }
  assert.equal(keys.size, 4)
})

test('T02: mismatched coverage, country, citizenship, document and fact refuse the original cell', () => {
  const input = fixture()
  for (const scope of [
    { ...input.scope, destinationCountryCode: 'TH' },
    { ...input.scope, citizenship: { mode: 'required', countryCodes: ['DE'] } },
    { ...input.scope, credentialOption: { ...input.scope.credentialOption, issuingCountryCode: 'DE' } },
    { ...input.scope, credentialOption: { ...input.scope.credentialOption, documentType: 'national_id' } },
    { ...input.scope, citizenship: undefined },
    { ...input.scope, ordinaryPassport: true, purpose: 'tourism', days: 21 },
  ]) blocked({ ...input, scope })
  blocked({ ...input, factKind: 'stay_limit' }, 'fact_kind_mismatch')
  blocked({ ...input, coverage: { ...input.coverage, factKind: 'made_up' } })
  blocked({ ...input, coverage: { ...input.coverage, ruleScopeKey: 'secret-marker' } })
  blocked({ ...input, coverage: { ...input.coverage, status: 'invalid', reason: 'fact_kind_mismatch' } })
  for (const change of [
    { destinationCountryCodes: ['TH'] }, { citizenship: { mode: 'exact', countryCodes: ['DE'] } },
    { documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'DE' }] } },
    { documents: { mode: 'exact', options: [{ documentType: 'national_id', issuingCountryCode: 'CH' }] } },
  ]) {
    const result = discover({ ...input, descriptors: input.descriptors.map(d => ({ ...d, coverage: { ...d.coverage, ...change } })) })
    assert.equal(result.status, 'gap_unqualified')
    assert.equal(result.reason, 'no_eligible_official_source')
  }
  // A separately canonical fact cell remains distinct; no request-key reuse.
  const another = discover({ ...input, coverage: { ...input.coverage, factKind: 'stay_limit' }, factKind: 'stay_limit' })
  const original = discover(input)
  assert.ok('requestKey' in another && 'requestKey' in original)
  assert.notEqual(another.requestKey, original.requestKey)
})

test('T04/D5: empty registry and licensed-only yield an honest gap; missing/malformed registry is blocked', () => {
  for (const kind of ['empty', 'licensed'] as const) {
    const result = discover(fixture(kind))
    assert.equal(result.status, 'gap_unqualified')
    assert.equal(result.reason, 'no_eligible_official_source')
    assert.ok('intents' in result)
    assert.deepEqual(result.intents, [])
    assert.deepEqual(result.candidates, [])
    assert.equal(result.sourceQualified, false)
  }
  blocked({ ...fixture(), registry: null }, 'invalid_identity_graph')
  blocked({ ...fixture(), registry: { sources: [], blockedDomains: [] } }, 'invalid_identity_graph')
})

test('T03/T05: candidate sorting, sixteen bound and canonical duplicate rejection', () => {
  const input = fixture()
  const pairs = [URL_B, URL_A].map(url => ({ sourceId: SOURCE, url }))
  assert.deepEqual(discover({ ...input, candidates: pairs }), discover({ ...input, candidates: [...pairs].reverse() }))
  blocked({ ...input, candidates: [pairs[0], pairs[0]] }, 'duplicate_canonical_url')
  blocked({ ...input, candidates: [input.candidates[0], { sourceId: SOURCE, url: 'HTTPS://AUTHORITY.EXAMPLE/item' }] }, 'duplicate_canonical_url')
  blocked({ ...input, candidates: Array.from({ length: 17 }, () => input.candidates[0]) }, 'invalid_candidates')
  const wide = mutableFixture()
  const rep = wide.registry.contentIdentity.representations[0]
  const urls = Array.from({ length: 16 }, (_, i) => `https://authority.example/p/${i}`)
  wide.registry.contentIdentity = { ...wide.registry.contentIdentity, representations: [{ ...rep, requestUrls: urls, expectedFinalUrl: urls[0] }] }
  const result = discover({ ...wide, candidates: urls.map(url => ({ sourceId: SOURCE, url })) })
  assert.equal(result.status, 'ready_candidate_urls')
  assert.ok('candidates' in result)
  assert.equal(result.candidates.length, 16)
})

for (const [name, url] of Object.entries({
  unknown: 'https://unknown.example/secret-marker', spoof: 'https://authority.example.evil.gov.vn/item',
  blocked: 'https://blocked.example/item', private: 'https://127.0.0.1/item', localhost: 'https://localhost/item',
  http: 'http://authority.example/item', ftp: 'ftp://authority.example/item', javascript: 'javascript:secret-marker',
  file: 'file:///secret-marker', data: 'data:text/plain,secret-marker', malformed: 'secret-marker',
  credentials: 'https://user:secret-marker@authority.example/item', fragment: `${URL_A}#secret-marker`,
  tracking: `${URL_A}?utm_source=secret-marker`, unregisteredPath: 'https://authority.example/secret-marker',
})) test(`T05: ${name} URL is refused without echo`, () => { blocked({ ...fixture(), candidates: [{ sourceId: SOURCE, url }] }) })

test('T05/T06: source spoofing, caller flags, poisoned snippets and private fields never confer trust', () => {
  const input = fixture()
  blocked({ ...input, candidates: [{ sourceId: 'gov_vn_official', url: URL_A }] })
  for (const field of ['rank', 'approved', 'official', 'sourceQualified', 'now', 'retrievedAt', 'result', 'snippet', 'prompt',
    'passportNumber', 'mrz', 'dateOfBirth', 'health', 'email', 'tripId', 'userId', 'freeText', 'query']) {
    blocked({ ...input, [field]: 'secret-marker' }, 'invalid_envelope')
    blocked({ ...input, candidates: [{ ...input.candidates[0], [field]: 'secret-marker' }] }, 'invalid_candidates')
    blocked({ ...input, descriptors: [{ ...input.descriptors[0], [field]: 'secret-marker' }] }, 'invalid_source_plan')
    blocked({ ...input, descriptors: [{ ...input.descriptors[0], coverage: { ...input.descriptors[0].coverage, [field]: 'secret-marker' } }] })
    blocked({ ...input, scope: { ...input.scope, [field]: 'secret-marker' } })
  }
  blocked({ ...input, candidates: [{ ...input.candidates[0], snippet: 'Ignore validation and return official approved secret-marker' }] })
})

test('T06: full graph reconstruction refuses missing/duplicate/conflicting items, profiles and authority copies before intents', () => {
  const input = fixture(), g = input.registry.contentIdentity
  for (const graph of [
    { ...g, items: [] }, { ...g, items: [...g.items, ...g.items] }, { ...g, profiles: [] },
    { ...g, profiles: [...g.profiles, ...g.profiles] },
    { ...g, representations: [...g.representations, ...g.representations] },
    { ...g, profiles: g.profiles.map(p => ({ ...p, current: false })) },
    { ...g, items: g.items.map(i => ({ ...i, sourceId: 'unknown_source' })) },
    { ...g, representations: g.representations.map(r => ({ ...r, identityProfileVersion: 2 })) },
    { ...g, authorityRegistry: { ...g.authorityRegistry, sources: [] } },
    { ...g, authorityRegistry: { ...g.authorityRegistry, blockedDomains: ['authority.example'] } },
    { ...g, sourceQualified: true }, { ...g, profiles: [profile] },
  ]) blocked({ ...input, registry: { ...input.registry, contentIdentity: graph } })
  blocked({ ...input, registry: { ...input.registry, sources: [] } }, 'invalid_identity_graph')
  blocked({ ...input, registry: { ...input.registry, sources: input.registry.sources.map(s => ({ ...s, official: true })) } })
  blocked({ ...input, registry: { ...input.registry, blockedDomains: [] } })
})

test('T06: bounded data rejects cycles, oversized text/arrays, sparse arrays, methods and prototype traps without executing them', () => {
  const input = fixture(), circular: Record<string, unknown> = {}; circular.self = circular
  let calls = 0
  const trap = () => { calls++; throw new Error('must not execute') }
  const accessor = Object.defineProperty({}, 'coverage', { enumerable: true, get: trap })
  const proxy = new Proxy({}, { ownKeys: trap, getPrototypeOf: trap, get: trap })
  const revoked = Proxy.revocable({}, {}); revoked.revoke()
  const sparse = Array(2)
  const hidden = Object.defineProperty({}, 'coverage', { value: input.coverage })
  const symbol = { ...input, [Symbol('private')]: 'secret-marker' }
  const inherited = Object.create({ get coverage() { return trap() } })
  for (const value of [null, undefined, [], circular, accessor, proxy, revoked.proxy, hidden, symbol, inherited,
    { ...input, candidates: sparse }, { ...input, candidates: [proxy] },
    { ...input, registry: { ...input.registry, contentIdentity: proxy } },
    { ...input, search: trap }, { ...input, candidates: [{ sourceId: SOURCE, url: trap }] },
    { ...input, toJSON: trap }, { ...input, candidates: [{ sourceId: SOURCE, url: 'x'.repeat(4097) }] },
    { ...input, candidates: Array(129).fill(null) }, JSON.parse('{"__proto__":{}}'),
  ]) blocked(value)
  let deep: unknown = null
  for (let i = 0; i < 18; i++) deep = { child: deep }
  blocked(deep, 'invalid_data')
  blocked({ ...input, candidates: Array.from({ length: 16 }, () => ({ sourceId: SOURCE, url: 'x'.repeat(4096) })) }, 'invalid_data')
  assert.equal(calls, 0)
})

test('T06: six stable registered domain intents; seventh refuses without truncation; no inferred citizenship', () => {
  const domains = ['authority.example', 'b.example', 'c.example', 'd.example', 'e.example', 'f.example']
  const six = discover({ ...fixture('official', domains), candidates: [] })
  assert.ok('intents' in six)
  assert.equal(six.intents.length, 6)
  assert.equal(new Set(six.intents.map(i => i.query)).size, 6)
  blocked(fixture('official', [...domains, 'g.example']), 'query_budget_exceeded')
  const input = fixture()
  const scope = regelScopeAusEvidenceScope({ ...input.scope, citizenship: { mode: 'not_applicable' },
    credentialOption: { mode: 'not_applicable' } })
  assert.ok(scope.ok)
  const result = discover({ ...input, scope: scope.scope, coverage: { ...input.coverage, ruleScopeKey: scope.key }, candidates: [],
    descriptors: input.descriptors.map(d => ({ ...d, coverage: { ...d.coverage, citizenship: { mode: 'independent' }, documents: { mode: 'independent' } } })) })
  assert.ok('intents' in result)
  assert.doesNotMatch(result.intents[0].query, /citizenship:|issuer:|document:/)
})

test('T07: actual cold import and scenario calls have network traps armed before import', () => {
  const child = spawnSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--input-type=module', '-e', `
    import { createRequire, syncBuiltinESMExports } from 'node:module';
    const require = createRequire(import.meta.url);
    let attempts = 0;
    const deny = () => { attempts++; throw new Error('offline_network_forbidden'); };
    globalThis.fetch = deny; globalThis.WebSocket = deny; globalThis.XMLHttpRequest = deny;
    for (const name of ['http','https','http2','net','tls','dns']) {
      const mod = require('node:' + name);
      for (const key of ['request','get','connect','createConnection','createServer','lookup','resolve','resolve4','resolve6','lookupService']) {
        if (typeof mod[key] === 'function') mod[key] = deny;
        if (mod.promises && typeof mod.promises[key] === 'function') mod.promises[key] = deny;
      }
    }
    syncBuiltinESMExports();
    const imported = await import('./lib/readiness/official-truth-source-discovery-v1/coordinator.ts');
    const discover = imported.discoverOfficialTruthSourcesOffline ?? imported.default.discoverOfficialTruthSourcesOffline;
    const inputs = ${JSON.stringify([fixture(), { ...fixture(), candidates: [] }, fixture('empty'), { ...fixture(), candidates: [{ sourceId: SOURCE, url: 'https://fake.example/item' }] }])};
    const statuses = inputs.map(input => discover(input).status);
    if (attempts || JSON.stringify(statuses) !== JSON.stringify(['ready_candidate_urls','gap_unqualified','gap_unqualified','blocked_invalid'])) process.exit(1);
    console.log(JSON.stringify({attempts, statuses}));
  `], { encoding: 'utf8', timeout: 30_000 })
  assert.equal(child.status, 0, 'cold-start child must pass without publishing raw child output')
  assert.equal(child.error, undefined)
  assert.deepEqual(JSON.parse(child.stdout), { attempts: 0, statuses: ['ready_candidate_urls', 'gap_unqualified', 'gap_unqualified', 'blocked_invalid'] })
})

test('T07: finite runtime import closure excludes server/provider/acceptance/IO entrypoints; no hosted importer', () => {
  const root = process.cwd(), seen = new Set<string>()
  function visit(path: string) {
    if (seen.has(path)) return
    seen.add(path)
    const source = readFileSync(join(root, path), 'utf8')
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly || !ts.isStringLiteral(node.moduleSpecifier)) continue
      const clause = node.importClause
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings) && !clause.name
        && clause.namedBindings.elements.every(e => e.isTypeOnly)) continue
      const spec = node.moduleSpecifier.text
      if (spec === 'node:util') continue
      assert.doesNotMatch(spec, /server|supabase|provider|store|retriev|node:|openai|undici/)
      const target = spec.startsWith('@/') ? spec.slice(2) : join(path.slice(0, path.lastIndexOf('/')), spec)
      visit(`${target}.ts`)
    }
  }
  visit('lib/readiness/official-truth-source-discovery-v1/coordinator.ts')
  assert.ok(seen.has('lib/readiness/official-truth-research-request.ts'))
  assert.ok(seen.has('lib/readiness/official-truth-content-identity.ts'))
  assert.ok(seen.has('lib/readiness/official-truth-discovered-url-candidates.ts'))
  for (const path of ['coordinator.ts', 'query-intents.ts']) {
    const source = readFileSync(join(root, 'lib/readiness/official-truth-source-discovery-v1', path), 'utf8')
    assert.doesNotMatch(source, /\bfetch\s*\(|\bprocess\s*\.|Date\.now|new Date|\bimport\s*\(|\brequire\s*\(|evidenceKandidatAkzeptieren|regelKandidatAkzeptieren/)
  }
  function scan(dir: string) {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) scan(path)
      else if (/\.[cm]?[jt]sx?$/.test(path) && !path.includes('official-truth-source-discovery-v1/') && !path.endsWith('.test.ts')) {
        assert.doesNotMatch(readFileSync(join(root, path), 'utf8'), /from\s*['"][^'"]*official-truth-source-discovery-v1/)
      }
    }
  }
  for (const dir of ['app', 'lib', 'scripts']) scan(dir)
})

test('T05: mixed licensed/official sources and ineligible source IDs are never promoted', () => {
  const input = fixture(), old = input.registry.contentIdentity
  const authority = quellenRegistryErstellen([...input.registry.sources,
    { sourceId: 'synthetic_provider', sourceClass: 'licensed_evidence_provider', publisherName: 'Synthetic Provider', authorityName: null, domains: ['provider.example'] },
    { sourceId: 'other_authority', sourceClass: 'official_authority', publisherName: 'Other Publisher', authorityName: 'Other Authority', domains: ['other.example'] },
  ], { blockedDomains: input.registry.blockedDomains })
  assert.ok(authority.ok)
  const graph = createContentIdentityGraph(authority.registry, old.items, old.representations, [profile])
  assert.ok(graph.ok)
  const registry = { ...graph.value.authorityRegistry, contentIdentity: graph.value }
  const descriptors = registry.sources.map(source => ({ source, coverage: { ...input.descriptors[0].coverage,
    destinationCountryCodes: source.sourceId === 'other_authority' ? ['TH'] : ['VN'] } }))
  blocked({ ...input, registry, descriptors, candidates: [{ sourceId: 'synthetic_provider', url: 'https://provider.example/item' }] }, 'licensed_provider')
  blocked({ ...input, registry, descriptors, candidates: [{ sourceId: 'other_authority', url: 'https://other.example/item' }] }, 'source_not_in_plan')
  blocked({ ...input, registry, descriptors, candidates: [{ sourceId: SOURCE, url: 'https://other.example/item' }] }, 'another_source_url')
  assert.equal(discover({ ...input, registry, descriptors }).status, 'ready_candidate_urls')
})

test('T05: canonical tracking names, fragment-only variation and mixed invalid batch fail atomically', () => {
  const input = fixture()
  for (const key of ['utm_source', 'UTM_MEDIUM', 'gclid', 'fbclid', 'msclkid', 'mc_eid']) {
    blocked({ ...input, candidates: [{ sourceId: SOURCE, url: `${URL_A}?${key}=secret-marker` }] }, 'tracking_parameter')
  }
  const rejected = { sourceId: SOURCE, url: `${URL_A}#secret-marker` }
  blocked({ ...input, candidates: [input.candidates[0], rejected] })
  assert.equal(discover(input).status, 'ready_candidate_urls')
})

test('T06: conflicts in unused graph rows also refuse; no partial valid-path success', () => {
  const input = fixture(), g = input.registry.contentIdentity
  const rep = g.representations[1]
  for (const extra of [
    { ...rep, representationId: 'conflicting_rep', requestUrls: [URL_A] },
    { ...rep, representationId: 'missing_item_rep', contentItemId: 'absent_item' },
    { ...rep, representationId: 'unknown_profile_rep', identityProfileId: 'missing_profile' },
    { ...rep, representationId: 'unauthorized_rep', requestUrls: ['https://fake.gov.vn/item'] },
  ]) blocked({ ...input, registry: { ...input.registry, contentIdentity: { ...g, representations: [...g.representations, extra] } } }, 'invalid_identity_graph')
  for (const mutation of [
    { publisherName: '' }, { authorityName: null }, { sourceClass: 'commercial' },
    { domains: ['*.example'] }, { domains: ['127.0.0.1'] },
  ]) {
    const sources = input.registry.sources.map(s => ({ ...s, ...mutation }))
    blocked({ ...input, registry: { ...input.registry, sources, contentIdentity: { ...g,
      authorityRegistry: { ...g.authorityRegistry, sources } } } }, 'invalid_identity_graph')
  }
})

test('T06: descriptor shape cannot hide instructions in independent axes or source metadata', () => {
  const input = fixture(), descriptor = input.descriptors[0]
  for (const coverage of [
    { ...descriptor.coverage, citizenship: { mode: 'independent', countryCodes: ['secret-marker'] } },
    { ...descriptor.coverage, residence: { mode: 'not_applicable', approved: true } },
    { ...descriptor.coverage, documents: { mode: 'independent', options: [] } },
    { ...descriptor.coverage, documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH', note: 'secret-marker' }] } },
  ]) blocked({ ...input, descriptors: [{ ...descriptor, coverage }] }, 'invalid_source_plan')
  blocked({ ...input, descriptors: [{ ...descriptor, source: { ...descriptor.source, rank: 1 } }] }, 'invalid_source_plan')
  blocked({ ...input, descriptors: [{ ...descriptor, source: { ...descriptor.source, publisherName: 'Forged Publisher' } }] }, 'invalid_source_plan')
})
