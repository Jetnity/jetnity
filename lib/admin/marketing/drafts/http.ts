import type { DraftFailure } from './runtime-contract'

export const DRAFT_PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Origin', 'X-Content-Type-Options': 'nosniff',
} as const
const BODY_LIMIT = 4096

export function draftHttpFailure(code: DraftFailure): Response {
  const status = code === 'unauthenticated' ? 401 : code === 'forbidden' ? 403 : code === 'invalid' ? 400
    : code === 'missing' ? 404 : code === 'rate_limit' ? 429
    : ['conflict', 'request_conflict', 'state'].includes(code) ? 409 : 503
  return Response.json({ ok: false, code }, { status, headers: DRAFT_PRIVATE_HEADERS })
}

export function draftRequestHeadersAllowed(request: Request): boolean {
  try {
    const url = new URL(request.url)
    return request.method === 'POST' && ['http:', 'https:'].includes(url.protocol)
      && request.headers.get('origin') === url.origin && request.headers.get('sec-fetch-site') === 'same-origin'
      && /^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
      && !request.signal.aborted
  } catch { return false }
}

/** Bounded streaming JSON. Neither input, backend text nor cancellation errors escape. */
export async function readDraftBody(request: Request): Promise<unknown> {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^(0|[1-9][0-9]{0,4})$/.test(declared) || Number(declared) > BODY_LIMIT)) return null
  if (!request.body || request.signal.aborted) return null
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  let size = 0, completed = false, stop: (() => void) | undefined
  const stopped = new Promise<null>(resolve => { stop = () => resolve(null) })
  const timer = setTimeout(() => stop?.(), 5_000)
  request.signal.addEventListener('abort', stop!, { once: true })
  try {
    for (;;) {
      const part = await Promise.race([reader.read(), stopped])
      if (part === null || request.signal.aborted) return null
      if (part.done) { completed = true; break }
      size += part.value.byteLength
      if (size > BODY_LIMIT) return null
      chunks.push(part.value)
    }
    if (declared !== null && size !== Number(declared)) return null
    const raw = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(raw))
  } catch { return null }
  finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort', stop!)
    if (!completed) void reader.cancel().catch(() => undefined)
    try { reader.releaseLock() } catch { /* pending cancelled read owns its cleanup */ }
  }
}
