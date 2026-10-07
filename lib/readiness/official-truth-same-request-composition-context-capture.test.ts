// Synthetic offline execution through the actual proof, retrieval, Phase A/B
// and extraction algorithms. Instrumentation below exists only in this test.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'
import * as composition from './official-truth-composition-policy-registry'
import {
  consumeOfficialTruthSameRequestCompositionContext as consume,
  decideOfficialTruthSameRequestTrustedFactExtraction as run,
  type OfficialTruthSameRequestCompositionContext as Context,
} from './official-truth-same-request-extraction-server'
import { compositionCaptureFixture as f } from './official-truth-same-request-extraction-server.test'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from './official-truth-trusted-fact-extractor-registry'
import { runOfficialTruthGlobalProduction } from './official-truth-autonomous-provenance-record-server'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const path = 'lib/readiness/official-truth-same-request-extraction-server.ts'
const source = readFileSync(join(root, path), 'utf8')
type Start = {
  input: Parameters<typeof composition.officialTruthCompositionPhaseA>[0]
  freeze: composition.OfficialTruthCompositionFreeze
  binding: Context['binding']
}
type PhaseB = Extract<ReturnType<typeof composition.officialTruthCompositionPhaseB>, { ok: true }>

function immutable(value: unknown) {
  if (!value || typeof value !== 'object') return
  assert.ok(Object.isFrozen(value))
  for (const child of Object.values(value)) immutable(child)
}
function nonExecutable(value: unknown) {
  assert.notEqual(typeof value, 'function')
  if (value && typeof value === 'object') for (const child of Object.values(value)) nonExecutable(child)
}
function emptyTrace() { return { abrufe: [], transporte: [], katalogOperationen: [], extrakt: [], http: [] } }
function options(policy = f.kompositionsPolitik()) {
  const calls = { match: 0, extract: 0 }
  return { compositionPolicies: [policy], compositionExtractors: [f.kompositionsExtraktor(calls, f.kompositionsBeobachtungen(policy))] }
}
async function success(input = f.zusammengesetzteEingabe(), opts = options()) {
  const result = await f.binden(input, opts)
  assert.equal(result.ergebnis.status, 'same_request_composition_bound', JSON.stringify(result.ergebnis))
  return result
}
function context(result: unknown): Context { const view = consume(result); assert.ok(view); return view }

/** Compile this exact local module with a read-only stage observer and a
 * read-only WeakMap membership probe. Imports execute the real algorithms;
 * neither instrumented export exists in the production source/module. */
function instrument(inspectStart: (start: Start | null) => void = () => {},
  afterB: (output: PhaseB) => PhaseB = value => value) {
  let lastB: PhaseB | null = null
  let phaseBInput: Parameters<typeof composition.officialTruthCompositionPhaseB>[0] | null = null
  let phaseACalls = 0, phaseBCalls = 0, registryCalls = 0
  const marker = '  const replay = wiedergabe(fest.registry)'
  assert.equal(source.split(marker).length, 2)
  const code = ts.transpileModule(source.replace(marker, '  inspectStart(compositionStart)\n' + marker) +
    '\nexport const capturePresent = (result: object) => compositionContexts.has(result as CompositionResult)', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const localRequire = createRequire(import.meta.url)
  const exports: Record<string, unknown> = {}
  const execute = runInThisContext(`(function(require, exports, structuredClone, inspectStart) {${code}\n})`)
  execute((name: string) => {
    if (name === 'server-only') return {}
    if (name.endsWith('/official-truth-composition-policy-registry')) return {
      ...composition,
      officialTruthCompositionRegistriesPruefen: (...args: Parameters<typeof composition.officialTruthCompositionRegistriesPruefen>) => {
        registryCalls++; return composition.officialTruthCompositionRegistriesPruefen(...args)
      },
      officialTruthCompositionPhaseA: (input: Parameters<typeof composition.officialTruthCompositionPhaseA>[0]) => {
        phaseACalls++; return composition.officialTruthCompositionPhaseA(input)
      },
      officialTruthCompositionPhaseB: (input: Parameters<typeof composition.officialTruthCompositionPhaseB>[0]) => {
        phaseBCalls++
        phaseBInput = input
        const result = composition.officialTruthCompositionPhaseB(input)
        if (!result.ok) return result
        lastB = result
        return afterB(result)
      },
    }
    return localRequire(name.startsWith('@/') ? join(root, name.slice(2)) : name)
  }, exports, structuredClone, inspectStart)
  return {
    run: exports.decideOfficialTruthSameRequestTrustedFactExtraction as typeof run,
    consume: exports.consumeOfficialTruthSameRequestCompositionContext as typeof consume,
    has: exports.capturePresent as (result: object) => boolean,
    observed: () => ({ lastB, phaseBInput, phaseACalls, phaseBCalls, registryCalls }),
  }
}

test('A precedes every retrieval; complete validated registries and exact executables survive input mutation', async () => {
  const opts = options()
  const original = opts.compositionExtractors[0]!
  const originalPolicy = opts.compositionPolicies[0]!
  const { match, extract } = original
  opts.compositionExtractors.push({ ...original, extractorVersion: 2, current: false })
  opts.compositionPolicies.push({ ...opts.compositionPolicies[0]!, policyVersion: 2, current: false })
  let start: Start | null = null, retrievalCount = 0
  const observed = instrument(value => { start = value })
  const result = await f.binden(f.zusammengesetzteEingabe(), {
    ...opts, run: observed.run,
    retrieve: async (request, transport) => {
      assert.ok(start)
      immutable(start)
      assert.equal(start.input.extractors.length, 2)
      assert.equal(start.input.policies.length, 2)
      assert.strictEqual(start.freeze.extractor, start.input.extractors[0])
      assert.strictEqual(start.freeze.policy, start.input.policies[0])
      assert.strictEqual(start.freeze.extractor.match, match)
      assert.strictEqual(start.freeze.extractor.extract, extract)
      assert.equal(observed.observed().phaseACalls, 1)
      assert.equal(observed.observed().phaseBCalls, 0)
      retrievalCount++
      // Replace caller-owned lists and mutable original definition scalars.
      opts.compositionExtractors.splice(0)
      opts.compositionPolicies.splice(0)
      Object.assign(original, { extractorVersion: 99, match: () => { throw Error('replacement') }, extract: () => { throw Error('replacement') } })
      Object.assign(originalPolicy.assignments[0]!.target, { fieldPath: 'replacement' })
      return f.echtAbrufen(request, transport, emptyTrace(), f.standardAntwort)
    },
  })
  assert.equal(result.ergebnis.status, 'same_request_composition_bound')
  assert.equal(retrievalCount, 2)
  assert.equal(result.extern.length, 1)
  const stats = observed.observed()
  assert.equal(stats.registryCalls, 1); assert.equal(stats.phaseACalls, 1); assert.equal(stats.phaseBCalls, 1)
  const view = observed.consume(result.ergebnis); assert.ok(view)
  assert.ok(start)
  assert.strictEqual(stats.phaseBInput!.freeze, (start as Start).freeze)
  assert.strictEqual(stats.phaseBInput!.registry, (start as Start).binding.registry)
  assert.strictEqual(view.binding.registry, (start as Start).binding.registry)
  assert.strictEqual(view.phaseA.supports, (start as Start).input.supports)
  assert.equal(view.phaseA.extractors.length, 2); assert.equal(view.phaseA.policies.length, 2)
  assert.equal(view.phaseA.selected.extractor.extractorVersion, 1)
  assert.deepEqual(view.phaseA.selected.policy.assignments, (start as Start).freeze.policy.assignments)
  assert.strictEqual(view.phaseB.provenance, stats.lastB!.provenance)
  assert.strictEqual(view.phaseB.seal, stats.lastB!.seal)
  assert.strictEqual(view.phaseB.fact, composition.officialTruthCompositionSealView(stats.lastB!.seal)!.fact)
  nonExecutable(view); immutable(view)
  assert.equal(observed.has(result.ergebnis), false)
})

test('real final-only URLs, full checked equal-values citations and proof order survive capture', async () => {
  const starts = new Map(f.urls.map((url, i) => [url, `${url}/start?lang=${i ? 'de' : 'en'}`]))
  const publications = f.publications.map(p => starts.has(p.url) ? { ...p, requestUrls: [starts.get(p.url)!] } : p)
  const policy = f.gleichwertigePolitik()
  const result = await f.binden(f.zusammengesetzteEingabe(), {
    ...options(policy), extern: f.transportFuer(f.realeEingaben(), publications),
    antwort: url => {
      const target = [...starts].find(([, initial]) => initial === url)?.[0]
      return target ? { status: 302, location: target } : f.standardAntwort(url)
    },
  })
  const view = context(result.ergebnis)
  assert.deepEqual(Object.keys(result.ergebnis).sort(), ['seal', 'status'])
  assert.deepEqual(Reflect.ownKeys(result.ergebnis).sort(), ['seal', 'status'])
  assert.equal(JSON.stringify(result.ergebnis), '{"status":"same_request_composition_bound","seal":{}}')
  assert.deepEqual(view.retrievals.map(r => r.versionId), view.binding.supportVersionIds)
  assert.deepEqual(view.retrievals.map(r => r.requestUrl), result.spur.http.filter((_, i) => i % 2 === 0))
  for (const row of view.retrievals) {
    assert.equal(row.requestUrl, starts.get(row.canonicalUrl))
    assert.notEqual(row.requestUrl, row.canonicalUrl)
    assert.equal(row.sourceContentHash, view.binding.supports.find(s => s.versionId === row.versionId)!.sourceContentHash)
    assert.deepEqual(Object.keys(row).sort(), ['canonicalUrl', 'contentItemId', 'contentItemVersion', 'contentType', 'identityProfileId', 'identityProfileVersion', 'identitySchema', 'representationId', 'representationVersion', 'requestUrl', 'retrievedAt', 'sourceContentHash', 'sourceId', 'versionId'].sort())
  }
  const expected = policy.assignments.flatMap(a => a.contentItemRefs.map(ref => {
    const support = view.binding.supports.find(s => s.sourceId === ref.sourceId && s.contentItemId === ref.contentItemId)!
    const { identitySchema, contentType, canonicalUrl, retrievedAt, sourceContentHash, validFrom, validUntil, ...binding } = support
    void identitySchema; void contentType; void canonicalUrl; void retrievedAt; void sourceContentHash; void validFrom; void validUntil
    return { ...binding, citationKey: composition.officialTruthCompositionCitationKey(a.target), target: a.target,
      extractorId: view.phaseB.extractorId, extractorVersion: view.phaseB.extractorVersion, policyId: policy.policyId, policyVersion: policy.policyVersion }
  })).sort((a, b) => a.citationKey < b.citationKey ? -1 : a.citationKey > b.citationKey ? 1 : a.versionId < b.versionId ? -1 : 1)
  assert.equal(expected.length, 3)
  assert.deepEqual(view.phaseB.provenance, expected)
  assert.strictEqual(view.phaseB.fact, composition.officialTruthCompositionSealView(view.phaseB.seal)!.fact)
  assert.notStrictEqual(view.phaseB.fact, structuredClone(view.phaseB.fact))
})

test('schema-1 branch, outcomes, atom and otherwise retain every checked citation', async () => {
  const base = f.kompositionsPolitik(), [first, second] = base.contentItemRefs
  assert.ok(first); assert.ok(second)
  const assignment = (target: composition.OfficialTruthCompositionCitationTarget, ref = first): composition.OfficialTruthCompositionAssignment => ({
    target, contentItemRefs: [ref], relation: 'single_content_item', role: 'complementary_part',
  })
  const policy: composition.OfficialTruthCompositionPolicy = { ...base, applicabilitySchema: 1, assignments: [
    assignment({ kind: 'branch', branchId: 'exemption' }),
    assignment({ kind: 'branch_outcome', branchId: 'exemption', field: 'effect' }),
    assignment({ kind: 'branch_outcome', branchId: 'exemption', field: 'visaMode' }),
    assignment({ kind: 'atom', branchId: 'exemption', atomLocator: 'branch:exemption/atom' }),
    assignment({ kind: 'otherwise', branchId: 'residual' }, second),
  ] }
  const definition = { ...f.kompositionsExtraktor({ match: 0, extract: 0 }), requiredFieldPaths: [],
    extract: (input: Parameters<ReturnType<typeof f.kompositionsExtraktor>['extract']>[0]) => {
      const id = (sourceId: string) => input.supports.find(s => s.sourceId === sourceId)!.versionId
      return { ok: true, observations: f.kompositionsBeobachtungen(policy), fact: {
        kind: 'requirement_effect', schema: 1, applicability: { schema: 1, kind: 'branches', branches: [
          { id: 'exemption', when: { kind: 'expression', expression: { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' }, supportVersionIds: [id(first.sourceId)] } },
            outcome: { effect: 'not_required', visaMode: null }, supportVersionIds: [id(first.sourceId)] },
          { id: 'residual', when: { kind: 'otherwise' }, outcome: { effect: 'required', visaMode: 'electronic_visa' }, supportVersionIds: [id(second.sourceId)] },
        ] },
      } }
    },
  }
  const result = await f.binden(f.zusammengesetzteEingabe(), { compositionPolicies: [policy], compositionExtractors: [definition] })
  const view = context(result.ergebnis)
  assert.equal(view.phaseB.provenance.length, 5)
  assert.deepEqual(view.phaseB.provenance.map(p => p.citationKey).sort(), policy.assignments.map(a => composition.officialTruthCompositionCitationKey(a.target)).sort())
  assert.strictEqual(view.phaseB.fact, composition.officialTruthCompositionSealView(view.phaseB.seal)!.fact)
  immutable(view)
  for (const missing of ['atom', 'otherwise', 'branch_outcome']) {
    const incomplete = { ...policy, assignments: policy.assignments.filter(a => a.target.kind !== missing) }
    const failed = await f.binden(f.zusammengesetzteEingabe(), { compositionPolicies: [incomplete], compositionExtractors: [definition] })
    assert.equal(failed.ergebnis.status, 'blocked', missing)
    assert.equal(consume(failed.ergebnis), null)
  }
})

for (const failure of ['missing', 'duplicate', 'foreign'] as const) {
  test(`invalid ${failure} support cannot publish capture`, async () => {
    const input = f.zusammengesetzteEingabe() as { supports: { umschlag: { request: unknown } }[] }
    if (failure === 'missing') input.supports.pop()
    if (failure === 'duplicate') input.supports.push(input.supports[0]!)
    if (failure === 'foreign') input.supports[0]!.umschlag.request = f.anfrage({ destinationCountryCode: 'TH' })
    const result = await f.binden(input, options())
    assert.equal(result.ergebnis.status, 'blocked')
    assert.equal(result.spur.http.length, 0)
    assert.equal(consume(result.ergebnis), null)
  })
}

test('only exact result identity consumes once; clones, proxies, prototypes, replay and cross-attachment fail', async () => {
  const a = (await success()).ergebnis, b = (await success()).ergebnis
  assert.equal(a.status, 'same_request_composition_bound'); assert.equal(b.status, 'same_request_composition_bound')
  if (a.status !== 'same_request_composition_bound' || b.status !== 'same_request_composition_bound') return
  let getters = 0
  const getter = Object.defineProperty({}, 'seal', { get() { getters++; throw Error('secret') } })
  for (const fake of [null, undefined, 'fabricated-id', {}, { ...a }, structuredClone(a), JSON.parse(JSON.stringify(a)), Object.create(a),
    new Proxy(a, {}), { ...a, seal: b.seal }, { ...a, fact: structuredClone(composition.officialTruthCompositionSealView(a.seal)!.fact) },
    { status: a.status, seal: Object.create(a.seal) }, getter]) assert.equal(consume(fake), null)
  assert.equal(getters, 0)
  const ca = context(a), cb = context(b)
  assert.notStrictEqual(ca.phaseB.seal, cb.phaseB.seal)
  assert.notStrictEqual(ca.phaseB.fact, cb.phaseB.fact)
  assert.strictEqual(ca.phaseB.seal, a.seal)
  assert.strictEqual(cb.phaseB.seal, b.seal)
  assert.equal(consume(a), null); assert.equal(consume(b), null); assert.equal(consume(ca), null)
  assert.throws(() => Object.assign(ca.phaseB, { fact: structuredClone(cb.phaseB.fact), seal: b.seal }))
})

test('interleaved invocations keep their own scope, URLs, fact, seal and citations', async () => {
  let release!: () => void, entered!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  const ready = new Promise<void>(resolve => { entered = resolve })
  const aInput = f.zusammengesetzteEingabe() as { supports: { umschlag: { request: unknown } }[] }
  for (const s of aInput.supports) s.umschlag.request = f.anfrage({ citizenship: { mode: 'required', countryCodes: ['CH', 'DE'] } })
  const starts = new Map(f.urls.map(url => [url, `${url}/start?lang=de`]))
  const pubs = f.publications.map(p => starts.has(p.url) ? { ...p, requestUrls: [starts.get(p.url)!] } : p)
  const pending = f.binden(aInput, { ...options(), extern: f.transportFuer(f.realeEingaben(), pubs),
    retrieve: async (value, transport) => {
      entered(); await held
      return f.echtAbrufen(value, transport, emptyTrace(), url => {
        const target = [...starts].find(([, initial]) => initial === url)?.[0]
        return target ? { status: 302, location: target } : f.standardAntwort(url)
      })
    },
  })
  await ready
  const b = await success()
  const cb = context(b.ergebnis)
  release()
  const a = await pending, ca = context(a.ergebnis)
  assert.notEqual(ca.binding.ruleScopeKey, cb.binding.ruleScopeKey)
  assert.notEqual(ca.binding.reviewPacketKey, cb.binding.reviewPacketKey)
  assert.notDeepEqual(ca.binding.supportVersionIds, cb.binding.supportVersionIds)
  assert.notStrictEqual(ca.phaseB.fact, cb.phaseB.fact)
  assert.notStrictEqual(ca.phaseB.seal, cb.phaseB.seal)
  for (const c of [ca, cb]) {
    assert.deepEqual([...new Set(c.phaseB.provenance.map(p => p.versionId))].sort(), c.binding.supportVersionIds)
    assert.strictEqual(c.phaseB.fact, composition.officialTruthCompositionSealView(c.phaseB.seal)!.fact)
  }
  assert.ok(ca.retrievals.every(r => r.requestUrl === starts.get(r.canonicalUrl)))
  assert.ok(cb.retrievals.every(r => r.requestUrl === r.canonicalUrl))
})

for (const failure of ['conflict', 'missing', 'duplicate', 'foreign'] as const) {
  test(`checked citation ${failure} publishes no capture`, async () => {
    const policy = f.gleichwertigePolitik(), rows = f.kompositionsBeobachtungen(policy)
    if (failure === 'conflict') rows[0] = { ...rows[0]!, canonical: 'different' }
    if (failure === 'missing') rows.shift()
    if (failure === 'duplicate') rows.push(rows[0]!)
    if (failure === 'foreign') rows[0] = { ...rows[0]!, contentItemId: 'foreign_item' }
    const result = await f.binden(f.zusammengesetzteEingabe(), {
      compositionPolicies: [policy], compositionExtractors: [f.kompositionsExtraktor({ match: 0, extract: 0 }, rows)],
    })
    assert.equal(result.ergebnis.status, 'blocked')
    assert.equal(consume(result.ergebnis), null)
    assert.deepEqual(Object.keys(result.ergebnis).sort(), ['reason', 'status'])
  })
}

for (const failure of ['throw', 'abort', 'hash', 'request', 'mime', 'identity'] as const) {
  test(`partial retrieval ${failure} publishes no capture`, async () => {
    let calls = 0
    const observed = instrument()
    const result = await f.binden(f.zusammengesetzteEingabe(), { ...options(), run: observed.run,
      retrieve: async (value, transport) => {
        const actual = await f.echtAbrufen(value, transport, emptyTrace(), f.standardAntwort)
        if (++calls === 1) return actual
        if (failure === 'throw') throw Error('private failure text')
        if (failure === 'abort') return { status: 'blocked', reason: 'timeout' }
        if (actual.status !== 'server_owned_official_retrieval') return actual
        if (failure === 'hash') return { ...actual, sourceContentHash: 'f'.repeat(64) }
        if (failure === 'request') return { ...actual, requestUrl: actual.requestUrl + '/wrong' }
        if (failure === 'mime') return { ...actual, contentType: 'text/html' }
        return { ...actual, representationVersion: 999 }
      },
    })
    assert.equal(calls, 2)
    assert.equal(result.ergebnis.status, 'blocked')
    assert.equal(observed.observed().phaseBCalls, 0)
    assert.equal(observed.has(result.ergebnis), false)
    assert.equal(observed.consume(result.ergebnis), null)
    assert.equal(JSON.stringify(result.ergebnis).includes('private'), false)
  })
}

test('Phase B throw and missing capture prerequisites cannot publish partial context', async () => {
  const observed = instrument()
  const opts = options()
  opts.compositionExtractors[0] = { ...opts.compositionExtractors[0]!, extract: () => { throw Error('secret') } }
  const failed = await f.binden(f.zusammengesetzteEingabe(), { ...opts, run: observed.run })
  assert.equal(failed.ergebnis.status, 'blocked'); assert.equal(observed.has(failed.ergebnis), false)
  // Fault injection only AFTER the real Phase B, preserving its actual outward
  // seal: loss of selected-scalar agreement yields no capture, not a new result.
  const missing = instrument(() => {}, output => ({ ...output, extractorVersion: output.extractorVersion + 1 }))
  const result = await f.binden(f.zusammengesetzteEingabe(), { ...options(), run: missing.run })
  assert.equal(result.ergebnis.status, 'same_request_composition_bound')
  assert.equal(missing.consume(result.ergebnis), null)
})

test('visible context excludes proposal, bodies, auth, transport, functions and side-channel fields', async () => {
  const sentinel = 'forbidden-transport-secret-sentinel'
  const result = await f.binden(f.zusammengesetzteEingabe(), { ...options(),
    retrieve: async (value, transport) => ({
      ...await f.echtAbrufen(value, transport, emptyTrace(), f.standardAntwort),
      headers: { authorization: sentinel }, cookies: sentinel, dns: sentinel, ip: sentinel,
      body: sentinel, redirectChain: [sentinel], user: sentinel, secrets: sentinel,
    }),
  })
  const view = context(result.ergebnis), serialized = JSON.stringify(view)
  for (const forbidden of [sentinel, 'official page line', 'proof-sentinel', 'interior proof page', 'sourceSnapshot', 'proposal', 'authorization', 'cookies', 'redirectChain', 'grant', 'capability', 'userId', 'sessionId', '"match"', '"extract"']) {
    assert.equal(serialized.includes(forbidden), false, forbidden)
  }
  assert.deepEqual(Object.keys(view).sort(), ['binding', 'phaseA', 'phaseB', 'retrievals'])
  assert.deepEqual(Object.keys(view.binding).sort(), ['registry', 'reviewPacketKey', 'ruleScopeKey', 'scope', 'serverReferenceTime', 'supportVersionIds', 'supports'])
  immutable(view); nonExecutable(view)
  const primary = await f.binden(f.eingabe(), { definitionen: [f.definition()] })
  assert.equal(primary.ergebnis.status, 'same_request_trusted_fact_material')
  assert.equal(consume(primary.ergebnis), null)
  const blocked = await f.binden(f.zusammengesetzteEingabe())
  assert.deepEqual(blocked.ergebnis, { status: 'blocked', reason: 'composition_policy_unavailable' })
  assert.equal(blocked.spur.http.length, 0); assert.equal(consume(blocked.ergebnis), null)
})

test('finite import/export fences, weak ownership, unchanged live wiring and dormant roots', () => {
  assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
  assert.equal(composition.OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY.length, 0)
  assert.deepEqual(runOfficialTruthGlobalProduction(), { status: 'blocked', reason: 'custody_missing' })
  assert.match(source, /const compositionContexts = new WeakMap</)
  assert.match(source, /compositionContexts\.delete\(result as CompositionResult\)/)
  assert.equal((source.match(/compositionContexts\.set\(/g) ?? []).length, 1)
  assert.doesNotMatch(source, /new Map\(|setTimeout|setInterval|Date\.now|randomUUID|\.toString\(\)/)
  assert.doesNotMatch(source, /export (?:async )?function (?:compositionCapture|extraktorSicht)|inspectStart|capturePresent/)
  const runtimeExports = [...source.matchAll(/^export (?:async )?function (\w+)/gm)].map(m => m[1]).sort()
  assert.deepEqual(runtimeExports, ['consumeOfficialTruthSameRequestCompositionContext', 'consumeOfficialTruthSameRequestCompositionExecutionContext', 'consumeOfficialTruthSameRequestPrimaryContext', 'decideOfficialTruthSameRequestTrustedFactExtraction', 'loadOfficialTruthSameRequestTrustedFactExtraction'])
  const imports = [...source.matchAll(/(?:from\s+|import\s+)['"]([^'"]+)['"]/g)].map(m => m[1]).sort()
  assert.deepEqual(imports, ['server-only', ...[
    'evidence', 'official-truth-content-identity', 'official-truth-composition-policy-registry',
    'official-truth-source-catalog-server', 'official-truth-same-request-proof-server',
    'official-truth-server-held-source-registry', 'official-truth-server-owned-retrieval',
    'official-truth-trusted-fact-extractor-registry', 'rule-claims', 'source-registry',
  ].map(n => '@/lib/readiness/' + n)].sort())
  const live = source.slice(source.indexOf('export async function loadOfficialTruthSameRequestTrustedFactExtraction'))
  assert.match(live, /loadProof: loadOfficialTruthSameRequestProof,\s+retrieve: loadOfficialTruthServerOwnedRetrievalWithCatalogTransport,\s+extract: officialTruthTrustedFactExtrahieren,/)
  const consumers: string[] = []
  function visit(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const name = join(dir, entry.name)
      if (entry.isDirectory()) visit(name)
      else if (/\.[cm]?[jt]sx?$/.test(name) && !/\.(?:test|spec)\./.test(name)) {
        const text = readFileSync(name, 'utf8')
        if (/\bconsumeOfficialTruthSameRequestCompositionContext\b/.test(text)) consumers.push(relative(root, name))
        assert.doesNotMatch(text, /from ['"][^'"]*official-truth-same-request-(?:composition-context-capture|extraction-server)\.test['"]/, name)
      }
    }
  }
  for (const dir of ['lib', 'app', 'components', 'scripts', 'types']) visit(join(root, dir))
  assert.deepEqual(consumers, [path])
})
