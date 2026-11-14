import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL, humanRequestHeadersAllowed } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { checkOfficialTruthV3ChDeMethod } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-server'
import { runOfficialTruthV3ChDeTick, type ChDeTickReport } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-tick'
import { withDevImportDiagnostics, traceDevDiagnosticStage } from '@/lib/readiness/official-truth-product-v3/runtime/dev-diagnostics'
import {
  CH_DE_OWNER_IMPORT_BODY, CH_DE_OWNER_IMPORT_PATH, CH_DE_OWNER_IMPORT_REQUEST_BYTES,
  type ChDeOwnerImportOutcome,
} from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-owner-import-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Origin, Cookie', 'X-Content-Type-Options': 'nosniff' }

function answer(status: ChDeOwnerImportOutcome['status'], httpStatus: number, published = 0) {
  const outcome: ChDeOwnerImportOutcome = { schema: 1, status, published }
  return NextResponse.json(outcome, { status: httpStatus, headers: PRIVATE_HEADERS })
}

async function fixedBody(request: Request): Promise<boolean> {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^(0|[1-9][0-9]{0,4})$/.test(declared)
    || Number(declared) !== new TextEncoder().encode(CH_DE_OWNER_IMPORT_BODY).byteLength)) return false
  if (!request.body || request.signal.aborted) return false
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  const deadline = performance.now() + 5_000
  let bytes = 0, complete = false, expired = false, cancellation: Promise<void> | null = null
  const stop = () => { expired = true; cancellation ??= reader.cancel().catch(() => undefined) }
  const timer = setTimeout(stop, 5_000)
  request.signal.addEventListener('abort', stop, { once: true })
  if (request.signal.aborted) stop()
  try {
    for (;;) {
      if (expired || request.signal.aborted || performance.now() >= deadline) return false
      const part = await reader.read()
      if (expired || request.signal.aborted || performance.now() >= deadline) return false
      if (part.done) { complete = true; break }
      bytes += part.value.byteLength
      if (bytes > CH_DE_OWNER_IMPORT_REQUEST_BYTES) return false
      chunks.push(part.value)
    }
    if (declared !== null && Number(declared) !== bytes) return false
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body) === CH_DE_OWNER_IMPORT_BODY
  } catch { return false }
  finally {
    clearTimeout(timer); request.signal.removeEventListener('abort', stop)
    if (!complete && !cancellation) cancellation = reader.cancel().catch(() => undefined)
    if (cancellation) await cancellation
    reader.releaseLock()
  }
}

function tickAnswer(report: ChDeTickReport) {
  const published = Number.isSafeInteger(report.counts.published) && report.counts.published >= 0 && report.counts.published <= 32
    ? report.counts.published : null
  if (published === null || report.schema !== 1 || report.budgetMilliseconds !== 30000
    || report.calls.started !== report.calls.settled) return answer('unresolved', 503)
  if (report.status === 'complete' && report.calls.started === 3 && report.elapsedMilliseconds <= 30000
    && report.elapsedMilliseconds >= 0 && report.counts.unconfirmed === 0 && report.counts.unavailable === 0
    && report.counts.invalid === 0 && report.counts.deferred === 0) {
    return answer(published > 0 ? 'published' : 'complete', 200, published)
  }
  if (published === 0 && report.calls.started === 0) {
    if (report.status === 'busy') return answer('busy', 409)
    if (report.status === 'unavailable') return answer('unavailable', 503)
  }
  return answer('unresolved', 503, published)
}

/** All inert target/request checks precede the existing fresh Owner/AAL2 gate.
 * Only the fixed tick runs; this endpoint cannot choose or approve anything. */
export async function POST(request: Request) {
  let tickStarted = false
  try {
    const release = getHumanRelease()
    if (!release || release.targetUrl !== HUMAN_METHOD_DEV_URL || getServerSupabaseUrl() !== HUMAN_METHOD_DEV_URL) {
      return answer('unavailable', 503)
    }
    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== CH_DE_OWNER_IMPORT_PATH || url.search !== '' || url.hash !== ''
      || url.username !== '' || url.password !== '' || request.headers.has('transfer-encoding') || request.headers.has('content-encoding')
      || !humanRequestHeadersAllowed(request.url, request.headers.get('origin'), request.headers.get('content-type'))
      || !await fixedBody(request)) return answer('request_refused', 400)
    if (request.signal.aborted) return answer('unavailable', 503)
    const gate = await requireAdminApi({ surface: 'official-truth-import', capability: 'official-truth-freigeben' })
    if (!gate.ok) {
      for (const [name, value] of Object.entries(PRIVATE_HEADERS)) gate.response.headers.set(name, value)
      return gate.response
    }
    if (gate.role !== 'owner' || gate.grant !== 'role' || !adminWriteErlaubt({ grant: gate.grant }).erlaubt) {
      return answer('access_required', 403)
    }
    if (request.signal.aborted) return answer('unavailable', 503)
    return await withDevImportDiagnostics(async () => {
      const approval = await traceDevDiagnosticStage('method_precheck', request.signal,
        () => checkOfficialTruthV3ChDeMethod(request.signal))
      if (request.signal.aborted || approval !== 'approved') return answer(approval === 'not_approved' ? 'not_approved' : 'unavailable', approval === 'not_approved' ? 409 : 503)
      tickStarted = true
      const report = await traceDevDiagnosticStage('tick', request.signal, () => runOfficialTruthV3ChDeTick(request.signal))
      if (request.signal.aborted) return answer('unresolved', 503)
      return tickAnswer(report)
    })
  } catch { return answer(tickStarted ? 'unresolved' : 'unavailable', 503) }
}
