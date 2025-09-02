// app/api/creator/alerts/evaluate/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// ───────────────── Config
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const ALLOWED = new Set([ORIGIN, 'http://localhost:3000'])
const allowHeaders = 'Content-Type,Authorization'
const allowMethods = 'GET,OPTIONS'
const cors = (origin: string | null) => {
  const ok = origin && [...ALLOWED].some(o => origin === o || origin.endsWith(new URL(o).host))
  return {
    'Access-Control-Allow-Origin': ok ? origin! : ORIGIN,
    'Access-Control-Allow-Methods': allowMethods,
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

// ───────────────── Rate Limit (User-Pfad)
const RL_WINDOW_MS = 60_000
const RL_MAX = 20
type Bucket = { c: number; r: number }
const buckets = new Map<string, Bucket>()
const ipOf = (req: Request) =>
  (req.headers.get('x-real-ip') ||
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    '') || `ua:${req.headers.get('user-agent') ?? 'unknown'}`
function checkRL(req: Request) {
  const k = ipOf(req)
  const now = Date.now()
  const b = buckets.get(k)
  if (!b || now > b.r) {
    const nb = { c: 1, r: now + RL_WINDOW_MS }
    buckets.set(k, nb)
    return { ok: true, rem: RL_MAX - 1, reset: nb.r }
  }
  if (b.c >= RL_MAX) return { ok: false, rem: 0, reset: b.r }
  b.c++
  return { ok: true, rem: RL_MAX - b.c, reset: b.r }
}

// ───────────────── Helpers
const j = (req: NextRequest, body: any, init?: ResponseInit & { rl?: { rem: number; reset: number } }) => {
  const headers: Record<string, string> = {
    ...cors(req.headers.get('origin')),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (init?.rl) {
    headers['X-RateLimit-Limit'] = String(RL_MAX)
    headers['X-RateLimit-Remaining'] = String(init.rl.rem)
    headers['X-RateLimit-Reset'] = String(Math.floor(init.rl.reset / 1000))
  }
  const { rl, ...rest } = init ?? {}
  return new NextResponse(JSON.stringify(body), { ...rest, headers })
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: { ...cors(req.headers.get('origin')) } })
}

// ───────────────── Route: GET
export async function GET(req: NextRequest) {
  const h = headers()
  const authHeader = h.get('authorization') || h.get('Authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const cronSecret = process.env.CRON_SECRET

  // ── Admin/Cron-Pfad (skip Rate-Limit)
  if (bearer && cronSecret && bearer === cronSecret) {
    // Service-Role nur im Admin-Zweig benutzen!
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Falls deine RPC integer zurückgibt, fangen wir das robust ab:
    const { data, error } = await admin.rpc('creator_alerts_eval_all' as any)
    if (error) return j(req, { success: false, error: `rpc_all: ${error.message}` }, { status: 500 })

    const inserted = (data as unknown as number) ?? 0
    return j(req, { success: true, mode: 'admin', inserted }, { status: 200 })
  }

  // ── User-Pfad (Rate-Limit aktiv)
  const rl = checkRL(req)
  if (!rl.ok) return j(req, { success: false, error: 'rate_limited' }, { status: 429, rl })

  const supabase = createServerComponentClient()
  const { data: ures, error: uerr } = await supabase.auth.getUser()
  if (uerr) return j(req, { success: false, error: 'auth_error' }, { status: 500, rl })
  if (!ures?.user) return j(req, { success: false, error: 'unauthorized' }, { status: 401, rl })

  const { data, error } = await supabase.rpc('creator_alerts_eval_current_user' as any)
  if (error) return j(req, { success: false, error: `rpc_current: ${error.message}` }, { status: 500, rl })

  const inserted = (data as unknown as number) ?? 0
  return j(req, { success: true, mode: 'user', inserted }, { status: 200, rl })
}
