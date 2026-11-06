import 'server-only'

import { OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES } from '@/lib/readiness/official-truth-source-fingerprint-v3'

const BODY_MAX = 131_072
type BoundedBody =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'response_too_large' | 'timeout' | 'http_failed' }

/**
 * One fixed buffer of `maxBytes`, then one slice of the received prefix.
 * Chunks are copied into that buffer. They are not retained as an array.
 */
async function readBounded(
  body: AsyncIterable<Uint8Array> | null,
  signal: AbortSignal,
  maxBytes: number,
  cancel?: () => void,
): Promise<BoundedBody> {
  if (signal.aborted) return { ok: false, reason: 'timeout' }
  if (!body) return { ok: true, bytes: new Uint8Array() }
  const buffer = new Uint8Array(maxBytes)
  let received = 0
  try {
    for await (const chunk of body) {
      if (signal.aborted) {
        cancel?.()
        return { ok: false, reason: 'timeout' }
      }
      if (chunk.byteLength === 0) continue
      if (received + chunk.byteLength > maxBytes) {
        cancel?.()
        return { ok: false, reason: 'response_too_large' }
      }
      buffer.set(chunk, received)
      received += chunk.byteLength
    }
  } catch {
    cancel?.()
    return { ok: false, reason: signal.aborted ? 'timeout' : 'http_failed' }
  }
  if (signal.aborted) return { ok: false, reason: 'timeout' }
  return { ok: true, bytes: buffer.slice(0, received) }
}

export async function officialTruthBoundedResponseBody(
  body: AsyncIterable<Uint8Array> | null,
  signal: AbortSignal,
  maxBytes: number,
  cancel?: () => void,
): Promise<BoundedBody> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > BODY_MAX) {
    return { ok: false, reason: 'http_failed' }
  }
  return readBounded(body, signal, maxBytes, cancel)
}

/** Fixed 393216-byte cap. The caller cannot raise or lower it. */
export async function officialTruthCurrentRequestBoundedResponseBody(
  body: AsyncIterable<Uint8Array> | null,
  signal: AbortSignal,
  cancel?: () => void,
): Promise<BoundedBody> {
  return readBounded(body, signal, OFFICIAL_TRUTH_SOURCE_FINGERPRINT_V3_MAX_BYTES, cancel)
}
