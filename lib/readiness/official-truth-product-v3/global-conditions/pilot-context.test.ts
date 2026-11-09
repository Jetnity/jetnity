import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { applicationContract, applicationPilotEnabled } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE as application, AA_CH_DE_VISA_EXTRACTOR_CANDIDATE as extractor } from '@/lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping'
import { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE as reviewed } from '@/lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source'
import { loadFixtureModule } from '../../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import { createV3AaPilotContextCandidate } from './pilot-context'

const path = 'lib/readiness/official-truth-product-v3/global-conditions/pilot-context.ts'
const applicationModule = '@/lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping'
const reviewedModule = '@/lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source'
type Mapper = typeof import('./pilot-context')

test('fixed dormant mapping equals the independent complete pilot context and mapping digest', () => {
  const bytes = readFileSync('docs/official-truth-product-v3/C1_MAPPING_REFERENCE_V1.json', 'utf8')
  assert.equal(sha256Hex(bytes), 'd9704b4c39326dabd0ea9c4c7ae39a26013a0b2dc57b24d79f815199e3bb7efa')
  const contexts = JSON.parse(readFileSync('docs/official-truth-product-v3/C1_REVISION2_IDENTITIES_V1.json', 'utf8'))
  const expected = contexts.rows[0]
  const result = createV3AaPilotContextCandidate()
  if (!result.ok) assert.fail(result.reason)
  assert.equal(result.value.mappingDigest, '19844fee3c9cb53c1a4d3bd5dc25573ccf0af705e604fb2a421a47cd20719076')
  assert.equal(result.value.mappingRevision, 1)
  assert.deepEqual(result.value.context, expected.context)
  assert.equal(result.value.contextKey, expected.contextKey)
  assert.equal(result.value.ruleScopeKey, expected.ruleScopeKey)
  assert.deepEqual(result.value.basis, {
    reviewedMetadataDigest: '0c5d46528329e799f930d04077b15a3bd9f114d72342d40ebe9dc19382623e23',
    applicationMetadataDigest: '6b58c2febd0a8e455ffd1494eacb9949c39855a331082d66a7b31a88b4830291',
    applicationContractId: 'aa-ch-de-visa-v1',
    applicationContractDigest: '668a84286d09c085adda49ada6ee9c75cae2ce348a63122f3b5d601221c492f6',
  })
  const frozen = (value: unknown): void => {
    if (!value || typeof value !== 'object') return
    assert.ok(Object.isFrozen(value)); Object.values(value).forEach(frozen)
  }
  frozen(result)
})

test('candidate offers no caller selector, acceptance, source receipt, method or inferred stay fact', () => {
  assert.equal(createV3AaPilotContextCandidate.length, 0)
  const result = createV3AaPilotContextCandidate()
  if (!result.ok) assert.fail(result.reason)
  assert.deepEqual(Object.keys(result.value).sort(), ['basis', 'context', 'contextKey', 'kind', 'mappingDigest', 'mappingRevision', 'ruleScopeKey'])
  const encoded = JSON.stringify(result.value)
  for (const forbidden of ['accepted', 'receipt', 'methodId', 'stay_limit', 'travel_date', 'legalValidity', 'visitor']) assert.equal(encoded.includes(forbidden), false, forbidden)
  assert.equal(extractor.current, false)
  assert.equal(applicationPilotEnabled(), false)
  assert.equal(applicationContract(application.id, application.digest), null)
  assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
})

test('metadata changes require a reviewed mapping revision instead of automatic repinning', () => {
  const changes = [
    { ...reviewed, travelDates: { ...reviewed.travelDates, through: '2026-11-14' } },
    { ...reviewed, sourceContentHash: '0'.repeat(64) },
    { ...reviewed, applicationScope: 'different-scope' },
    { ...reviewed, binding: { ...reviewed.binding, representationVersion: 2 } },
    { ...reviewed, recognition: 'different-recognition' },
    { ...reviewed, fact: { ...reviewed.fact, visaMode: 'visa_required' } },
  ]
  for (const changed of changes) {
    const mapper = loadFixtureModule<Mapper>(path, { [reviewedModule]: { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE: changed } })
    assert.deepEqual(mapper.createV3AaPilotContextCandidate(), { ok: false, reason: 'reference_mismatch' })
  }
  for (const changed of [{ ...application, digest: '0'.repeat(64) },
    { ...application, travelDates: { ...application.travelDates, from: '2026-11-06' } },
    { ...application, source: { ...application.source, url: 'https://different.example/changed' } }]) {
    const mapper = loadFixtureModule<Mapper>(path, { [applicationModule]: { AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE: changed } })
    assert.deepEqual(mapper.createV3AaPilotContextCandidate(), { ok: false, reason: 'reference_mismatch' })
  }
})

test('pure metadata mapping does not execute old travel-date validity or extractor callbacks', () => {
  let calls = 0
  const unexpected = () => { calls++; throw new Error('old AA callback must not be executed') }
  const mapper = loadFixtureModule<Mapper>(path, { [applicationModule]: {
    AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE: { ...application, validity: unexpected },
    AA_CH_DE_VISA_EXTRACTOR_CANDIDATE: { ...extractor, match: unexpected, extract: unexpected },
  } })
  assert.deepEqual(mapper.createV3AaPilotContextCandidate(), createV3AaPilotContextCandidate())
  assert.equal(calls, 0)
})

test('protected old canonical, AA, catalog, transport, authority and workflow files stay byte-identical', () => {
  const manifest = JSON.parse(readFileSync('docs/official-truth-product-v3/C1_PROTECTED_SOURCES_V1.json', 'utf8')) as {
    baselineFiles: Array<{ path: string; sha256: string; changePolicy: string }>
  }
  for (const row of manifest.baselineFiles.filter(row => row.changePolicy === 'unchanged')) {
    assert.equal(sha256Hex(readFileSync(row.path, 'utf8')), row.sha256, row.path)
  }
})
