// Synthetic developer integration remains PARTIAL: both real execution paths
// stop at the unchanged closure-depth contract. No complete bundle is claimed.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'
import * as proofModule from './official-truth-same-request-proof-server'
import * as extractionModule from './official-truth-same-request-extraction-server'
import * as evidenceModule from './evidence'
import * as bundleModule from './official-truth-integrated-pilot-bundle'
import { officialTruthCompositionSealView, OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY } from './official-truth-composition-policy-registry'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from './official-truth-trusted-fact-extractor-registry'
import { runOfficialTruthGlobalProduction } from './official-truth-autonomous-provenance-record-server'
import { requirementsProviderAus } from './provider'
import { PILOT_FAULTS, runSyntheticIntegratedPilot, type PilotFault } from '../../scripts/official-truth-integrated-pilot-1/engine'
import { PILOT_CORPUS, PILOT_ITEMS, pilotBody, type PilotMode } from '../../scripts/official-truth-integrated-pilot-1/corpus'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const enginePath = join(root, 'scripts/official-truth-integrated-pilot-1/engine.ts')
type PilotResult = Awaited<ReturnType<typeof runSyntheticIntegratedPilot>>
type ProofInput = Parameters<typeof proofModule.proveOfficialTruthCustodiedMaterial>[0]
type Ledger = { advance(previous: object | null): object; owns(token: object): boolean; close(): void }

/** Test-only read observers and private-ledger export on this exact source.
 * Every observed call still executes its real implementation. No success stub,
 * alternate parser or wider graph limit is installed. */
function observeEngine() {
  const observed: {
    proofInputs: ProofInput[]
    proofResults: ReturnType<typeof proofModule.proveOfficialTruthCustodiedMaterial>[]
    evidenceAcceptances: number
    primary: extractionModule.OfficialTruthSameRequestPrimaryContext[]
    composed: extractionModule.OfficialTruthSameRequestCompositionExecutionContext[]
    consumedResults: unknown[]
    bundleResults: ReturnType<typeof bundleModule.verifyIntegratedPilotBundle>[]
  } = { proofInputs: [], proofResults: [], evidenceAcceptances: 0, primary: [], composed: [], consumedResults: [], bundleResults: [] }
  const source = readFileSync(enginePath, 'utf8').replaceAll('import.meta.url', 'moduleUrl') + '\nexport const testInvocation = invocation\n'
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const localRequire = createRequire(enginePath), exports: Record<string, unknown> = {}
  const execute = runInThisContext(`(function(require, exports, moduleUrl) {${code}\n})`)
  execute((name: string) => {
    if (name.endsWith('/official-truth-same-request-proof-server')) return {
      ...proofModule,
      proveOfficialTruthCustodiedMaterial: (input: ProofInput) => {
        observed.proofInputs.push(input)
        const result = proofModule.proveOfficialTruthCustodiedMaterial(input)
        observed.proofResults.push(result)
        return result
      },
    }
    if (name.endsWith('/official-truth-same-request-extraction-server')) return {
      ...extractionModule,
      consumeOfficialTruthSameRequestPrimaryContext: (result: unknown) => {
        const context = extractionModule.consumeOfficialTruthSameRequestPrimaryContext(result)
        if (context) { observed.primary.push(context); observed.consumedResults.push(result) }
        return context
      },
      consumeOfficialTruthSameRequestCompositionExecutionContext: (result: unknown) => {
        const context = extractionModule.consumeOfficialTruthSameRequestCompositionExecutionContext(result)
        if (context) { observed.composed.push(context); observed.consumedResults.push(result) }
        return context
      },
    }
    if (name.endsWith('/evidence')) return {
      ...evidenceModule,
      evidenceKandidatAkzeptieren: (...args: Parameters<typeof evidenceModule.evidenceKandidatAkzeptieren>) => {
        const result = evidenceModule.evidenceKandidatAkzeptieren(...args)
        if (result.ok) observed.evidenceAcceptances++
        return result
      },
    }
    if (name.endsWith('/official-truth-integrated-pilot-bundle')) return {
      ...bundleModule,
      verifyIntegratedPilotBundle: (input: Parameters<typeof bundleModule.verifyIntegratedPilotBundle>[0]) => {
        const result = bundleModule.verifyIntegratedPilotBundle(input)
        observed.bundleResults.push(result)
        return result
      },
    }
    return localRequire(name.startsWith('@/') ? join(root, name.slice(2)) : name)
  }, exports, pathToFileURL(enginePath).href)
  return { observed, run: exports.runSyntheticIntegratedPilot as typeof runSyntheticIntegratedPilot,
    invocation: exports.testInvocation as () => Ledger }
}

function immutable(value: unknown) {
  if (!value || typeof value !== 'object') return
  assert.ok(Object.isFrozen(value))
  for (const child of Object.values(value)) immutable(child)
}
function noPublication(result: PilotResult) {
  assert.equal(result.status, 'blocked', 'Integrated implementation is PARTIAL; blocked closure must not become synthetic completion')
  assert.equal(result.trace.publicationCount, 0)
  assert.equal(result.trace.storageCalls, 0)
  const json = JSON.stringify(result)
  for (const forbidden of ['recordFingerprint', 'receiptBytes', 'custodyBindingBytes', 'canonicalBytes', 'sourceSnapshot',
    'trustedRuleFact', 'supportVersionIds', 'token', 'seal', 'electronic_visa', 'regulations.example']) {
    assert.equal(json.includes(forbidden), false, forbidden)
  }
  for (const item of PILOT_ITEMS) assert.equal(json.includes(pilotBody(item)), false)
  immutable(result)
}

const integrations = new Map<PilotMode, Promise<{ result: PilotResult; observed: ReturnType<typeof observeEngine>['observed'] }>>()
function integration(mode: PilotMode) {
  let pending = integrations.get(mode)
  if (!pending) {
    const engine = observeEngine()
    pending = engine.run(mode).then(result => ({ result, observed: engine.observed }))
    integrations.set(mode, pending)
  }
  return pending
}

for (const mode of ['primary', 'composed'] as const) {
  test(`${mode} canonical integration is PARTIAL: executed through private projection, zero publication/storage`, async () => {
    const { result, observed } = await integration(mode)
    noPublication(result)
    assert.equal(result.status === 'blocked' && result.reason, 'closure_bound_exceeded')
    assert.deepEqual(result.stages, ['independent_fixed_cell_admission', 'controlled_original_observation',
      'canonical_evidence_acceptance', 'original_custody_membership', 'unique_support_selection',
      'safe_review_v3', 'scope_identity_freshness_proof', 'fresh_retrieval', `${mode}_actual_execution_context`,
      'private_receipt_and_separate_binding_projection'])
    assert.deepEqual(result.trace, { catalogReads: 1, originalHttp: mode === 'primary' ? 2 : 4,
      freshHttp: mode === 'primary' ? 2 : 4, evidenceAcceptances: mode === 'primary' ? 1 : 2,
      proof: true, extracted: true, actualFactIdentity: true, receiptProjected: true, publicationCount: 0, storageCalls: 0 })
    assert.equal(observed.evidenceAcceptances, result.trace.evidenceAcceptances)
    assert.equal(observed.proofInputs.length, 1)
    assert.equal(observed.proofResults[0]!.status, 'same_request_proof')
    assert.equal(observed.bundleResults.length, 1)
    const verification = observed.bundleResults[0]!
    assert.ok(!verification.ok)
    assert.equal(verification.reason, 'closure_bound_exceeded')
    assert.equal(verification.bound?.maximum, 8)
    assert.ok(verification.bound && verification.bound.observed > verification.bound.maximum)
    assert.equal(observed.primary.length, mode === 'primary' ? 1 : 0)
    assert.equal(observed.composed.length, mode === 'composed' ? 1 : 0)
    if (mode === 'primary') {
      const context = observed.primary[0]!
      assert.equal(context.execution.extractors.length, PILOT_CORPUS.extractors.length)
      assert.strictEqual(context.execution.selected.extract, PILOT_CORPUS.extractors.find(e => e.policyId === null)!.extract)
    } else {
      const context = observed.composed[0]!
      assert.equal(context.execution.extractors.length, PILOT_CORPUS.extractors.length)
      assert.strictEqual(context.context.phaseB.fact, officialTruthCompositionSealView(context.context.phaseB.seal)!.fact)
    }
    for (const consumed of observed.consumedResults) {
      assert.equal(extractionModule.consumeOfficialTruthSameRequestPrimaryContext(consumed), null)
      assert.equal(extractionModule.consumeOfficialTruthSameRequestCompositionExecutionContext(consumed), null)
    }
  })
}

const expectedFaults: Record<Exclude<PilotFault, 'none'>, { reason: string; proof: boolean; fresh: number | 'all' }> = {
  unknown_body_field: { reason: 'representation_not_global', proof: false, fresh: 0 },
  changed_fresh_body: { reason: 'content_identity_mismatch', proof: true, fresh: 2 },
  changed_final_url: { reason: 'representation_url_mismatch', proof: true, fresh: 1 },
  reversed_clock: { reason: 'freshness_gap', proof: true, fresh: 'all' },
  future_original: { reason: 'freshness_not_current', proof: false, fresh: 0 },
  duplicate_support: { reason: 'support_selection_invalid', proof: false, fresh: 0 },
  missing_support: { reason: 'support_selection_invalid', proof: false, fresh: 0 },
  non_null_proposal: { reason: 'proposal_not_null', proof: false, fresh: 0 },
  missing_origin: { reason: 'custody_missing', proof: false, fresh: 0 },
  scope_substitution: { reason: 'scope_mismatch', proof: false, fresh: 0 },
}
test('every declared fault has an explicit expected integration gate', () => {
  assert.deepEqual(PILOT_FAULTS.filter(fault => fault !== 'none').sort(), Object.keys(expectedFaults).sort())
})
for (const mode of ['primary', 'composed'] as const) for (const fault of PILOT_FAULTS.filter(fault => fault !== 'none')) {
  test(`${mode} ${fault} terminates before projection with no partial bundle`, async () => {
    const result = await runSyntheticIntegratedPilot(mode, fault)
    noPublication(result)
    const expected = expectedFaults[fault]
    assert.equal(result.status === 'blocked' && result.reason, expected.reason)
    assert.equal(result.trace.proof, expected.proof)
    assert.equal(result.trace.freshHttp, expected.fresh === 'all' ? mode === 'primary' ? 2 : 4 : expected.fresh)
    assert.equal(result.trace.receiptProjected, false)
    assert.equal(result.trace.actualFactIdentity, false)
    assert.equal(result.stages.includes('private_receipt_and_separate_binding_projection'), false)
  })
}

test('parallel invocations keep primary/composed failures and private identities separate', async () => {
  const left = observeEngine(), right = observeEngine()
  const [a, b] = await Promise.all([left.run('primary'), right.run('composed')])
  noPublication(a); noPublication(b)
  assert.notStrictEqual(left.observed.primary[0]!.execution.fact, right.observed.composed[0]!.context.phaseB.fact)
  assert.notEqual(left.observed.proofInputs[0]!.review, right.observed.proofInputs[0]!.review)
  assert.equal(left.observed.composed.length, 0)
  assert.equal(right.observed.primary.length, 0)
  assert.equal(a.trace.evidenceAcceptances, 1)
  assert.equal(b.trace.evidenceAcceptances, 2)
})

test('invocation ledger rejects clones, foreign, replayed and closed predecessors', () => {
  const { invocation } = observeEngine()
  for (const wrong of ['clone', 'foreign', 'old', 'closed'] as const) {
    const ledger = invocation(), first = ledger.advance(null)
    assert.equal(ledger.owns(first), true)
    const second = ledger.advance(first)
    assert.equal(ledger.owns(first), false)
    const candidate = wrong === 'clone' ? structuredClone(second) : wrong === 'foreign' ? invocation().advance(null) : wrong === 'old' ? first : second
    if (wrong === 'closed') ledger.close()
    assert.throws(() => ledger.advance(candidate), /authority_required/)
    assert.equal(ledger.owns(second), false)
    assert.throws(() => ledger.advance(null), /authority_required/)
  }
})

test('custodied proof rejects extra or malformed input before getters and never accepts a proposal', async () => {
  const { observed } = await integration('primary')
  const input = observed.proofInputs[0]!
  let getters = 0
  const accessor = Object.defineProperty({ ...input }, 'scope', { enumerable: true, get() { getters++; throw Error('private') } })
  const cycle = { ...input, extra: {} as unknown }; cycle.extra = cycle
  for (const malformed of [null, false, [], {}, accessor, cycle, { ...input, [Symbol('private')]: true },
    { ...input, proposal: null }, { ...input, clock: input.serverReferenceTime }, { ...input, evidenceVersions: {} },
    { ...input, evidenceVersions: [null] }, { ...input, registry: null }, { ...input, scope: null }]) {
    const result = proofModule.proveOfficialTruthCustodiedMaterial(malformed as ProofInput)
    assert.equal(result.status, 'blocked')
  }
  assert.equal(getters, 0)
})

test('custodied proof enforces authority, exact scope, accepted evidence and freshness', async () => {
  const { observed } = await integration('primary')
  const input = observed.proofInputs[0]!
  const negative: Partial<ProofInput>[] = [
    { authority: { status: 'access_forbidden' } },
    { serverReferenceTime: 'invalid' },
    { serverReferenceTime: '2026-10-01T00:00:00.000Z' },
    { serverReferenceTime: '2027-10-07T00:00:00.000Z' },
    { review: {} }, { scope: { ...PILOT_CORPUS.scope, destinationCountryCode: 'JP' } },
    { evidenceVersions: [] }, { evidenceVersions: [...input.evidenceVersions, input.evidenceVersions[0]!] },
    { evidenceVersions: input.evidenceVersions.map(version => ({ ...version, sourceContentHash: 'a'.repeat(64) })) },
    { evidenceVersions: input.evidenceVersions.map(version => ({ ...version, lifecycle: 'candidate' })) },
  ]
  for (const mutation of negative) {
    const result = proofModule.proveOfficialTruthCustodiedMaterial({ ...input, ...mutation })
    assert.equal(result.status, 'blocked', JSON.stringify(mutation))
  }
})

test('invalid pilot mode/fault values cannot echo private caller material or escape as exceptions', async () => {
  const privateValue = 'private-input-sentinel'
  const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic
  for (const supplied of [privateValue, { fact: privateValue }, cyclic]) {
    const badMode = await runSyntheticIntegratedPilot(supplied as PilotMode)
    const badFault = await runSyntheticIntegratedPilot('primary', supplied as PilotFault)
    for (const result of [badMode, badFault]) {
      noPublication(result)
      assert.equal(JSON.stringify(result).includes(privateValue), false)
      assert.equal(result.trace.originalHttp, 0)
      assert.equal(result.trace.freshHttp, 0)
    }
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
