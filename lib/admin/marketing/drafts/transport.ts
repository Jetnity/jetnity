import { parseMarketingDraftCommand, parseMarketingDraftRead, parseMarketingDraftResult } from './contract'
import {
  draftFailure, draftOperation, matchingDraftRead, matchesDraftOperation, parseDraftConfirm, parseDraftConfirmation,
  type DraftOutcome, type DraftPort,
} from './runtime-contract'

const ENDPOINTS = {
  read: '/api/admin/marketing/drafts/read', apply: '/api/admin/marketing/drafts/apply', confirm: '/api/admin/marketing/drafts/confirm',
} as const

async function boundedResponse(response: Response): Promise<unknown> {
  if (!response.body || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) return null
  const reader = response.body.getReader(), chunks: Uint8Array[] = []
  let size = 0, complete = false
  try {
    for (;;) {
      const part = await reader.read()
      if (part.done) { complete = true; break }
      size += part.value.byteLength
      if (size > 100_000) return null
      chunks.push(part.value)
    }
    const raw = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw))
  } catch { return null }
  finally {
    if (!complete) void reader.cancel().catch(() => undefined)
    try { reader.releaseLock() } catch { /* cancellation does not grant a result */ }
  }
}

export function createDraftTransport(fetcher: typeof fetch = (...args) => fetch(...args)): DraftPort {
  async function request(kind: keyof typeof ENDPOINTS, value: unknown): Promise<DraftOutcome<unknown>> {
    try {
      const response = await fetcher(ENDPOINTS[kind], {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value), signal: AbortSignal.timeout(20_000),
      })
      // Hide guarded data immediately. A stalled/erroring denial body must not
      // postpone loss of authority or turn HTML login markup into success.
      if (response.status === 401 || response.status === 403) {
        void response.body?.cancel().catch(() => undefined)
        return { ok: false, code: response.status === 401 ? 'unauthenticated' : 'forbidden' }
      }
      const parsed = await boundedResponse(response)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, code: 'unknown' }
      const body = parsed as Record<string, unknown>
      if (response.status === 200 && body.ok === true && Object.keys(body).sort().join(',') === 'ok,value') return { ok: true, value: body.value }
      const code = draftFailure(body.code)
      return !response.ok && body.ok === false && code ? { ok: false, code } : { ok: false, code: 'unknown' }
    } catch { return { ok: false, code: 'unknown' } }
  }
  return {
    async read(raw) {
      const input = parseMarketingDraftRead(raw)
      if (!input) return { ok: false, code: 'invalid' }
      const result = await request('read', input)
      if (!result.ok) return result
      const value = matchingDraftRead(result.value, input)
      return value ? { ok: true, value } : { ok: false, code: 'unknown' }
    },
    async apply(raw) {
      const input = parseMarketingDraftCommand(raw)
      if (!input) return { ok: false, code: 'invalid' }
      const result = await request('apply', input)
      if (!result.ok) return result
      const value = parseMarketingDraftResult(result.value)
      return value?.action === 'apply' && matchesDraftOperation(value.receipt, draftOperation(input)) && value.receipt.action === input.action
        ? { ok: true, value } : { ok: false, code: 'unknown' }
    },
    async confirm(raw) {
      const input = parseDraftConfirm(raw)
      if (!input) return { ok: false, code: 'invalid' }
      const result = await request('confirm', input)
      if (!result.ok) return result
      const value = parseDraftConfirmation(result.value, input)
      return value ? { ok: true, value } : { ok: false, code: 'unknown' }
    },
  }
}
