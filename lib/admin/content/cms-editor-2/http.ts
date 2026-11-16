import type { CmsFailure, CmsPort, CmsPortResult } from './port'
import { CMS_RESPONSE_BYTES, cmsJsonBody, parseCmsHttpRequest, type CmsHttpRequest } from './request'

const FAILURE_STATUS: Readonly<Record<CmsFailure, number>> = {
  invalid: 400, unauthenticated: 401, forbidden: 403, missing: 404,
  conflict: 409, request_conflict: 409, state: 409, rate_limit: 429,
  unavailable: 503, timeout: 504,
}

/** A fixed same-origin transport. Network loss never becomes a failed write. */
export function createCmsHttpPort(fetcher: typeof fetch = fetch): CmsPort {
  async function send(input: CmsHttpRequest): Promise<CmsPortResult> {
    const request = parseCmsHttpRequest(input)
    if (!request) return { ok: false, code: 'invalid' }
    const deadline = new AbortController()
    const timer = setTimeout(() => deadline.abort(), 15_000)
    try {
      const response = await fetcher('/api/admin/content/cms', {
        method: 'POST', credentials: 'same-origin', mode: 'same-origin', redirect: 'error', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request), signal: deadline.signal,
      })
      if (response.redirected || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
        return { ok: false, code: 'unavailable' }
      }
      // Fetch may decompress the stream while retaining the compressed length.
      const value = await cmsJsonBody(response.body, CMS_RESPONSE_BYTES, deadline.signal, null)
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, code: 'unavailable' }
      const record = value as Record<string, unknown>
      if (Object.keys(record).length !== 2) return { ok: false, code: 'unavailable' }
      if (response.status === 200 && record.ok === true && Object.hasOwn(record, 'value')) return { ok: true, value: record.value }
      if (record.ok === false && typeof record.code === 'string' && Object.hasOwn(FAILURE_STATUS, record.code)) {
        const code = record.code as CmsFailure
        if (response.status === FAILURE_STATUS[code]) return { ok: false, code }
      }
      return { ok: false, code: 'unavailable' }
    } catch { return { ok: false, code: deadline.signal.aborted ? 'timeout' : 'unavailable' } }
    finally { clearTimeout(timer) }
  }
  return {
    read: query => send({ operation: 'read', query }),
    command: command => send({ operation: 'command', command }),
    confirm: requestId => send({ operation: 'confirm', requestId }),
  }
}
