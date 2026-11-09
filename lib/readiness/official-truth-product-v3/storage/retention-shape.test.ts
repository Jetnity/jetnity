import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3ProposalUpload } from '../import/interface'
import { readV3RetainableProposal } from './proposal-bytes'
import { S1_RETENTION_SHAPE, s1RetentionShapeAllows } from './retention-shape'
import { retentionFixtures, unknownMemberMutations } from '../../../../scripts/db/official-truth-v3-intake-store-1/retention-fixtures'
import { shapeSql } from '../../../../scripts/db/official-truth-v3-intake-store-1/generate-retention-shape'
import { s1Fixture } from '../../../../scripts/db/official-truth-v3-intake-store-1/fixtures'
import { c1Fixture, c1InvalidShapes } from '../global-conditions/test-support/fixture'
import { readV3GlobalRuleContext } from '../contract'

test('S1 SQL retention shape pins actual canonical reader sources, not just its own generator', () => {
  const hashes: Record<string, string> = {
    'lib/readiness/official-truth-product-v3/contract.ts': '7a7abc307b3bd9cf5bf80a85da91c5ecdb7ef7146546fe0d15fc3f25f768859c',
    'lib/readiness/official-truth-product-v3/import/interface.ts': 'd98772cb27275aa768541bb670f3ae0effaf866748aea6b3797c03ac49361bb6',
    'lib/readiness/official-truth-product-v3/import/service-server.ts': '2f88077023c0215ebfd246b0dd50b3216e45e7bc342e72eae2cac10c72758b09',
    'lib/readiness/rule-claims.ts': '52f9395ad21cd2331c986d4e767611a5f0454cd1bf1e08e73666525c0612ab3a',
    'lib/readiness/regulierungs-anwendbarkeit.ts': '5e4d84e45f1a41223df722647ef545244ca5ed38b79e3622b4e259ed21b6994f',
    'lib/readiness/temporal.ts': '768d1dd731bb745b3ce3e8b40bb425a4a51b8ce7b757ae4eb5173e9c65dd38d8',
    'lib/readiness/official-truth-content-identity.ts': 'f48c5e31ab5e4ec0f8f3a5dae2bd769869b37396aae8e36ccb6964d2798d3df6',
    'lib/readiness/domain.ts': 'e4b2e779f398b6a45916e7fc1a232194a0a374833cfb39884a5c312d69ded587',
    'lib/country/katalog.ts': 'ebaed24988b7c34ac352cdc10e7ed6031fbb25bf93f6efd280769878c7891f8c',
    'types/trips.ts': 'cdf7a10fa6060cc732e923c7e7239dafe58f26e1e79cd057e62ea14ebefcf3d4',
    'lib/readiness/official.ts': '0351c6d695dce1c4351ff283ce3a3ffec308a0f8947020420d30da5231298bd4',
  }
  for (const [file, hash] of Object.entries(hashes)) assert.equal(sha256Hex(readFileSync(file, 'utf8')), hash, `${file}: new reader requires explicit retention-shape review`)
  const sql = readFileSync('scripts/db/official-truth-v3-intake-store-1/intake-candidate.sql', 'utf8')
  assert.equal(sql.match(/-- S1_RETENTION_SHAPE_BEGIN[\s\S]*?-- S1_RETENTION_SHAPE_END/)?.[0], shapeSql())
})

test('all claimed fact families are valid in the actual S0 reader; URL variant is explicitly S0-valid/S1-rejected', () => {
  for (const row of retentionFixtures()) {
    const text = JSON.stringify(row.proposal)
    assert.equal(readV3ProposalUpload(text, row.registry).ok, true, row.name)
    assert.equal(s1RetentionShapeAllows(row.proposal), row.supported, row.name)
    assert.equal(readV3RetainableProposal(text, row.registry).ok, row.supported, row.name)
  }
})

test('every nested proposal object rejects an unknown private payload and all top-level structured values reject primitives', () => {
  for (const row of retentionFixtures().filter(row => row.supported)) {
    for (const bad of unknownMemberMutations(row.proposal)) assert.equal(s1RetentionShapeAllows(bad), false, row.name)
    for (const key of ['context', 'research', 'proposedFact', 'references']) {
      for (const value of [null, 'PII_CANARY', 1, true]) assert.equal(s1RetentionShapeAllows({ ...row.proposal, [key]: value }), false)
    }
  }
})

test('complete actual I1 outcomes and audits are closed at every nested object before durable finish', async () => {
  for (const reason of ['prepared', 'primary_unclear', 'comparable_conflict'] as const) {
    const f = s1Fixture(`shape-${reason}`), value = reason === 'prepared' ? await f.completion() : await f.withArchivedPredecessor(reason)
    assert.equal(s1RetentionShapeAllows(value.outcome, 'outcome'), true)
    assert.equal(s1RetentionShapeAllows(value.audit, 'audit'), true)
    for (const bad of unknownMemberMutations(value.outcome)) assert.equal(s1RetentionShapeAllows(bad, 'outcome'), false)
    for (const bad of unknownMemberMutations(value.audit)) assert.equal(s1RetentionShapeAllows(bad, 'audit'), false)
  }
})

test('C1 descriptor revision preserves both context forms and changes only the generated SQL block', () => {
  assert.equal(S1_RETENTION_SHAPE.revision, 2)
  assert.equal(s1RetentionShapeAllows(s1Fixture('c1-legacy-retention').proposal), true)
  const f = c1Fixture('c1-revision2-retention')
  assert.equal(s1RetentionShapeAllows(f.proposal), true)
  assert.equal(readV3RetainableProposal(f.text, f.originals.registry).ok, true)
  const manifest = JSON.parse(readFileSync('docs/official-truth-product-v3/C1_PROTECTED_SOURCES_V1.json', 'utf8'))
  const { path, mask, sha256 } = manifest.sqlOutsideDescriptor
  const sql = readFileSync(path, 'utf8')
  assert.equal(sha256Hex(sql.replace(/-- S1_RETENTION_SHAPE_BEGIN[\s\S]*?-- S1_RETENTION_SHAPE_END/, mask)), sha256)
})

test('C1 retention closes all new subtrees and does not claim canonical ordering or identity proof', () => {
  const f = c1Fixture('c1-retention-negative')
  for (const row of c1InvalidShapes(f.proposal)) {
    assert.equal(s1RetentionShapeAllows(row.value), false, row.label)
    assert.equal(readV3RetainableProposal(JSON.stringify(row.value), f.originals.registry).ok, false, row.label)
  }
  const reversed = { ...f.proposal, context: { ...f.context, application: { ...f.context.application,
    tripStartAndEndWindow: { from: '2026-11-14', through: '2026-11-13' } } } }
  assert.equal(s1RetentionShapeAllows(reversed), true, 'shape validates two civil dates; canonical reader owns ordering')
  assert.equal(readV3GlobalRuleContext(reversed.context).ok, false)
  assert.equal(readV3RetainableProposal(JSON.stringify(reversed), f.originals.registry).ok, false)
  const wrongKey = { ...f.proposal, contextKey: `official-truth-context:v3:${'0'.repeat(64)}` }
  assert.equal(s1RetentionShapeAllows(wrongKey), true, 'shape is not checksum or acceptance authority')
  assert.equal(readV3RetainableProposal(JSON.stringify(wrongKey), f.originals.registry).ok, false)
})

test('C1 full prepared outcome shape retains new decision/observation/version subtrees without widening them', async () => {
  const f = c1Fixture('c1-retention-completion'), value = await f.completion()
  assert.equal(value.outcome.status, 'prepared')
  assert.equal(s1RetentionShapeAllows(value.outcome, 'outcome'), true)
  assert.equal(s1RetentionShapeAllows(value.audit, 'audit'), true)
  for (const bad of unknownMemberMutations(value.outcome)) assert.equal(s1RetentionShapeAllows(bad, 'outcome'), false)
})
