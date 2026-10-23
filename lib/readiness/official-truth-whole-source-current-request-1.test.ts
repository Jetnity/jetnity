import assert from 'node:assert/strict'
import { test } from 'node:test'

import { applicationContract, applicationPilotEnabled } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY, contentEvidenceVersionCurrentRequest, contentEvidenceVersionV2 } from '@/lib/readiness/official-truth-content-identity'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY as POLICY } from '@/lib/readiness/official-truth-whole-source-current-request-1'
import {
  SYNTHETIC_PREFIX,
  currentContract,
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
    ['gzip', 'http_failed'],
    ['media', 'content_type_mismatch'],
    ['timeout', 'timeout'],
    ['late', 'timeout'],
    ['throw', 'http_failed'],
    ['bom', 'invalid_utf8'],
    ['bad-utf8', 'invalid_utf8'],
  ] as const
  for (const [fault, reason] of cases) {
    const observed = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length + 32, fault })
    assert.equal(observed.result.status, 'blocked', fault)
    if (observed.result.status === 'blocked') assert.equal(observed.result.reason, reason, fault)
    if (fault === 'redirect') assert.equal(observed.calls, 1)
    if (fault === 'over-cap') assert.equal(observed.pulled, 0)
  }
  const open = await observeRetrieval({ bytes: 393_215, fault: 'no-length' })
  assert.equal(open.result.status, 'server_owned_official_retrieval')
  if (open.result.status === 'server_owned_official_retrieval') assert.equal(open.result.sourceFingerprintProtocol, 3)
})

test('a clone, a caller budget and the live registry cannot select protocol 3', async () => {
  const clone = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, fault: 'legacy-cap', profiles: 'clone' })
  assert.equal(clone.result.status, 'blocked')
  if (clone.result.status === 'blocked') assert.equal(clone.result.reason, 'response_too_large')
  assert.equal(clone.pulled, 0)
  const absent = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, profiles: 'absent' })
  assert.equal(absent.calls, 0)
  assert.equal(absent.result.status, 'blocked')
  const liveLarge = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, fault: 'legacy-cap', engine: 'production', profiles: 'approved' })
  assert.equal(liveLarge.result.status, 'blocked')
  if (liveLarge.result.status === 'blocked') assert.equal(liveLarge.result.reason, 'response_too_large')
  assert.equal(liveLarge.pulled, 0)
  const liveOpen = await observeRetrieval({ bytes: SYNTHETIC_PREFIX.length, engine: 'production', profiles: 'absent' })
  assert.equal(liveOpen.calls, 0)
  const budget = await observeRetrieval({ extra: { maxBytes: 393_216, protocol: 3 }, profiles: 'approved' })
  assert.equal(budget.calls, 0)
  assert.equal(budget.result.status, 'blocked')
  if (budget.result.status === 'blocked') assert.equal(budget.result.reason, 'caller_authority_forbidden')
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
