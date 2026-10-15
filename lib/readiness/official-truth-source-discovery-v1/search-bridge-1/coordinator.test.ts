import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getEventListeners } from 'node:events'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
import { createContentIdentityGraph } from '../../official-truth-content-identity'
import { officialTruthAbdeckungBewerten } from '../../official-truth-coverage'
import { regelScopeAusEvidenceScope } from '../../rule-claims'
import { quellenRegistryErstellen } from '../../source-registry'
import { requirementsProviderAus } from '../../provider'
import { discoverOfficialTruthSourcesOffline as canonical } from '../coordinator'
import { discoverOfficialTruthSearchBridgeOffline as bridge } from './coordinator'
import type { SearchBridgeOptions, SearchBridgeResult, SearchHit, SearchHitPort } from './port'

const SOURCE = 'synthetic_authority'
const URL_A = 'https://authority.example/item'
const URL_B = 'https://authority.example/second'
const PRIVATE = 'synthetic-private-marker'

function fixture(kind: 'official' | 'empty' | 'licensed' = 'official', domains = ['authority.example']) {
  // Scenario ONLY: CH ordinary passport, VN tourism, 21 days. Subtype/purpose/days
  // are not enforceable legal dimensions in the current canonical model.
  const parsed = regelScopeAusEvidenceScope({ destinationCountryCode: 'VN', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } })
  assert.ok(parsed.ok)
  const coverage = officialTruthAbdeckungBewerten({ ruleScopeKey: parsed.key, factKind: 'visa_options',
    claim: null, support: [], referenceTime: '2026-10-15T12:00:00.000Z' })
  assert.equal(coverage.status, 'missing')
  const sources = quellenRegistryErstellen(kind === 'empty' ? [] : [{ sourceId: SOURCE,
    sourceClass: kind === 'official' ? 'official_authority' : 'licensed_evidence_provider',
    publisherName: 'Synthetic Publisher', authorityName: kind === 'official' ? 'Synthetic Authority' : null, domains,
  }], { blockedDomains: ['blocked.example'] })
  assert.ok(sources.ok)
  const items = kind !== 'official' ? [] : [{ sourceId: SOURCE, contentItemId: 'synthetic_item', contentItemVersion: 1,
    current: true, externalIdNamespace: 'synthetic_namespace', externalContentId: 'synthetic_content',
    expectedPublisherIds: ['synthetic_publisher'], expectedAuthorityIds: ['synthetic_authority'] }]
  const graph = createContentIdentityGraph(sources.registry, items, items.flatMap(item => [URL_A, URL_B].map((url, i) => ({
    sourceId: SOURCE, contentItemId: item.contentItemId, contentItemVersion: 1, current: true,
    representationId: `synthetic_rep_${i}`, representationVersion: 1, requestUrls: [url], expectedFinalUrl: url,
    expectedMediaType: 'text/plain', identityProfileId: 'synthetic_profile', identityProfileVersion: 1,
    expectedLocale: null, expectedSchema: null,
  }))), [{ identityProfileId: 'synthetic_profile', identityProfileVersion: 1, current: true,
    verify: () => { throw new Error('Must never verify a document in this slice') } }])
  assert.ok(graph.ok)
  const registry = { ...graph.value.authorityRegistry, contentIdentity: graph.value }
  const descriptors = registry.sources.map(source => ({ source, coverage: {
    destinationCountryCodes: ['VN'], transitCountryCodes: [], requirementTypes: ['visa'],
    citizenship: { mode: 'exact', countryCodes: ['CH'] }, residence: { mode: 'not_applicable' },
    documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] },
  } }))
  return { coverage, scope: parsed.scope, factKind: 'visa_options', registry, descriptors, candidates: [] }
}

function mutable() { return JSON.parse(JSON.stringify(fixture())) as ReturnType<typeof fixture> }
function options(transport?: SearchHitPort): SearchBridgeOptions {
  return { signal: new AbortController().signal, transport, timeoutMs: 1000 }
}
function unqualified(result: SearchBridgeResult) {
  assert.equal(result.officialResult, 'unknown')
  assert.equal(result.sourceQualified, false)
  assert.doesNotMatch(JSON.stringify(result), /visa_not_required|synthetic-private-marker|snippet|passportNumber/)
  assert.ok(Object.isFrozen(result))
}
function blocked(result: SearchBridgeResult, reason?: string) {
  unqualified(result)
  assert.equal(result.status, 'blocked_invalid')
  if (reason) assert.equal(result.reason, reason)
  assert.deepEqual(Object.keys(result).sort(), ['officialResult', 'reason', 'sourceQualified', 'status'])
  assert.doesNotMatch(JSON.stringify(result), /https:|authority\.example/)
}
function deferred() {
  let resolve!: (value: unknown) => void, reject!: (reason: unknown) => void
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const flush = () => new Promise<void>(resolve => setImmediate(resolve))

test('T02/D4: CH linked ordinary-passport scenario → VN tourism 21 days; V1 intent → fake hits → exact V1 candidates', async () => {
  const input = fixture(), before = JSON.stringify(input), calls: unknown[] = [], signals: AbortSignal[] = []
  const hits: readonly SearchHit[] = [{ url: URL_B }, { url: URL_A }]
  const port: SearchHitPort = async (intent, signal) => {
    calls.push(intent); signals.push(signal)
    assert.ok(Object.isFrozen(intent))
    assert.deepEqual(Object.keys(intent).sort(), ['domain', 'query', 'sourceId'])
    return hits
  }
  const config = options(port)
  const result = await bridge(input, config)
  unqualified(result)
  assert.equal(result.status, 'ready_candidate_urls')
  assert.equal(result.reason, 'candidate_only')
  assert.deepEqual(result, canonical({ ...input, candidates: hits.map(hit => ({ sourceId: SOURCE, url: hit.url })) }))
  assert.deepEqual(calls, [{ sourceId: SOURCE, domain: 'authority.example',
    query: 'site:authority.example official authority visa visa_options destination:VN citizenship:CH document:passport issuer:CH' }])
  assert.equal(JSON.stringify(input), before)
  assert.equal(requirementsProviderAus(), null)
  assert.equal(getEventListeners(config.signal, 'abort').length, 0)
  assert.ok(signals[0].aborted)
  assert.equal(getEventListeners(signals[0], 'abort').length, 0)
  assert.doesNotMatch(JSON.stringify(calls), /tourism|ordinary|21|traveller|passportNumber|ruleScopeKey|registry/)
})

test('T01/T06: current, malformed, invalid graph, empty/only licensed registry never invoke a transport', async () => {
  let calls = 0
  const port: SearchHitPort = async () => { calls++; return [{ url: 'https://unknown.gov.vn/item' }] }
  const base = fixture()
  const current = { ...base, coverage: { status: 'current', ruleScopeKey: base.coverage.ruleScopeKey,
    factKind: base.factKind, supportVersionIds: [`ev2_${'a'.repeat(32)}`] } }
  assert.deepEqual(await bridge(current, options(port)), canonical(current))
  for (const input of [null, {}, { ...base, factKind: 'unknown' },
    { ...base, scope: { ...base.scope, destinationCountryCode: 'TH' } },
    { ...base, registry: { ...base.registry, contentIdentity: { ...base.registry.contentIdentity, items: [] } } },
    { ...base, coverage: { ...base.coverage, status: 'invalid', reason: 'fact_kind_mismatch' } },
  ]) assert.deepEqual(await bridge(input, options(port)), canonical(input))
  for (const kind of ['empty', 'licensed'] as const) {
    const input = fixture(kind), result = await bridge(input, options(port))
    assert.deepEqual(result, { ...canonical(input), authorityRegistration: 'independent_registration_required' })
    assert.equal(result.reason, 'no_eligible_official_source')
    unqualified(result)
  }
  assert.equal(calls, 0)
})

test('T01/T04: six intents maximum; seventh is canonically blocked before a single query', async () => {
  const domains = ['authority.example', 'b.example', 'c.example', 'd.example', 'e.example', 'f.example']
  const calls: string[] = []
  const port: SearchHitPort = async intent => { calls.push(intent.domain); return [] }
  const six = await bridge(fixture('official', domains), options(port))
  assert.equal(six.reason, 'no_candidate_hits')
  assert.deepEqual(calls, domains)
  calls.length = 0
  blocked(await bridge(fixture('official', [...domains, 'g.example']), options(port)), 'query_budget_exceeded')
  assert.deepEqual(calls, [])
})

test('T02: every canonical stale reason uses its own unchanged request identity', async () => {
  const base = fixture(), keys = new Set<string>()
  for (const reason of [null, 'valid_from_in_future', 'valid_until_elapsed', 'max_age_exceeded']) {
    const input = reason ? { ...base, coverage: { ...base.coverage, status: 'recheck_needed', reason } } : base
    const result = await bridge(input, options(async () => [{ url: URL_A }]))
    assert.deepEqual(result, canonical({ ...input, candidates: [{ sourceId: SOURCE, url: URL_A }] }))
    assert.ok('requestKey' in result)
    keys.add(result.requestKey)
  }
  assert.equal(keys.size, 4)
})

for (const [name, url] of Object.entries({
  unknown: 'https://unknown.example/item', spoof: 'https://authority.example.evil.gov.vn/item',
  shadow: 'https://shadow.authority.example/item', blocked: 'https://blocked.example/item',
  loopback: 'https://127.0.0.1/item', localhost: 'https://localhost/item',
  http: 'http://authority.example/item', credentials: `https://user:${PRIVATE}@authority.example/item`,
  fragment: `${URL_A}#${PRIVATE}`, tracker: `${URL_A}?utm_source=${PRIVATE}`,
  alternateTracker: `${URL_A}?FBCLID=${PRIVATE}`, otherPath: `https://authority.example/${PRIVATE}`,
  file: `file:///${PRIVATE}`, javascript: `javascript:${PRIVATE}`, malformed: PRIVATE,
})) test(`T03: ${name} is rejected by the existing V1 validator with no echo`, async () => {
  const input = fixture()
  const result = await bridge(input, options(async () => [{ url }]))
  blocked(result)
  assert.deepEqual(result, canonical({ ...input, candidates: [{ sourceId: SOURCE, url }] }))
})

test('T03: result sourceId is never trusted; a URL from another registered authority fails V1', async () => {
  blocked(await bridge(fixture(), options(async () => [{ sourceId: SOURCE, url: URL_A }])), 'invalid_search_response')
  const input = mutable()
  const other = { ...input.registry.sources[0], sourceId: 'other_authority', domains: ['other.example'] }
  input.registry.sources = [other, ...input.registry.sources]
  input.registry.contentIdentity = { ...input.registry.contentIdentity,
    authorityRegistry: { ...input.registry.contentIdentity.authorityRegistry, sources: input.registry.sources } }
  assert.notEqual(canonical(input).status, 'blocked_invalid')
  const result = await bridge(input, options(async () => [{ url: 'https://other.example/item' }]))
  blocked(result, 'another_source_url')
  assert.deepEqual(result, canonical({ ...input, candidates: [{ sourceId: SOURCE, url: 'https://other.example/item' }] }))
})

test('T03/T04: deterministic ordering, canonical aliases and duplicates across queries are atomic failures', async () => {
  const input = fixture('official', ['authority.example', 'b.example'])
  const run = (reverse: boolean) => bridge(input, options(async intent => intent.domain === 'b.example' ? []
    : (reverse ? [URL_B, URL_A] : [URL_A, URL_B]).map(url => ({ url }))))
  assert.deepEqual(await run(false), await run(true))
  for (const duplicate of [URL_A, 'HTTPS://AUTHORITY.EXAMPLE/item']) {
    const result = await bridge(input, options(async intent => [{ url: intent.domain === 'authority.example' ? URL_A : duplicate }]))
    blocked(result, 'duplicate_canonical_url')
  }
  const mixed = [URL_A, 'http://authority.example/item', 'https://unknown.example/item']
  const one = await bridge(fixture(), options(async () => mixed.map(url => ({ url }))))
  const two = await bridge(fixture(), options(async () => [...mixed].reverse().map(url => ({ url }))))
  blocked(one)
  assert.deepEqual(one, two)
})

test('T04: complete operation budget 16; 17, cross-query excess and oversized text are never silently truncated', async () => {
  const input = mutable()
  const urls = Array.from({ length: 16 }, (_, i) => `https://authority.example/p/${i}`)
  input.registry.contentIdentity = { ...input.registry.contentIdentity,
    representations: [{ ...input.registry.contentIdentity.representations[0], requestUrls: urls, expectedFinalUrl: urls[0] }] }
  const result = await bridge(input, options(async () => urls.map(url => ({ url }))))
  assert.equal(result.status, 'ready_candidate_urls')
  assert.ok('candidates' in result)
  assert.equal(result.candidates.length, 16)
  blocked(await bridge(input, options(async () => [...urls, URL_A].map(url => ({ url })))), 'hit_budget_exceeded')
  let count = 0
  blocked(await bridge(fixture('official', ['authority.example', 'b.example']), options(async () => {
    count++; return Array.from({ length: count === 1 ? 16 : 1 }, () => ({ url: URL_A }))
  })), 'hit_budget_exceeded')
  assert.equal(count, 2)
  blocked(await bridge(fixture(), options(async () => [{ url: 'x'.repeat(4097) }])), 'invalid_search_response')
  blocked(await bridge(fixture(), options(async () => Array.from({ length: 5 }, () => ({ url: 'x'.repeat(4096) })))), 'hit_budget_exceeded')
  // UTF-8 byte budget, not JS string length.
  blocked(await bridge(fixture(), options(async () => [{ url: 'é'.repeat(4096) }, { url: 'é'.repeat(4096) }, { url: 'x' }])), 'hit_budget_exceeded')
})

test('T04: accessors, proxies, cycles, functions, private/snippet/rank/redirect metadata and sparse shapes rejected without executing them', async () => {
  let traps = 0
  const trap = () => { traps++; throw new Error(PRIVATE) }
  const proxy = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap })
  const revoked = Proxy.revocable({}, {}); revoked.revoke()
  const cyclic: Record<string, unknown> = { url: URL_A }; cyclic.self = cyclic
  const indexGetter = Object.defineProperty([], '0', { get: trap, enumerable: true })
  const hiddenUrl = Object.defineProperty({}, 'url', { value: URL_A })
  const invalid: unknown[] = [null, {}, 'text', [null], [URL_A], [proxy], [revoked.proxy], [cyclic], [trap],
    [{ url: trap }], [{ get url() { return trap() } }], indexGetter, Array(1), [hiddenUrl],
    [Object.create({ url: URL_A })], [{ url: URL_A, [Symbol('metadata')]: PRIVATE }],
    [{ url: URL_A, get snippet() { return trap() } }], [{ url: { toString: trap } }],
    { hits: [{ url: URL_A }] }, new Proxy([], { ownKeys: trap, getPrototypeOf: trap }),
    Object.assign([], { extra: PRIVATE }), [{ url: URL_A, toJSON: trap }]]
  for (const field of ['snippet', 'title', 'rank', 'score', 'sourceId', 'official', 'sourceQualified', 'redirect',
    'passportNumber', 'mrz', 'email', 'query', 'metadata', 'status', 'body', 'instructions']) {
    invalid.push([{ url: URL_A, [field]: PRIVATE }])
  }
  for (const response of invalid) blocked(await bridge(fixture(), options(async () => response)), 'invalid_search_response')
  assert.equal(traps, 0)
})

test('T04: unsafe port/options/thenables rejected; no accessor or proxy invocation', async () => {
  let calls = 0
  const trap = () => { calls++; throw new Error(PRIVATE) }
  const signal = new AbortController().signal
  const unsafe = [new Proxy(async () => [], { apply: trap, ownKeys: trap }),
    Object.assign(async () => [], { metadata: PRIVATE }), function* () { yield [] },
    (async () => []).bind(null), { search: trap }]
  for (const transport of unsafe) blocked(await bridge(fixture(), { signal, transport } as SearchBridgeOptions), 'unsafe_search_transport')
  for (const config of [null, {}, new Proxy({}, { get: trap, ownKeys: trap }),
    { signal, get transport() { return trap() } }, { signal, extra: PRIVATE },
    { signal: new Proxy(signal, { get: trap }) }, { signal: Object.create(AbortSignal.prototype) },
    ...[0, -1, 5001, Infinity, NaN, 1.5, '100'].map(timeoutMs => ({ signal, timeoutMs })),
  ]) blocked(await bridge(fixture(), config as SearchBridgeOptions), 'invalid_search_options')
  const thenable = { get then() { return trap() } }
  blocked(await bridge(fixture(), options((() => thenable) as unknown as SearchHitPort)), 'unsafe_search_transport')
  const overridden = Object.defineProperty(Promise.resolve([]), 'then', { get: trap })
  blocked(await bridge(fixture(), options(() => overridden)), 'unsafe_search_transport')
  const rejecting = Object.defineProperty(Promise.reject(new Error(PRIVATE)), 'then', { get: trap })
  blocked(await bridge(fixture(), options(() => rejecting)), 'unsafe_search_transport')
  const constructorGetter = Object.defineProperty(Promise.resolve([]), 'constructor', { get: trap })
  blocked(await bridge(fixture(), options(() => constructorGetter)), 'unsafe_search_transport')
  await flush()
  assert.equal(calls, 0)
})

test('T01/T04: input functions, proxy traps, unexpected personal fields and preloaded candidates never query', async () => {
  let calls = 0
  const trap = () => { calls++; throw new Error(PRIVATE) }
  const input = fixture(), port: SearchHitPort = async () => { calls++; return [] }
  for (const value of [new Proxy({}, { get: trap, ownKeys: trap, getPrototypeOf: trap }),
    { ...input, get registry() { return trap() } }, { ...input, passportNumber: PRIVATE },
    { ...input, scope: { ...input.scope, days: 21, purpose: 'tourism', ordinaryPassport: true } },
  ]) blocked(await bridge(value, options(port)))
  blocked(await bridge({ ...input, candidates: [{ sourceId: SOURCE, url: URL_A }] }, options(port)), 'initial_candidates_forbidden')
  assert.equal(calls, 0)
})

test('T05: no transport, synchronous throw, rejected promise and 429 fail without fallback or raw details', async () => {
  blocked(await bridge(fixture(), options()), 'search_transport_unavailable')
  for (const port of [(() => { throw new Error(PRIVATE) }) as SearchHitPort,
    async () => { throw { status: 429, retryAfter: 60, snippet: PRIVATE } },
  ]) blocked(await bridge(fixture(), options(port)), 'search_transport_error')
  let count = 0
  blocked(await bridge(fixture('official', ['authority.example', 'b.example']), options(async () => {
    if (++count === 1) return [{ url: URL_A }]
    throw new Error(PRIVATE)
  })), 'search_transport_error')
  assert.equal(count, 2)
})

test('T05: pre-abort, mid-flight abort and late rejected promise clean resources and never publish stale candidates', async () => {
  const aborted = new AbortController(); aborted.abort(PRIVATE)
  let calls = 0
  blocked(await bridge(fixture(), { signal: aborted.signal, transport: async () => { calls++; return [] } }), 'search_aborted')
  assert.equal(calls, 0)
  const caller = new AbortController(), pending = deferred()
  let child!: AbortSignal
  const running = bridge(fixture(), { signal: caller.signal, transport: (_intent, signal) => { child = signal; return pending.promise } })
  assert.equal(getEventListeners(caller.signal, 'abort').length, 1)
  caller.abort(PRIVATE)
  blocked(await running, 'search_aborted')
  assert.ok(child.aborted)
  assert.notEqual(child.reason, PRIVATE)
  assert.equal(getEventListeners(child, 'abort').length, 0)
  assert.equal(getEventListeners(caller.signal, 'abort').length, 0)
  pending.reject(new Error(PRIVATE))
  await flush() // The Node test runner would fail on an unhandled late rejection.
})

test('T05: mocked finite whole-operation deadline; pending promises settle bridge with cleanup, no next query', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const caller = new AbortController(), pending = deferred()
  let calls = 0, child!: AbortSignal
  const running = bridge(fixture('official', ['authority.example', 'b.example']), {
    signal: caller.signal, timeoutMs: 20, transport: (_intent, signal) => { calls++; child = signal; return pending.promise },
  })
  t.mock.timers.tick(19)
  assert.equal(child.aborted, false)
  t.mock.timers.tick(1)
  blocked(await running, 'search_timeout')
  assert.equal(calls, 1)
  assert.ok(child.aborted)
  assert.equal(getEventListeners(child, 'abort').length, 0)
  assert.equal(getEventListeners(caller.signal, 'abort').length, 0)
  pending.resolve([{ url: URL_A }])
  await flush()
  t.mock.timers.runAll()
  assert.equal(calls, 1)
})

test('T05: total deadline is not reset per query; timeout discards earlier hits', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const first = deferred(), second = deferred()
  let calls = 0
  const running = bridge(fixture('official', ['authority.example', 'b.example']), {
    ...options(), timeoutMs: 20, transport: () => ++calls === 1 ? first.promise : second.promise,
  })
  t.mock.timers.tick(15)
  first.resolve([{ url: URL_A }])
  await flush()
  assert.equal(calls, 2)
  t.mock.timers.tick(5)
  blocked(await running, 'search_timeout')
  second.resolve([{ url: URL_B }])
  await flush()
})

test('T05: original envelope mutation cannot change authority, travel cell or graph across await', async () => {
  const input = mutable(), pristine = JSON.parse(JSON.stringify(input)), pending = deferred()
  const running = bridge(input, options(() => pending.promise))
  input.scope.destinationCountryCode = 'TH'
  input.registry.contentIdentity = { ...input.registry.contentIdentity, items: [] }
  input.registry.sources = []
  input.descriptors = []
  pending.resolve([{ url: URL_A }])
  const result = await running
  assert.deepEqual(result, canonical({ ...pristine, candidates: [{ sourceId: SOURCE, url: URL_A }] }))
  assert.equal(result.status, 'ready_candidate_urls')
})

test('T05: concurrent operations and reversed completion order are isolated, with no global configuration', async () => {
  const first = deferred(), second = deferred(), input = fixture()
  const a = bridge(input, options(() => first.promise))
  const b = bridge(input, options(() => second.promise))
  second.resolve([{ url: URL_B }])
  const bResult = await b
  first.resolve([{ url: URL_A }])
  assert.deepEqual(await a, canonical({ ...input, candidates: [{ sourceId: SOURCE, url: URL_A }] }))
  assert.deepEqual(bResult, canonical({ ...input, candidates: [{ sourceId: SOURCE, url: URL_B }] }))
  blocked(await bridge(input, options()), 'search_transport_unavailable')
})

test('T05: abort wins over queued successful settlement; cooperative fake releases its timer', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const caller = new AbortController()
  let completed = 0
  const running = bridge(fixture(), { signal: caller.signal, transport: (_intent, signal) => new Promise(resolve => {
    const timer = setTimeout(() => { completed++; resolve([{ url: URL_A }]) }, 100)
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve([]) }, { once: true })
  }) })
  caller.abort()
  blocked(await running, 'search_aborted')
  t.mock.timers.runAll()
  assert.equal(completed, 0)
  const lateAbort = new AbortController(), done = deferred()
  const next = bridge(fixture(), { signal: lateAbort.signal, transport: () => done.promise })
  done.resolve([{ url: URL_A }]); lateAbort.abort()
  blocked(await next, 'search_aborted')
})

test('T07: cold import and full fixture execution under network/DB entrypoint traps', () => {
  const child = spawnSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--input-type=module', '-e', `
    import { createRequire, syncBuiltinESMExports } from 'node:module';
    const require = createRequire(import.meta.url);
    let attempts = 0;
    const deny = () => { attempts++; throw new Error('offline_io_forbidden'); };
    globalThis.fetch = deny; globalThis.WebSocket = deny; globalThis.XMLHttpRequest = deny;
    for (const name of ['http','https','http2','net','tls','dns']) {
      const mod = require('node:' + name);
      for (const key of ['request','get','connect','createConnection','createServer','lookup','resolve','resolve4','resolve6','lookupService']) {
        if (typeof mod[key] === 'function') mod[key] = deny;
        if (mod.promises && typeof mod.promises[key] === 'function') mod.promises[key] = deny;
      }
    }
    const original = require('node:module')._load;
    require('node:module')._load = function(name, ...args) {
      if (/supabase|openai|source-catalog|server-owned-retrieval/.test(name)) return deny();
      return original.call(this, name, ...args);
    };
    syncBuiltinESMExports();
    const imported = await import('./lib/readiness/official-truth-source-discovery-v1/search-bridge-1/coordinator.ts');
    const run = imported.discoverOfficialTruthSearchBridgeOffline ?? imported.default.discoverOfficialTruthSearchBridgeOffline;
    const input = ${JSON.stringify(fixture())};
    const result = await run(input, { signal: new AbortController().signal, transport: async () => [{url:${JSON.stringify(URL_A)}}] });
    if (result.status !== 'ready_candidate_urls' || result.sourceQualified !== false || result.officialResult !== 'unknown') process.exit(1);
    console.log(JSON.stringify({attempts, status:result.status}));
  `], { encoding: 'utf8', timeout: 30_000 })
  assert.equal(child.status, 0, 'cold import must pass; raw child output is not published')
  assert.equal(child.error, undefined)
  assert.deepEqual(JSON.parse(child.stdout), { attempts: 0, status: 'ready_candidate_urls' })
})

test('T07/T08: finite runtime closure reuses V1; no service, secret, acceptance or application entrypoint', () => {
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
      visit(`${spec.startsWith('@/') ? spec.slice(2) : join(dirname(path), spec)}.ts`)
    }
  }
  const namespace = 'lib/readiness/official-truth-source-discovery-v1/search-bridge-1/'
  visit(`${namespace}coordinator.ts`)
  assert.ok(seen.has('lib/readiness/official-truth-source-discovery-v1/coordinator.ts'))
  assert.ok(seen.has('lib/readiness/official-truth-content-identity.ts'))
  assert.ok(seen.has('lib/readiness/official-truth-discovered-url-candidates.ts'))
  for (const path of ['coordinator.ts', 'port.ts']) {
    const source = readFileSync(join(root, namespace, path), 'utf8')
    assert.doesNotMatch(source, /\bfetch\s*\(|\bprocess\s*\.|\bimport\s*\(|\brequire\s*\(|Date\.now|new Date|KandidatAkzeptieren/)
  }
  function scan(dir: string) {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) scan(path)
      else if (/\.[cm]?[jt]sx?$/.test(path) && !path.startsWith(namespace) && !path.endsWith('.test.ts')) {
        assert.doesNotMatch(readFileSync(join(root, path), 'utf8'), /['"][^'"]*search-bridge-1[^'"]*['"]|discoverOfficialTruthSearchBridgeOffline/)
      }
    }
  }
  for (const dir of ['app', 'lib', 'scripts']) scan(dir)
  assert.equal(requirementsProviderAus(), null)
})
