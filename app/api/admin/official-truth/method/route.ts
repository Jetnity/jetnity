import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { HUMAN_METHOD_BODY_BYTES, humanRequestHeadersAllowed, readHumanRequestText } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { runHumanMethodRequest } from '@/lib/readiness/official-truth-product-v3/method/human-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }

function refuse(status: number, code: 'owner_required' | 'request_refused' | 'request_unresolved') {
  return NextResponse.json({ error: code }, { status, headers: PRIVATE_HEADERS })
}

async function boundedBody(request: Request): Promise<string | null> {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^(0|[1-9][0-9]{0,4})$/.test(declared) || Number(declared) > HUMAN_METHOD_BODY_BYTES)) return null
  if (!request.body || request.signal.aborted) return null
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  const deadline = performance.now() + 10_000
  let bytes = 0, completed = false, expired = false, cancellation: Promise<void> | null = null
  const stop = () => {
    expired = true
    if (!cancellation) cancellation = reader.cancel().catch(() => undefined)
  }
  const timer = setTimeout(stop, 10_000)
  request.signal.addEventListener('abort', stop, { once: true })
  try {
    for (;;) {
      if (expired || request.signal.aborted || performance.now() >= deadline) return null
      const part = await reader.read()
      if (expired || request.signal.aborted || performance.now() >= deadline) return null
      if (part.done) { completed = true; break }
      bytes += part.value.byteLength
      if (bytes > HUMAN_METHOD_BODY_BYTES) return null
      chunks.push(part.value)
    }
    if (declared !== null && bytes !== Number(declared)) return null
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body)
  } catch { return null }
  finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort', stop)
    if (!completed && !cancellation) cancellation = reader.cancel().catch(() => undefined)
    if (cancellation) await cancellation
    reader.releaseLock()
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdminApi({ surface: 'official-truth-method', capability: 'official-truth-freigeben' })
    if (!gate.ok) {
      gate.response.headers.set('Cache-Control', 'private, no-store')
      return gate.response
    }
    if (gate.role !== 'owner' || gate.grant !== 'role' || !adminWriteErlaubt({ grant: gate.grant }).erlaubt) return refuse(403, 'owner_required')
    if (!humanRequestHeadersAllowed(request.url, request.headers.get('origin'), request.headers.get('content-type'))) return refuse(400, 'request_refused')
    const raw = await boundedBody(request)
    const input = raw === null ? null : readHumanRequestText(raw)
    if (!input) return refuse(400, 'request_refused')
    const outcome = await runHumanMethodRequest(input, gate.user.id, request.signal)
    return NextResponse.json(outcome, { status: outcome.status === 'unresolved' ? 409 : 200, headers: PRIVATE_HEADERS })
  } catch { return refuse(503, 'request_unresolved') }
}
