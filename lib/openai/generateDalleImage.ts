// lib/openai/generateDalleImage.ts
import 'server-only'
import OpenAI from 'openai'
import { randomUUID, createHash } from 'crypto'

// ENV
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_IMAGE_MODEL = (process.env.OPENAI_IMAGE_MODEL || 'dall-e-3').trim()

// Optionaler Supabase-Upload (nur mit Service-Role)
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SB_BUCKET = (process.env.AI_IMAGE_BUCKET || 'public').trim()
const SB_PATH_PREFIX = (process.env.AI_IMAGE_PATH_PREFIX || 'ai/dalle').trim()

export type Dalle3Size = '1024x1024' | '1792x1024' | '1024x1792'
export type Quality = 'standard' | 'hd'
export type Orientation = 'landscape' | 'portrait' | 'square'

export type GenerateDalleOptions = {
  size?: Dalle3Size
  orientation?: Orientation // mappt auf size, wenn size nicht gesetzt ist
  quality?: Quality
  /** Zusätzliche Auschlussbegriffe – werden in den Prompt integriert */
  negative?: string[]
  /** Wenn true und Service-Role vorhanden → Upload als PNG in Supabase Storage */
  saveToSupabase?: boolean
  /** Optionaler Unterpfad im Bucket */
  pathPrefix?: string
  /** Dateiname-Seed (nur für Dateiname/Deterministik) */
  seed?: string | number
  /** Ergebnisform: 'url' (Default) oder 'object' mit Metadaten */
  result?: 'url' | 'object'
}

export type GeneratedImage = {
  url: string
  provider: 'openai'
  model: string
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  createdAt: string
  storage?: { bucket: string; path: string } // falls hochgeladen
}

/* ───────────────────────── Helpers ───────────────────────── */

function deriveSize(orientation: Orientation = 'landscape'): { size: Dalle3Size; w: number; h: number } {
  switch (orientation) {
    case 'portrait':
      return { size: '1024x1792', w: 1024, h: 1792 }
    case 'square':
      return { size: '1024x1024', w: 1024, h: 1024 }
    default:
      return { size: '1792x1024', w: 1792, h: 1024 }
  }
}
function parseSize(size: Dalle3Size): { w: number; h: number } {
  const [w, h] = size.split('x').map((n) => parseInt(n, 10))
  return { w, h }
}
function sanitize(s?: string) {
  return (s || '').replace(/\s+/g, ' ').trim()
}
function buildPrompt(userPrompt: string, negatives?: string[]) {
  const base = [
    'Ultra realistic travel photography',
    'professional composition, depth, natural colors',
    'no people, no text, no logo, no watermark',
  ]
  const negative = (negatives || []).map((x) => x.trim()).filter(Boolean)
  const prompt =
    [...base, sanitize(userPrompt)].filter(Boolean).join(', ') +
    (negative.length ? `. Avoid: ${negative.join(', ')}.` : '')
  return { prompt, negative: negative.length ? negative.join(', ') : undefined }
}
function stableSeed(seed?: string | number): string {
  if (seed === undefined || seed === null) return randomUUID()
  return createHash('sha1').update(String(seed)).digest('hex').slice(0, 16)
}

async function uploadToSupabasePNG(png: Buffer, fileName: string, pathPrefix?: string) {
  if (!SB_URL || !SB_SERVICE_KEY) return null
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(SB_URL, SB_SERVICE_KEY, { auth: { persistSession: false } })
  const prefix = (pathPrefix || SB_PATH_PREFIX).replace(/^\/+|\/+$/g, '')
  const path = `${prefix}/${fileName}`
  const { error } = await client.storage.from(SB_BUCKET).upload(path, png, {
    cacheControl: '31536000',
    contentType: 'image/png',
    upsert: true,
  })
  if (error) {
    console.error('[generateDalleImage] Supabase upload failed:', error.message)
    return null
  }
  const pub = client.storage.from(SB_BUCKET).getPublicUrl(path)
  const url = pub?.data?.publicUrl
  return url ? { url, bucket: SB_BUCKET, path } : null
}

/* ───────────────────────── Public API ───────────────────────── */

// Overload 1 (kompatibel): URL zurück
export async function generateDalleImage(prompt: string, opts?: GenerateDalleOptions): Promise<string | null>
// Overload 2: Objekt mit Metadaten zurück
export async function generateDalleImage(
  prompt: string,
  opts: GenerateDalleOptions & { result: 'object' }
): Promise<GeneratedImage | null>

// Implementierung
export async function generateDalleImage(
  userPrompt: string,
  opts: GenerateDalleOptions = {}
): Promise<string | GeneratedImage | null> {
  if (!OPENAI_API_KEY) {
    console.error('[generateDalleImage] Missing OPENAI_API_KEY')
    return null
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
  const { size, w, h } = opts.size ? { size: opts.size, ...parseSize(opts.size) } : deriveSize(opts.orientation)
  const { prompt, negative } = buildPrompt(userPrompt, opts.negative)
  const quality: Quality = opts.quality ?? 'standard'
  const createdAt = new Date().toISOString()
  const seed = stableSeed(opts.seed)
  const wantObject = opts.result === 'object'
  const wantUpload = Boolean(opts.saveToSupabase && SB_URL && SB_SERVICE_KEY)

  // kleine Retry-Logik bei transienten Fehlern
  let lastErr: any
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (wantUpload) {
        // b64 zum Speichern erzeugen
        const res = await openai.images.generate({
          model: OPENAI_IMAGE_MODEL,
          prompt,
          size,
          quality,
          n: 1,
          response_format: 'b64_json',
        })
        const b64 = res.data?.[0]?.b64_json
        if (!b64) throw new Error('No image data (b64_json).')
        const buf = Buffer.from(b64, 'base64')
        const fileName = `dalle_${seed}_${size.replace('x', '-')}.png`
        const uploaded = await uploadToSupabasePNG(buf, fileName, opts.pathPrefix)
        if (!uploaded) throw new Error('Upload failed.')
        const obj: GeneratedImage = {
          url: uploaded.url,
          provider: 'openai',
          model: OPENAI_IMAGE_MODEL,
          prompt,
          negativePrompt: negative,
          width: w,
          height: h,
          createdAt,
          storage: { bucket: uploaded.bucket, path: uploaded.path },
        }
        return wantObject ? obj : obj.url
      } else {
        // nur URL beziehen
        const res = await openai.images.generate({
          model: OPENAI_IMAGE_MODEL,
          prompt,
          size,
          quality,
          n: 1,
        })
        const url = res.data?.[0]?.url
        if (!url) throw new Error('No image URL returned.')
        const obj: GeneratedImage = {
          url,
          provider: 'openai',
          model: OPENAI_IMAGE_MODEL,
          prompt,
          negativePrompt: negative,
          width: w,
          height: h,
          createdAt,
        }
        return wantObject ? obj : url
      }
    } catch (err: any) {
      lastErr = err
      // einfacher Backoff
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
    }
  }

  console.error('❌ [generateDalleImage] Generation failed:', lastErr?.message ?? lastErr)
  return null
}
