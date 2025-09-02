// app/api/copilot/generate/route.ts
export const dynamic = 'force-dynamic'
// export const runtime = 'edge' // <- aktivieren, falls dein Generator Edge-kompatibel ist

import { NextResponse, NextRequest } from 'next/server'
import { generateCopilotUpload } from '@/lib/intelligence/copilot-upload-generator'

// ── CORS Config ──────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set<string>([
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
])
const ALLOWED_METHODS = 'GET,POST,OPTIONS'
const ALLOWED_HEADERS = 'Content-Type,Authorization'

// ── Rate Limit (in-memory, pro Lambda-Worker) ─────────────────
const RL_WINDOW_MS = 60_000 // 1 min
const RL_MAX_REQ = 30
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function getClientIp(req: Request) {
  // works on Vercel/Proxy; fallback auf UA-Hash
  const h = new Headers(req.headers)
  const ip =
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    ''
  return ip || `ua:${h.get('user-agent') ?? 'unknown'}`
}
function rateLimitKey(req: Request) {
  return getClientIp(req)
}
function checkRateLimit(req: Request) {
  const key = rateLimitKey(req)
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + RL_WINDOW_MS }
    buckets.set(key, next)
    return { allowed: true, remaining: RL_MAX_REQ - 1, resetAt: next.resetAt }
  }
  if (bucket.count >= RL_MAX_REQ) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }
  bucket.count += 1
  return { allowed: true, remaining: RL_MAX_REQ - bucket.count, resetAt: bucket.resetAt }
}

// ── Utils ────────────────────────────────────────────────────
function corsHeaders(origin: string | null) {
  // Nur erlaubte Origins echoen
  const allowed =
    origin && [...ALLOWED_ORIGINS].some((o) => origin === o || origin.endsWith(new URL(o).host))
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : [...ALLOWED_ORIGINS][0],
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

function json(
  req: NextRequest,
  body: unknown,
  init?: ResponseInit & { ratelimit?: { remaining: number; resetAt: number } }
) {
  const origin = req.headers.get('origin')
  const base = corsHeaders(origin)
  const rl = init?.ratelimit
  const headers: Record<string, string> = {
    ...base,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json; charset=utf-8',
  }
  if (rl) {
    headers['X-RateLimit-Limit'] = String(RL_MAX_REQ)
    headers['X-RateLimit-Remaining'] = String(rl.remaining)
    headers['X-RateLimit-Reset'] = String(Math.floor(rl.resetAt / 1000))
  }
  const { ratelimit, ...rest } = init ?? {}
  return new NextResponse(JSON.stringify(body), { ...rest, headers })
}

function badRequest(req: NextRequest, code: string, message: string, rl?: any) {
  return json(req, { success: false, code, error: message }, { status: 400, ratelimit: rl })
}
function unauthorized(req: NextRequest, code: string, message: string, rl?: any) {
  return json(req, { success: false, code, error: message }, { status: 401, ratelimit: rl })
}
function tooMany(req: NextRequest, rl: any) {
  return json(req, { success: false, code: 'rate_limited', error: 'Rate limit exceeded' }, { status: 429, ratelimit: rl })
}
function serverError(req: NextRequest, err: unknown, rl?: any) {
  return json(
    req,
    { success: false, code: 'internal_error', error: err instanceof Error ? err.message : String(err) },
    { status: 500, ratelimit: rl }
  )
}

// ── Validation (leichtgewichtig, ohne zod) ────────────────────
type Payload = {
  destination: string
  locale?: string
  items?: number
}
function validatePayload(p: any): { ok: true; value: Payload } | { ok: false; msg: string } {
  if (!p || typeof p !== 'object') return { ok: false, msg: 'Invalid JSON payload' }
  const destination = String(p.destination ?? '').trim()
  if (!destination) return { ok: false, msg: 'Missing "destination"' }
  if (destination.length < 2 || destination.length > 120) return { ok: false, msg: 'Destination length out of range' }
  // einfache Zeichenprüfung (Buchstaben/Zahlen/Leerzeichen ,.-)
  if (!/^[\p{L}\p{N}\s.,\-()/_]+$/u.test(destination)) {
    return { ok: false, msg: 'Destination contains invalid characters' }
  }
  const locale = p.locale ? String(p.locale).slice(0, 10) : undefined
  let items = Number.isFinite(p.items) ? Number(p.items) : undefined
  if (items !== undefined) {
    items = Math.max(1, Math.min(20, Math.floor(items)))
  }
  return { ok: true, value: { destination, locale, items } }
}

// ── OPTIONS (CORS preflight) ──────────────────────────────────
export function OPTIONS(req: NextRequest) {
  return json(req, null, { status: 204 })
}

// ── GET ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req)
  if (!rl.allowed) return tooMany(req, rl)

  try {
    const { searchParams } = new URL(req.url)
    const payload: Payload = {
      destination: String(searchParams.get('destination') ?? ''),
      locale: searchParams.get('locale') ?? undefined,
      items: searchParams.get('items') ? Number(searchParams.get('items')) : undefined,
    }
    const v = validatePayload(payload)
    if (!v.ok) return badRequest(req, 'validation_error', v.msg, rl)

    // Optional: simple API-Key check (falls benötigt)
    const apiKey = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (process.env.COPILOT_API_KEY && apiKey !== process.env.COPILOT_API_KEY) {
      return unauthorized(req, 'unauthorized', 'Invalid API key', rl)
    }

    // Dein Generator – falls er weitere Optionen akzeptiert, hier übergeben
    const result = await generateCopilotUpload(v.value.destination /* , { locale: v.value.locale, items: v.value.items } */)

    // strukturiertes Log (nützlich in Logs/Datadog/etc.)
    console.info(
      JSON.stringify({
        msg: 'copilot.generate.success',
        destination: v.value.destination,
        locale: v.value.locale ?? null,
        items: v.value.items ?? null,
        ip: getClientIp(req),
      })
    )

    return json(
      req,
      { success: true, upload: result },
      { status: 200, ratelimit: rl }
    )
  } catch (err) {
    console.error('❌ /api/copilot/generate GET error:', err)
    return serverError(req, err)
  }
}

// ── POST ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req)
  if (!rl.allowed) return tooMany(req, rl)

  try {
    const body = await req.json().catch(() => ({}))
    const v = validatePayload(body)
    if (!v.ok) return badRequest(req, 'validation_error', v.msg, rl)

    const apiKey = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (process.env.COPILOT_API_KEY && apiKey !== process.env.COPILOT_API_KEY) {
      return unauthorized(req, 'unauthorized', 'Invalid API key', rl)
    }

    const result = await generateCopilotUpload(v.value.destination /* , { locale: v.value.locale, items: v.value.items } */)

    console.info(
      JSON.stringify({
        msg: 'copilot.generate.success',
        destination: v.value.destination,
        locale: v.value.locale ?? null,
        items: v.value.items ?? null,
        ip: getClientIp(req),
      })
    )

    return json(
      req,
      { success: true, upload: result },
      { status: 200, ratelimit: rl }
    )
  } catch (err) {
    console.error('❌ /api/copilot/generate POST error:', err)
    return serverError(req, err, rl)
  }
}
