import { NextResponse } from 'next/server'
import { isAdminDevRuntimeEnabled } from '@/lib/admin/dev-runtime-activation'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import type { CmsFailure, CmsPortResult } from '@/lib/admin/content/cms-editor-2/port'
import { CMS_REQUEST_BYTES, cmsDuring, cmsJsonBody, cmsRequestHeadersAllowed, parseCmsHttpRequest } from '@/lib/admin/content/cms-editor-2/request'
import { runCmsRequest } from '@/lib/admin/content/cms-editor-2/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const HEADERS = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }
const STATUS: Readonly<Record<CmsFailure, number>> = {
  invalid: 400, unauthenticated: 401, forbidden: 403, missing: 404,
  conflict: 409, request_conflict: 409, state: 409, rate_limit: 429, timeout: 504, unavailable: 503,
}
function reply(result: CmsPortResult) {
  return NextResponse.json(result, { status: result.ok ? 200 : STATUS[result.code], headers: HEADERS })
}

export async function POST(request: Request) {
  const deadline = new AbortController()
  const abort = () => deadline.abort()
  const timer = setTimeout(abort, 12_000)
  request.signal.addEventListener('abort', abort, { once: true })
  try {
    if (!isAdminDevRuntimeEnabled()) return reply({ ok: false, code: 'unavailable' })
    if (!cmsRequestHeadersAllowed(request)) return reply({ ok: false, code: 'invalid' })
    if (request.signal.aborted) return reply({ ok: false, code: 'timeout' })
    const gate = await cmsDuring(() => requireAdminApi({ surface: 'content', capability: 'inhalte-moderieren' }), deadline.signal)
    if (!gate.ok) return reply({ ok: false, code: gate.response.status === 401 ? 'unauthenticated'
      : gate.response.status === 403 ? 'forbidden' : 'unavailable' })
    const body = await cmsJsonBody(request.body, CMS_REQUEST_BYTES, deadline.signal, request.headers.get('content-length'))
    const input = parseCmsHttpRequest(body)
    if (!input) return reply({ ok: false, code: deadline.signal.aborted ? 'timeout' : 'invalid' })
    if (input.operation === 'command' && !adminWriteErlaubt({ grant: gate.grant }).erlaubt) return reply({ ok: false, code: 'forbidden' })
    return reply(await runCmsRequest(input, gate.user.id, deadline.signal))
  } catch { return reply({ ok: false, code: deadline.signal.aborted ? 'timeout' : 'unavailable' }) }
  finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort', abort)
  }
}
