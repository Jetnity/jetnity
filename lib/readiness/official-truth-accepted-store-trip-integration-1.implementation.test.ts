import assert from 'node:assert/strict'
import test from 'node:test'
import { archiveWire, verifyArchive, verifyCurrentImplementation } from './official-truth-accepted-store-trip-integration-1/archive-server'
import { provenanceCanonical, PROVENANCE_LIMITS } from './official-truth-autonomous-provenance-artifact'
import { fixtureContract, fixtureProductModules, fixtureRegistry, freshFixtureOriginal } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/fixtures'

test('Accepted Store Trip Integration 1: complete multi-capsule implementation identity preserves every exact file', async () => {
  const contract = fixtureContract(), modules = fixtureProductModules()
  const { original, startedAt } = await freshFixtureOriginal()
  const material = modules.canonical.canonicalStoreMaterial(contract, fixtureRegistry, original, startedAt)
  const bundle = modules.provenance.storeProvenanceBundle(material)
  const verified = verifyArchive(archiveWire(bundle))
  assert(Buffer.byteLength(JSON.stringify(contract.implementationSources), 'utf8') > PROVENANCE_LIMITS.artifactBytes)
  assert.equal(provenanceCanonical(contract.implementationSources), null,
    'The unchanged single-artifact codec must still refuse the aggregate source list')
  assert.doesNotThrow(() => verifyCurrentImplementation(verified, contract))
  const files = contract.implementationSources
  for (const [name, changed] of [
    ['changed byte', [{ ...files[0]!, utf8: files[0]!.utf8 + '\n' }, ...files.slice(1)]],
    ['changed path', [{ ...files[0]!, path: files[0]!.path + '.different' }, ...files.slice(1)]],
    ['missing file', files.slice(1)],
    ['duplicate path', [files[0]!, files[0]!, ...files.slice(2)]],
    ['extra file', [...files, { path: 'synthetic-extra-source.ts', utf8: '' }]],
  ] as const) {
    assert.throws(() => verifyCurrentImplementation(verified, { ...contract, implementationSources: changed }),
      /implementation_changed/, name)
  }
})
