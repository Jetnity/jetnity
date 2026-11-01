import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, test } from 'node:test'

import { officialTruthBoundedResponseBody, officialTruthCurrentRequestBoundedResponseBody } from '@/lib/readiness/official-truth-bounded-response-body'
import { contentEvidenceVersionCurrentRequest, contentEvidenceVersionV2 } from '@/lib/readiness/official-truth-content-identity'
import { officialTruthReviewIdentityCurrentRequest, officialTruthReviewIdentityV3 } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import {
  OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES,
  officialTruthSourceFingerprintProtocol,
  officialTruthSourceFingerprintV2,
} from '@/lib/readiness/official-truth-source-fingerprint-v2'
import {
  OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES,
  OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_UTF16_UNITS,
  officialTruthSourceFingerprintV3,
  type OfficialTruthSourceFingerprintV3Binding,
} from '@/lib/readiness/official-truth-source-fingerprint-v3'

const BINDING: OfficialTruthSourceFingerprintV3Binding = {
  sourceId: 'synthetic-authority',
  contentItemId: 'synthetic-item',
  contentItemVersion: 1,
  representationId: 'synthetic-html',
  representationVersion: 1,
  identityProfileId: 'synthetic-profile',
  identityProfileVersion: 1,
  canonicalUrl: 'https://authority.example/rules',
  contentType: 'text/html',
}
const DOMAIN = 'jetnity:official-truth:source-fingerprint:v3\0'
const GOLDEN_BODY = 'SYNTHETIC WHOLE SOURCE CURRENT REQUEST ONLY\n'
const GOLDEN = '691aef0448394c434c5be5b5a33066d589f6556490b9f391ec0ba2710ce21cb4'

function golden(snapshot: string): string {
  const normalized = snapshot.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return createHash('sha256').update(`${DOMAIN}${JSON.stringify([3, BINDING, normalized])}`).digest('hex')
}

describe('officialTruthSourceFingerprintV3', () => {
  test('hashes the whole normalized source under one NUL-terminated v3 domain', () => {
    assert.equal(DOMAIN.charCodeAt(DOMAIN.length - 1), 0)
    assert.equal(DOMAIN.includes('\\0'), false)
    assert.equal(OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES, 393_216)
    assert.equal(OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_UTF16_UNITS, 393_216)
    const hash = officialTruthSourceFingerprintV3(GOLDEN_BODY, BINDING)
    assert.equal(hash, GOLDEN)
    assert.equal(hash, golden(GOLDEN_BODY))
    assert.equal(officialTruthSourceFingerprintV3('first\r\nsecond\rthird', BINDING), officialTruthSourceFingerprintV3('first\nsecond\nthird', BINDING))
    assert.notEqual(hash, officialTruthSourceFingerprintV3(GOLDEN_BODY, { ...BINDING, identityProfileVersion: 2 }))
    assert.notEqual(hash, officialTruthSourceFingerprintV2(GOLDEN_BODY, BINDING))
  })

  test('counts raw UTF-8 bytes before line-ending normalization and refuses the next byte', () => {
    assert.equal(officialTruthSourceFingerprintV3('a'.repeat(393_215), BINDING)?.length, 64)
    assert.equal(officialTruthSourceFingerprintV3('a'.repeat(393_216), BINDING)?.length, 64)
    assert.equal(officialTruthSourceFingerprintV3('a'.repeat(393_217), BINDING), null)
    const rawOver = `${'é'.repeat(100_000)}${'\r\n'.repeat(100_000)}`
    assert.equal(rawOver.length, 300_000)
    assert.equal(new TextEncoder().encode(rawOver).length, 400_000)
    assert.equal(officialTruthSourceFingerprintV3(rawOver, BINDING), null)
    assert.equal(officialTruthSourceFingerprintV3('é'.repeat(196_608), BINDING)?.length, 64)
    assert.equal(officialTruthSourceFingerprintV3('é'.repeat(196_609), BINDING), null)
    assert.equal(officialTruthSourceFingerprintV3(`${GOLDEN_BODY}tamper`, BINDING), officialTruthSourceFingerprintV3(GOLDEN_BODY, BINDING) ? golden(`${GOLDEN_BODY}tamper`) : null)
    assert.notEqual(officialTruthSourceFingerprintV3(`${GOLDEN_BODY}tamper`, BINDING), GOLDEN)
  })

  test('rejects malformed text and non-canonical bindings', () => {
    assert.equal(officialTruthSourceFingerprintV3('', BINDING), null)
    assert.equal(officialTruthSourceFingerprintV3(`\uFEFF${GOLDEN_BODY}`, BINDING), null)
    assert.equal(officialTruthSourceFingerprintV3('\uD800', BINDING), null)
    assert.equal(officialTruthSourceFingerprintV3('\uDC00', BINDING), null)
    assert.equal(officialTruthSourceFingerprintV3(GOLDEN_BODY, { ...BINDING, canonicalUrl: 'http://authority.example/rules' }), null)
    assert.equal(officialTruthSourceFingerprintV3(GOLDEN_BODY, { ...BINDING, unexpected: true } as never), null)
    assert.equal(officialTruthSourceFingerprintV3(GOLDEN_BODY, { ...BINDING, canonicalUrl: 'https://authority.example:443/rules' }), null)
  })

  test('keeps the old V1/V2 selectors and the old reader cap', async () => {
    assert.equal(officialTruthSourceFingerprintProtocol('a'.repeat(65_535)), 1)
    assert.equal(officialTruthSourceFingerprintProtocol('a'.repeat(65_536)), 1)
    assert.equal(officialTruthSourceFingerprintProtocol('a'.repeat(65_537)), 2)
    assert.equal(officialTruthSourceFingerprintProtocol('a'.repeat(131_071)), 2)
    assert.equal(officialTruthSourceFingerprintProtocol('a'.repeat(131_072)), 2)
    assert.equal(officialTruthSourceFingerprintProtocol('a'.repeat(131_073)), null)
    assert.equal(OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES, 131_072)
    assert.match(officialTruthSourceFingerprintV2('a'.repeat(131_072), BINDING) ?? '', /^[a-f0-9]{64}$/)
    assert.equal(officialTruthSourceFingerprintV2('a'.repeat(131_073), BINDING), null)
    const signal = new AbortController().signal
    const oneByte = Buffer.alloc(1, 0x61)
    const one = (async function* () { yield oneByte })()
    assert.equal((await officialTruthBoundedResponseBody(one, signal, 131_073)).ok, false)
    const accepted = await officialTruthBoundedResponseBody((async function* () { yield Buffer.alloc(1, 0x61) })(), signal, 131_072)
    assert.equal(accepted.ok && accepted.bytes.byteLength, 1)
    let cancelled = false
    const overflow = await officialTruthCurrentRequestBoundedResponseBody((async function* () {
      yield Buffer.alloc(393_217, 0x61)
    })(), signal, () => { cancelled = true })
    assert.equal(overflow.ok, false)
    assert.equal(cancelled, true)
    const exact = await officialTruthCurrentRequestBoundedResponseBody((async function* () {
      yield Buffer.alloc(393_216, 0x61)
    })(), signal)
    assert.equal(exact.ok && exact.bytes.byteLength, 393_216)
  })

  test('old identity constructors still reject protocol 3 and the new ones require it', () => {
    const hash = officialTruthSourceFingerprintV3(GOLDEN_BODY, BINDING)!
    const identity = {
      ...BINDING,
      identitySchema: 2 as const,
      lookupKey: `evidence-key:v3:${'ab'.repeat(32)}`,
      sourceContentHash: hash,
      retrievedAt: '2026-10-23T00:00:00.000Z',
      validFrom: null,
      validUntil: null,
      sourceFingerprintProtocol: 3 as const,
    }
    assert.equal(contentEvidenceVersionV2(identity).ok, false)
    const current = contentEvidenceVersionCurrentRequest(identity)
    assert.equal(current.ok, true)
    if (current.ok) assert.match(current.value.versionId, /^ev2_[a-f0-9]{32}$/)
    const support = {
      ...BINDING, identitySchema: 2 as const, contentType: BINDING.contentType, versionId: 'ev2_' + 'a'.repeat(32),
      canonicalUrl: BINDING.canonicalUrl, retrievedAt: '2026-10-23T00:00:00.000Z', sourceContentHash: hash,
      validFrom: null, validUntil: null, sourceFingerprintProtocol: 3 as const,
    }
    const kandidat = { scope: {}, key: 'rule-scope:v1:' + 'ab'.repeat(32), factKind: 'requirement_effect' as const, evidenceQuality: 'explicit_primary_statement' as const, supportVersionIds: [support.versionId], proposal: null } as unknown as Parameters<typeof officialTruthReviewIdentityCurrentRequest>[0]
    assert.equal(officialTruthReviewIdentityV3(kandidat, [support]).ok, false)
    assert.equal(officialTruthReviewIdentityCurrentRequest(kandidat, [support, { ...support, sourceFingerprintProtocol: 2 }]).ok, false)
    assert.equal(officialTruthReviewIdentityCurrentRequest(kandidat, [{ ...support, sourceFingerprintProtocol: 2 }]).ok, false)
    const single = officialTruthReviewIdentityCurrentRequest(kandidat, [support])
    assert.equal(single.ok, true)
    if (single.ok) {
      assert.match(single.digest, /^[a-f0-9]{64}$/)
      assert.equal((single.preimage as { usage?: string }).usage, 'current_request_only')
      assert.equal((single.preimage as { sourceFingerprintProtocol?: number }).sourceFingerprintProtocol, 3)
    }
  })
})
