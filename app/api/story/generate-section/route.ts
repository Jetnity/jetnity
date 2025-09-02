// app/api/story/generate-section/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
const ENFORCE_OWNER = process.env.COPILOT_ENFORCE_OWNER === '1'

// ── kleine CORS-Helfer
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin ?? ORIGIN,
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Credentials': 'true',
  Vary: 'Origin',
})
const j = (req: NextRequest, body: any, init?: ResponseInit) =>
  new NextResponse(JSON.stringify(body), {
    ...init,
    headers: { ...cors(req.headers.get('origin')), 'Content-Type': 'application/json; charset=utf-8' },
  })
export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: { ...cors(req.headers.get('origin')) } })
}

// ── Typen
type SectionKey = 'intro' | 'highlight1' | 'highlight2' | 'conclusion' | 'custom'
type Language = 'de' | 'en'
type Tone = 'inspirational' | 'playful' | 'factual' | 'emotional'

type Body = {
  sessionId: string
  section: SectionKey
  customPrompt?: string
  language?: Language
  tone?: Tone
  wordLimit?: number
}

// ── Prompts
const SECTION_PROMPTS: Record<Exclude<SectionKey, 'custom'>, { de: string; en: string }> = {
  intro: {
    de: 'Schreibe eine lebendige Einleitung, die neugierig macht und in die Reise-Story hineinzieht.',
    en: 'Write a vivid introduction that hooks the reader and sets the travel mood.',
  },
  highlight1: {
    de: 'Beschreibe den ersten besonderen Reise-Moment mit sensorischen Details.',
    en: 'Describe the first highlight moment with sensory detail.',
  },
  highlight2: {
    de: 'Füge einen weiteren Höhepunkt hinzu und verknüpfe ihn sinnvoll mit dem bisherigen Verlauf.',
    en: 'Add another highlight and tie it meaningfully to the journey so far.',
  },
  conclusion: {
    de: 'Formuliere ein persönliches, rundes Fazit mit einem kleinen Ausblick.',
    en: 'Craft a personal, rounded conclusion with a small outlook.',
  },
}

// ── Validation (liefert Tone garantiert NICHT undefined)
function parse(body: any):
  | { ok: true; val: { sessionId: string; section: SectionKey; language: Language; tone: Tone; wordLimit: number; customPrompt?: string } }
  | { ok: false; msg: string } {
  const sessionId = String(body?.sessionId ?? '').trim()
  if (!/^[0-9a-fA-F-]{16,}$/.test(sessionId)) return { ok: false, msg: 'Invalid sessionId' }

  const sectionRaw = String(body?.section ?? '').trim() as SectionKey
  const section: SectionKey = (['intro','highlight1','highlight2','conclusion','custom'] as const).includes(sectionRaw)
    ? sectionRaw
    : 'custom'

  const language: Language = body?.language === 'en' ? 'en' : 'de'
  const tone: Tone = (body?.tone as Tone) ?? 'inspirational'       // ✅ hier defaulten
  let wordLimit = Number(body?.wordLimit ?? 140)
  if (!Number.isFinite(wordLimit)) wordLimit = 140
  wordLimit = Math.max(60, Math.min(260, Math.floor(wordLimit)))

  const customPrompt = typeof body?.customPrompt === 'string' ? body.customPrompt.trim() : undefined
  if (section === 'custom' && !customPrompt) return { ok: false, msg: 'Missing customPrompt for section=custom' }

  return { ok: true, val: { sessionId, section, language, tone, wordLimit, customPrompt } }
}

// ── Helpers
type Db = SupabaseClient<Database>
async function fetchContext(supabase: Db, sessionId: string) {
  if (ENFORCE_OWNER) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id ?? null
    const { data: sess, error: sessErr } = await supabase
      .from('creator_sessions').select('id, user_id').eq('id', sessionId).maybeSingle()
    if (sessErr) throw new Error(`db_session:${sessErr.message}`)
    if (!sess) throw new Error('not_found')
    if (!uid || sess.user_id !== uid) throw new Error('forbidden')
  }

  const { data, error } = await supabase
    .from('session_snippets').select('content').eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`db_snippets:${error.message}`)

  const parts = (data ?? []).map(r => String((r as any).content ?? '')).filter(Boolean)
  let ctx = ''
  for (const p of parts) {
    if (ctx.length + p.length > 8000) break
    ctx += (ctx ? '\n---\n' : '') + p
  }
  return ctx
}

function systemPrompt(language: Language, tone: Tone, wordLimit: number) {
  if (language === 'en') {
    return `You are a creative travel co-author. Write one cohesive section in a ${tone} tone.
Keep roughly ${wordLimit} words. Return strict JSON: {"text":"..."}`
  }
  return `Du bist ein kreativer Co-Autor für Reise-Stories. Verfasse genau einen zusammenhängenden Abschnitt im ${tone}-Ton.
Halte ungefähr ${wordLimit} Wörter ein. Antworte strikt als JSON: {"text":"..."}.`
}
function sectionInstruction(section: SectionKey, language: Language, custom?: string) {
  if (section === 'custom') return custom ?? ''
  const p = SECTION_PROMPTS[section]
  return language === 'en' ? p.en : p.de
}

// ── Handler
export async function POST(req: NextRequest) {
  const parsed = parse(await req.json().catch(() => ({})))
  if (!parsed.ok) return j(req, { success: false, error: parsed.msg }, { status: 400 })

  const { sessionId, section, language, tone, wordLimit, customPrompt } = parsed.val // ✅ tone ist hier vom Typ Tone

  try {
    const supabase = createServerComponentClient()
    const context = await fetchContext(supabase as unknown as Db, sessionId)
    if (!context) return j(req, { success: true, text: '' }, { status: 200 })

    // optionale leichte Moderation
    try {
      const mod = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: context.slice(0, 5000),
      })
      if (mod.results?.[0]?.flagged) return j(req, { success: false, error: 'context_flagged' }, { status: 400 })
    } catch { /* ignore */ }

    const sys = systemPrompt(language, tone, wordLimit)                             // ✅ kein Union mit undefined
    const instr = sectionInstruction(section, language, customPrompt)

    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.75,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `${language === 'en' ? 'Context' : 'Kontext'}:\n${context}` },
        { role: 'user', content: `${language === 'en' ? 'Section' : 'Abschnitt'}: ${instr}` },
      ],
    })

    const content = resp.choices?.[0]?.message?.content || '{}'
    let data: any
    try { data = JSON.parse(content) } catch { return j(req, { success: false, error: 'bad_model_output' }, { status: 502 }) }

    const text = String(data?.text ?? '').trim()
    if (!text) return j(req, { success: false, error: 'empty_text' }, { status: 502 })

    return j(req, { success: true, text, model: MODEL, usage: resp.usage ?? null }, { status: 200 })
  } catch (error: any) {
    const msg = String(error?.message ?? error)
    const code =
      msg.startsWith('db_session:') || msg.startsWith('db_snippets:') ? 500
      : msg === 'not_found' ? 404
      : msg === 'forbidden' ? 403
      : 500
    return j(req, { success: false, error: msg }, { status: code })
  }
}
