import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'
import { AT_OFFICIAL_PUBLICATIONS } from '../official-truth-at-source-reader/publications'
import { HRS1_LIMITS } from '../official-truth-product-v3/result/contract'
import { readMa1FixedBinding } from '../official-truth-product-v3/method/contract'
import { readV3MethodRevisionDraft } from '../official-truth-product-v3/contract'

test('AT V3 preparation pins all three complete originals without changing HRS1 or minting authority', () => {
  const at = AT_V3_METHOD_PREPARATION
  assert.equal(at.status, 'DRAFT_NOT_STAGED')
  assert.equal(at.publicationAuthority, 'none')
  assert.equal(at.acceptedFacts, 0)
  assert.equal(at.importable, false)
  assert.equal(at.destinationCountryCode, 'AT')
  assert.equal(at.method.method.methodId, 'jetnity-destination-primary-at-visa')
  assert.equal(at.method.status, 'NOT_APPROVED')
  assert.equal(at.originalBytes, 131072)
  assert.equal(HRS1_LIMITS.originalBytes, 131072)
  assert.equal(at.proposedAtOnlyMaximumBytes, 524288)
  assert.deepEqual(at.sourcePins.map(p => p.url), AT_OFFICIAL_PUBLICATIONS.map(p => p.url))
  assert.deepEqual(at.sourcePins.map(p => p.originalBytes), [498415, 91655, 172460])
  assert.equal(at.sourcePins[0].observedEdition, '2026-11-06')
  assert.ok(at.sourcePins.every(p => p.originalSha256.length === 64))
  assert.equal(at.nativeHrsQualified, false)
  assert.equal(at.ownerMethodApproved, false)
  assert.equal(at.backgroundGuardBound, false)
  assert.equal(at.devVisitorReadback, false)
  assert.equal(readMa1FixedBinding(at.binding).ok, true)
  assert.equal(readV3MethodRevisionDraft(at.method).ok, true)
})
