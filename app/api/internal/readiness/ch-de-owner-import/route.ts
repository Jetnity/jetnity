import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_PRODUCTION_URL, humanRequestHeadersAllowed } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { checkOfficialTruthV3ChDeMethod } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-server'
import { runOfficialTruthV3ChDeTick } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-tick'
import { withDevImportDiagnostics, withProductionImportDiagnostics, traceDevDiagnosticStage } from '@/lib/readiness/official-truth-product-v3/runtime/dev-diagnostics'
import { readChDeImportBody, chDeTickOutcome, chDeImportHttpStatus } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-import-http'
import { enqueueOfficialTruthV3ChDeRefresh } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-refresh'
import {
  CH_DE_OWNER_IMPORT_PATH, type ChDeOwnerImportOutcome,
} from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-owner-import-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Origin, Cookie', 'X-Content-Type-Options': 'nosniff' }

function answer(status: ChDeOwnerImportOutcome['status'], httpStatus: number, published = 0) {
  const outcome: ChDeOwnerImportOutcome = { schema: 1, status, published }
  return NextResponse.json(outcome, { status: httpStatus, headers: PRIVATE_HEADERS })
}

/** All inert target/request checks precede the existing fresh Owner/AAL2 gate.
 * Only a fixed ordinary enqueue/tick runs; no caller chooses or approves scope. */
export async function POST(request: Request) {
  let tickStarted = false
  try {
    const release = getHumanRelease()
    if (!release || getServerSupabaseUrl() !== release.targetUrl) {
      return answer('unavailable', 503)
    }
    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== CH_DE_OWNER_IMPORT_PATH || url.search !== '' || url.hash !== ''
      || url.username !== '' || url.password !== '' || request.headers.has('transfer-encoding') || request.headers.has('content-encoding')
      || !humanRequestHeadersAllowed(request.url, request.headers.get('origin'), request.headers.get('content-type'))) return answer('request_refused', 400)
    const body = await readChDeImportBody(request)
    if (!body) return answer('request_refused', 400)
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
    const observe = release.targetUrl === HUMAN_METHOD_PRODUCTION_URL ? withProductionImportDiagnostics : withDevImportDiagnostics
    return await observe(async () => {
      const approval = await traceDevDiagnosticStage('method_precheck', request.signal,
        () => checkOfficialTruthV3ChDeMethod(request.signal))
      if (request.signal.aborted || approval !== 'approved') return answer(approval === 'not_approved' ? 'not_approved' : 'unavailable', approval === 'not_approved' ? 409 : 503)
      tickStarted = true
      const selected = body.schema === 2 ? body : undefined
      if (selected?.mode === 'start') {
        const queued = await traceDevDiagnosticStage('refresh_enqueue', request.signal,
          () => enqueueOfficialTruthV3ChDeRefresh(selected, request.signal))
        if (request.signal.aborted) return answer('unresolved', 503)
        return answer(queued.status, chDeImportHttpStatus(queued.status), queued.published)
      }
      const report = await traceDevDiagnosticStage('tick', request.signal, () => runOfficialTruthV3ChDeTick(request.signal, selected))
      if (request.signal.aborted) return answer('unresolved', 503)
      const outcome = chDeTickOutcome(report, selected?.mode === 'resume' ? 1 : 3)
      return answer(outcome.status, chDeImportHttpStatus(outcome.status), outcome.published)
    })
  } catch { return answer(tickStarted ? 'unresolved' : 'unavailable', 503) }
}
