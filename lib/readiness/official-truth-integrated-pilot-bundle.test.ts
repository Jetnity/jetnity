import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import {
  createIntegratedPilotArtifact, readIntegratedPilotArtifact, readIntegratedPilotReceipt,
  verifyIntegratedPilotArtifactClosure, verifyIntegratedPilotBundle, INTEGRATED_PILOT_BUNDLE_LIMITS,
  type IntegratedPilotArtifactInput, type IntegratedPilotDependency,
} from './official-truth-integrated-pilot-bundle'
import { historicalPinFor, provenanceCanonical, provenanceHash, type Pin } from './official-truth-autonomous-provenance-artifact'
import { regelScopeAusEvidenceScope } from './rule-claims'

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
