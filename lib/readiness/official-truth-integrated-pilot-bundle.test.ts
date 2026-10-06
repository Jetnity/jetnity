import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'
import {
  createIntegratedPilotArtifact, readIntegratedPilotArtifact, readIntegratedPilotReceipt,
  verifyIntegratedPilotArtifactClosure, verifyIntegratedPilotBundle, INTEGRATED_PILOT_BUNDLE_LIMITS,
  verifyLocalIntegratedPilotArtifactClosure, verifyLocalIntegratedPilotBundle, LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE,
  type IntegratedPilotArtifactInput, type IntegratedPilotDependency, type IntegratedPilotVerifiedArtifact,
  type IntegratedPilotArtifactClosureInput, type LocalIntegratedPilotEnvelope,
} from './official-truth-integrated-pilot-bundle'
import { historicalPinFor, provenanceCanonical, provenanceHash, type Pin } from './official-truth-autonomous-provenance-artifact'
import { regelScopeAusEvidenceScope } from './rule-claims'
import { runControlledSyntheticPilot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'

function good<T>(r: { ok: true; value: T } | { ok: false; reason: string }): T {
  assert.equal(r.ok, true, JSON.stringify(r)); if (!r.ok) throw Error('blocked'); return r.value
}
const encode = (v: unknown) => new TextEncoder().encode(provenanceCanonical(v)!)
const hash = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')
const dummy = (id = 'synthetic-pin'): Pin => historicalPinFor(id, 1, { fixture: id })!
const scopeValue = {
  destinationCountryCode: 'NZ', transitCountryCode: null, citizenship: { mode: 'required', countryCodes: ['CH'] },
  credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
  residence: { mode: 'not_applicable' }, requirementType: 'passport_validity', validity: { mode: 'not_applicable' },
}
function code(id = 'synthetic-code') {
  return good(createIntegratedPilotArtifact('implementation_bundle', id, 1, {
    encoding: 'base64', mediaType: 'application/vnd.jetnity.implementation-source-bundle+json',
    bundleBase64: Buffer.from(encode({ schema: 'implementation-source-bundle-v1', files: [{ path: 'synthetic/example.ts', utf8: 'export const synthetic = true\n' }] })).toString('base64'),
  }))
}
function contract(id: string, implementation: Pin, extra: readonly Pin[] = []) {
  return good(createIntegratedPilotArtifact('semantic_contract', id, 1,
    { contract: 'scope', implementation, implementationDependencies: [...extra] }))
}
function artifact(type: IntegratedPilotArtifactInput['artifactType'], id: string, v: unknown): IntegratedPilotArtifactInput {
  const canonicalBytes = encode(v)
  return { pin: { id, version: 1, digest: hash(canonicalBytes) }, artifactType: type, artifactContractVersion: 1, canonicalBytes }
}
const root = (slot: string, a: IntegratedPilotArtifactInput): IntegratedPilotDependency => ({ slot, pin: a.pin, artifactType: a.artifactType })
function graph(artifacts: readonly IntegratedPilotArtifactInput[], target = artifacts.at(-1)!) {
  return verifyIntegratedPilotArtifactClosure({ artifacts, receiptRoots: [root('synthetic', target)],
    bindingRoots: [root('a', target), root('b', target), root('c', target)], bindingByteLength: 200 })
}

test('C27 implementation manifest stores exact canonical source bytes and derives typed edges', () => {
  const implementation = code(), semantic = contract('synthetic-scope', implementation.pin)
  const read = good(readIntegratedPilotArtifact(semantic))
  assert.equal(read.byteContractFamily, 'manifest_v1')
  assert.deepEqual(read.dependencies, [{ slot: '/implementation', pin: implementation.pin, artifactType: 'implementation_bundle' }])
  const parsed = JSON.parse(new TextDecoder().decode(semantic.canonicalBytes))
  assert.equal(hash(semantic.canonicalBytes), semantic.pin.digest)
  assert.deepEqual(parsed.dependencies, [{ slot: '/implementation', pin: implementation.pin }])
  const result = good(graph([implementation, semantic]))
  assert.deepEqual(result.graph, { nodes: 3, edges: 6, bytes: 200 + implementation.canonicalBytes.length + semantic.canonicalBytes.length, longestDepth: 3 })
})

test('C27 global and custody bytes retain their distinct accepted preimages', () => {
  const scope = regelScopeAusEvidenceScope(scopeValue); assert.ok(scope.ok)
  const cell = { id: 'synthetic-cell', version: 1, scope: scope.scope }
  const global = artifact('global_cell', cell.id, cell)
  assert.equal(good(readIntegratedPilotArtifact(global)).byteContractFamily, 'global_definition_v1')
  const admission = { kind: 'GlobalCellAdmissionV1', schemaVersion: 1, value: {
    cell: global.pin, scopeContract: dummy('scope'), corpusAdmissionContract: dummy('corpus'), evaluationDatePlan: null,
    dimensionBasis: Object.fromEntries(Object.entries(scope.scope).map(([name, category]) => [name, { category, basis: dummy(name.toLowerCase()) }])),
  } }
  const admitted = artifact('GlobalCellAdmissionV1', 'synthetic-admission', admission)
  const read = good(readIntegratedPilotArtifact(admitted))
  assert.equal(read.byteContractFamily, 'custody_v1')
  assert.equal(read.dependencies.length, 10)
  assert.ok(read.dependencies.some(e => e.slot === '/dimensionBasis/citizenship/basis'))
  const rewrapped = artifact('GlobalCellAdmissionV1', 'synthetic-admission', { artifactType: 'GlobalCellAdmissionV1', value: admission })
  assert.equal(readIntegratedPilotArtifact(rewrapped).ok, false)
})

test('C22 artifact rejects malformed bytes, unknown keys and versions without invoking accessors', () => {
  const valid = code()
  for (const raw of ['{"a":1,"a":2}', '{"a":-0}', '{"a":1e0}', '{"a":"\\ud800"}', '{}\n']) {
    const canonicalBytes = new TextEncoder().encode(raw)
    assert.equal(readIntegratedPilotArtifact({ ...valid, pin: { ...valid.pin, digest: hash(canonicalBytes) }, canonicalBytes }).ok, false)
  }
  assert.equal(readIntegratedPilotArtifact({ ...valid, artifactContractVersion: 2 } as unknown as IntegratedPilotArtifactInput).ok, false)
  assert.equal(readIntegratedPilotArtifact({ ...valid, artifactType: 'unknown' } as unknown as IntegratedPilotArtifactInput).ok, false)
  let calls = 0
  const getter = Object.defineProperty({}, 'pin', { enumerable: true, get() { calls++; return valid.pin } })
  assert.equal(readIntegratedPilotArtifact(getter as IntegratedPilotArtifactInput).ok, false)
  assert.equal(calls, 0)
  const badArray: IntegratedPilotArtifactInput[] = []
  Object.defineProperty(badArray, 0, { enumerable: true, get() { calls++; return valid } })
  assert.equal(graph(badArray, valid).ok, false)
  assert.equal(calls, 0)
  assert.equal(createIntegratedPilotArtifact('semantic_contract', 'unknown-fields', 1,
    { contract: 'scope', implementation: valid.pin, implementationDependencies: [], accepted: true } as never).ok, false)
})

test('C18 implementation bytes are mandatory and cannot be replaced by function, Git SHA or source locator', () => {
  const value = { encoding: 'base64' as const, mediaType: 'application/vnd.jetnity.implementation-source-bundle+json' as const, bundleBase64: '' }
  for (const invalid of ['', Buffer.from('function extract() {}').toString('base64'), Buffer.from('{"gitSha":"abc"}').toString('base64')]) {
    assert.equal(createIntegratedPilotArtifact('implementation_bundle', 'bad-code', 1, { ...value, bundleBase64: invalid }).ok, false)
  }
  assert.equal(createIntegratedPilotArtifact('implementation_bundle', 'bad-code', 1, { ...value,
    bundleBase64: Buffer.from(encode({ schema: 'implementation-source-bundle-v1', files: [{ path: '../secret', utf8: 'bad' }] })).toString('base64') }).ok, false)
})

test('C23/C24 shared DAG preserves all role edges; complete pins and bytes cannot be aliased', () => {
  const leaf = code(), parent = contract('synthetic-scope', leaf.pin)
  assert.equal(good(graph([leaf, parent])).artifactEdges.length, 1)
  assert.deepEqual(graph([leaf, parent, leaf]), { ok: false, reason: 'dependency_corrupt' })
  assert.deepEqual(graph([parent]), { ok: false, reason: 'dependency_missing' })
  assert.deepEqual(graph([leaf, parent, code('extra')], parent), { ok: false, reason: 'dependency_corrupt' })
  const wrongType = { ...leaf, artifactType: 'semantic_contract' as const }
  assert.equal(graph([wrongType, parent]).ok, false)
  const corrupt = { ...leaf, canonicalBytes: leaf.canonicalBytes.slice() }; corrupt.canonicalBytes[0] = 0
  assert.equal(graph([corrupt, parent]).ok, false)
})

test('C23 raw node, byte and binding bounds reject boundary+1 without truncation', () => {
  const leaf = code()
  assert.deepEqual(graph(Array.from({ length: INTEGRATED_PILOT_BUNDLE_LIMITS.nodes }, () => leaf)), { ok: false, reason: 'closure_bound_exceeded' })
  assert.deepEqual(verifyIntegratedPilotArtifactClosure({ artifacts: [leaf], receiptRoots: [root('x', leaf)],
    bindingRoots: [root('a', leaf), root('b', leaf), root('c', leaf)], bindingByteLength: 4097 }), { ok: false, reason: 'closure_bound_exceeded' })
  assert.equal(readIntegratedPilotArtifact({ ...leaf, canonicalBytes: new Uint8Array(1_048_577) }).ok, false)
})

test('C05 original and validity codecs distinguish observed clocks and explicit unasserted bounds', () => {
  const binding = { sourceId: 'example-authority', contentItemId: 'example-rule', contentItemVersion: 1,
    representationId: 'text', representationVersion: 1, identityProfileId: 'example-profile', identityProfileVersion: 1 }
  const observation = { binding, requestUrl: 'https://authority.example/rule', canonicalFinalUrl: 'https://authority.example/rule',
    contentType: 'text/plain', sourceContentHash: 'a'.repeat(64), startedAt: '2026-10-06T10:00:00.000Z', completedAt: '2026-10-06T10:00:00.100Z',
    qualification: dummy('qualification'), transportContract: dummy('transport'), identityProfile: dummy('profile'), catalogSnapshot: dummy('catalog'), hashContract: dummy('hash') }
  const a = good(createIntegratedPilotArtifact('original_observation', 'synthetic-observation', 1, observation))
  assert.equal(good(readIntegratedPilotArtifact(a)).dependencies.length, 5)
  assert.equal(createIntegratedPilotArtifact('original_observation', 'synthetic-observation', 1,
    { ...observation, completedAt: '2026-10-06T09:59:59.999Z' }).ok, false)
  const validity = { observation: a.pin, evidenceScope: { ...scopeValue, sourceId: binding.sourceId }, validFrom: null, validUntil: null,
    validFromBasis: { kind: 'no_bound_asserted' as const }, validUntilBasis: { kind: 'no_bound_asserted' as const }, derivationContract: dummy('validity') }
  good(createIntegratedPilotArtifact('validity_origin', 'synthetic-validity', 1, validity))
  assert.equal(createIntegratedPilotArtifact('validity_origin', 'synthetic-validity', 1,
    { ...validity, validFrom: '2026-10-01' }).ok, false)
  assert.equal(createIntegratedPilotArtifact('validity_origin', 'synthetic-validity', 1,
    { ...validity, validFromBasis: undefined } as never).ok, false)
})

test('C13/C28 receipt or persistence-shaped success cannot reconstruct a live producer', () => {
  assert.deepEqual(verifyIntegratedPilotBundle({ recordFingerprint: `ot-provenance-v1:${'a'.repeat(64)}`,
    receiptBytes: encode({ accepted: true }), custodyBindingBytes: encode({}), artifacts: [] }), { ok: false, reason: 'receipt_corrupt' })
  assert.equal(readIntegratedPilotReceipt({ payload: { schema: 'unknown' }, recordFingerprint: provenanceHash('ot-provenance-v1', { schema: 'unknown' }) }).ok, false)
})


const localProfile = LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE
function localGraph(closure: IntegratedPilotArtifactClosureInput) {
  return verifyLocalIntegratedPilotArtifactClosure({ profile: localProfile, closure })
}
function closure(artifacts: readonly IntegratedPilotArtifactInput[], roots: readonly IntegratedPilotArtifactInput[] = artifacts.slice(-1)) {
  return { artifacts, receiptRoots: roots.map((a, i) => root(`root-${i}`, a)),
    bindingRoots: [root('a', roots[0]!), root('b', roots[0]!), root('c', roots[0]!)], bindingByteLength: 200 }
}

test('R1 explicit local envelope preserves v1 and rejects unknown, ambiguous or caller-selected limits', () => {
  const leaf = code(), input = closure([leaf])
  const legacy = good(verifyIntegratedPilotArtifactClosure(input)), local = good(localGraph(input))
  assert.equal(INTEGRATED_PILOT_BUNDLE_LIMITS.depth, 8)
  assert.equal(local.profile, localProfile)
  assert.deepEqual(local.graph, legacy.graph)
  for (const bad of [input, { profile: 'ot-integrated-pilot-local-closure-v1', closure: input },
    { profile: localProfile, closure: input, maxDepth: 64 }, { profile: localProfile, closure: { ...input, maxDepth: 64 } },
    { profile: localProfile, closure: input, bundle: {} }]) {
    assert.equal(verifyLocalIntegratedPilotArtifactClosure(bad as never).ok, false)
  }
  assert.equal(verifyIntegratedPilotArtifactClosure({ profile: localProfile, closure: input } as never).ok, false)
  const bundle = { recordFingerprint: 'ot-provenance-v1:' + 'a'.repeat(64), receiptBytes: encode({}), custodyBindingBytes: encode({}), artifacts: [] }
  for (const envelope of [bundle, { profile: 2, bundle }, { profile: 'ot-integrated-pilot-local-closure-v1', bundle },
    { profile: localProfile, bundle, maxDepth: 16 }, { profile: localProfile, bundle, schemaVersion: 2 }]) {
    assert.deepEqual(verifyLocalIntegratedPilotBundle(envelope as never), { ok: false, reason: 'unsupported_version' })
  }
  assert.deepEqual(verifyIntegratedPilotBundle({ profile: localProfile, bundle } as never), { ok: false, reason: 'receipt_corrupt' })
  let invoked = 0
  const accessor = Object.defineProperty({ bundle }, 'profile', { enumerable: true, get() { invoked++; return localProfile } })
  assert.deepEqual(verifyLocalIntegratedPilotBundle(accessor as never), { ok: false, reason: 'unsupported_version' })
  assert.equal(invoked, 0)
})

/** Test-only export of the exact production graph arithmetic. The closed typed
 * artifact language currently cannot construct paths 16/17; these are helper
 * boundary tests, not fabricated accepted artifacts or complete pilot bundles. */
function graphArithmetic() {
  const file = fileURLToPath(new URL('./official-truth-integrated-pilot-bundle.ts', import.meta.url))
  const source = readFileSync(file, 'utf8') + '\nexport { verifyResolvedGraph }\n'
  const emitted = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const localRequire = createRequire(file), exported: Record<string, unknown> = {}
  const execute = runInThisContext(`(function(require, exports) {${emitted}\n})`)
  execute((name: string) => localRequire(name.startsWith('@/') ? join(dirname(file), '../..', name.slice(2)) : name), exported)
  return exported.verifyResolvedGraph as (nodes: ReadonlyMap<string, IntegratedPilotVerifiedArtifact>,
    receiptRoots: readonly IntegratedPilotDependency[], bindingRoots: readonly IntegratedPilotDependency[], maximum: 8 | 16) =>
    { ok: true; value: { longestDepth: number } } | { ok: false; reason: string; bound?: { limit: 'depth'; observed: number; maximum: number } }
}
function resolvedChain(depth: number) {
  const nodes = new Map<string, IntegratedPilotVerifiedArtifact>()
  let last: IntegratedPilotVerifiedArtifact | null = null
  for (let i = 1; i < depth; i++) {
    const pin = dummy(`graph-node-${i}`)
    const dependencies: IntegratedPilotDependency[] = last ? [root('child', last)] : []
    const node: IntegratedPilotVerifiedArtifact = { pin, artifactType: 'semantic_contract', artifactContractVersion: 1,
      canonicalBytes: new Uint8Array(), byteContractFamily: 'manifest_v1', value: null, dependencies }
    nodes.set(`${pin.id}\0${pin.version}\0${pin.digest}`, node); last = node
  }
  const top = last!
  // The short route is visited first, so a visited-only depth implementation fails.
  return { nodes, receiptRoots: [root('first-short-route', [...nodes.values()][0]!)],
    bindingRoots: [root('long-route', top)], top }
}

test('R1 production graph arithmetic enforces v1 8/9 and explicit-local v2 16/17 using longest shared DAG paths', () => {
  const verify = graphArithmetic()
  for (const maximum of [8, 16] as const) {
    const exact = resolvedChain(maximum)
    assert.deepEqual(verify(exact.nodes, exact.receiptRoots, exact.bindingRoots, maximum), { ok: true, value: { longestDepth: maximum } })
    const over = resolvedChain(maximum + 1)
    assert.deepEqual(verify(over.nodes, over.receiptRoots, over.bindingRoots, maximum), {
      ok: false, reason: 'closure_bound_exceeded', bound: { limit: 'depth', observed: maximum + 1, maximum },
    })
  }
  const eleven = resolvedChain(11)
  assert.deepEqual(verify(eleven.nodes, eleven.receiptRoots, eleven.bindingRoots, 8), {
    ok: false, reason: 'closure_bound_exceeded', bound: { limit: 'depth', observed: 11, maximum: 8 },
  })
  assert.equal(good(verify(eleven.nodes, eleven.receiptRoots, eleven.bindingRoots, 16)).longestDepth, 11)
  const cycle = resolvedChain(4), bottom = [...cycle.nodes.values()][0]!
  cycle.nodes.set(`${bottom.pin.id}\0${bottom.pin.version}\0${bottom.pin.digest}`, { ...bottom, dependencies: [root('cycle', cycle.top)] })
  assert.deepEqual(verify(cycle.nodes, cycle.receiptRoots, cycle.bindingRoots, 16), { ok: false, reason: 'dependency_corrupt' })
})

test('R1 local profile retains exact node, edge, binding and byte budgets', () => {
  const leaves = Array.from({ length: 253 }, (_, i) => code(`budget-leaf-${String(i).padStart(3, '0')}`))
  const parents = [contract('budget-parent-a', leaves[0]!.pin, leaves.slice(1, 127).map(a => a.pin)),
    contract('budget-parent-b', leaves[127]!.pin, leaves.slice(128).map(a => a.pin))]
  const atNodes = closure([...leaves, ...parents], parents)
  assert.equal(good(localGraph(atNodes)).graph.nodes, 256)
  assert.deepEqual(localGraph({ ...atNodes, artifacts: [...atNodes.artifacts, code('node-over')] }), { ok: false, reason: 'closure_bound_exceeded' })
  const edgeLeaves = leaves.slice(0, 128)
  const edgeParents = Array.from({ length: 8 }, (_, i) => contract(`edge-parent-${i}`, edgeLeaves[0]!.pin,
    edgeLeaves.slice(0, i === 7 ? 108 : 128).map(a => a.pin)))
  const atEdges = closure([...edgeLeaves, ...edgeParents], edgeParents)
  assert.equal(good(localGraph(atEdges)).graph.edges, 1024)
  const over = contract('edge-parent-7', edgeLeaves[0]!.pin, edgeLeaves.slice(0, 109).map(a => a.pin))
  const overParents = [...edgeParents.slice(0, -1), over]
  assert.deepEqual(localGraph(closure([...edgeLeaves, ...overParents], overParents)), { ok: false, reason: 'closure_bound_exceeded' })
  const minimal = closure([leaves[0]!])
  assert.equal(good(localGraph({ ...minimal, bindingByteLength: 4096 })).graph.bytes, 4096 + leaves[0]!.canonicalBytes.length)
  assert.deepEqual(localGraph({ ...minimal, bindingByteLength: 4097 }), { ok: false, reason: 'closure_bound_exceeded' })
  assert.equal(localGraph({ ...minimal, artifacts: [{ ...leaves[0]!, canonicalBytes: new Uint8Array(1_048_577) }] }).ok, false)
})

test('R1 validity origins retain derived non-null values and reject invented, swapped or malformed basis', () => {
  const value = { observation: dummy('observation'), evidenceScope: { ...scopeValue, sourceId: 'example-authority' },
    validFrom: '2026-10-01', validUntil: null, derivationContract: dummy('validity'),
    validFromBasis: { kind: 'qualified_locator' as const, locator: { kind: 'json_pointer' as const, pointer: '/validity/from' }, value: '2026-10-01' },
    validUntilBasis: { kind: 'no_bound_asserted' as const } }
  good(createIntegratedPilotArtifact('validity_origin', 'non-null-origin', 1, value))
  for (const invalid of [{ ...value, validFrom: '2026-10-02' }, { ...value, validFrom: null },
    { ...value, validFromBasis: { ...value.validFromBasis, locator: { kind: 'json_pointer', pointer: '/validity/~invalid' } } },
    { ...value, validUntilBasis: value.validFromBasis }, { ...value, validFromBasis: { kind: 'no_bound_asserted' } }]) {
    assert.deepEqual(createIntegratedPilotArtifact('validity_origin', 'non-null-origin', 1, invalid as never), { ok: false, reason: 'dependency_corrupt' })
  }
})


/** Rehash the complete historical closure after a content mutation. This proves
 * semantic refusal independently of byte/checksum/depth failures. It cannot
 * create runtime custody membership or a trusted fact. */
function rehashMutation(envelope: LocalIntegratedPilotEnvelope, type: IntegratedPilotArtifactInput['artifactType'], mutate: (value: Record<string, unknown>) => void): LocalIntegratedPilotEnvelope {
  const all = envelope.bundle.artifacts
  const selected = all.find(a => a.artifactType === type)!
  assert.ok(selected)
  const key = (pin: Pin) => `${pin.id}\0${pin.version}\0${pin.digest}`
  const indexed = new Map(all.map(a => [key(a.pin), a])), rebuilt = new Map<string, IntegratedPilotArtifactInput>()
  function replace(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(replace)
    if (!value || typeof value !== 'object') return value
    const row = value as Record<string, unknown>
    if (Object.keys(row).sort().join(',') === 'digest,id,version' && indexed.has(key(row as Pin))) return visit(row as Pin).pin
    return Object.fromEntries(Object.entries(row).map(([name, child]) => [name, replace(child)]))
  }
  function visit(pin: Pin): IntegratedPilotArtifactInput {
    const existing = rebuilt.get(key(pin)); if (existing) return existing
    const old = indexed.get(key(pin))!, value = JSON.parse(new TextDecoder().decode(old.canonicalBytes))
    if (old === selected) mutate(value as Record<string, unknown>)
    const canonicalBytes = encode(replace(value)), result = { ...old, pin: { ...pin, digest: hash(canonicalBytes) }, canonicalBytes }
    rebuilt.set(key(pin), result); return result
  }
  const artifacts = all.map(a => visit(a.pin))
  const payload = replace(JSON.parse(new TextDecoder().decode(envelope.bundle.receiptBytes)))
  const recordFingerprint = provenanceHash('ot-provenance-v1', payload)!
  const k = replace(JSON.parse(new TextDecoder().decode(envelope.bundle.custodyBindingBytes))) as { value: { receiptFingerprint: string } }
  k.value.receiptFingerprint = recordFingerprint
  return { profile: localProfile, bundle: { recordFingerprint, artifacts, receiptBytes: encode(payload), custodyBindingBytes: encode(k) } }
}

function receiptMutation(envelope: LocalIntegratedPilotEnvelope, mutate: (payload: Record<string, unknown>) => void): LocalIntegratedPilotEnvelope {
  const payload = JSON.parse(new TextDecoder().decode(envelope.bundle.receiptBytes)) as Record<string, unknown>
  mutate(payload)
  const recordFingerprint = provenanceHash('ot-provenance-v1', payload)!
  const k = JSON.parse(new TextDecoder().decode(envelope.bundle.custodyBindingBytes)) as { value: { receiptFingerprint: string } }
  k.value.receiptFingerprint = recordFingerprint
  return { profile: localProfile, bundle: { ...envelope.bundle, recordFingerprint, receiptBytes: encode(payload), custodyBindingBytes: encode(k) } }
}

test('R1 both controlled positive bundles verify fully at depth11; unchanged v1 refuses the exact same closure', async () => {
  for (const mode of ['primary', 'composed'] as const) {
    const run = await runControlledSyntheticPilot(mode)
    assert.equal(run.status, 'synthetic_bundle_verified', run.status === 'blocked' ? run.reason : undefined); if (run.status !== 'synthetic_bundle_verified') throw Error('positive_failed')
    const local = good(verifyLocalIntegratedPilotBundle(run.envelope))
    assert.equal(local.profile, localProfile)
    assert.equal(local.graph.longestDepth, 11)
    assert.deepEqual(verifyIntegratedPilotBundle(run.envelope.bundle), { ok: false, reason: 'closure_bound_exceeded',
      bound: { limit: 'depth', observed: 11, maximum: 8 } })
    if (mode === 'primary') {
      assert.equal(local.receipt.payload.supports[0]!.validFrom, '2026-10-01')
      const origin = local.artifacts.find(a => a.artifactType === 'validity_origin')!
      const value = (origin.value as { content: { validFromBasis: unknown } }).content
      assert.deepEqual(value.validFromBasis, { kind: 'qualified_locator', locator: { kind: 'json_pointer', pointer: '/validity/from' }, value: '2026-10-01' })
    }
    const bundle = run.envelope.bundle, first = bundle.artifacts[0]!
    const verify = (changes: Partial<typeof bundle>) => verifyLocalIntegratedPilotBundle({ profile: localProfile, bundle: { ...bundle, ...changes } })
    const absent = bundle.artifacts.filter(a => a !== bundle.artifacts.find(x => x.artifactType === 'original_observation'))
    assert.deepEqual(verify({ artifacts: absent }), { ok: false, reason: 'dependency_missing' })
    assert.deepEqual(verify({ artifacts: [...bundle.artifacts, code('unreachable-artifact')] }), { ok: false, reason: 'dependency_corrupt' })
    assert.deepEqual(verify({ artifacts: [...bundle.artifacts, first] }), { ok: false, reason: 'dependency_corrupt' })
    assert.deepEqual(verify({ artifacts: [{ ...first, pin: { ...first.pin, digest: '0'.repeat(64) } }, ...bundle.artifacts.slice(1)] }), { ok: false, reason: 'dependency_corrupt' })
    assert.deepEqual(verify({ artifacts: [{ ...first, artifactContractVersion: 2 } as never, ...bundle.artifacts.slice(1)] }), { ok: false, reason: 'unsupported_version' })
    assert.deepEqual(verify({ artifacts: [{ ...first, artifactType: 'external_issuer' } as never, ...bundle.artifacts.slice(1)] }), { ok: false, reason: 'unsupported_version' })
    assert.deepEqual(verify({ custodyBindingBytes: encode({ accepted: true }) }), { ok: false, reason: 'binding_corrupt' })
    assert.deepEqual(verify({ receiptBytes: new Uint8Array([...bundle.receiptBytes, 10]) }), { ok: false, reason: 'receipt_corrupt' })
    assert.deepEqual(verify({ recordFingerprint: 'ot-provenance-v1:' + '0'.repeat(64) }), { ok: false, reason: 'receipt_corrupt' })
    const k = JSON.parse(new TextDecoder().decode(bundle.custodyBindingBytes)) as { value: { receiptFingerprint: string } }
    k.value.receiptFingerprint = 'ot-provenance-v1:' + '0'.repeat(64)
    assert.deepEqual(verify({ custodyBindingBytes: encode(k) }), { ok: false, reason: 'binding_corrupt' })
    const raw = first.canonicalBytes.slice(); raw[0] = 0
    assert.deepEqual(verify({ artifacts: [{ ...first, canonicalBytes: raw }, ...bundle.artifacts.slice(1)] }), { ok: false, reason: 'dependency_corrupt' })
    assert.deepEqual(verifyLocalIntegratedPilotBundle(receiptMutation(run.envelope, p => { p.schemaVersion = 2 })), { ok: false, reason: 'receipt_corrupt' })
    assert.deepEqual(verifyLocalIntegratedPilotBundle(receiptMutation(run.envelope, p => { (p.citations as unknown[]).pop() })), { ok: false, reason: 'semantic_mismatch' })
    assert.deepEqual(verifyLocalIntegratedPilotBundle(receiptMutation(run.envelope, p => { (p.extractor as Record<string, unknown>).selectionKey = 'ot-extractor-selection-v1:' + '0'.repeat(64) })), { ok: false, reason: 'semantic_mismatch' })
    assert.deepEqual(verifyLocalIntegratedPilotBundle(receiptMutation(run.envelope, p => { (p.candidate as Record<string, unknown>).factHash = 'ot-fact-v1:' + '0'.repeat(64) })), { ok: false, reason: 'semantic_mismatch' })
    if (mode === 'composed') {
      assert.deepEqual(verifyLocalIntegratedPilotBundle(receiptMutation(run.envelope, p => {
        (p.policy as Record<string, unknown>).resultIdentity = 'ot-composition-result-v1:' + '0'.repeat(64)
      })), { ok: false, reason: 'semantic_mismatch' })
    }
    for (const [type, change] of [
      ['original_observation', (v: Record<string, unknown>) => { (v.content as Record<string, unknown>).contentType = 'text/html' }],
      ['original_observation', (v: Record<string, unknown>) => { (v.content as Record<string, unknown>).requestUrl = 'https://regulations.example/unqualified' }],
      ['validity_origin', (v: Record<string, unknown>) => { ((v.content as Record<string, unknown>).evidenceScope as Record<string, unknown>).sourceId = 'other-authority' }],
      ['GlobalRepresentationQualificationV1', (v: Record<string, unknown>) => { ((v.value as Record<string, unknown>).binding as Record<string, unknown>).identityProfileVersion = 2 }],
      ['semantic_contract', (v: Record<string, unknown>) => { (v.content as Record<string, unknown>).contract = 'transport' }],
    ] as const) {
      const altered = rehashMutation(run.envelope, type, change)
      assert.deepEqual(verifyLocalIntegratedPilotBundle(altered), { ok: false, reason: 'semantic_mismatch' })
    }
    for (const mutate of [(v: Record<string, unknown>) => { (v.dependencies as unknown[]).pop() },
      (v: Record<string, unknown>) => { (v.dependencies as unknown[]).push({ slot: '/unknown', pin: first.pin }) },
      (v: Record<string, unknown>) => { v.issuer = 'caller-asserted' }]) {
      assert.deepEqual(verifyLocalIntegratedPilotBundle(rehashMutation(run.envelope, 'original_observation', mutate)), { ok: false, reason: 'dependency_corrupt' })
    }

  }
})


test('R1 local closure accepts exactly 8 MiB including K and refuses one additional byte', () => {
  function sizedCode(name: string, size: number) {
    return good(createIntegratedPilotArtifact('implementation_bundle', name, 1, {
      encoding: 'base64', mediaType: 'application/vnd.jetnity.implementation-source-bundle+json',
      bundleBase64: Buffer.from(encode({ schema: 'implementation-source-bundle-v1', files: [
        { path: 'synthetic/a.ts', utf8: 'a'.repeat(Math.floor(size / 2)) },
        { path: 'synthetic/b.ts', utf8: 'b'.repeat(Math.ceil(size / 2)) },
      ] })).toString('base64'),
    }))
  }
  const fixed = Array.from({ length: 11 }, (_, i) => sizedCode(`sized-${String(i).padStart(2, '0')}`, 520_000))
  let variableSize = 560_000
  const make = () => {
    const artifacts = [...fixed, sizedCode('sized-11', variableSize)]
    const parent = contract('sized-parent', artifacts[0]!.pin, artifacts.map(a => a.pin))
    return closure([...artifacts, parent])
  }
  let input = make()
  const total = () => input.artifacts.reduce((sum, a) => sum + a.canonicalBytes.length, input.bindingByteLength)
  variableSize += Math.floor((INTEGRATED_PILOT_BUNDLE_LIMITS.totalArtifactBytes - total()) * 3 / 4)
  input = make()
  input.bindingByteLength += INTEGRATED_PILOT_BUNDLE_LIMITS.totalArtifactBytes - total()
  assert.ok(input.bindingByteLength > 0 && input.bindingByteLength <= 4096)
  assert.equal(good(localGraph(input)).graph.bytes, 8_388_608)
  assert.deepEqual(localGraph({ ...input, bindingByteLength: input.bindingByteLength + 1 }), { ok: false, reason: 'closure_bound_exceeded' })
})
