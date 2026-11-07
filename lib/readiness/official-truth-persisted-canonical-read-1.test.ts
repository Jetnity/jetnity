import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { test } from 'node:test'
import { persistedCanonicalReadContract } from '../../scripts/db/official-truth-persisted-canonical-read-1/contract'
import { historicalProjectionCurrent, projectHistoricalCanonicalRequirements } from '../../scripts/db/official-truth-persisted-canonical-read-1/projection'
import { readPersistedCanonicalRequirements } from '../../scripts/db/official-truth-persisted-canonical-read-1/reader'
import { contradictingFactFixture, freshExecutedFixture } from '../../scripts/db/official-truth-persisted-canonical-read-1/fixtures'
import { runFreshControlledSyntheticPilot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'
import { verifyLocalIntegratedPilotBundle } from './official-truth-integrated-pilot-bundle'
import { requirementsProviderAus } from './provider'
import type { LocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

function deeplyFrozen(value: unknown): boolean {
  return value === null || typeof value !== 'object' || (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen))
}

for (const mode of ['primary', 'composed'] as const) {
  test(`${mode}: actual fresh full captured bundle re-extracts canonical historical requirements`, { timeout: 60_000 }, async () => {
    const before = Date.now(), fixture = await freshExecutedFixture(mode), after = Date.now()
    const checked = verifyLocalIntegratedPilotBundle(fixture.envelope)
    assert.ok(checked.ok)
    const payload = checked.value.receipt.payload
    assert.deepEqual(payload.globalCell.definition, persistedCanonicalReadContract(mode).request.definition)
    assert.equal(payload.supports.length, mode === 'primary' ? 1 : 2)
    for (const support of payload.supports) {
      assert.ok(Date.parse(support.acceptedRetrievedAt) >= before - 121_000)
      assert.ok(Date.parse(support.acceptedRetrievedAt) < Date.parse(payload.proof.serverReferenceTime))
      assert.ok(Date.parse(payload.proof.serverReferenceTime) <= Date.parse(support.freshRetrieval.completedAt))
      assert.ok(Date.parse(support.freshRetrieval.completedAt) <= after)
    }
    const capsules = fixture.envelope.bundle.artifacts.filter(artifact => artifact.artifactType === 'implementation_bundle')
    const files = capsules.flatMap(artifact => {
      const manifest = JSON.parse(Buffer.from(artifact.canonicalBytes).toString('utf8'))
      return (JSON.parse(Buffer.from(manifest.content.bundleBase64, 'base64').toString('utf8')) as { files: { path: string; utf8: string }[] }).files
    })
    assert.ok(capsules.length > 1, 'full actual capsules retained, no one-file replacement')
    assert.ok(files.some(file => file.path === 'controlled-build/build.json'))
    assert.ok(files.some(file => file.path === 'controlled-build/worker.cjs' && file.utf8.includes('workerData.clockMode')))
    assert.ok(files.some(file => file.path === 'scripts/official-truth-integrated-pilot-1/engine.ts'))
    assert.ok(files.some(file => file.path.startsWith('node_modules/zod/')))
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => { throw Error('unexpected_reader_network') }
    try {
      const projection = await projectHistoricalCanonicalRequirements(checked.value, fixture.bodies, mode, new AbortController().signal)
      assert.equal(projection.status, 'synthetic_historical_projection')
      assert.equal(projection.reproof, 'unsealed_historical_reextraction')
      assert.equal(projection.recordFingerprint, fixture.envelope.bundle.recordFingerprint)
      assert.equal(projection.reviewPacketKey, payload.proof.reviewPacketKey)
      assert.equal(projection.reviewPacketKey.length, 81)
      assert.deepEqual(projection.supportVersionIds, payload.supports.map(support => support.versionId))
      assert.equal(projection.sources.length, mode === 'primary' ? 1 : 2)
      assert.deepEqual(projection.sources.map(source => source.sourceUrl), payload.supports.map(support => support.canonicalFinalUrl))
      assert.deepEqual(projection.sources.map(source => source.retrievedAt), payload.supports.map(support => support.acceptedRetrievedAt))
      const positives = projection.evaluations.filter(row => row.result !== 'unknown')
      assert.equal(positives.length, 1)
      assert.equal(positives[0]!.requirementType, 'visa')
      assert.equal(positives[0]!.result, 'required')
      assert.equal(positives[0]!.visaMode, 'electronic_visa')
      assert.equal(positives[0]!.status, 'current')
      assert.equal(positives[0]!.freshness, 'current')
      assert.equal(positives[0]!.evidence.sourceUrl, mode === 'primary' ? projection.sources[0]!.sourceUrl : null)
      assert.equal(positives[0]!.evidence.ruleReference, null)
      assert.equal(positives[0]!.evidence.checkedAt, payload.supports.map(support => support.acceptedRetrievedAt).sort()[0])
      assert.ok(projection.evaluations.length > 1)
      assert.ok(projection.evaluations.filter(row => row.requirementType !== 'visa').every(row => row.result === 'unknown'))
      assert.ok(deeplyFrozen(projection))
      assert.equal(historicalProjectionCurrent(projection), true)
      const old = new Date(Date.parse(projection.sources[0]!.retrievedAt) + 3_600_001).toISOString()
      assert.equal(historicalProjectionCurrent(projection, old), false, 'a fresh DB read cannot refresh the source time')
      assert.equal(historicalProjectionCurrent(projection, new Date(Date.parse(projection.sources[0]!.retrievedAt) - 1).toISOString()), false)
      const encoded = JSON.stringify(projection)
      for (const body of fixture.bodies) {
        assert.equal(encoded.includes(JSON.stringify(Buffer.from(body).toString('utf8')).slice(1, -1)), false)
        assert.equal(encoded.includes(Buffer.from(body).toString('base64')), false)
      }
      assert.doesNotMatch(encoded, /"(?:sourceSnapshot|original_bytes|canonicalBytes|bundleBase64|custodyBindingBytes|seal|token)":/)
      const forged = verifyLocalIntegratedPilotBundle(contradictingFactFixture(fixture.envelope))
      assert.ok(forged.ok)
      await assert.rejects(projectHistoricalCanonicalRequirements(forged.value, fixture.bodies, mode, new AbortController().signal), /persisted_projection_refused/)
      await assert.rejects(projectHistoricalCanonicalRequirements(checked.value, fixture.bodies, mode === 'primary' ? 'composed' : 'primary', new AbortController().signal), /persisted_projection_refused/)
      const wrongBodies = fixture.bodies.map(body => Buffer.from(body))
      wrongBodies[0]!.fill(32)
      await assert.rejects(projectHistoricalCanonicalRequirements(checked.value, wrongBodies, mode, new AbortController().signal), /persisted_projection_refused/)
      if (mode === 'composed') await assert.rejects(projectHistoricalCanonicalRequirements(checked.value, [...fixture.bodies].reverse(), mode, new AbortController().signal), /persisted_projection_refused/)
      const cancelled = new AbortController(); cancelled.abort()
      await assert.rejects(projectHistoricalCanonicalRequirements(checked.value, fixture.bodies, mode, cancelled.signal), /persisted_projection_refused/)
    } finally { globalThis.fetch = originalFetch }
  })
}

test('finite public read and fresh clock reject caller context, material, clocks and invalid modes', async () => {
  const cluster = {} as LocalProofCluster, key = 'ab'.repeat(32), witness = { sequence: '0', eventHash: '0'.repeat(64) }
  for (const mode of [undefined, null, 'visa', 'CH-DE', 'passport', {}, { mode: 'primary', fingerprint: 'caller' }]) {
    const result = await readPersistedCanonicalRequirements(cluster, mode, key, witness)
    assert.equal(result.status, 'refused')
    assert.equal(result.syntheticVisaCells, 0)
    assert.equal(result.positiveRealVisaCells, 0)
    if (result.status === 'refused') assert.equal(result.reason, 'context_invalid')
  }
  assert.equal((await Reflect.apply(readPersistedCanonicalRequirements, null, [cluster, 'primary', key, witness, undefined, { definition: {} }])).reason, 'context_invalid')
  assert.equal((await readPersistedCanonicalRequirements(cluster, 'primary', key, { ...witness, scope: {} } as typeof witness)).status, 'refused')
  const cancelled = new AbortController(); cancelled.abort()
  assert.equal((await readPersistedCanonicalRequirements(cluster, 'primary', key, witness, cancelled.signal)).status, 'refused')
  assert.equal((await readPersistedCanonicalRequirements(cluster, 'primary', key, witness)).status, 'unavailable', 'no invented local-cluster authority')
  for (const args of [[], ['bogus'], ['primary', 'none'], ['primary', { now: Date.now() }], ['primary', undefined]]) {
    await assert.rejects(Reflect.apply(runFreshControlledSyntheticPilot, null, args), /controlled_runtime_authority_required/)
  }
})

test('ordinary engine import cannot gain fresh-clock runtime authority', async () => {
  const { runSyntheticIntegratedPilot } = await import('../../scripts/official-truth-integrated-pilot-1/engine')
  for (const args of [['primary', 'none', 'fresh'], ['primary', 'changed_fresh_body', 'fresh'], ['primary', 'none', { now: Date.now() }]]) {
    const result = await Reflect.apply(runSyntheticIntegratedPilot, null, args)
    assert.equal(result.status, 'blocked')
    assert.equal('envelope' in result, false)
  }
})

test('reader has no HTTP or application import edge and existing provider remains off', () => {
  const root = new URL('../../', import.meta.url)
  const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
  for (const path of [
    'scripts/db/official-truth-persisted-canonical-read-1/reader.ts',
    'scripts/db/official-truth-persisted-canonical-read-1/contract.ts',
    'scripts/db/official-truth-persisted-canonical-read-1/projection.ts',
    'scripts/db/official-truth-original-custody-1/storage.ts',
    'scripts/db/official-truth-current-version-lookup-1/lookup.ts',
  ]) {
    const source = read(path)
    assert.doesNotMatch(source, /\bfetch\s*\(|(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](?:node:)?(?:http|https|net|undici)["']/)
    assert.doesNotMatch(source, /officialTruthTrustedFactExtrahierenMitDefinitionen|officialTruthCompositionPhaseB|server_owned_official_retrieval|redirectCount\s*:/)
  }
  const walk = (dir: string): string[] => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(`${dir}/${entry.name}`) : /\.[cm]?[jt]sx?$/.test(entry.name) && !/\.test\.[jt]sx?$/.test(entry.name) ? [join(dir, entry.name)] : [])
  const visited = new Set<string>()
  const forbidden = (path: string) => path.startsWith('scripts/db/official-truth-persisted-canonical-read-1/')
    || path === 'scripts/db/official-truth-original-custody-1/storage.ts'
    || path === 'scripts/db/official-truth-current-version-lookup-1/lookup.ts'
  const visit = (path: string) => {
    assert.equal(forbidden(path), false, `application import reaches the actual retained entry: ${path}`)
    if (visited.has(path)) return
    visited.add(path)
    const imports = read(path).matchAll(/(?:\bfrom\s+|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)["']([^"']+)["']/g)
    for (const match of imports) {
      const spec = match[1]!
      const base = spec.startsWith('@/') ? spec.slice(2) : spec.startsWith('.') ? normalize(join(dirname(path), spec)) : null
      if (!base) continue
      const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}/index.ts`, `${base}/index.tsx`]
        .find(candidate => /\.[cm]?[jt]sx?$/.test(candidate) && existsSync(new URL(candidate, root)))
      if (resolved) visit(resolved)
    }
  }
  for (const directory of ['app', 'components', 'lib']) for (const path of walk(directory)) visit(path)
  assert.equal(requirementsProviderAus(), null)
})
