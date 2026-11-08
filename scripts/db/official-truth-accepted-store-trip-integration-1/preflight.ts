import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { verifyIntegratedPilotBundle, verifyLocalIntegratedPilotBundle, LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE } from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import { fixtureContract, fixtureProductModules, fixtureRegistry, freshFixtureOriginal } from './fixtures'

/** Concrete diagnostic only; never chooses a consumer profile or publishes. */
export async function runAcceptedStoreBundlePreflight(outputDirectory: string) {
  const modules = fixtureProductModules(), contract = fixtureContract()
  const { original, startedAt } = await freshFixtureOriginal()
  const material = modules.canonical.canonicalStoreMaterial(contract, fixtureRegistry, original, startedAt)
  assert.equal(material.claim.scope.destinationCountryCode, 'DE')
  assert.deepEqual(material.claim.scope.validity, { mode: 'travel_date', travelDate: '2026-11-20' })
  assert.equal(material.claim.fact.kind, 'requirement_effect')
  const bundle = modules.provenance.storeProvenanceBundle(material)
  assert.throws(() => modules.provenance.storeProvenanceBundle(material), /canonical_execution_required/)
  const standard = verifyIntegratedPilotBundle(bundle)
  const local = verifyLocalIntegratedPilotBundle({ profile: LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, bundle })
  const gitBlob = (buffer: Buffer) => createHash('sha1').update(`blob ${buffer.byteLength}\0`).update(buffer).digest('hex')
  const verifierPath = 'lib/readiness/official-truth-integrated-pilot-bundle.ts'
  assert.equal(gitBlob(readFileSync(verifierPath)), 'ee4a35d224b7177c6b07efcf4b131433751f70d1')
  const record = {
    schema: 'accepted-store-trip-preflight-v1', observedAt: new Date().toISOString(),
    baseline: 'e1fe0c696ade9f39b417772b5c065f87530204d6', acknowledgement: '3e5f9e418c2ebc48d0351ae7185e71f07a30d3db',
    boundary: 'Synthetic original and actual fresh canonical Evidence/Review/Extractor/Rule execution. No Auth/SQL/COMMIT/product authorization claimed.',
    scope: material.claim.scope, ruleScopeKey: material.claim.key, fact: material.claim.fact, evidenceVersion: material.evidence.versionId,
    originalRetrievedAt: original.retrievedAt, legalValidity: material.validity, reviewPacketKey: material.reviewPacketKey,
    receiptFingerprint: bundle.recordFingerprint, verifier: { path: verifierPath, gitBlob: gitBlob(readFileSync(verifierPath)) },
    standard8: { entry: 'verifyIntegratedPilotBundle', configuredMaximum: 8, result: standard.ok ? { ok: true, graph: standard.value.graph } : standard },
    local16Diagnostic: { entry: 'verifyLocalIntegratedPilotBundle', profile: LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE, configuredMaximum: 16,
      result: local.ok ? { ok: true, graph: local.value.graph } : local },
    receiptBytes: bundle.receiptBytes.byteLength, custodyBindingBytes: bundle.custodyBindingBytes.byteLength,
    artifacts: bundle.artifacts.map(a => ({ pin: a.pin, artifactType: a.artifactType, artifactContractVersion: a.artifactContractVersion, byteLength: a.canonicalBytes.byteLength })),
    code: contract.implementationSources.map(f => ({ path: f.path, gitBlob: gitBlob(Buffer.from(f.utf8, 'utf8')) })),
  }
  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(resolve(outputDirectory, 'preflight-evidence.json'), JSON.stringify(record, null, 2) + '\n')
  writeFileSync(resolve(outputDirectory, 'preflight-bundle.json'), JSON.stringify({ recordFingerprint: bundle.recordFingerprint,
    receiptBytesBase64: Buffer.from(bundle.receiptBytes).toString('base64'), custodyBindingBytesBase64: Buffer.from(bundle.custodyBindingBytes).toString('base64'),
    artifacts: bundle.artifacts.map(a => ({ pin: a.pin, artifactType: a.artifactType, artifactContractVersion: a.artifactContractVersion,
      canonicalBytesBase64: Buffer.from(a.canonicalBytes).toString('base64') })) }) + '\n')
  console.log(JSON.stringify({ receiptFingerprint: bundle.recordFingerprint, artifacts: bundle.artifacts.length,
    standard8: record.standard8, local16Diagnostic: record.local16Diagnostic, evidencePath: resolve(outputDirectory, 'preflight-evidence.json') }, null, 2))
  return record
}

if (process.argv[1]?.endsWith('/preflight.ts')) {
  void runAcceptedStoreBundlePreflight(process.argv[2] ?? '/tmp/accepted-store-trip-preflight').catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
