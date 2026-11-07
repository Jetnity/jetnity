// Native conformance helpers only. Never imported by the coordinator or apps.
import assert from 'node:assert/strict'
import { provenanceCanonical, provenanceHash } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { createIntegratedPilotArtifact, verifyLocalIntegratedPilotBundle, type IntegratedPilotArtifactInput, type IntegratedPilotManifestContent, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { freshExecutedFixture } from '../official-truth-persisted-canonical-read-1/fixtures'
import type { PilotMode } from '../../official-truth-integrated-pilot-1/corpus'
import type { PreparedOriginals } from '../official-truth-original-custody-1/storage'
import { pgBytes, pgCompositeArray, pgText, type LocalPgConnection } from '../official-truth-integrated-pilot-1/pg-wire'
import type { AtomicRefreshRequest } from './contract'
import { rewriteIntegratedFixture } from '../official-truth-integrated-pilot-1/integrated-proof'

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
const changingTypes = new Set([
  'original_observation', 'validity_origin', 'accepted_origin', 'eligible_version_snapshot',
  'AcceptedEvidenceCustodyV1', 'SelectedSupportManifestV1', 'AutonomousReviewConstructionV1',
])
const artifactKey = (artifact: IntegratedPilotArtifactInput) => `${artifact.pin.id}\0${artifact.pin.version}`
const byteFamily = (artifact: IntegratedPilotArtifactInput) => artifact.artifactType === 'global_cell' ? 'global_definition_v1'
  : artifact.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1'

/** Actual outputs must coexist under the unchanged immutable store contract.
 * An early publisher collision cannot stand in for a downstream refusal. */
function mutuallyCompatibleFreshGraphs(old: PreparedOriginals, next: PreparedOriginals) {
  const previous = new Map(old.envelope.bundle.artifacts.map(artifact => [artifactKey(artifact), artifact]))
  const incoming = new Map(next.envelope.bundle.artifacts.map(artifact => [artifactKey(artifact), artifact]))
  assert.equal(previous.size, old.envelope.bundle.artifacts.length)
  assert.equal(incoming.size, next.envelope.bundle.artifacts.length)
  assert.equal(incoming.size, previous.size)
  for (const artifact of incoming.values()) {
    const prior = previous.get(artifactKey(artifact))
    assert.equal(artifact.pin.version, 1)
    if (changingTypes.has(artifact.artifactType)) {
      assert.equal(prior, undefined, `${artifact.artifactType}: genuinely later owned content needs a distinct immutable identity`)
      assert.match(artifact.pin.id, /^pilot-fresh-[a-f0-9]{64}$/)
    } else {
      assert.ok(prior, `${artifact.artifactType}: static producer identity must remain shared`)
    }
    if (prior) {
      assert.equal(artifact.artifactType, prior.artifactType)
      assert.equal(byteFamily(artifact), byteFamily(prior))
      assert.equal(artifact.artifactContractVersion, prior.artifactContractVersion)
      assert.deepEqual(artifact.pin, prior.pin)
      assert.equal(Buffer.compare(Buffer.from(artifact.canonicalBytes), Buffer.from(prior.canonicalBytes)), 0,
        'every shared immutable key must have identical complete canonical bytes')
    }
  }
  for (const type of changingTypes) {
    const before = [...previous.values()].filter(artifact => artifact.artifactType === type)
    const after = [...incoming.values()].filter(artifact => artifact.artifactType === type)
    assert.ok(before.length > 0, `${type}: actual changing artifact family must be present`)
    assert.equal(after.length, before.length)
    for (const artifact of before) {
      assert.equal(incoming.has(artifactKey(artifact)), false)
      assert.match(artifact.pin.id, /^pilot-fresh-[a-f0-9]{64}$/)
    }
  }
}

export async function actuallyFreshObservations(mode: PilotMode, count: number): Promise<PreparedOriginals[]> {
  assert.ok(count >= 2 && count <= 3)
  const fixtures: PreparedOriginals[] = []
  for (let i = 0; i < count; i++) {
    // This waits for a genuinely later actual run. It never rewrites a time,
    // evidence ID, receipt, review, provenance field or implementation capsule.
    if (i) await delay(1_100)
    const fixture = await freshExecutedFixture(mode)
    const checked = verifyLocalIntegratedPilotBundle(fixture.envelope); assert.ok(checked.ok)
    for (const previous of fixtures) mutuallyCompatibleFreshGraphs(previous, fixture)
    const payload = checked.value.receipt.payload
    const prior = fixtures.at(-1)
    if (prior) {
      const previous = verifyLocalIntegratedPilotBundle(prior.envelope); assert.ok(previous.ok)
      assert.notEqual(fixture.envelope.bundle.recordFingerprint, prior.envelope.bundle.recordFingerprint)
      assert.ok(Date.parse(payload.proof.serverReferenceTime) > Date.parse(previous.value.receipt.payload.proof.serverReferenceTime))
      assert.notEqual(payload.proof.reviewPacketKey, previous.value.receipt.payload.proof.reviewPacketKey)
      for (let n = 0; n < payload.supports.length; n++) {
        const support = payload.supports[n]!
        const oldIndex: number = previous.value.receipt.payload.supports.findIndex(s => provenanceCanonical(s.binding) === provenanceCanonical(support.binding))
        assert.ok(oldIndex >= 0)
        const old = previous.value.receipt.payload.supports[oldIndex]!
        assert.notEqual(support.versionId, old.versionId)
        assert.ok(Date.parse(support.acceptedRetrievedAt) > Date.parse(old.acceptedRetrievedAt))
        assert.ok(Date.parse(support.freshRetrieval.completedAt) > Date.parse(old.freshRetrieval.completedAt))
        assert.deepEqual(fixture.bodies[n], prior.bodies[oldIndex])
      }
    }
    const capsules = fixture.envelope.bundle.artifacts.filter(item => item.artifactType === 'implementation_bundle')
    assert.ok(capsules.length > 1)
    const files = capsules.flatMap(item => {
      const manifest = JSON.parse(Buffer.from(item.canonicalBytes).toString('utf8'))
      return (JSON.parse(Buffer.from(manifest.content.bundleBase64, 'base64').toString('utf8')) as { files: { path: string; utf8: string }[] }).files
    })
    assert.ok(files.some(file => file.path === 'controlled-build/build.json'))
    assert.ok(files.some(file => file.path === 'controlled-build/worker.cjs' && file.utf8.includes('workerData.clockMode')))
    assert.ok(files.some(file => file.path === 'scripts/official-truth-integrated-pilot-1/engine.ts'))
    assert.ok(files.some(file => file.path.startsWith('node_modules/zod/')))
    fixtures.push(fixture)
  }
  return fixtures
}

/** Full historical hashes remain consistent; the actual raw JSON does not
 * support this locator. This is an explicit negative, never a fresh execution. */
export function falseValidityLocator(envelope: LocalIntegratedPilotEnvelope): LocalIntegratedPilotEnvelope {
  const origin = envelope.bundle.artifacts.find(item => item.artifactType === 'validity_origin')
  assert.ok(origin)
  const rewritten = rewriteIntegratedFixture(envelope, origin.pin.id, value => {
    const content = value.content as IntegratedPilotManifestContent<'validity_origin'>
    assert.equal(content.validFromBasis.kind, 'qualified_locator')
    return { ...value, content: { ...content, validFromBasis: { ...content.validFromBasis,
      locator: { kind: 'json_pointer', pointer: '/unrelated/date' } } } }
  })
  assert.ok(verifyLocalIntegratedPilotBundle(rewritten).ok, 'wrong locator negative must retain complete valid historical closure')
  return rewritten
}

/** Extra inactive definition is structurally valid but outside the fixed
 * canonical Composed registry. No observation/version/clock is rewritten. */
export function extraInactivePolicy(envelope: LocalIntegratedPilotEnvelope): LocalIntegratedPilotEnvelope {
  const definition = envelope.bundle.artifacts.find(item => item.artifactType === 'policy_definition')
  const registry = envelope.bundle.artifacts.find(item => item.artifactType === 'policy_registry')
  assert.ok(definition && registry)
  const content = JSON.parse(Buffer.from(definition.canonicalBytes).toString('utf8')).content as IntegratedPilotManifestContent<'policy_definition'>
  const extra = createIntegratedPilotArtifact('policy_definition', definition.pin.id, 2,
    { ...content, descriptor: { ...content.descriptor, policyVersion: 2 } })
  assert.ok(extra.ok)
  const original = JSON.parse(Buffer.from(registry.canonicalBytes).toString('utf8')).content as IntegratedPilotManifestContent<'policy_registry'>
  const next = createIntegratedPilotArtifact('policy_registry', registry.pin.id, registry.pin.version,
    { definitions: [...original.definitions, { id: definition.pin.id, version: 2, current: false, definition: extra.value.pin }] })
  assert.ok(next.ok)
  const rewritten = rewriteIntegratedFixture({ profile: envelope.profile, bundle: { ...envelope.bundle,
    artifacts: [...envelope.bundle.artifacts.map(item => item === registry ? { ...item, canonicalBytes: next.value.canonicalBytes } : item), extra.value],
  } }, '__rehash_all__', value => value)
  assert.ok(verifyLocalIntegratedPilotBundle(rewritten).ok, 'extra inactive policy negative must retain complete historical closure')
  return rewritten
}

/** Deliberate unqualified corruption, never evidence of an actual execution. */
export function corruptReceipt(envelope: LocalIntegratedPilotEnvelope, mutate: (payload: Record<string, unknown>) => void): LocalIntegratedPilotEnvelope {
  const payload = JSON.parse(Buffer.from(envelope.bundle.receiptBytes).toString('utf8')) as Record<string, unknown>
  mutate(payload)
  const fingerprint = provenanceHash('ot-provenance-v1', payload)!
  const binding = JSON.parse(Buffer.from(envelope.bundle.custodyBindingBytes).toString('utf8')) as { value: Record<string, unknown> }
  return { profile: envelope.profile, bundle: { ...envelope.bundle, recordFingerprint: fingerprint,
    receiptBytes: Buffer.from(provenanceCanonical(payload)!),
    custodyBindingBytes: Buffer.from(provenanceCanonical({ ...binding, value: { ...binding.value, receiptFingerprint: fingerprint } })!),
  } }
}

/** Test-only raw role path: deliberately bypasses TS prechecks to prove SQL. */
export async function directlyCallRefresh(connection: LocalPgConnection, oids: { element: number; array: number }, request: AtomicRefreshRequest, key: string) {
  const bundle = request.envelope.bundle
  const artifacts = pgCompositeArray(oids.array, oids.element, bundle.artifacts.map(a => [pgText(a.pin.id), pgText(String(a.pin.version), 20),
    pgText(a.pin.digest), pgText(a.artifactType), pgText(a.artifactType === 'global_cell' ? 'global_definition_v1' : a.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1'),
    pgText(String(a.artifactContractVersion), 23), pgBytes(a.canonicalBytes)]))
  const params = [pgText(request.mode), pgText(request.expectedPredecessor), pgText(bundle.recordFingerprint), pgText(request.reviewId), pgText(key),
    pgText(request.witness.sequence, 20), pgText(request.witness.eventHash), pgBytes(bundle.receiptBytes), pgBytes(bundle.custodyBindingBytes), artifacts, ...request.bodies.map(pgBytes)]
  return connection.query(`SELECT predecessor,successor,after_sequence::text,after_hash,phase_ms::text FROM official_original_api.refresh_version_v1(
    $1::text,$2::text,$3::text,$4::uuid,$5::text,$6::bigint,$7::text,$8::bytea,$9::bytea,$10::official_provenance_api.artifact_input_v1[],
    ARRAY[${request.bodies.map((_, i) => `$${11 + i}::bytea`).join(',')}]::bytea[])`, params)
}
