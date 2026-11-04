import 'server-only'
import { createHmac, randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'
import { kayakSearchSchema, validSearchDates } from './contract'
import { KayakFailure, searchKayak } from './server'

// Process-local protection supplements KAYAK's account-wide quota. It is not a distributed limit.
const limits = new Map<string, number[]>()
function allowance(key: string, max: number): boolean {
  const since = Date.now() - 3600000
  for (const [id, times] of limits) if (!times.some((time) => time > since)) limits.delete(id)
  if (!limits.has(key) && limits.size >= 10000) return false
  const times = (limits.get(key) ?? []).filter((time) => time > since)
  if (times.length >= max) return false
  limits.set(key, [...times, Date.now()]); return true
}
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
function fail(status: number, message: string) { return NextResponse.json({ mode: 'sandbox', message }, { status, headers: { ...headers, ...(status === 429 ? { 'Retry-After': '3600' } : {}) } }) }

export async function kayakPreviewRequest(request: NextRequest): Promise<NextResponse> {
  const key = process.env.KAYAK_SANDBOX_API_KEY
  if (process.env.KAYAK_SANDBOX_ENABLED !== 'true' || !key) return fail(503, 'Die KAYAK-Testvorschau ist gerade nicht verfügbar.')
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin)) return fail(403, 'Bitte starte die Vorschau direkt in Jetnity.')
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return fail(415, 'Ungültiges Anfrageformat.')
  if (Number(request.headers.get('content-length')) > 4096) return fail(413, 'Die Suchanfrage ist zu gross.')
  // Vercel overwrites these forwarding headers at the edge. Never trust them on an arbitrary host.
  const ip = process.env.VERCEL === '1' ? (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() : process.env.KAYAK_LOCAL_TEST_IP ?? ''
  if (!isIP(ip)) return fail(503, 'Die Vorschau ist auf diesem Zugang noch nicht eingerichtet.')
  const identity = createHmac('sha256', key).update(ip).digest('hex')
  if (!allowance(`user:${identity}`, 12)) return fail(429, 'Das Testkontingent für diesen Zugang ist erreicht. Bitte versuche es in einer Stunde erneut.')
  let parsed: unknown
  try {
    if (!request.body) return fail(400, 'Bitte vervollständige die Suchangaben.')
    const reader = request.body.getReader(), chunks: Uint8Array[] = []; let bytes = 0
    try { for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 4096) return fail(413, 'Die Suchanfrage ist zu gross.'); chunks.push(value) } } finally { await reader.cancel().catch(() => {}) }
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch { return fail(400, 'Bitte prüfe die Suchangaben.') }
  const input = kayakSearchSchema.safeParse(parsed)
  if (!input.success || !validSearchDates(input.data)) return fail(400, 'Bitte prüfe Orte, Reisedaten und Reisende. Hotels können für bis zu 30 Nächte getestet werden.')
  const existing = request.cookies.get('jetnity-kayak-preview')?.value ?? ''
  const userTrackId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing) ? existing : randomUUID()
  try {
    const data = await searchKayak(input.data, { key, clientIp: ip, userTrackId, signal: request.signal, allowRequest: async () => allowance(`provider:${input.data.kind}`, 220) })
    const response = NextResponse.json(data, { headers })
    response.cookies.set('jetnity-kayak-preview', userTrackId, { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/api/kayak/preview', maxAge: 86400 })
    return response
  } catch (error) {
    const status = error instanceof KayakFailure ? error.status : 503
    return fail(status, status === 429 ? 'Das KAYAK-Testkontingent ist gerade ausgeschöpft. Bitte versuche es später erneut.' : 'KAYAK hat die Testsuche nicht abgeschlossen. Bitte versuche es später erneut.')
  }
}
