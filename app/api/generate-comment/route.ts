// app/api/copilot/comment/route.ts
export const dynamic = 'force-dynamic'
// export const runtime = 'edge' // optional: aktivieren, wenn du kein Node-spezifisches Zeug nutzt

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'

// ── CORS ─────────────────────────────────────────────────────
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const ALLOWED = new Set([ORIGIN, 'http://localhost:3000'])
const allowHeaders = 'Content-Type,Authorization'
const allowMethods = 'POST,OPTIONS'
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

// ── kleines Rate-Limit (In-Memory) ───────────────────────────
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

// ── Typen & Validation ───────────────────────────────────────
type Payload = {
  snippetContent: string
  language?: 'de' | 'en'
  style?: 'auto' | 'question' | 'suggestion' | 'insight'
  temperature?: number
}

function parse(body: any): { ok: true; val: Payload } | { ok: false; msg: string } {
  const snippetContent = String(body?.snippetContent ?? '').trim()
  if (snippetContent.length < 5) return { ok: false, msg: 'Invalid snippet content' }
  // Limit (z. B. 1500 Zeichen), um Kosten & Halluzinationen zu senken
  const content = snippetContent.slice(0, 1500)

  const language = body?.language === 'en' ? 'en' : 'de'
  const style = (body?.style as Payload['style']) ?? 'auto'
  let temperature = Number(body?.temperature ?? 0.7)
  if (!Number.isFinite(temperature)) temperature = 0.7
  temperature = Math.max(0, Math.min(1, temperature))

  return { ok: true, val: { snippetContent: content, language, style, temperature } }
}

// ── Helper für JSON-Antworten ────────────────────────────────
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

// ── Prompt (DE/EN) in JSON-Mode ──────────────────────────────
function mkSystem(language: 'de' | 'en', style: NonNullable<Payload['style']>) {
  const common =
    'Output strict JSON: {"comment": "...", "intent": "question|suggestion|insight"} — no extra keys, no prose.'
  if (language === 'en') {
    return `You are a creative co-creator for a travel platform. Read the snippet and produce one short, friendly ${
      style === 'auto' ? 'suggestion or question' : style
    } to improve or extend it, consistent with the tone. ${common}`
  }
  return `Du bist ein kreativer Co-Creator für eine Reiseplattform. Lies den Snippet und formuliere genau einen kurzen, freundlichen ${
    style === 'auto' ? 'Vorschlag oder eine Rückfrage' : style
  }, der ihn verbessert oder ergänzt, tonal passend. ${common}`
}

// ── Handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rl = checkRL(req)
  if (!rl.ok) return j(req, { success: false, error: 'rate_limited' }, { status: 429, rl })

  const body = await req.json().catch(() => ({}))
  const parsed = parse(body)
  if (!parsed.ok) return j(req, { success: false, error: parsed.msg }, { status: 400, rl })
  const p = parsed.val

  try {
    // Leichte Moderation (nicht blockierend bei Ausfall)
    try {
      const mod = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: p.snippetContent.slice(0, 5000),
      })
      if (mod.results?.[0]?.flagged) {
        return j(req, { success: false, error: 'content_flagged' }, { status: 400, rl })
      }
    } catch { /* ignore moderation outage */ }

    const sys = mkSystem(p.language ?? 'de', p.style ?? 'auto')

    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: p.snippetContent },
      ],
      temperature: p.temperature ?? 0.7,
      max_tokens: 120,
      response_format: { type: 'json_object' }, // ✅ sauberes JSON
      // optional: seed: 7,
      // presence_penalty: 0.2,
    })

    const content = resp.choices?.[0]?.message?.content || '{}'
    let data: any
    try {
      data = JSON.parse(content)
    } catch {
      return j(req, { success: false, error: 'bad_model_output' }, { status: 502, rl })
    }

    const comment = String(data?.comment ?? '').trim()
    const intent = String(data?.intent ?? '').trim()
    if (!comment || !/^(question|suggestion|insight)$/.test(intent))
      return j(req, { success: false, error: 'invalid_model_json' }, { status: 502, rl })

    return j(
      req,
      { success: true, aiComment: comment, intent, model: MODEL, usage: resp.usage ?? null },
      { status: 200, rl }
    )
  } catch (error: any) {
    console.error('comment-api error:', error?.message ?? error)
    return j(req, { success: false, error: 'internal_error' }, { status: 500, rl })
  }
}
