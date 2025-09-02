// app/api/copilot/snippets/route.ts
export const dynamic = 'force-dynamic'
// export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'

// ── CORS ─────────────────────────────────────────────────────
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const ALLOWED = new Set([ORIGIN, 'http://localhost:3000'])
const allowHeaders = 'Content-Type,Authorization'
const allowMethods = 'GET,POST,OPTIONS'
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

// ── Rate Limit (in-memory) ───────────────────────────────────
const RL_WINDOW_MS = 60_000
const RL_MAX = 30
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

// ── Typen & Validation ───────────────────────────────────────
type Payload = {
  sessionId: string
  language?: 'de' | 'en'
  maxSuggestions?: number
  topic?: string
  temperature?: number
}

function parseParams(q: URLSearchParams | any): { ok: true; val: Payload } | { ok: false; msg: string } {
  const isQS = q instanceof URLSearchParams
  const get = (k: string) => (isQS ? q.get(k) : q?.[k])

  const sessionId = String(get('sessionId') ?? '').trim()
  if (!sessionId) return { ok: false, msg: 'Missing sessionId' }
  if (!/^[0-9a-fA-F-]{16,}$/.test(sessionId)) return { ok: false, msg: 'Invalid sessionId' }

  const language = (get('language') === 'en' ? 'en' : 'de') as 'de' | 'en'
  let maxSuggestions = Number(get('maxSuggestions') ?? 3)
  if (!Number.isFinite(maxSuggestions)) maxSuggestions = 3
  maxSuggestions = Math.max(1, Math.min(5, Math.floor(maxSuggestions)))

  let temperature = Number(get('temperature') ?? 0.8)
  if (!Number.isFinite(temperature)) temperature = 0.8
  temperature = Math.max(0, Math.min(1, temperature))

  const topic = (get('topic') ?? undefined) as string | undefined
  if (topic && !/^[\p{L}\p{N}\s.,\-()/'&+:_?!]+$/u.test(topic)) {
    return { ok: false, msg: 'Invalid characters in topic' }
  }

  return { ok: true, val: { sessionId, language, maxSuggestions, topic, temperature } }
}

// ── Helpers ──────────────────────────────────────────────────
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

// ── DB: Snippets holen (+ optional Ownership) ────────────────
const ENFORCE_OWNER = process.env.COPILOT_SNIPPETS_ENFORCE_OWNER === '1'
type Db = SupabaseClient<Database>
type CreatorSessionRow = Database['public']['Tables']['creator_sessions']['Row']

async function fetchContext(supabase: Db, sessionId: string) {
  if (ENFORCE_OWNER) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id ?? null

    const { data: sess, error: sessErr } = await supabase
      .from('creator_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .maybeSingle<{ id: CreatorSessionRow['id']; user_id: CreatorSessionRow['user_id'] }>()
    if (sessErr) throw new Error(`DB session: ${sessErr.message}`)
    if (!sess) throw new Error('not_found')
    if (!uid || sess.user_id !== uid) throw new Error('forbidden')
  }

  const { data, error } = await supabase
    .from('session_snippets')
    .select('content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`DB snippets: ${error.message}`)

  const parts = (data ?? []).map((r: any) => String(r.content ?? '')).filter(Boolean)
  let ctx = ''
  for (const p of parts) {
    if (ctx.length + p.length > 8000) break
    ctx += (ctx ? '\n---\n' : '') + p
  }
  return ctx
}

// ── Prompt Builder ───────────────────────────────────────────
function mkSystem(language: 'de' | 'en', n: number, topic?: string) {
  if (language === 'en') {
    return `You are a creative travel editor. Return ${n} concrete, fresh text additions that expand or improve the story. ${
      topic ? `Focus on: ${topic}. ` : ''
    }Output strict JSON: {"snippets": ["..."]} — no extra keys.`
  }
  return `Du bist ein kreativer Reise-Redakteur. Liefere ${n} konkrete, frische Ergänzungen zur Story. ${
    topic ? `Fokus: ${topic}. ` : ''
  }Antworte strikt als JSON: {"snippets": ["..."]} — keine weiteren Schlüssel.`
}

// ── Kern ─────────────────────────────────────────────────────
async function handle(req: NextRequest, p: Payload, rl: { rem: number; reset: number }) {
  try {
    const supabase = createServerComponentClient()
    const context = await fetchContext(supabase as unknown as Db, p.sessionId)
    if (!context) return j(req, { success: true, snippets: [] }, { status: 200, rl })

    try {
      const mod = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: context.slice(0, 4000),
      })
      if (mod.results?.[0]?.flagged) return j(req, { success: false, error: 'context_flagged' }, { status: 400, rl })
    } catch { /* ignore */ }

    const sys = mkSystem(p.language ?? 'de', p.maxSuggestions ?? 3, p.topic)

    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: context },
      ],
      temperature: p.temperature ?? 0.8,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const content = resp.choices?.[0]?.message?.content || '{}'
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      return j(req, { success: false, error: 'bad_model_output' }, { status: 502, rl })
    }

    const items: string[] = Array.isArray(parsed?.snippets) ? parsed.snippets : []
    const cleaned = items.map(s => String(s ?? '').trim()).filter(s => s.length >= 12).slice(0, p.maxSuggestions ?? 3)
    const snippets = cleaned.map(text => ({ id: crypto.randomUUID(), content: text }))

    return j(req, { success: true, snippets, usage: resp.usage ?? null, model: MODEL, language: p.language ?? 'de' }, { status: 200, rl })
  } catch (err: any) {
    const msg = String(err?.message ?? err)
    const code = msg === 'not_found' ? 404 : msg === 'forbidden' ? 403 : 500
    return j(req, { success: false, error: msg }, { status: code, rl })
  }
}

// ── GET & POST ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = checkRL(req)
  if (!rl.ok) return j(req, { success: false, error: 'rate_limited' }, { status: 429, rl })
  const parsed = parseParams(new URL(req.url).searchParams)
  if (!parsed.ok) return j(req, { success: false, error: parsed.msg }, { status: 400, rl })
  return handle(req, parsed.val, rl)
}

export async function POST(req: NextRequest) {
  const rl = checkRL(req)
  if (!rl.ok) return j(req, { success: false, error: 'rate_limited' }, { status: 429, rl })
  const body = await req.json().catch(() => ({}))
  const parsed = parseParams(body)
  if (!parsed.ok) return j(req, { success: false, error: parsed.msg }, { status: 400, rl })
  return handle(req, parsed.val, rl)
}
