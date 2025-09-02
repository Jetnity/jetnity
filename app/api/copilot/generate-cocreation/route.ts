// app/api/cocreation/generate/route.ts
export const dynamic = 'force-dynamic'
// export const runtime = 'edge' // nur aktivieren, wenn dein Supabase-Client edge-fähig ist

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerComponentClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ── kleines In-Memory RateLimit pro Instanz ───────────────────
const RL_WINDOW_MS = 60_000
const RL_MAX_REQ = 20
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
    const next = { c: 1, r: now + RL_WINDOW_MS }
    buckets.set(k, next)
    return { ok: true, rem: RL_MAX_REQ - 1, reset: next.r }
  }
  if (b.c >= RL_MAX_REQ) return { ok: false, rem: 0, reset: b.r }
  b.c++
  return { ok: true, rem: RL_MAX_REQ - b.c, reset: b.r }
}

type Payload = { sessionId: string; language?: 'de' | 'en'; style?: 'short' | 'long'; stream?: boolean }

function parsePayload(src: any): { ok: true; val: Payload } | { ok: false; msg: string } {
  const sessionId = String(src?.sessionId ?? '').trim()
  if (!sessionId) return { ok: false, msg: 'Missing sessionId' }
  const language = src?.language === 'en' ? 'en' : 'de'
  const style = src?.style === 'long' ? 'long' : 'short'
  const stream = Boolean(src?.stream)
  return { ok: true, val: { sessionId, language, style, stream } }
}

async function fetchContext(sessionId: string) {
  const supabase = createServerComponentClient()
  const { data, error } = await supabase
    .from('session_snippets')
    .select('content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`DB: ${error.message}`)
  const all = (data ?? []).map((s: any) => String(s.content ?? '')).filter(Boolean)
  // Kontext kompakt halten (ca. 8k Zeichen)
  let ctx = ''
  for (const part of all) {
    if (ctx.length + part.length > 8000) break
    ctx += (ctx ? '\n' : '') + part
  }
  return ctx
}

async function moderated(text: string) {
  try {
    const m = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text.slice(0, 4000),
    })
    return !(m.results?.[0]?.flagged ?? false)
  } catch {
    // Fallback: bei Ausfall nicht blockieren
    return true
  }
}

function mkSystemPrompt(lang: 'de' | 'en', style: 'short' | 'long') {
  const baseDe =
    'Du bist ein kreativer Reise-CoAuthor. Schreibe einen frischen Abschnitt, der an die bisherigen Snippets anschließt. Keine Wiederholungen, keine Meta-Kommentare. Fakten konsistent halten. Stil: lebendig, klar. Output: reiner Text ohne Markdown.'
  const baseEn =
    'You are a creative travel co-author. Write a fresh paragraph that continues the existing snippets. No repetition, no meta comments. Keep facts consistent. Style: vivid, clear. Output: plain text without Markdown.'
  const lenHint = style === 'long' ? ' Länge ~180–250 Wörter.' : ' Länge ~80–120 Wörter.'
  return (lang === 'de' ? baseDe : baseEn) + lenHint
}

function json(req: NextRequest, body: any, status = 200, rl?: { rem: number; reset: number }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (rl) {
    headers['X-RateLimit-Limit'] = String(RL_MAX_REQ)
    headers['X-RateLimit-Remaining'] = String(rl.rem)
    headers['X-RateLimit-Reset'] = String(Math.floor(rl.reset / 1000))
  }
  return new NextResponse(JSON.stringify(body), { status, headers })
}

// ── GET: erlaubt ?sessionId=…&language=de&style=short&stream=1 ──
export async function GET(req: NextRequest) {
  const rl = checkRL(req)
  if (!rl.ok) return json(req, { success: false, error: 'rate_limited' }, 429, rl)

  const u = new URL(req.url)
  const parsed = parsePayload({
    sessionId: u.searchParams.get('sessionId'),
    language: u.searchParams.get('language'),
    style: u.searchParams.get('style'),
    stream: u.searchParams.get('stream') === '1',
  })
  if (!parsed.ok) return json(req, { success: false, error: parsed.msg }, 400, rl)
  return handleGenerate(req, parsed.val, rl)
}

// ── POST: { sessionId, language?, style?, stream? } ───────────
export async function POST(req: NextRequest) {
  const rl = checkRL(req)
  if (!rl.ok) return json(req, { success: false, error: 'rate_limited' }, 429, rl)

  const body = await req.json().catch(() => ({}))
  const parsed = parsePayload(body)
  if (!parsed.ok) return json(req, { success: false, error: parsed.msg }, 400, rl)
  return handleGenerate(req, parsed.val, rl)
}

// ── Kernlogik (JSON oder Streaming) ───────────────────────────
async function handleGenerate(req: NextRequest, p: Payload, rl: { rem: number; reset: number }) {
  try {
    const context = await fetchContext(p.sessionId)
    if (!context) return json(req, { success: false, error: 'no_context' }, 404, rl)

    // Moderation (einfach)
    const ok = await moderated(context)
    if (!ok) return json(req, { success: false, error: 'content_flagged' }, 400, rl)

    const sys = mkSystemPrompt(p.language ?? 'de', p.style ?? 'short')

    // STREAM?
    const wantStream =
      p.stream ||
      req.headers.get('accept')?.includes('text/event-stream') === true

    if (wantStream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            const chat = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: sys },
                { role: 'user', content: `Bisherige Snippets:\n\n${context}` },
              ],
              temperature: 0.8,
              max_tokens: 320,
              stream: true,
            })
            controller.enqueue(encoder.encode('retry: 5000\n\n'))
            for await (const part of chat) {
              const delta = part.choices?.[0]?.delta?.content
              if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`))
            }
            controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
            controller.close()
          } catch (e) {
            controller.error(e)
          }
        },
      })
      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-store',
          Connection: 'keep-alive',
          'X-RateLimit-Limit': String(RL_MAX_REQ),
          'X-RateLimit-Remaining': String(rl.rem),
          'X-RateLimit-Reset': String(Math.floor(rl.reset / 1000)),
        },
      })
    }

    // JSON-Antwort (nicht streamend)
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `Bisherige Snippets:\n\n${context}` },
      ],
      temperature: 0.8,
      max_tokens: 320,
    })

    const text = resp.choices?.[0]?.message?.content?.trim() || ''
    return json(req, { success: true, text }, 200, rl)
  } catch (err: any) {
    console.error('❌ generate-cocreation error:', err?.message ?? err)
    const msg = typeof err?.message === 'string' ? err.message : 'internal_error'
    return json(req, { success: false, error: msg }, 500, rl)
  }
}
