import { sha256Hex } from '@/lib/readiness/digest'

export const OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES = 131_072
const OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_UTF16_UNITS = 131_072

export type OfficialTruthSourceFingerprintV2Binding = Readonly<{
  sourceId: string
  contentItemId: string
  contentItemVersion: number
  representationId: string
  representationVersion: number
  identityProfileId: string
  identityProfileVersion: number
  canonicalUrl: string
  contentType: string
}>

const BINDING_FIELDS = [
  'sourceId',
  'contentItemId',
  'contentItemVersion',
  'representationId',
  'representationVersion',
  'identityProfileId',
  'identityProfileVersion',
  'canonicalUrl',
  'contentType',
] as const
const IDENTIFIER = /^[a-z][a-z0-9_-]{1,63}$/
const MEDIA_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,63}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,63}$/
const DOMAIN = 'jetnity:official-truth:source-fingerprint:v2\0'

function bindingLesen(value: unknown): OfficialTruthSourceFingerprintV2Binding | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null
  const row = value as Record<string, unknown>
  const keys = Reflect.ownKeys(value)
  if (keys.length !== BINDING_FIELDS.length || keys.some((key) => typeof key !== 'string' || !BINDING_FIELDS.includes(key as typeof BINDING_FIELDS[number]))) return null
  for (const key of BINDING_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null
  }
  if (
    typeof row.sourceId !== 'string' || !IDENTIFIER.test(row.sourceId) ||
    typeof row.contentItemId !== 'string' || !IDENTIFIER.test(row.contentItemId) ||
    typeof row.representationId !== 'string' || !IDENTIFIER.test(row.representationId) ||
    typeof row.identityProfileId !== 'string' || !IDENTIFIER.test(row.identityProfileId) ||
    !Number.isSafeInteger(row.contentItemVersion) || Number(row.contentItemVersion) < 1 ||
    !Number.isSafeInteger(row.representationVersion) || Number(row.representationVersion) < 1 ||
    !Number.isSafeInteger(row.identityProfileVersion) || Number(row.identityProfileVersion) < 1 ||
    typeof row.canonicalUrl !== 'string' || typeof row.contentType !== 'string' || !MEDIA_TYPE.test(row.contentType)
  ) return null

  let url: URL
  try {
    url = new URL(row.canonicalUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || url.toString() !== row.canonicalUrl) return null
  return Object.freeze({
    sourceId: row.sourceId,
    contentItemId: row.contentItemId,
    contentItemVersion: row.contentItemVersion as number,
    representationId: row.representationId,
    representationVersion: row.representationVersion as number,
    identityProfileId: row.identityProfileId,
    identityProfileVersion: row.identityProfileVersion as number,
    canonicalUrl: row.canonicalUrl,
    contentType: row.contentType,
  })
}

function wellFormedUtf16(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false
      i += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false
    }
  }
  return true
}

/**
 * Fingerprints the complete normalized source body together with its immutable
 * source/representation/profile binding. Authorization to use this protocol
 * is deliberately performed by the code-owned retrieval and Evidence paths.
 */
export function officialTruthSourceFingerprintV2(
  snapshot: unknown,
  binding: unknown,
): string | null {
  if (typeof snapshot !== 'string' || snapshot.length === 0 ||
    snapshot.length > OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_UTF16_UNITS ||
    snapshot.startsWith('\uFEFF') || !wellFormedUtf16(snapshot)) return null
  const normalized = snapshot.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const encoded = new TextEncoder().encode(snapshot)
  if (encoded.length > OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V2_MAX_BYTES) return null
  const identity = bindingLesen(binding)
  if (!identity || normalized.length === 0) return null
  return sha256Hex(`${DOMAIN}${JSON.stringify([2, identity, normalized])}`)
}
