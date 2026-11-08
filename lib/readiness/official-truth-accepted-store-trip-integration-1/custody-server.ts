import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { provenanceCanonical } from '../official-truth-autonomous-provenance-artifact'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const identifier = z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/)
const pin = z.object({ id: identifier, version: z.number().int().positive(), digest }).strict()
const identity = z.object({ sourceId: identifier, contentItemId: identifier, contentItemVersion: z.number().int().positive(),
  representationId: identifier, representationVersion: z.number().int().positive(),
  identityProfileId: identifier, identityProfileVersion: z.number().int().positive() }).strict()
const stamp = z.string().datetime({ precision: 3, offset: false })
export const custodyMetadataSchema = z.object({
  schema: z.literal('accepted-store-original-v1'), operationId: z.string().uuid(),
  receiptFingerprint: z.string().regex(/^ot-provenance-v1:[a-f0-9]{64}$/), originalPin: pin,
  evidenceVersionId: z.string().regex(/^ev2_[a-f0-9]{32}$/), identity,
  canonicalUrl: z.string().url().max(2_048), contentType: z.string().min(1).max(128),
  contentHash: digest, contentBytes: z.number().int().min(1).max(65_536),
  originalRetrievedAt: stamp, retainUntil: stamp, keyId: identifier, keyPolicyDigest: digest,
}).strict().refine(v => Date.parse(v.originalRetrievedAt) < Date.parse(v.retainUntil))
export type CustodyMetadata = z.infer<typeof custodyMetadataSchema>
const base64 = z.string().regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
export const ciphertextSchema = z.object({ version: z.literal(1), algorithm: z.literal('aes-256-gcm'),
  nonce: base64.length(16), tag: base64.length(24), ciphertext: base64.min(4).max(87_384),
}).strict()
export type CustodyCiphertext = z.infer<typeof ciphertextSchema>

function associated(metadata: CustodyMetadata): Buffer {
  const checked = custodyMetadataSchema.parse(metadata), text = provenanceCanonical(checked)
  if (text === null) throw Error('custody_metadata_invalid')
  return Buffer.from(text, 'utf8')
}
function decode(text: string, expected?: number): Buffer {
  const bytes = Buffer.from(text, 'base64')
  if (bytes.toString('base64') !== text || expected !== undefined && bytes.byteLength !== expected) throw Error('custody_integrity_invalid')
  return bytes
}
function bodyMatches(body: Buffer, metadata: CustodyMetadata): boolean {
  const hash = createHash('sha256').update(body).digest()
  return body.byteLength === metadata.contentBytes && timingSafeEqual(hash, Buffer.from(metadata.contentHash, 'hex'))
}

/** This helper is server-only. The key is never part of an RPC, stored envelope,
 * exception or result. The deployment supplies no key binding by default. */
export function encryptOriginal(bodyText: string, metadata: CustodyMetadata, key: Uint8Array): CustodyCiphertext {
  const aad = associated(metadata), body = Buffer.from(bodyText, 'utf8'), ownedKey = Buffer.from(key)
  try {
    if (ownedKey.byteLength !== 32 || !bodyMatches(body, metadata)
      || new TextDecoder('utf-8', { fatal: true }).decode(body) !== bodyText) throw Error('custody_integrity_invalid')
    const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', ownedKey, nonce, { authTagLength: 16 })
    cipher.setAAD(aad, { plaintextLength: body.byteLength })
    const encrypted = Buffer.concat([cipher.update(body), cipher.final()])
    return ciphertextSchema.parse({ version: 1, algorithm: 'aes-256-gcm', nonce: nonce.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'), ciphertext: encrypted.toString('base64') })
  } catch { throw Error('custody_integrity_invalid') }
  finally { ownedKey.fill(0); body.fill(0) }
}

export function decryptOriginal(envelope: CustodyCiphertext, metadata: CustodyMetadata, key: Uint8Array): string {
  const aad = associated(metadata), checked = ciphertextSchema.parse(envelope), ownedKey = Buffer.from(key)
  let plaintext: Buffer | null = null
  try {
    if (ownedKey.byteLength !== 32) throw Error('custody_integrity_invalid')
    const nonce = decode(checked.nonce, 12), tag = decode(checked.tag, 16), ciphertext = decode(checked.ciphertext)
    if (ciphertext.byteLength !== metadata.contentBytes) throw Error('custody_integrity_invalid')
    const decipher = createDecipheriv('aes-256-gcm', ownedKey, nonce, { authTagLength: 16 })
    decipher.setAAD(aad, { plaintextLength: metadata.contentBytes }); decipher.setAuthTag(tag)
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    if (!bodyMatches(plaintext, metadata)) throw Error('custody_integrity_invalid')
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext)
  } catch { throw Error('custody_integrity_invalid') }
  finally { ownedKey.fill(0); plaintext?.fill(0) }
}
