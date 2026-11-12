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

test('protected sources retain C1, MI1, R28 and exact chained HMA1 PG17 successor identities', () => {
  const historicalBytes = readFileSync('docs/official-truth-product-v3/C1_PROTECTED_SOURCES_V1.json', 'utf8')
  assert.equal(sha256Hex(historicalBytes), '76a35e4f0b533462c3e3dfde0116f900b71bf253c41665a96bc3889df6b83650')
  const manifest = JSON.parse(historicalBytes) as {
    baselineFiles: Array<{ path: string; bytes: number; sha256: string; changePolicy: string }>
  }
  // Root's finite MI1 R1 amendment pins existing main inputs; it does not select
  // hashes from the working tree or rewrite the historical C1 evidence.
  const amendmentBytes = readFileSync('docs/official-truth-product-v3/MI1_PROTECTED_SOURCE_AMENDMENT_V1.json', 'utf8')
  assert.equal(sha256Hex(amendmentBytes), '63f97a38aee742610261e2d8d9a41ee02e6eb20fd182e5da87b084c40c005d5f')
  const amendment = JSON.parse(amendmentBytes) as {
    files: Array<{ path: string; historical: { bytes: number; sha256: string }; reviewed: { bytes: number; sha256: string } }>
  }
  assert.deepEqual(amendment.files.map(row => row.path), ['package-lock.json', 'package.json'])
  // R29 acknowledges only the already reviewed R28 workflow identity.
  // Historical C1 and MI1 evidence remains separately pinned and unchanged.
  const runnerAmendmentBytes = readFileSync('docs/official-truth-product-v3/M04_R28_PROTECTED_SOURCE_AMENDMENT_V1.json', 'utf8')
  assert.equal(sha256Hex(runnerAmendmentBytes), '2f8e301299f5e1aea9b414963032698236c5b241118062531e39c67c33549968')
  const runnerAmendment = JSON.parse(runnerAmendmentBytes) as typeof amendment
  assert.deepEqual(runnerAmendment.files.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set([...amendment.files, ...runnerAmendment.files].map(row => row.path)).size, 3)
  // R5-B adds only two fixed successors; historical C1/MI1/R28 identities stay exact.
  const hostedAmendmentBytes = readFileSync('docs/official-truth-product-v3/HMA1_PG17_PROTECTED_SOURCE_AMENDMENT_V1.json', 'utf8')
  assert.equal(sha256Hex(hostedAmendmentBytes), '200d64253d3d57db7b973bdddde63350a8a0fd46ba9ff36a7b20802fa7b63973')
  const hostedAmendment = JSON.parse(hostedAmendmentBytes) as {
    files: Array<{
      path: string
      historical: { bytes: number; sha256: string }
      previousManifest: { path: string; sha256: string; gitBlob: string }
      previousReviewed: { bytes: number; sha256: string; gitBlob: string; mode: string }
      reviewed: { bytes: number; sha256: string; gitBlob: string; mode: string }
    }>
  }
  assert.deepEqual(hostedAmendment.files.map(row => row.path), ['.github/workflows/ci.yml', 'package.json'])
  assert.equal(new Set(hostedAmendment.files.map(row => row.path)).size, 2)
  // Exact Root-selected A3 and HRS diagnostic successors. The historical
  // C1/MI1/R28/HMA1 evidence above remains byte-identical and independently checked.
  // No working-tree-derived pins, skipped rows, live source or activation change.
  const currentSourceAmendment = [
    { path: 'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
      previousReviewed: { bytes: 12288, sha256: 'ef390e3c001fa34adb6b2d1437a32e88aa7fe2fe43e94ee7522f0e5e47cca127' },
      reviewed: { bytes: 12562, sha256: 'a809ec68c0f6b125bfc9f66737c4895f16099a5162c44be220cfbf5f0234c7c6' } },
    { path: 'package-lock.json',
      previousReviewed: { bytes: 320689, sha256: '71f4f32185dc9acd56b5dcfaec8162f317f7e370f32bdefe9264adbb7fd05b1e' },
      reviewed: { bytes: 326553, sha256: 'f763a124825aab57fcbed14c4913a18503dd3f3b03773c9877a340870695e37f' } },
    { path: 'package.json',
      previousReviewed: { bytes: 6460, sha256: '46c317656c81030397681d1d0c67e54a5c7d65b0aa66d15d2051c76503584da0' },
      reviewed: { bytes: 6507, sha256: '328d8e2fe4f99a59030886f6c7a6684add34f6c0026c89633e6fef731cee026a' } },
    { path: 'scripts/db/official-truth-integrated-pilot-1/pg-wire.ts',
      previousReviewed: { bytes: 22433, sha256: '57f3b01f5624889a41e8e8832cbebf49da9100fbb4dec6ffe25f769a44a4aaf8' },
      reviewed: { bytes: 30699, sha256: '9ad361433f7d0563ae892d4b24d0fee3acbcb8ea567d750f5f3cb4be6989da3b' } },
  ] as const
  assert.deepEqual(currentSourceAmendment.map(row => row.path), [
    'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
    'package-lock.json', 'package.json', 'scripts/db/official-truth-integrated-pilot-1/pg-wire.ts',
  ])
  assert.equal(new Set(currentSourceAmendment.map(row => row.path)).size, 4)
  let reviewedCurrentRows = 0
  const protectedRows = manifest.baselineFiles.filter(row => row.changePolicy === 'unchanged')
  assert.equal(protectedRows.length, 40)
  assert.equal(new Set(protectedRows.map(row => row.path)).size, 40)
  let reviewedMainRows = 0
  let reviewedRunnerRows = 0
  let reviewedHostedRows = 0
  for (const row of protectedRows) {
    const changed = amendment.files.find(file => file.path === row.path)
    const runnerChanged = runnerAmendment.files.find(file => file.path === row.path)
    if (changed) {
      assert.deepEqual({ bytes: row.bytes, sha256: row.sha256 }, changed.historical, row.path)
      reviewedMainRows++
    }
    if (runnerChanged) {
      assert.equal(changed, undefined, row.path)
      assert.deepEqual({ bytes: row.bytes, sha256: row.sha256 }, runnerChanged.historical, row.path)
      reviewedRunnerRows++
    }
    const hostedChanged = hostedAmendment.files.find(file => file.path === row.path)
    if (hostedChanged) {
      assert.deepEqual({ bytes: row.bytes, sha256: row.sha256 }, hostedChanged.historical, row.path)
      const previous = changed ?? runnerChanged
      assert.ok(previous, row.path)
      assert.deepEqual(hostedChanged.previousReviewed, previous.reviewed, row.path)
      assert.deepEqual(hostedChanged.previousManifest, changed ? {
        path: 'docs/official-truth-product-v3/MI1_PROTECTED_SOURCE_AMENDMENT_V1.json',
        sha256: '63f97a38aee742610261e2d8d9a41ee02e6eb20fd182e5da87b084c40c005d5f',
        gitBlob: '8edcf4befc19e3a6c743824da59e4634d0393ec9',
      } : {
        path: 'docs/official-truth-product-v3/M04_R28_PROTECTED_SOURCE_AMENDMENT_V1.json',
        sha256: '2f8e301299f5e1aea9b414963032698236c5b241118062531e39c67c33549968',
        gitBlob: '30e14e235b3a21ef681c470ced9a7efc271c0907',
      }, row.path)
      assert.equal(hostedChanged.reviewed.mode, '100644', row.path)
      assert.match(hostedChanged.reviewed.gitBlob, /^[0-9a-f]{40}$/, row.path)
      reviewedHostedRows++
    }
    const previousExpected = hostedChanged?.reviewed ?? changed?.reviewed ?? runnerChanged?.reviewed ?? row
    const currentChanged = currentSourceAmendment.find(file => file.path === row.path)
    if (currentChanged) {
      assert.deepEqual({ bytes: previousExpected.bytes, sha256: previousExpected.sha256 }, currentChanged.previousReviewed, row.path)
      reviewedCurrentRows++
    }
    const expected = currentChanged?.reviewed ?? previousExpected
    const bytes = readFileSync(row.path)
    const text = bytes.toString('utf8')
    assert.deepEqual(Buffer.from(text, 'utf8'), bytes, row.path)
    assert.equal(bytes.length, expected.bytes, row.path)
    assert.equal(sha256Hex(text), expected.sha256, row.path)
  }
  assert.equal(reviewedMainRows, 2)
  assert.equal(reviewedRunnerRows, 1)
  assert.equal(reviewedHostedRows, 2)
  assert.equal(reviewedCurrentRows, 4)
})
