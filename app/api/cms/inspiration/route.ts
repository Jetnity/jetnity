import { NextResponse } from 'next/server'
import { isAdminDevRuntimeEnabled } from '@/lib/admin/dev-runtime-activation'
import { readCmsPublished } from '@/lib/admin/content/cms-editor-2/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }

export async function GET(request: Request) {
  if (!isAdminDevRuntimeEnabled() || new URL(request.url).search) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: HEADERS })
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12_000)])
  const result = await readCmsPublished(signal)
  return result.ok ? NextResponse.json(result, { headers: HEADERS })
    : NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: HEADERS })
}
