// app/api/copilot/image/route.ts
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // ✅ Buffer verfügbar (fix für frühere TS/Edge-Probleme)

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// Konfigurierbar per .env
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1' // alternativ: 'dall-e-3'
const DEFAULT_SIZE = process.env.OPENAI_IMAGE_DEFAULT_SIZE || '1024x1024'
const BUCKET = process.env.GENERATED_IMAGES_BUCKET || 'public-media'
const BASE_DIR = process.env.GENERATED_IMAGES_DIR || 'ai-images'

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
const j = (req: NextRequest, body: any, init?: ResponseInit) =>
  new NextResponse(JSON.stringify(body), {
    ...init,
    headers: { ...cors(req.headers.get('origin')), 'Content-Type': 'application/json; charset=utf-8', ...(init?.headers || {}) },
  })
export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: { ...cors(req.headers.get('origin')) } })
}

// ── Mini Rate-Limit (in-memory) ──────────────────────────────
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
    return true
  }
  if (b.c >= RL_MAX) return false
  b.c++
  return true
}

// ── Utils ────────────────────────────────────────────────────
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64)

function datedPath(base: string, name: string, ext = 'png') {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${base}/${yyyy}/${mm}/${dd}/${name}.${ext}`
}

// ── Handler ─────────────────────────────────────────────────
type Body = {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  persist?: boolean
  filename?: string // optionaler Basisname
}

export async function POST(req: NextRequest) {
  if (!checkRL(req)) return j(req, { success: false, error: 'rate_limited' }, { status: 429 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return j(req, { success: false, error: 'invalid_json' }, { status: 400 })
  }

  const prompt = String(body?.prompt ?? '').trim()
  if (!prompt) return j(req, { success: false, error: 'Kein Prompt angegeben' }, { status: 400 })

  const size = (body.size as Body['size']) || (DEFAULT_SIZE as Body['size'])
  const quality = (body.quality as Body['quality']) || 'standard'
  const persist = Boolean(body?.persist)

  // leichte Prompt-Moderation (nicht blockierend bei Ausfall)
  try {
    const mod = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: prompt.slice(0, 5000),
    })
    if (mod.results?.[0]?.flagged) {
      return j(req, { success: false, error: 'prompt_flagged' }, { status: 400 })
    }
  } catch {
    // ignore moderation outage
  }

  try {
    // Wenn persist: b64 anfordern (für Upload), sonst URL genügt
    const wantB64 = persist
    const gen = await openai.images.generate({
      model: MODEL,
      prompt,
      n: 1,
      size,
      quality,
      response_format: wantB64 ? 'b64_json' : 'url',
    })

    const item = gen.data?.[0]
    if (!item) return j(req, { success: false, error: 'no_image' }, { status: 502 })

    // ── Nur URL zurückgeben (kein Persist)
    if (!persist) {
      const url = (item as any)?.url ?? null
      if (!url) return j(req, { success: false, error: 'no_url' }, { status: 502 })
      return j(req, { success: true, model: MODEL, image_url: url, size, quality }, { status: 200 })
    }

    // ── Persist in Supabase Storage (Service Role empfohlen)
    const b64 = (item as any)?.b64_json ?? null
    if (!b64) return j(req, { success: false, error: 'no_b64' }, { status: 502 })

    const buf = Buffer.from(b64, 'base64') // ✅ Node Buffer (runtime=nodejs)

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!SUPA_URL || !SUPA_KEY) {
      return j(req, { success: false, error: 'missing_supabase_env' }, { status: 500 })
    }

    const supabase = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } })

    const baseName = slug(body.filename || prompt) || 'image'
    const path = datedPath(BASE_DIR, `${baseName}-${Date.now()}`, 'png')

    const up = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: 'image/png',
      upsert: false,
    })
    if (up.error) {
      return j(req, { success: false, error: `upload_failed: ${up.error.message}` }, { status: 500 })
    }

    const publicUrl = `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${path}`
    return j(
      req,
      {
        success: true,
        model: MODEL,
        storage: { bucket: BUCKET, path, url: publicUrl },
        size,
        quality,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('image-api error:', error?.message ?? error)
    return j(req, { success: false, error: 'Bildgenerierung fehlgeschlagen' }, { status: 500 })
  }
}
