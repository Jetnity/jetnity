import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, test } from 'node:test'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import {
  OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES,
  officialTruthSourceFingerprintV2,
  type OfficialTruthSourceFingerprintV2Binding,
} from '@/lib/readiness/official-truth-source-fingerprint-v2'

const BINDING: OfficialTruthSourceFingerprintV2Binding = {
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
const DOMAIN = 'jetnity:official-truth:source-fingerprint:v2\0'

function golden(snapshot: string, binding: OfficialTruthSourceFingerprintV2Binding): string {
  const normalized = snapshot.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const canonicalBinding = {
    sourceId: binding.sourceId,
    contentItemId: binding.contentItemId,
    contentItemVersion: binding.contentItemVersion,
    representationId: binding.representationId,
    representationVersion: binding.representationVersion,
    identityProfileId: binding.identityProfileId,
    identityProfileVersion: binding.identityProfileVersion,
    canonicalUrl: binding.canonicalUrl,
    contentType: binding.contentType,
  }
  return createHash('sha256').update(`${DOMAIN}${JSON.stringify([2, canonicalBinding, normalized])}`).digest('hex')
}

describe('officialTruthSourceFingerprintV2', () => {
  test('hashes the complete LF-normalized body with a closed versioned source tuple', () => {
    const body = 'first\r\nsecond\rthird'
    const hash = officialTruthSourceFingerprintV2(body, BINDING)
    assert.equal(hash, golden(body, BINDING))
    assert.equal(hash, officialTruthSourceFingerprintV2('first\nsecond\nthird', BINDING))
    assert.notEqual(hash, officialTruthSourceFingerprintV2(body, { ...BINDING, identityProfileVersion: 2 }))
    assert.notEqual(hash, evidenceQuellenFingerprint(body))
  })

  test('accepts the inclusive UTF-8 byte boundary and refuses a late extra byte', () => {
    assert.match(officialTruthSourceFingerprintV2('a'.repeat(OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES), BINDING) ?? '', /^[a-f0-9]{64}$/)
    assert.equal(officialTruthSourceFingerprintV2('a'.repeat(OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES + 1), BINDING), null)
  })

  test('measures encoded UTF-8 bytes independently from UTF-16 code units', () => {
    const exactMultibyte = 'é'.repeat(65_536)
    assert.equal(exactMultibyte.length, 65_536)
    assert.equal(new TextEncoder().encode(exactMultibyte).length, 131_072)
    assert.match(officialTruthSourceFingerprintV2(exactMultibyte, BINDING) ?? '', /^[a-f0-9]{64}$/)
    assert.equal(officialTruthSourceFingerprintV2('é'.repeat(65_537), BINDING), null)

    const exactAstral = '😀'.repeat(32_768)
    assert.equal(exactAstral.length, 65_536)
    assert.equal(new TextEncoder().encode(exactAstral).length, 131_072)
    assert.match(officialTruthSourceFingerprintV2(exactAstral, BINDING) ?? '', /^[a-f0-9]{64}$/)
    assert.equal(officialTruthSourceFingerprintV2('😀'.repeat(32_769), BINDING), null)
  })

  test('rejects malformed, unbounded, or non-canonical binding input', () => {
    assert.equal(officialTruthSourceFingerprintV2('', BINDING), null)
    assert.equal(officialTruthSourceFingerprintV2(`\uFEFF${'a'.repeat(10)}`, BINDING), null)
    assert.equal(officialTruthSourceFingerprintV2('\uD800', BINDING), null)
    assert.equal(officialTruthSourceFingerprintV2('\uDC00', BINDING), null)
    assert.equal(officialTruthSourceFingerprintV2('valid', { ...BINDING, canonicalUrl: 'http://authority.example/rules' }), null)
    assert.equal(officialTruthSourceFingerprintV2('valid', { ...BINDING, identityProfileVersion: 0 }), null)
    assert.equal(officialTruthSourceFingerprintV2('valid', { ...BINDING, unexpected: true } as never), null)
    assert.equal(officialTruthSourceFingerprintV2('valid', { ...BINDING, canonicalUrl: 'https://authority.example:443/rules' }), null)
  })
})
