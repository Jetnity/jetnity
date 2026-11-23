import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AT_CH_METHOD_V2_CANDIDATE, atChV2ScopeMatches } from './at-ch-v2-method-candidate'
import { readV3MethodRevisionDraft } from '../official-truth-product-v3/contract'
import { readMa1FixedBinding } from '../official-truth-product-v3/method/contract'

const valid = { citizenshipCountryCode: 'CH', destinationCountryCode: 'AT',
  requirementType: 'visa', documentType: 'passport', route: 'direct_entry' }

test('CH→AT proposed source successor has three exact editions and preserves changed BMEIA status', () => {
  const x = AT_CH_METHOD_V2_CANDIDATE
  assert.equal(x.status, 'DRAFT_NOT_STAGED')
  assert.equal(x.bmeiaOriginalWatchState, 'changed')
  assert.equal(x.sourcePins.length, 3)
  assert.deepEqual(x.sourcePins.map(s => s.originalBytes), [498415, 91655, 172428])
  assert.equal(x.sourcePins[2].originalSha256, '2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe')
  assert.equal(x.sourcePins[2].watchState, 'changed')
  assert.ok(x.sourcePins.every(s => /^[a-f0-9]{64}$/.test(s.originalSha256)))
})
test('CH→AT candidate method revision 2 is a valid unapproved successor, not an authority receipt', () => {
  const x = AT_CH_METHOD_V2_CANDIDATE
  assert.equal(x.method.method.revision, 2)
  assert.deepEqual(x.method.predecessor, { methodId: 'jetnity-destination-primary-at-visa', revision: 1 })
  assert.equal(x.method.status, 'NOT_APPROVED')
  assert.equal(readV3MethodRevisionDraft(x.method).ok, true)
  assert.equal(readMa1FixedBinding(x.binding).ok, true)
  assert.equal(x.binding.revision, 2)
  assert.equal(x.binding.methodDigest, 'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e')
  assert.equal(x.binding.packageDigest, '6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0')
  assert.equal(x.ownerMethodStaged, false)
  assert.equal(x.ownerMethodApproved, false)
  assert.equal(x.sourceQualificationWritten, false)
  assert.equal(x.bg1ProtectedSuccessorInstalled, false)
  assert.equal(x.publisherRebound, false)
  assert.equal(x.positiveCustomerFacts, 0)
})
test('no other passports, transit, document classes or topics inherit the CH→AT visa candidate', () => {
  assert.equal(atChV2ScopeMatches(valid), true)
  for (const field of Object.keys(valid) as Array<keyof typeof valid>) {
    assert.equal(atChV2ScopeMatches({ ...valid, [field]: 'INVALID' }), false)
  }
  assert.equal(atChV2ScopeMatches({ ...valid, citizenshipCountryCode: 'DE' }), false)
  assert.equal(atChV2ScopeMatches({ ...valid, route: 'transit' }), false)
  assert.equal(atChV2ScopeMatches({ ...valid, requirementType: 'vaccination' }), false)
})
