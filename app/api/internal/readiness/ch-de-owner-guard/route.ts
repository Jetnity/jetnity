import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL, humanRequestHeadersAllowed } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { DEV_GUARD_PATH, DEV_GUARD_REQUEST_BYTES, readDevGuardRequest, readDevGuardText } from '@/lib/readiness/official-truth-product-v3/runtime/guard-contract'
import { runDevGuardRequest } from '@/lib/readiness/official-truth-product-v3/runtime/guard-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30
const HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Origin, Cookie', 'X-Content-Type-Options': 'nosniff' }
const refuse = (status: number) => NextResponse.json({ schema: 1, status: 'unresolved',
  message: 'Der Vorgang wurde nicht bestätigt. Prüfe einen bereits gesendeten Vorgang mit seiner ursprünglichen Auswahl.' }, { status, headers: HEADERS })

export async function POST(request: Request) {
  try {
    const release = getHumanRelease()
    if (release?.targetUrl !== HUMAN_METHOD_DEV_URL || getServerSupabaseUrl() !== HUMAN_METHOD_DEV_URL) return refuse(503)
    const url = new URL(request.url), declared = request.headers.get('content-length')
    if (request.method !== 'POST' || url.pathname !== DEV_GUARD_PATH || url.search || url.hash || url.username || url.password
      || request.headers.has('transfer-encoding') || request.headers.has('content-encoding')
      || (declared !== null && (!/^(0|[1-9][0-9]{0,3})$/.test(declared) || Number(declared) > DEV_GUARD_REQUEST_BYTES))
      || !humanRequestHeadersAllowed(request.url, request.headers.get('origin'), request.headers.get('content-type'))) return refuse(400)
    const text = await readDevGuardText(request.body, request.signal, DEV_GUARD_REQUEST_BYTES)
    let parsed: unknown
    try { parsed = text === null ? null : JSON.parse(text) } catch { return refuse(400) }
    const input = readDevGuardRequest(parsed)
    if (!input || JSON.stringify(input) !== text || (declared !== null && Number(declared) !== new TextEncoder().encode(text!).byteLength)) return refuse(400)
    if (request.signal.aborted) return refuse(503)
    const gate = await requireAdminApi({ surface: 'official-truth-guard', capability: 'official-truth-freigeben' })
    if (!gate.ok) { for (const [name, value] of Object.entries(HEADERS)) gate.response.headers.set(name, value); return gate.response }
    if (gate.role !== 'owner' || gate.grant !== 'role' || !adminWriteErlaubt({ grant: gate.grant }).erlaubt) return refuse(403)
    if (request.signal.aborted) return refuse(503)
    const result = await runDevGuardRequest(input, request.signal)
    return result.problem ? NextResponse.json({ schema: 1, status: 'unresolved', message: result.problem.message }, { status: result.problem.status, headers: HEADERS })
      : NextResponse.json(result.value, { headers: HEADERS })
  } catch { return refuse(503) }
}
