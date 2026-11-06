import assert from 'node:assert/strict'
import { test } from 'node:test'

import { applicationContract, applicationPilotEnabled } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY, contentEvidenceVersionCurrentRequest, contentEvidenceVersionV2 } from '@/lib/readiness/official-truth-content-identity'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY as POLICY } from '@/lib/readiness/official-truth-whole-source-current-request-1'
import { officialTruthReviewIdentityCurrentRequest } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import {
  SYNTHETIC_PREFIX,
  currentContract,
  observeContractDrift,
  observeExactProfileSeams,
  observeGeneratedProtocol3Store,
  observeMarkerLoss,
  observeMutated,
  observePilot,
  observeRetrieval,
} from '@/lib/readiness/fixtures/whole-source-current-request-1/harness.test'

test('production registries and the application gate stay closed', () => {
  assert.equal(applicationPilotEnabled(), false)
  assert.equal(applicationContract(currentContract.id, currentContract.digest), null)
  assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
  assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some((profile) => profile.identityProfileId === POLICY.identityProfileId), false)
  assert.equal(POLICY.maxBytes, 393_216)
  assert.equal(POLICY.redirectAllowance, 0)
  assert.equal(POLICY.sourceProtocol, 3)
})

test('synthetic 371444 and 393216 bodies pass the existing reader, evidence, review, extractor and application chain', async () => {
  for (const bytes of [371_444, 393_216, SYNTHETIC_PREFIX.length]) {
    const observed = await observePilot(bytes)
    const retrieval = observed.retrieval
    const detail = JSON.stringify({
      bytes,
      status: observed.result.status,
      retrieval: retrieval && (retrieval.status === 'blocked' ? retrieval.reason : retrieval.sourceFingerprintProtocol),
      packet: observed.packet && (observed.packet as { status?: string; reason?: string }).status,
      packetReason: observed.packet && (observed.packet as { reason?: string }).reason,
    })
    if (observed.result.status !== 'verified') assert.fail(detail)
    if (!retrieval || retrieval.status !== 'server_owned_official_retrieval') assert.fail(detail)
    assert.equal(retrieval.sourceFingerprintProtocol, 3)
    assert.equal(retrieval.redirectCount, 0)
    assert.equal(Buffer.byteLength(retrieval.sourceSnapshot), bytes)
    assert.equal(retrieval.sourceSnapshot.startsWith(SYNTHETIC_PREFIX), true)
    assert.equal(JSON.stringify(observed.result).includes(SYNTHETIC_PREFIX), false)
    const visa = observed.result.evaluations.find((row) => row.requirementType === 'visa')
    assert.equal(visa?.result, 'not_required')
    assert.equal(observed.result.evaluations.filter((row) => row.result === 'not_required' || row.result === 'required').length, 1)
    const packet = observed.packet as { status?: string; supports?: { sourceFingerprintProtocol?: number; versionId: string; sourceContentHash: string; canonicalUrl: string; contentType: string; retrievedAt: string; validFrom: null; validUntil: null; identitySchema: 2 }[]; evidenceVersions?: { sourceFingerprintProtocol?: number; versionId: string; lookupKey: string; sourceContentHash: string }[] }
    assert.equal(packet.status, 'rule_review_packet')
    assert.equal(packet.supports?.length, 1)
    assert.equal(packet.supports?.[0]?.sourceFingerprintProtocol, 3)
    assert.equal(packet.evidenceVersions?.[0]?.sourceFingerprintProtocol, 3)
    assert.match(packet.supports?.[0]?.versionId ?? '', /^ev2_[a-f0-9]{32}$/)
    const support = packet.supports![0]!
    const evidence = packet.evidenceVersions![0]!
    const closed = {
      sourceId: POLICY.sourceId, contentItemId: POLICY.contentItemId, contentItemVersion: 1,
      representationId: POLICY.representationId, representationVersion: 1,
      identityProfileId: POLICY.identityProfileId, identityProfileVersion: 1,
      identitySchema: 2 as const, lookupKey: evidence.lookupKey, canonicalUrl: support.canonicalUrl,
      contentType: support.contentType, sourceContentHash: support.sourceContentHash, retrievedAt: support.retrievedAt,
      validFrom: null, validUntil: null, sourceFingerprintProtocol: 3 as const,
    }
    assert.equal(contentEvidenceVersionV2(closed).ok, false)
    const current = contentEvidenceVersionCurrentRequest(closed)
    assert.equal(current.ok && current.value.versionId, support.versionId)
  }
})

test('framing, length, redirect, media, compression, deadline and encoding refuse success', async () => {
  const cases = [
    ['redirect', 'redirect_rejected'],
    ['framing-false', 'http_failed'],
    ['framing-missing', 'http_failed'],
    ['short', 'http_failed'],
    ['long', 'http_failed'],
    ['over-cap', 'response_too_large'],
    ['stream-overflow', 'response_too_large'],
    ['truncated', 'http_failed'],
    ['duplicate', 'http_failed'],
    ['error', 'http_failed'],
    ['gzip', 'http_failed'],
    ['media', 'content_type_mismatch'],
    ['throw', 'http_failed'],
    ['bom', 'invalid_utf8'],
    ['bad-utf8', 'invalid_utf8'],
  ] as const
  for (const [fault, reason] of cases) {
    const observed = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length + 32, fault })
    assert.equal(observed.result.status, 'blocked', fault)
    if (observed.result.status === 'blocked') assert.equal(observed.result.reason, reason, fault)
    if (fault === 'redirect' || fault === 'duplicate') assert.equal(observed.calls, 1, fault)
    if (fault === 'over-cap' || fault === 'duplicate') assert.equal(observed.pulled, 0, fault)
    if (fault === 'stream-overflow' || fault === 'error' || fault === 'duplicate') assert.ok(observed.cancels > 0, fault)
  }
  const open = await observeRetrieval({ bytes: 393_215, fault: 'no-length' })
  assert.equal(open.result.status, 'server_owned_official_retrieval')
  if (open.result.status === 'server_owned_official_retrieval') assert.equal(open.result.sourceFingerprintProtocol, 3)
  const deadline = await observeRetrieval({ fault: 'hang' })
  assert.equal(deadline.result.status, 'blocked')
  if (deadline.result.status === 'blocked') assert.equal(deadline.result.reason, 'timeout')
  const injectedLate = await observeRetrieval({ fault: 'late', entry: 'injected' })
  assert.equal(injectedLate.result.status, 'blocked')
  if (injectedLate.result.status === 'blocked') assert.equal(injectedLate.result.reason, 'timeout')
})

test('a clone, a caller budget and the live registry cannot select protocol 3', async () => {
  const clone = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, fault: 'legacy-cap', profiles: 'clone', entry: 'injected' })
  assert.equal(clone.result.status, 'blocked')
  if (clone.result.status === 'blocked') assert.equal(clone.result.reason, 'response_too_large')
  assert.equal(clone.pulled, 0)
  const absent = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, profiles: 'absent', entry: 'injected' })
  assert.equal(absent.calls, 0)
  assert.equal(absent.result.status, 'blocked')
  const liveLarge = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, fault: 'legacy-cap', engine: 'production', profiles: 'approved' })
  assert.equal(liveLarge.result.status, 'blocked')
  if (liveLarge.result.status === 'blocked') assert.equal(liveLarge.result.reason, 'response_too_large')
  assert.equal(liveLarge.pulled, 0)
  const liveOpen = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, engine: 'production', profiles: 'absent' })
  assert.equal(liveOpen.calls, 0)
  const budget = await observeRetrieval({ extra: { maxBytes: 393_216, protocol: 3 }, profiles: 'approved', entry: 'injected' })
  assert.equal(budget.calls, 0)
  assert.equal(budget.result.status, 'blocked')
  if (budget.result.status === 'blocked') assert.equal(budget.result.reason, 'caller_authority_forbidden')
  const seams = await observeExactProfileSeams()
  assert.equal(seams.cataloged.status, 'blocked')
  assert.notEqual('sourceFingerprintProtocol' in seams.cataloged ? seams.cataloged.sourceFingerprintProtocol : undefined, 3)
  assert.equal(seams.isolated.status, 'blocked')
  if (seams.isolated.status === 'blocked') assert.equal(seams.isolated.reason, 'response_too_large')
  assert.equal(seams.injected.result.status, 'blocked')
  if (seams.injected.result.status === 'blocked') assert.equal(seams.injected.result.reason, 'response_too_large')
  assert.equal(seams.injected.pulled, 0)
  assert.equal(seams.nativePulled, 0)
})

test('a lost or changed protocol 3 marker is refused at each new projection', async () => {
  const observed = await observeMarkerLoss()
  for (const result of [observed.removed, observed.changed, observed.unknown]) {
    assert.equal(result.status, 'blocked')
  }
  assert.equal(observed.evidenceRemoved.ok, false)
  assert.equal(observed.evidenceRemoved.reason, 'invalid_source_snapshot')
  for (const result of [observed.composed, observed.multi, observed.mixed]) {
    assert.equal(result.status, 'blocked')
    if (result.status === 'blocked') assert.equal(result.reason, 'ambiguous_structure')
  }
  const packet = observed.pilot.packet as { supports?: { sourceFingerprintProtocol?: number }[] }
  assert.equal(packet.supports?.[0]?.sourceFingerprintProtocol, 3)
})

test('a mutated protocol 3 contract and a legacy receipt stay closed', async () => {
  for (const kind of ['policy', 'version', 'protocol'] as const) {
    const result = await observeContractDrift(kind)
    assert.equal(result.status, 'source_not_admitted', kind)
  }
  for (const kind of ['legacy', 'v2'] as const) {
    const result = await observeContractDrift(kind)
    assert.equal(result.status, 'unavailable', kind)
  }
})

test('the current-request review constructor rejects composed and malformed supports', () => {
  const support = {
    sourceId: 'synthetic-authority', contentItemId: 'synthetic-item', contentItemVersion: 1,
    representationId: 'synthetic-html', representationVersion: 1,
    identityProfileId: 'synthetic-profile', identityProfileVersion: 1,
    identitySchema: 2 as const, contentType: 'text/html', versionId: `ev2_${'a'.repeat(32)}`,
    canonicalUrl: 'https://authority.example/rules', retrievedAt: '2026-10-23T00:00:00.000Z',
    sourceContentHash: 'ab'.repeat(32), validFrom: null, validUntil: null, sourceFingerprintProtocol: 3 as const,
  }
  const kandidat = {
    scope: {}, key: `rule-scope:v1:${'ab'.repeat(32)}`, factKind: 'requirement_effect' as const,
    evidenceQuality: 'explicit_primary_statement' as const, supportVersionIds: [support.versionId], proposal: null,
  }
  const valid = officialTruthReviewIdentityCurrentRequest(kandidat as never, [support])
  assert.equal(valid.ok, true)
  const withSnapshot = officialTruthReviewIdentityCurrentRequest(kandidat as never, [{ ...support, sourceSnapshot: 'synthetic page' } as never])
  assert.equal(withSnapshot.ok, true)
  if (valid.ok && withSnapshot.ok) assert.equal(withSnapshot.digest, valid.digest)
  const composed = officialTruthReviewIdentityCurrentRequest({ ...kandidat, evidenceQuality: 'composed_from_multiple_primary_sources' } as never, [support])
  assert.equal(composed.ok, false)
  const schema = officialTruthReviewIdentityCurrentRequest(kandidat as never, [{ ...support, identitySchema: 77 as never }])
  assert.equal(schema.ok, false)
  let reads = 0
  const getter = { ...support }
  Object.defineProperty(getter, 'sourceFingerprintProtocol', { enumerable: true, get() { reads += 1; return 3 } })
  const got = officialTruthReviewIdentityCurrentRequest(kandidat as never, [getter])
  assert.equal(got.ok, false)
  assert.equal(reads, 0)
  const foreign = Object.assign(Object.create({ injected: true }), support)
  assert.equal(officialTruthReviewIdentityCurrentRequest(kandidat as never, [foreign]).ok, false)
  const extra = officialTruthReviewIdentityCurrentRequest(kandidat as never, [{ ...support, unexpected: true } as never])
  assert.equal(extra.ok, false)
  if (valid.ok) assert.equal(Object.hasOwn(extra, 'digest'), false)
})

test('generated protocol 3 never reaches a historical client', async () => {
  const stored = await observeGeneratedProtocol3Store()
  assert.equal(stored.calls, 0)
  assert.equal(stored.evidenceStored.ok, false)
  assert.equal(stored.claimStored.ok, false)
  assert.equal(stored.material.status, 'blocked')
  assert.equal(stored.accepted.status, 'blocked')
  assert.equal(stored.review.status, 'blocked')
  assert.equal(stored.kandidat.ok, false)
})

test('changing one tuple field, staleness or a duplicate representation grants no protocol 3 read', async () => {
  for (const kind of ['url', 'media', 'version', 'stale', 'source', 'item', 'representation', 'profile', 'duplicate'] as const) {
    const mutated = await observeMutated(kind)
    if (!mutated.graph) {
      assert.equal(mutated.calls, 0)
      continue
    }
    assert.equal(mutated.pulled, 0, kind)
    assert.equal(mutated.result?.status, 'blocked', kind)
    assert.notEqual(mutated.result && 'sourceFingerprintProtocol' in mutated.result ? mutated.result.sourceFingerprintProtocol : undefined, 3)
  }
})
