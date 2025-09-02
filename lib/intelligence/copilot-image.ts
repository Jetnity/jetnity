// lib/intelligence/copilot-image.ts
import 'server-only'
import OpenAI from 'openai'
import { randomUUID, createHash } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Konfiguration
// ─────────────────────────────────────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_IMAGE_MODEL = (process.env.OPENAI_IMAGE_MODEL || 'dall-e-3').trim()

// Standard: statisches Hero verwenden (Projektvorgabe)
const HERO_IMAGE_DYNAMIC =
  (process.env.NEXT_PUBLIC_HERO_IMAGE_DYNAMIC ?? '0').trim() === '1'

const STATIC_HERO_URL = '/images/hero-bali.png'

// Optionaler Supabase-Upload
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SB_BUCKET = (process.env.AI_IMAGE_BUCKET || 'public').trim()
const SB_PATH_PREFIX = (process.env.AI_IMAGE_PATH_PREFIX || 'hero').trim()

// ─────────────────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────────────────

export type Orientation = 'portrait' | 'landscape' | 'square'
export type Quality = 'standard' | 'hd'
export type Dalle3Size = '1024x1024' | '1792x1024' | '1024x1792'

export type GenerateHeroImageOptions = {
  region?: string
  mood?: string
  style?: string
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  timeOfDay?: 'sunrise' | 'sunset' | 'blue hour' | 'night' | 'day'
  orientation?: Orientation
  size?: Dalle3Size
  quality?: Quality
  seed?: string | number // nur für Dateinamen/Deterministik
  negative?: string[]    // Negative Begriffe werden in den Prompt integriert
  saveToSupabase?: boolean
  pathPrefix?: string
}

export type GeneratedImage = {
  url: string
  provider: 'static' | 'openai'
  model: string
  prompt: string
  negativePrompt?: string
  seed?: string
  width: number
  height: number
  createdAt: string
  storage?: { bucket: string; path: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

function deriveSize(orientation: Orientation = 'portrait'): { size: Dalle3Size; w: number; h: number } {
  switch (orientation) {
    case 'landscape':
      return { size: '1792x1024', w: 1792, h: 1024 }
    case 'square':
      return { size: '1024x1024', w: 1024, h: 1024 }
    default:
      return { size: '1024x1792', w: 1024, h: 1792 }
  }
}

function parseSize(size: Dalle3Size): { w: number; h: number } {
  const [w, h] = size.split('x').map((n) => parseInt(n, 10))
  return { w, h }
}

/** 🔒 Fix gegen Typ-Hochweitung in Ternaries – garantiert Dalle3Size */
function resolveSize(opts: GenerateHeroImageOptions): { size: Dalle3Size; w: number; h: number } {
  if (opts.size) {
    const { w, h } = parseSize(opts.size)
    return { size: opts.size, w, h }
  }
  return deriveSize(opts.orientation ?? 'portrait')
}

function sanitize(text?: string): string | undefined {
  if (!text) return undefined
  return text.replace(/\s+/g, ' ').trim()
}

/** Prompt-Composer (EN), Negative Begriffe werden im Prompt sprachlich vermieden. */
function buildPrompt(opts: GenerateHeroImageOptions): { prompt: string; negative?: string } {
  const region = sanitize(opts.region)
  const mood = sanitize(opts.mood)
  const style = sanitize(opts.style)
  const tod = opts.timeOfDay ? sanitize(opts.timeOfDay) : undefined
  const season = opts.season ? sanitize(opts.season) : undefined

  const base: string[] = [
    'Ultra realistic travel landscape photograph',
    'professional composition, depth',
    'rich yet natural colors',
    'no people, no text, no logo, no watermark',
  ]
  if (region) base.push(`iconic scenery of ${region}`)
  if (mood) base.push(`${mood} mood`)
  if (style) base.push(style)

  if (tod) {
    const map: Record<string, string> = {
      'sunrise': 'soft sunrise light, warm glow, long shadows',
      'sunset': 'golden hour light, warm highlights, gentle contrast',
      'blue hour': 'blue hour ambience, subtle city lights, soft gradients',
      'night': 'night ambience, starry sky, clean highlights',
      'day': 'clean daylight, crisp details',
    }
    base.push(map[tod] ?? tod)
  }
  if (season) {
    const sm: Record<string, string> = {
      'spring': 'fresh greens, blossoms, airy atmosphere',
      'summer': 'vivid summer palette, clear skies',
      'autumn': 'autumn foliage, warm earthy tones',
      'winter': 'snow textures, cool palette, crisp air',
    }
    base.push(sm[season] ?? season)
  }

  const negativeExtra = (opts.negative ?? []).map((s) => s.trim()).filter(Boolean)
  const negative = negativeExtra.length ? negativeExtra.join(', ') : undefined

  const prompt =
    base.filter(Boolean).join(', ') +
    (negative ? `. Avoid: ${negative}.` : '')

  return { prompt, negative }
}

function stableSeed(seed?: string | number): string {
  if (seed === undefined || seed === null) return randomUUID()
  return createHash('sha1').update(String(seed)).digest('hex').slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase-Upload (optional)
// ─────────────────────────────────────────────────────────────────────────────

async function uploadToSupabasePNG(opts: {
  png: Buffer
  fileName: string
  bucket?: string
  pathPrefix?: string
}): Promise<{ url: string; bucket: string; path: string } | null> {
  if (!SB_URL || !SB_SERVICE_KEY) return null
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(SB_URL, SB_SERVICE_KEY, { auth: { persistSession: false } })

  const bucket = opts.bucket ?? SB_BUCKET
  const prefix = (opts.pathPrefix ?? SB_PATH_PREFIX).replace(/^\/+|\/+$/g, '')
  const path = `${prefix}/${opts.fileName}`

  const { error } = await client.storage.from(bucket).upload(path, opts.png, {
    cacheControl: '31536000',
    contentType: 'image/png',
    upsert: true,
  })
  if (error) {
    console.error('[copilot-image] Supabase upload failed:', error.message)
    return null
  }

  const pub = client.storage.from(bucket).getPublicUrl(path)
  const url = pub?.data?.publicUrl
  if (!url) return null
  return { url, bucket, path }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generiert (optional) ein Hero-Bild. Standard ist das **statische** Jetnity-Hero.
 * Dynamik aktivierst du über NEXT_PUBLIC_HERO_IMAGE_DYNAMIC=1.
 */
export async function generateHeroImage(options: GenerateHeroImageOptions = {}): Promise<GeneratedImage> {
  if (!HERO_IMAGE_DYNAMIC || !OPENAI_API_KEY) {
    const { w, h } = resolveSize(options)
    return {
      url: STATIC_HERO_URL,
      provider: 'static',
      model: OPENAI_IMAGE_MODEL,
      prompt: '[static] curated brand hero image',
      width: w,
      height: h,
      createdAt: new Date().toISOString(),
    }
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
  const { size, w, h } = resolveSize(options)
  const { prompt, negative } = buildPrompt(options)
  const seed = stableSeed(options.seed)
  const quality: Quality = options.quality ?? 'standard'
  const createdAt = new Date().toISOString()

  try {
    if (options.saveToSupabase && SB_URL && SB_SERVICE_KEY) {
      const res = await openai.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size,       // '1024x1024' | '1792x1024' | '1024x1792'
        quality,    // 'standard' | 'hd'
        n: 1,
        response_format: 'b64_json',
      })
      const b64 = res.data?.[0]?.b64_json
      if (!b64) throw new Error('No image data (b64_json) returned.')

      const buf = Buffer.from(b64, 'base64')
      const fileName = `hero_${seed}_${size.replace('x', '-')}.png`

      const uploaded = await uploadToSupabasePNG({
        png: buf,
        fileName,
        bucket: SB_BUCKET,
        pathPrefix: options.pathPrefix,
      })

      if (uploaded) {
        return {
          url: uploaded.url,
          provider: 'openai',
          model: OPENAI_IMAGE_MODEL,
          prompt,
          negativePrompt: negative,
          seed,
          width: w,
          height: h,
          createdAt,
          storage: { bucket: uploaded.bucket, path: uploaded.path },
        }
      }

      // Fallback: direkt URL beziehen
      const resUrl = await openai.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size,
        quality,
        n: 1,
      })
      const url = resUrl.data?.[0]?.url
      if (!url) throw new Error('OpenAI image URL missing after upload fallback.')

      return {
        url,
        provider: 'openai',
        model: OPENAI_IMAGE_MODEL,
        prompt,
        negativePrompt: negative,
        seed,
        width: w,
        height: h,
        createdAt,
      }
    }

    // Kein Upload → direkt URL nutzen
    const res = await openai.images.generate({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size,
      quality,
      n: 1,
    })
    const url = res.data?.[0]?.url
    if (!url) throw new Error('OpenAI image URL missing.')

    return {
      url,
      provider: 'openai',
      model: OPENAI_IMAGE_MODEL,
      prompt,
      negativePrompt: negative,
      seed,
      width: w,
      height: h,
      createdAt,
    }
  } catch (err: any) {
    console.error('❌ [copilot-image] Image generation failed:', err?.message ?? err)
    const { w: fw, h: fh } = resolveSize(options)
    return {
      url: STATIC_HERO_URL,
      provider: 'static',
      model: OPENAI_IMAGE_MODEL,
      prompt: '[fallback] curated brand hero image',
      width: fw,
      height: fh,
      createdAt,
    }
  }
}
