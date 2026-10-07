// Actual controlled canonical conformance. SQL publication is mandatory in the storage test.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY } from './official-truth-composition-policy-registry'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from './official-truth-trusted-fact-extractor-registry'
import { runOfficialTruthGlobalProduction } from './official-truth-autonomous-provenance-record-server'
import { requirementsProviderAus } from './provider'
import { PILOT_FAULTS, runSyntheticIntegratedPilot, type PilotFault } from '../../scripts/official-truth-integrated-pilot-1/engine'
import { runControlledSyntheticPilot } from '../../scripts/official-truth-integrated-pilot-1/controlled-runtime'
import { PILOT_ITEMS, pilotBody, pilotUrl, pilotStartUrl, pilotOtherStartUrl, pilotOriginalRequestUrl, derivePilotValidity, type PilotMode } from '../../scripts/official-truth-integrated-pilot-1/corpus'
import { verifyLocalIntegratedPilotBundle, verifyIntegratedPilotBundle } from './official-truth-integrated-pilot-bundle'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const enginePath = join(root, 'scripts/official-truth-integrated-pilot-1/engine.ts')
type PilotResult = Awaited<ReturnType<typeof runSyntheticIntegratedPilot>>
function noPublication(result: PilotResult) {
  assert.equal(result.status, 'blocked')
  assert.equal(result.trace.publicationCount, 0)
  assert.equal(result.trace.storageCalls, 0)
  const json = JSON.stringify(result)
  for (const forbidden of ['recordFingerprint', 'receiptBytes', 'custodyBindingBytes', 'canonicalBytes', 'sourceSnapshot',
    'trustedRuleFact', 'supportVersionIds', '"token"', '"seal"', 'electronic_visa', 'regulations.example']) assert.equal(json.includes(forbidden), false, forbidden)
  for (const item of PILOT_ITEMS) assert.equal(json.includes(pilotBody(item)), false)
}

for (const mode of ['primary', 'composed'] as const) {
  test(`${mode} executes the captured canonical pipeline and fully verifies exact v2 bytes; legacy11 refuses`, async () => {
    const result = await runControlledSyntheticPilot(mode)
    assert.equal(result.status, 'synthetic_bundle_verified')
    assert.ok(result.status === 'synthetic_bundle_verified')
    assert.equal(result.trace.actualFactIdentity, true)
    assert.equal(result.trace.proof, true)
    assert.equal(result.trace.receiptProjected, true)
    assert.equal(result.trace.evidenceAcceptances, mode === 'primary' ? 1 : 2)
    // No counter stands in for the separately mandatory real PostgreSQL commit/readback.
    assert.equal(result.trace.publicationCount, 0)
    assert.equal(result.trace.storageCalls, 0)
    assert.equal(verifyLocalIntegratedPilotBundle(result.envelope).ok, true)
    const legacy = verifyIntegratedPilotBundle(result.envelope.bundle)
    assert.ok(!legacy.ok)
    assert.equal(legacy.reason, 'closure_bound_exceeded')
    assert.deepEqual(legacy.bound, { limit: 'depth', observed: 11, maximum: 8 })
    const payload = JSON.parse(Buffer.from(result.envelope.bundle.receiptBytes).toString('utf8'))
    assert.equal(payload.supports[0].validFrom, mode === 'primary' ? '2026-10-01' : null)
    assert.equal(payload.supports[0].validUntil, null)
    for (const support of payload.supports) {
      const item = support.binding.contentItemId as typeof PILOT_ITEMS[number]
      assert.equal(support.freshRetrieval.requestUrl, mode === 'primary' ? pilotUrl(item) : pilotOtherStartUrl(item))
      const observed: { binding: { contentItemId: string }; requestUrl: string; canonicalFinalUrl: string } | undefined = result.envelope.bundle.artifacts.filter(a => a.artifactType === 'original_observation')
        .map(a => JSON.parse(Buffer.from(a.canonicalBytes).toString('utf8')).content).find(o => o.binding.contentItemId === item)
      assert.ok(observed)
      assert.equal(observed.requestUrl, pilotOriginalRequestUrl(item))
      assert.equal(observed.canonicalFinalUrl, pilotUrl(item))
      if (mode === 'composed') assert.equal(observed.requestUrl, pilotStartUrl(item))
    }

    const origin = result.envelope.bundle.artifacts.find(a => a.artifactType === 'validity_origin')!
    const value = JSON.parse(Buffer.from(origin.canonicalBytes).toString('utf8')).content
    assert.deepEqual(value.validFromBasis, mode === 'primary'
      ? { kind: 'qualified_locator', locator: { kind: 'json_pointer', pointer: '/validity/from' }, value: '2026-10-01' }
      : { kind: 'no_bound_asserted' })
  })
}

const expectedFaults: Record<Exclude<PilotFault, 'none'>, string> = {
  unknown_body_field: 'representation_not_global', changed_fresh_body: 'content_identity_mismatch',
  changed_final_url: 'representation_url_mismatch', reversed_clock: 'freshness_gap',
  future_original: 'freshness_not_current', duplicate_support: 'support_selection_invalid',
  missing_support: 'support_selection_invalid', non_null_proposal: 'proposal_not_null',
  missing_origin: 'custody_missing', scope_substitution: 'scope_mismatch',
  stale_original: 'freshness_not_current', invalid_utf8: 'representation_not_global',
  missing_execution_context: 'execution_context_unavailable', cloned_execution_result: 'execution_context_unavailable',
  replayed_execution_context: 'execution_context_unavailable', substituted_fact_reference: 'fact_reference_mismatch',
  foreign_composition_seal: 'composition_context_incomplete',
  expired_original: 'freshness_not_current', two_eligible_versions: 'support_selection_invalid',
  same_item_two_representations: 'support_selection_invalid', eligibility_revoked: 'support_selection_invalid',
  ledger_clone: 'authority_required', ledger_foreign: 'authority_required', ledger_replay: 'authority_required', ledger_closed: 'authority_required',
}
test('every declared mutation names its intended integration rejection', () => {
  assert.deepEqual(PILOT_FAULTS.filter(f => f !== 'none').sort(), Object.keys(expectedFaults).sort())
})
for (const mode of ['primary', 'composed'] as const) for (const fault of PILOT_FAULTS.filter(f => f !== 'none')) {
  test(`${mode}: ${fault} rejects at intended gate from the passing canonical path`, async () => {
    const result = await runControlledSyntheticPilot(mode, fault)
    noPublication(result)
    assert.equal(result.status === 'blocked' && result.reason, expectedFaults[fault])
    assert.equal(result.trace.receiptProjected, false)
    if (['two_eligible_versions', 'same_item_two_representations'].includes(fault)) {
      assert.equal(result.trace.evidenceAcceptances, mode === 'primary' ? 2 : 3, 'both distinct versions were genuinely accepted before selection')
      assert.ok(result.stages.includes('original_custody_membership'))
      assert.equal(result.stages.includes('unique_support_selection'), false)
      assert.equal(result.trace.freshHttp, 0)
    }
    if (fault === 'expired_original') {
      assert.equal(result.trace.evidenceAcceptances, mode === 'primary' ? 1 : 2)
      assert.ok(result.stages.includes('unique_support_selection'))
      assert.equal(result.trace.proof, false)
    }
    if (fault === 'eligibility_revoked') {
      assert.ok(result.stages.includes('original_custody_membership'))
      assert.equal(result.stages.includes('unique_support_selection'), false)
    }
  })
}

test('validity comes from the qualified original body and rejects a changed bound or unused field', () => {
  const body = pilotBody('primary_rule')
  assert.equal(derivePilotValidity('primary_rule', body)?.validFrom, '2026-10-01')
  assert.equal(derivePilotValidity('composed_effect', pilotBody('composed_effect'))?.validFrom, null)
  const expired = derivePilotValidity('primary_rule', pilotBody('primary_rule', 'expired'))
  assert.equal(expired?.validUntil, '2026-10-05')
  assert.deepEqual(expired?.validUntilBasis, { kind: 'qualified_locator', locator: { kind: 'json_pointer', pointer: '/validity/until' }, value: '2026-10-05' })
  assert.equal(derivePilotValidity('primary_rule', body.replace('2026-10-01', '2026-10-02')), null)
  assert.equal(derivePilotValidity('primary_rule', body.slice(0, -1) + ',"private":"hidden"}'), null)
})

test('direct, caller-injected and invalid invocation never gain a loaded-code context', async () => {
  for (const [mode, fault] of [['primary', 'none'], ['private-input-sentinel', 'none'], ['primary', 'private-input-sentinel']] as const) {
    const result = await runSyntheticIntegratedPilot(mode as PilotMode, fault as PilotFault)
    noPublication(result)
    assert.equal(result.status === 'blocked' && result.reason, mode === 'primary' && fault === 'none' ? 'runtime_context_missing' : 'authority_required')
    assert.equal(JSON.stringify(result).includes('private-input-sentinel'), false)
  }
})

test('fixed developer corpus has no application importers or production activation', () => {
  const importers: string[] = []
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name) &&
        /(?:from\s+|import\s*(?:\(\s*)?|require\s*\(\s*)["'][^"']*(?:scripts\/)?official-truth-integrated-pilot-1\//.test(readFileSync(path, 'utf8'))) {
        importers.push(relative(root, path))
      }
    }
  }
  for (const directory of ['app', 'components', 'lib']) visit(join(root, directory))
  assert.deepEqual(importers, [])
  assert.deepEqual(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY, [])
  assert.deepEqual(OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY, [])
  assert.equal(requirementsProviderAus(), null)
  assert.deepEqual(runOfficialTruthGlobalProduction(), { status: 'blocked', reason: 'custody_missing' })
  const source = readFileSync(enginePath, 'utf8')
  assert.doesNotMatch(source, /\b(?:createClient|akzeptierteRegelClaimSpeichern|regelKandidatAkzeptieren|fetch)\s*\(/)
  assert.doesNotMatch(source, /export\s+(?:function\s+invocation|const\s+testInvocation)/)
})
