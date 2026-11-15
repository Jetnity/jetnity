import { createHmac, timingSafeEqual } from 'node:crypto'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_PRODUCTION_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { checkOfficialTruthV3ChDeMethod } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-server'
import { runOfficialTruthV3ChDeTick } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-tick'
import { enqueueOfficialTruthV3ChDeRefresh } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-refresh'
import { readChDeImportBody, chDeTickOutcome, chDeImportHttpStatus } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-import-http'
import { withProductionImportDiagnostics, traceDevDiagnosticStage } from '@/lib/readiness/official-truth-product-v3/runtime/dev-diagnostics'
import type { ChDeOwnerImportOutcome, ChDeOwnerImportRequest } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-owner-import-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const PATH = '/api/internal/readiness/ch-de-prod-refresh'
const HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Authorization, X-Jetnity-Prod-Import-Time, Cookie', 'X-Content-Type-Options': 'nosniff' }

/** Narrow Production scheduler admission. Credentials authorize only a fixed ordinary
 * queue request / its exact continuation. MA1/source/guard/publication remain
 * in the unchanged runtime; no endpoint grants or renews Owner authority. */
export async function POST(request: Request): Promise<Response> {
  let dispatched = false
  let verified: Readonly<{ key: string; time: string; body: ChDeOwnerImportRequest }> | null = null
  function answer(status: ChDeOwnerImportOutcome['status'], httpStatus = chDeImportHttpStatus(status), published = 0) {
    const outcome: ChDeOwnerImportOutcome = { schema: 1, status, published }
    const headers = new Headers(HEADERS)
    if (verified) {
      const { key, time, body } = verified
      const text = ['jetnity-prod-import-response-v1', 'POST', PATH, time, '2', body.mode,
        body.operationId, body.leaseId, '1', String(httpStatus), status, String(published)].join('\n')
      headers.set('X-Jetnity-Prod-Import-Mac', createHmac('sha256', key).update(text).digest('hex'))
    }
    return Response.json(outcome, { status: httpStatus, headers })
  }
  try {
    const release = getHumanRelease()
    if (!release || release.targetUrl !== HUMAN_METHOD_PRODUCTION_URL || getServerSupabaseUrl() !== HUMAN_METHOD_PRODUCTION_URL) {
      return answer('unavailable')
    }
    const secret = process.env.JETNITY_PROD_IMPORT_CRON_SECRET
    if (!secret || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) return answer('unavailable')
    const authorization = request.headers.get('authorization'), time = request.headers.get('X-Jetnity-Prod-Import-Time')
    if (!authorization || !/^HMAC-SHA256 [a-f0-9]{64}$/.test(authorization)
      || !time || !/^[1-9][0-9]{12}$/.test(time)) return answer('access_required', 401)
    const current = () => { const age = Date.now() - Number(time); return age >= -5_000 && age <= 120_000 }
    if (!current()) return answer('access_required', 401)
    const url = new URL(request.url)
    // Production has no preview/session transport admission. Only the fixed
    // Production origin and this request's separate HMAC are accepted.
    if (request.method !== 'POST' || url.origin !== 'https://jetnity.com' || url.pathname !== PATH || url.search !== '' || url.hash !== ''
      || url.username !== '' || url.password !== '' || request.headers.has('transfer-encoding') || request.headers.has('content-encoding')
      || request.headers.has('cookie') || request.headers.has('x-vercel-protection-bypass')
      || request.headers.has('x-vercel-set-bypass-cookie')
      || request.headers.has('origin')
      || !/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')) return answer('request_refused')
    const body = await readChDeImportBody(request, true)
    if (!body || body.schema !== 2) return answer('request_refused')
    const text = ['jetnity-prod-import-v1', 'POST', PATH, time, '2', body.mode, body.operationId, body.leaseId].join('\n')
    const expected = createHmac('sha256', secret).update(text).digest()
    const supplied = Buffer.from(authorization.slice('HMAC-SHA256 '.length), 'hex')
    if (!current() || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return answer('access_required', 401)
    verified = Object.freeze({ key: secret, time, body })
    if (request.signal.aborted) return answer('unavailable')
    return await withProductionImportDiagnostics(async () => {
      const approval = await traceDevDiagnosticStage('method_precheck', request.signal,
        () => checkOfficialTruthV3ChDeMethod(request.signal))
      if (request.signal.aborted || approval !== 'approved') return answer(approval === 'not_approved' ? 'not_approved' : 'unavailable')
      if (!current()) return answer('access_required', 401)
      dispatched = true
      const outcome = body.mode === 'start'
        ? await traceDevDiagnosticStage('refresh_enqueue', request.signal, () => enqueueOfficialTruthV3ChDeRefresh(body, request.signal))
        : chDeTickOutcome(await traceDevDiagnosticStage('tick', request.signal, () => runOfficialTruthV3ChDeTick(request.signal, body)), 1)
      if (request.signal.aborted) return answer('unresolved')
      return answer(outcome.status, chDeImportHttpStatus(outcome.status), outcome.published)
    })
  } catch { return answer(dispatched ? 'unresolved' : 'unavailable') }
}
