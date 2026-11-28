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
  // Exact Root-selected A3, HRS and I1 diagnostic successors. The historical
  // C1/MI1/R28/HMA1 evidence above remains byte-identical and independently checked.
  // No working-tree-derived pins, skipped rows, live source or activation change.
  const currentSourceAmendment = [
    { path: 'lib/readiness/official-truth-product-v3/visitor/query.ts',
      previousReviewed: { bytes: 20238, sha256: '89fc7206e5bcfaf6b6aaf5152f17df0a2fbe0e79ee7045104048e4695c9d6ec6' },
      reviewed: { bytes: 20341, sha256: 'dcdd2c352f770d3ea3ec70bf0a1c3f85b471347ddfb519c7ec8632a8fc818b37' } },
    { path: 'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
      previousReviewed: { bytes: 12288, sha256: 'ef390e3c001fa34adb6b2d1437a32e88aa7fe2fe43e94ee7522f0e5e47cca127' },
      reviewed: { bytes: 12562, sha256: 'a809ec68c0f6b125bfc9f66737c4895f16099a5162c44be220cfbf5f0234c7c6' } },
    { path: 'package-lock.json',
      previousReviewed: { bytes: 320689, sha256: '71f4f32185dc9acd56b5dcfaec8162f317f7e370f32bdefe9264adbb7fd05b1e' },
      reviewed: { bytes: 326553, sha256: 'f763a124825aab57fcbed14c4913a18503dd3f3b03773c9877a340870695e37f' } },
    { path: 'package.json',
      previousReviewed: { bytes: 6460, sha256: '46c317656c81030397681d1d0c67e54a5c7d65b0aa66d15d2051c76503584da0' },
      reviewed: { bytes: 6717, sha256: 'd0cc039b2dc2aa20b066c9421edc8df1ab03455caefcfa41396d504b6237df8f' } },
    { path: 'scripts/db/official-truth-integrated-pilot-1/pg-wire.ts',
      previousReviewed: { bytes: 22433, sha256: '57f3b01f5624889a41e8e8832cbebf49da9100fbb4dec6ffe25f769a44a4aaf8' },
      reviewed: { bytes: 32943, sha256: '02ff596de9ce4fe89bc3d441a8c79bb9443bafc35d487ccadf828f04e0255d1d' } },
    { path: 'components/readiness/OfficialTruthVisitorV3.tsx',
      previousReviewed: { bytes: 9935, sha256: '62d18b4e2b2e7425f54c3a0626fac8df42849f6e3ab24e6f6144b04ea12f8b35' },
      reviewed: { bytes: 11117, sha256: 'e4b9fa59e6b92e3c1f4ad8b395495e19c5227c3c47702547da17e8148d5a4df3' } },
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 23906, sha256: '371e8467441727d1fc72f1f524f4b0f7bafd2338eb3b706f0c9f32f8a662b7ba' },
      reviewed: { bytes: 24418, sha256: '9592a0c093ef63f74c9e1688502f00cf663b8deda18d1721d8daf38f1ed0356b' } },
    { path: 'lib/readiness/official-truth-product-v3/import/service-server.ts',
      previousReviewed: { bytes: 23971, sha256: '2f88077023c0215ebfd246b0dd50b3216e45e7bc342e72eae2cac10c72758b09' },
      reviewed: { bytes: 24762, sha256: '9dcbe21893c3d98231c0446a62cfa67f486e571a2547884f850808c553291f08' } },
  ] as const
  assert.deepEqual(currentSourceAmendment.map(row => row.path), [
    'lib/readiness/official-truth-product-v3/visitor/query.ts',
    'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
    'package-lock.json', 'package.json', 'scripts/db/official-truth-integrated-pilot-1/pg-wire.ts',
    'components/readiness/OfficialTruthVisitorV3.tsx',
    '.github/workflows/ci.yml',
    'lib/readiness/official-truth-product-v3/import/service-server.ts',
  ])
  assert.equal(new Set(currentSourceAmendment.map(row => row.path)).size, 8)
  // Exact reviewed I1/S1 operation successors; every earlier amendment remains intact.
  const operationSourceAmendment = [
    { path: 'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
      previousReviewed: { bytes: 12562, sha256: 'a809ec68c0f6b125bfc9f66737c4895f16099a5162c44be220cfbf5f0234c7c6' },
      reviewed: { bytes: 13780, sha256: 'd21819b688b135199702e7ae1d8e008ba3e238d77010e0362fb88f44a837d009' } },
    { path: 'lib/readiness/official-truth-product-v3/storage/intake-server.ts',
      previousReviewed: { bytes: 2934, sha256: 'fe83419c0709fa753aea63d538f12720027a85a3a933c7390378883784260082' },
      reviewed: { bytes: 2980, sha256: '67b4ad9d08e341bc551e265cfbd0ef9ddc6561308d559ca81e863ea65ad15628' } },
  ] as const
  assert.deepEqual(operationSourceAmendment.map(row => row.path), [
    'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
    'lib/readiness/official-truth-product-v3/storage/intake-server.ts',
  ])
  assert.equal(new Set(operationSourceAmendment.map(row => row.path)).size, 2)
  // CUSTOMER-INFORMATION1 adds structured entry details and the complete visitor
  // inventory. Every historical source identity above remains independently bound.
  const customerSourceAmendment = [
    { path: 'components/readiness/OfficialTruthVisitorV3.tsx',
      previousReviewed: { bytes: 11117, sha256: 'e4b9fa59e6b92e3c1f4ad8b395495e19c5227c3c47702547da17e8148d5a4df3' },
      reviewed: { bytes: 15298, sha256: 'c5e5c3844e425dfdb44417d5022837da7d827ee66e1675c391c7d98783cad518' } },
    { path: 'lib/readiness/rule-claims.ts',
      previousReviewed: { bytes: 46056, sha256: '52f9395ad21cd2331c986d4e767611a5f0454cd1bf1e08e73666525c0612ab3a' },
      reviewed: { bytes: 48010, sha256: '4a3686ff6186bdefc2c8ae7f5e0bb96169366f02dfdc2f0b61c1b5511d9d852f' } },
  ] as const
  assert.deepEqual(customerSourceAmendment.map(row => row.path), [
    'components/readiness/OfficialTruthVisitorV3.tsx', 'lib/readiness/rule-claims.ts',
  ])
  assert.equal(new Set(customerSourceAmendment.map(row => row.path)).size, 2)
  // Reviewed I1 overlap and original-deadline forwarding; old amendments stay exact.
  const importDeadlineSourceAmendment = [
    { path: 'lib/readiness/official-truth-product-v3/import/service-server.ts',
      previousReviewed: { bytes: 24762, sha256: '9dcbe21893c3d98231c0446a62cfa67f486e571a2547884f850808c553291f08' },
      reviewed: { bytes: 27279, sha256: '8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33' } },
    { path: 'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
      previousReviewed: { bytes: 13780, sha256: 'd21819b688b135199702e7ae1d8e008ba3e238d77010e0362fb88f44a837d009' },
      reviewed: { bytes: 13960, sha256: 'aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2' } },
  ] as const
  assert.deepEqual(importDeadlineSourceAmendment.map(row => row.path), [
    'lib/readiness/official-truth-product-v3/import/service-server.ts',
    'lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts',
  ])
  assert.equal(new Set(importDeadlineSourceAmendment.map(row => row.path)).size, 2)
  // Admin CI bundling preserves every existing job and adds the two mandatory
  // native proofs. This finite successor retains every historical source pin.
  const adminCiSourceAmendment = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 24418, sha256: '9592a0c093ef63f74c9e1688502f00cf663b8deda18d1721d8daf38f1ed0356b' },
      reviewed: { bytes: 49661, sha256: 'fd6a209c46451db5b91b4667d4234f14dc81faaaa4addf3be92e1e85dfe4fcc6' } },
  ] as const
  assert.deepEqual(adminCiSourceAmendment.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(adminCiSourceAmendment.map(row => row.path)).size, 1)
  // ADMIN-RUNTIME-BG1-1 adds one typed, mandatory atomic-transition proof to
  // the existing CMS runner. All earlier jobs, time budgets and pins remain exact.
  const adminRuntimeCiSourceAmendment = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 49661, sha256: 'fd6a209c46451db5b91b4667d4234f14dc81faaaa4addf3be92e1e85dfe4fcc6' },
      reviewed: { bytes: 50018, sha256: '9060166e750251096b564b31eedc881398e116da55973cbd3f6c38606affa7f2' } },
  ] as const
  assert.deepEqual(adminRuntimeCiSourceAmendment.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(adminRuntimeCiSourceAmendment.map(row => row.path)).size, 1)
  // Passkeys Dev 1 installs supabase-js 2.119.2 after the #1265 package identity.
  // Every earlier official-truth amendment stays on its reviewed hash.
  const passkeySdkSourceAmendment = [
    { path: 'package.json',
      previousReviewed: { bytes: 6717, sha256: '201da70eb924a2760b4c9bc368c81f3ee1688307e7fca8a9a23147ca04d11625' },
      reviewed: { bytes: 6717, sha256: 'b72ed28b71bd9a351eaef3637b6b56f2a28844c3e7f4dc6ac3f9a28bb96e540e' } },
    { path: 'package-lock.json',
      previousReviewed: { bytes: 326715, sha256: '8af66807f4368afe8f48b15d5cc8d4c2e7d06badda63aaac518877d208446e60' },
      reviewed: { bytes: 325113, sha256: 'da769bf15ec9a5349e88cb7420267a5dedd70953c15f8e93ec6a6a802e24dfb4' } },
  ] as const
  assert.deepEqual(passkeySdkSourceAmendment.map(row => row.path), ['package.json', 'package-lock.json'])
  assert.equal(new Set(passkeySdkSourceAmendment.map(row => row.path)).size, 2)
  let reviewedPasskeySdkRows = 0
  // Next.js 16.4.6 security patch: finite root-package successor only.
  // Historical C1/MI1/R28/HMA1/Admin CI source identities remain unchanged.
  const nextSecurityPatch = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 50018, sha256: '9060166e750251096b564b31eedc881398e116da55973cbd3f6c38606affa7f2' },
      reviewed: { bytes: 50018, sha256: 'd2999d128b254d36491aeb34409a24b19373c8de83b337ac81bc4fc358377d23' } },
    { path: 'package.json',
      previousReviewed: { bytes: 6717, sha256: 'd0cc039b2dc2aa20b066c9421edc8df1ab03455caefcfa41396d504b6237df8f' },
      reviewed: { bytes: 6717, sha256: '201da70eb924a2760b4c9bc368c81f3ee1688307e7fca8a9a23147ca04d11625' } },
    { path: 'package-lock.json',
      previousReviewed: { bytes: 326553, sha256: 'f763a124825aab57fcbed14c4913a18503dd3f3b03773c9877a340870695e37f' },
      reviewed: { bytes: 326715, sha256: '8af66807f4368afe8f48b15d5cc8d4c2e7d06badda63aaac518877d208446e60' } },
  ] as const
  assert.deepEqual(nextSecurityPatch.map(row => row.path), ['.github/workflows/ci.yml', 'package.json', 'package-lock.json'])
  assert.equal(new Set(nextSecurityPatch.map(row => row.path)).size, 3)
  // The 2026-11-20 AT50 browser/Dev HTTP addition belongs exclusively to the
  // existing branch-gated Auth job. Root CI, U1 no-secret, PG17, quota and
  // aggregator families remain intact. Never normalize to arbitrary workspace
  // bytes: exact predecessor and successor are both independently pinned.
  const at50CiSuccessor = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 50018, sha256: 'd2999d128b254d36491aeb34409a24b19373c8de83b337ac81bc4fc358377d23' },
      reviewed: { bytes: 51712, sha256: '15232a13327e584209fb5a22cd0a2b08132bab7a3e5058ce91211e8768048779' } },
  ] as const
  assert.deepEqual(at50CiSuccessor.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(at50CiSuccessor.map(row => row.path)).size, 1)
  // Reviewed BG1 five-minute alarm test successor. The original AT50
  // 51712-byte workflow remains immutable as the immediate predecessor.
  // Exactly one guarded offline alarm step was added; existing CI families,
  // native tests, timeouts and fail-closed aggregator must remain active.
  const bg1AlarmCiSuccessor = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 51712, sha256: '15232a13327e584209fb5a22cd0a2b08132bab7a3e5058ce91211e8768048779' },
      reviewed: { bytes: 52025, sha256: 'ac86cd4dadd177061b833673c92fff6baccbb465044185a774784e040e7f3de5' } },
  ] as const
  assert.deepEqual(bg1AlarmCiSuccessor.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(bg1AlarmCiSuccessor.map(row => row.path)).size, 1)
  // Independent, append-only successor for incident app PR #1265. The prior
  // AT50/BG1 source identities stay immutable and are checked above.
  // This pins the *exact* scope-only change for the live Dev BG1 alarm: it is
  // required on main and BG1-/Official-Truth PRs, while Auth configuration
  // and strict offline BG1 negative tests still run on every PR.
  const incidentAppCiSuccessor = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 52025, sha256: 'ac86cd4dadd177061b833673c92fff6baccbb465044185a774784e040e7f3de5' },
      reviewed: { bytes: 52696, sha256: 'a0630a727aba38c0333192298cd2597bffb7eab568fc909dea8ebf10fb4146df' } },
  ] as const
  assert.deepEqual(incidentAppCiSuccessor.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(incidentAppCiSuccessor.map(row => row.path)).size, 1)
  // The separate public CMS reader release adds one mandatory native proof
  // and its exact typecheck root inside the existing CMS job. Its predecessor
  // and every earlier source identity remain immutable; no runner, budget,
  // Auth/BG1 gate or required family is replaced or made optional.
  const publicCmsReaderCiSuccessor = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 52696, sha256: 'a0630a727aba38c0333192298cd2597bffb7eab568fc909dea8ebf10fb4146df' },
      reviewed: { bytes: 53070, sha256: 'ca656990f3b14f97895087155b59eb30dc2bd4a77941f0fa9cb578e7b523cdef' } },
  ] as const
  assert.deepEqual(publicCmsReaderCiSuccessor.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(publicCmsReaderCiSuccessor.map(row => row.path)).size, 1)
  // The reviewed BG1 query-cost release adds two exact typecheck roots and
  // one mandatory native proof to the same CMS job. Preserve the complete
  // public-reader predecessor and every earlier gate, budget and source pin.
  const bg1QueryCostCiSuccessor = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 53070, sha256: 'ca656990f3b14f97895087155b59eb30dc2bd4a77941f0fa9cb578e7b523cdef' },
      reviewed: { bytes: 53497, sha256: '88e45eaf54b0b26c5e35b4a17dfdfc43c7417d8aa05fd40d9e56ba35247f55b3' } },
  ] as const
  assert.deepEqual(bg1QueryCostCiSuccessor.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(bg1QueryCostCiSuccessor.map(row => row.path)).size, 1)
  const bg1AlarmWorkflowSource = readFileSync('.github/workflows/ci.yml', 'utf8')
  assert.equal(bg1AlarmWorkflowSource.split('node --test scripts/official-truth-bg1-five-minute-integrity-alarm.test.mjs').length, 2)
  assert.match(bg1AlarmWorkflowSource,/\bnpm run test:core\b/)
  assert.match(bg1AlarmWorkflowSource,/\bname: Hosted V3 — native PostgreSQL 17/)
  assert.match(bg1AlarmWorkflowSource, /\bname: Dev-Guardstatus \(BG1\/main only\)/)
  assert.ok(bg1AlarmWorkflowSource.includes("github.event_name != 'pull_request'"))
  assert.ok(bg1AlarmWorkflowSource.includes("startsWith(github.head_ref, 'feat/official-truth-')"))
  assert.ok(bg1AlarmWorkflowSource.includes("startsWith(github.head_ref, 'fix/bg1-')"))
  // #1325 Phase 0: one exact, PO-authorized CI successor. The artifact upload
  // alone is excluded for throughput branches; the existing live Dev BG1
  // gate explicitly includes them. No test, job or historical pin is removed.
  const throughputCiSuccessor = [
    { path: '.github/workflows/ci.yml',
      previousReviewed: { bytes: 53497, sha256: '88e45eaf54b0b26c5e35b4a17dfdfc43c7417d8aa05fd40d9e56ba35247f55b3' },
      reviewed: { bytes: 53746, sha256: 'c0caf615d5fb00a9905bba326abe3056879d919165ef3690a4891e34f436c33d' } },
  ] as const
  assert.deepEqual(throughputCiSuccessor.map(row => row.path), ['.github/workflows/ci.yml'])
  assert.equal(new Set(throughputCiSuccessor.map(row => row.path)).size, 1)
  // Prove the complete workflow is identical to the protected predecessor
  // after reversing only the two explicitly reviewed, finite changes.
  const throughputUploadBefore = "      - name: Preserve actual synthetic evidence, including failures\n        if: ${{ always() }}\n"
  const throughputUploadAfter = "      - name: Preserve actual synthetic evidence, including failures\n        # Throughput branches retain mandatory local browser proof but do not upload artifacts.\n        if: ${{ always() && !startsWith(github.head_ref || github.ref_name, 'official-truth-throughput-') }}\n"
  const throughputGuardBefore = "           startsWith(github.head_ref, 'feat/official-truth-') ||\n           startsWith(github.head_ref, 'fix/bg1-'))"
  const throughputGuardAfter = "           startsWith(github.head_ref, 'feat/official-truth-') ||\n           startsWith(github.head_ref, 'official-truth-throughput-') ||\n           startsWith(github.head_ref, 'fix/bg1-'))"
  assert.equal(bg1AlarmWorkflowSource.split(throughputUploadAfter).length, 2)
  assert.equal(bg1AlarmWorkflowSource.split(throughputGuardAfter).length, 2)
  const throughputPredecessor = bg1AlarmWorkflowSource
    .replace(throughputUploadAfter, throughputUploadBefore)
    .replace(throughputGuardAfter, throughputGuardBefore)
  assert.equal(Buffer.byteLength(throughputPredecessor, 'utf8'), throughputCiSuccessor[0].previousReviewed.bytes)
  assert.equal(sha256Hex(throughputPredecessor), throughputCiSuccessor[0].previousReviewed.sha256)
  let reviewedThroughputCiRows = 0
  let reviewedBg1QueryCostCiRows = 0
  let reviewedPublicCmsReaderCiRows = 0
  let reviewedIncidentAppCiRows = 0
  let reviewedBg1AlarmRows = 0
  let reviewedAt50Rows = 0
  let reviewedNextPatchRows = 0
  let reviewedAdminRuntimeCiRows = 0
  let reviewedAdminCiRows = 0
  let reviewedImportDeadlineRows = 0
  let reviewedCustomerRows = 0
  let reviewedOperationRows = 0
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
    const previousCurrent = currentChanged?.reviewed ?? previousExpected
    const operationChanged = operationSourceAmendment.find(file => file.path === row.path)
    if (operationChanged) {
      assert.deepEqual({ bytes: previousCurrent.bytes, sha256: previousCurrent.sha256 }, operationChanged.previousReviewed, row.path)
      reviewedOperationRows++
    }
    const previousOperation = operationChanged?.reviewed ?? previousCurrent
    const customerChanged = customerSourceAmendment.find(file => file.path === row.path)
    if (customerChanged) {
      assert.deepEqual({ bytes: previousOperation.bytes, sha256: previousOperation.sha256 }, customerChanged.previousReviewed, row.path)
      reviewedCustomerRows++
    }
    const previousCustomer = customerChanged?.reviewed ?? previousOperation
    const importDeadlineChanged = importDeadlineSourceAmendment.find(file => file.path === row.path)
    if (importDeadlineChanged) {
      assert.deepEqual({ bytes: previousCustomer.bytes, sha256: previousCustomer.sha256 }, importDeadlineChanged.previousReviewed, row.path)
      reviewedImportDeadlineRows++
    }
    const previousImportDeadline = importDeadlineChanged?.reviewed ?? previousCustomer
    const adminCiChanged = adminCiSourceAmendment.find(file => file.path === row.path)
    if (adminCiChanged) {
      assert.deepEqual({ bytes: previousImportDeadline.bytes, sha256: previousImportDeadline.sha256 }, adminCiChanged.previousReviewed, row.path)
      reviewedAdminCiRows++
    }
    const previousAdminCi = adminCiChanged?.reviewed ?? previousImportDeadline
    const adminRuntimeCiChanged = adminRuntimeCiSourceAmendment.find(file => file.path === row.path)
    if (adminRuntimeCiChanged) {
      assert.deepEqual({ bytes: previousAdminCi.bytes, sha256: previousAdminCi.sha256 }, adminRuntimeCiChanged.previousReviewed, row.path)
      reviewedAdminRuntimeCiRows++
    }
    const reviewedBeforePatch = adminRuntimeCiChanged?.reviewed ?? previousAdminCi
    const nextPatchChanged = nextSecurityPatch.find(file => file.path === row.path)
    if (nextPatchChanged) {
      assert.deepEqual({ bytes: reviewedBeforePatch.bytes, sha256: reviewedBeforePatch.sha256 },
        nextPatchChanged.previousReviewed, row.path)
      reviewedNextPatchRows++
    }
    const expectedBeforeAt50 = nextPatchChanged?.reviewed ?? reviewedBeforePatch
    const at50Changed = at50CiSuccessor.find(file => file.path === row.path)
    if (at50Changed) {
      assert.deepEqual({ bytes: expectedBeforeAt50.bytes, sha256: expectedBeforeAt50.sha256 },
        at50Changed.previousReviewed, row.path)
      reviewedAt50Rows++
    }
    const bg1AlarmChanged = bg1AlarmCiSuccessor.find(file => file.path === row.path)
    if (bg1AlarmChanged) {
      assert.deepEqual(bg1AlarmChanged.previousReviewed,at50Changed?.reviewed ?? expectedBeforeAt50,row.path)
      reviewedBg1AlarmRows++
    }
    const previousIncident = bg1AlarmChanged?.reviewed ?? at50Changed?.reviewed ?? expectedBeforeAt50
    const incidentAppChanged = incidentAppCiSuccessor.find(file => file.path === row.path)
    if (incidentAppChanged) {
      assert.deepEqual(incidentAppChanged.previousReviewed, previousIncident, row.path)
      reviewedIncidentAppCiRows++
    }
    const previousPublicCmsReader = incidentAppChanged?.reviewed ?? previousIncident
    const publicCmsReaderChanged = publicCmsReaderCiSuccessor.find(file => file.path === row.path)
    if (publicCmsReaderChanged) {
      assert.deepEqual(publicCmsReaderChanged.previousReviewed, previousPublicCmsReader, row.path)
      reviewedPublicCmsReaderCiRows++
    }
    const previousBg1QueryCost = publicCmsReaderChanged?.reviewed ?? previousPublicCmsReader
    const bg1QueryCostChanged = bg1QueryCostCiSuccessor.find(file => file.path === row.path)
    if (bg1QueryCostChanged) {
      assert.deepEqual(bg1QueryCostChanged.previousReviewed, previousBg1QueryCost, row.path)
      reviewedBg1QueryCostCiRows++
    }
    const previousPasskey = bg1QueryCostChanged?.reviewed ?? previousBg1QueryCost
    const passkeySdkChanged = passkeySdkSourceAmendment.find(file => file.path === row.path)
    if (passkeySdkChanged) {
      assert.deepEqual({ bytes: previousPasskey.bytes, sha256: previousPasskey.sha256 }, passkeySdkChanged.previousReviewed, row.path)
      reviewedPasskeySdkRows++
    }
    const previousThroughput = passkeySdkChanged?.reviewed ?? previousPasskey
    const throughputChanged = throughputCiSuccessor.find(file => file.path === row.path)
    if (throughputChanged) {
      assert.deepEqual({ bytes: previousThroughput.bytes, sha256: previousThroughput.sha256 },
        throughputChanged.previousReviewed, row.path)
      reviewedThroughputCiRows++
    }
    const expected = throughputChanged?.reviewed ?? previousThroughput
    const bytes = readFileSync(row.path)
    const text = bytes.toString('utf8')
    assert.deepEqual(Buffer.from(text, 'utf8'), bytes, row.path)
    assert.equal(bytes.length, expected.bytes, row.path)
    assert.equal(sha256Hex(text), expected.sha256, row.path)
  }
  assert.equal(reviewedMainRows, 2)
  assert.equal(reviewedRunnerRows, 1)
  assert.equal(reviewedHostedRows, 2)
  assert.equal(reviewedCurrentRows, 8)
  assert.equal(reviewedOperationRows, 2)
  assert.equal(reviewedCustomerRows, 2)
  assert.equal(reviewedImportDeadlineRows, 2)
  assert.equal(reviewedAdminCiRows, 1)
  assert.equal(reviewedAdminRuntimeCiRows, 1)
  assert.equal(reviewedNextPatchRows, 3)
  assert.equal(reviewedAt50Rows, 1)
  assert.equal(reviewedBg1AlarmRows, 1)
  assert.equal(reviewedIncidentAppCiRows, 1)
  assert.equal(reviewedPublicCmsReaderCiRows, 1)
  assert.equal(reviewedBg1QueryCostCiRows, 1)
  assert.equal(reviewedPasskeySdkRows, 2)
  assert.equal(reviewedThroughputCiRows, 1)
})
