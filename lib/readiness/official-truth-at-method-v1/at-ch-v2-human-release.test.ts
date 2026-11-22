import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  HUMAN_METHOD_DEV_URL, HUMAN_METHOD_PRODUCTION_URL, buildHumanCommand,
  humanRpcArguments, readHumanRelease,
} from '../official-truth-product-v3/method/human-contract'

const release = {
  schema: 1, selectionId: 'hmr1_fe161a865c50d26be4a41c1b122fcd14',
  targetUrl: HUMAN_METHOD_DEV_URL, methodId: 'jetnity-destination-primary-at-visa', revision: 2,
  methodDigest: 'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e',
  packageDigest: '6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',
  predecessorRevision: 1,
  expectedHead: {
    methodId: 'jetnity-destination-primary-at-visa', revision: 1,
    methodDigest: 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
    packageDigest: '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
    epoch: 1, status: 'approved', approvalMode: 'until_revoked', approvalUntil: null,
  },
  approval: { mode: 'until_revoked', until: null },
  packageVersion: 'BMI 06.11.2026 / BMEIA neue Fassung · CH→AT Visum Rev. 2',
  packageHref: 'https://github.com/Jetnity/jetnity/blob/a7d7b0ba833c4421c7f7b353566762e0472f3638/lib/readiness/official-truth-at-method-v1/at-ch-v2-method-candidate.ts',
  scope: {
    citizenship: 'CH', destination: 'AT', requirement: 'visa', document: 'swiss_passport',
    route: 'direct_entry', conditions: 'verified_context_only',
    activeFrom: '2026-11-22T00:00:00.000Z', activeUntilExclusive: '2027-11-22T00:00:00.000Z',
    reviewedScope: 'CH valid Swiss passport, direct AT visa only; BMEIA changed source remains qualified only for approved narrow scope.',
  },
}

test('method rev2 CH→AT Owner descriptor binds exact predecessor and never self-authorizes', () => {
  const selected = readHumanRelease(release)
  assert.ok(selected)
  assert.equal(selected.targetUrl, HUMAN_METHOD_DEV_URL)
  assert.equal(selected.predecessorRevision, 1)
  assert.equal(selected.expectedHead?.revision, 1)
  assert.equal(selected.scope.citizenship, 'CH')
  assert.equal(selected.scope.destination, 'AT')
  const stage = buildHumanCommand(selected, { schema: 1, action: 'stage',
    selectionId: selected.selectionId, operationId: 'maop1_' + 'a'.repeat(32) })
  assert.ok(stage)
  assert.equal(stage.action, 'stage')
  assert.equal(humanRpcArguments(stage).action, 'stage')
  assert.equal(humanRpcArguments(stage).args.p_predecessor_revision, 1)
  const approve = buildHumanCommand(selected, { schema: 1, action: 'approve',
    selectionId: selected.selectionId, operationId: 'maop1_' + 'b'.repeat(32) })
  assert.ok(approve)
  assert.equal(approve.action, 'approve')
  assert.equal(humanRpcArguments(approve).action, 'approve')
  if (approve.action === 'approve') {
    assert.equal(approve.expected.status, 'approved')
    assert.equal(approve.expected.revision, 1)
  }
})

test('CH→AT method scope cannot silently expand to foreign pass, transit or other topics', () => {
  assert.ok(readHumanRelease(release))
  for (const scope of [
    { citizenship: 'PRIORITY_50' }, { citizenship: 'DE' }, { destination: 'DE' },
    { document: 'national_passport' }, { route: 'transit' },
    { conditions: 'unconditional' }, { requirement: 'vaccination' },
  ]) assert.equal(readHumanRelease({ ...release, scope: { ...release.scope, ...scope } }), null)
  assert.equal(readHumanRelease({ ...release, targetUrl: 'https://qscbgcdmivbbnzrcyegn.evil.example' }), null)
  assert.equal(readHumanRelease({ ...release, predecessorRevision: null }), null)
  assert.equal(readHumanRelease({ ...release, expectedHead: null }), null)
  assert.equal(readHumanRelease({ ...release, expectedHead: { ...release.expectedHead, revision: 3 } }), null)
  // Pure contract parsing may recognize a valid Production-shaped descriptor.
  // Production inability to select it is enforced independently by the strict
  // Dev-only branch/env/URL policy and Owner-held Production release gates.
  assert.ok(readHumanRelease({ ...release, targetUrl: HUMAN_METHOD_PRODUCTION_URL }))
})
