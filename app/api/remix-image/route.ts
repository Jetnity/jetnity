// app/api/remix-image/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

type Size = '1024x1024' | '768x1344' | '1344x768' | '512x512'
const OUTPUT_BUCKET = 'media-renders'

export async function POST(req: Request) {
  const supabase = createServerComponentClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({} as any))
    const imageUrl: string | undefined = body?.imageUrl
    const promptMain: string = body?.prompt ?? ''
    const negative: string | undefined = body?.negative_prompt
    const size: Size = (body?.size ?? '1024x1024') as Size
    const cfg: number = Number(body?.cfg ?? 7.5)
    const strength: number = clamp(Number(body?.strength ?? 0.55), 0.1, 1)
    const model: 'auto' | 'v1' = (body?.model ?? 'auto') as 'auto' | 'v1'
    const store: 'server' | 'client' = (body?.store ?? 'server') as 'server' | 'client'

    if (!imageUrl) return NextResponse.json({ error: 'missing imageUrl' }, { status: 400 })

    // Quelle (http(s) oder bucket/path) holen
    const src = await loadSourceBlob(supabase, imageUrl)

    // Prompt zusammenbauen (negative hint am Ende)
    const prompt = [promptMain, negative ? `(negative prompt: ${negative})` : ''].filter(Boolean).join('. ')

    let outBytes: Uint8Array | null = null
    let outMime = 'image/png'
    let apiWarning: string | null = null

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const controller = new AbortController()
        const to = setTimeout(() => controller.abort(), 110_000)

        const resp = await openai.images.edit({
          model: 'gpt-image-1',
          image: src.blob,
          prompt,
          n: 1,
          size: mapSizeToOpenAI(size),
          response_format: 'url',
        }, { signal: controller.signal as any })

        clearTimeout(to)

        const item = Array.isArray(resp.data) && resp.data.length ? resp.data[0] : undefined
        const editedUrl = (item as any)?.url as string | undefined
        const editedB64 = (item as any)?.b64_json as string | undefined

        if (editedUrl) {
          const res = await fetch(editedUrl, { cache: 'no-store' })
          if (!res.ok) throw new Error(`image fetch ${res.status}`)
          outMime = res.headers.get('content-type') || 'image/png'
          const ab = await res.arrayBuffer()
          outBytes = new Uint8Array(ab)
        } else if (editedB64) {
          outBytes = base64ToUint8Array(editedB64)
          outMime = 'image/png'
        } else {
          throw new Error('no image in response')
        }
      } catch (err: any) {
        apiWarning = String(err?.message || err)
        outBytes = src.bytes
        outMime = src.mime
      }
    } else {
      // Kein OPENAI-Key → Passthrough
      outBytes = src.bytes
      outMime = src.mime
    }

    // Server-seitig speichern & signieren (empfohlen)
    if (store === 'server') {
      const ext = guessExtFromMime(outMime) || guessExtFromUrl(imageUrl) || 'png'
      const path = `${user.id}/${Date.now()}_${rand(6)}.${ext}`

      const up = await supabase.storage.from(OUTPUT_BUCKET).upload(path, outBytes!, {
        cacheControl: '3600',
        contentType: outMime,
        upsert: true,
      })
      if (up.error) {
        return NextResponse.json({ error: `upload failed: ${up.error.message}` }, { status: 500 })
      }

      const signed = await supabase.storage.from(OUTPUT_BUCKET).createSignedUrl(path, 60 * 30)
      if (signed.error || !signed.data?.signedUrl) {
        return NextResponse.json({ error: 'could not sign url' }, { status: 500 })
      }

      return NextResponse.json({
        signed_url: signed.data.signedUrl,
        bucket: OUTPUT_BUCKET,
        path,
        mime: outMime,
        cfg,
        strength,
        size,
        model,
        ...(apiWarning ? { warning: `openai_fallback: ${apiWarning}` } : null),
      })
    }

    // Client-seitige Rückgabe (falls gewünscht)
    const b64 = Buffer.from(outBytes!).toString('base64')
    const dataUrl = `data:${outMime};base64,${b64}`
    return NextResponse.json({ image_url: dataUrl, mime: outMime, cfg, strength, size, model })
  } catch (e: any) {
    console.error('[remix-image] error:', e?.message || e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

/* Helpers */

function mapSizeToOpenAI(s: Size): '1024x1024' | '512x512' | '1536x1024' | '1024x1536' | 'auto' {
  switch (s) {
    case '1024x1024': return '1024x1024'
    case '1344x768':  return '1536x1024'
    case '768x1344':  return '1024x1536'
    case '512x512':   return '512x512'
    default:          return '1024x1024'
  }
}

async function loadSourceBlob(
  supabase: ReturnType<typeof createServerComponentClient<Database>>,
  src: string
): Promise<{ blob: Blob; bytes: Uint8Array; mime: string }> {
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) {
    const res = await fetch(src, { cache: 'no-store' })
    if (!res.ok) throw new Error(`src fetch ${res.status}`)
    const mime = res.headers.get('content-type') || 'image/png'
    const ab = await res.arrayBuffer()
    return { blob: new Blob([ab], { type: mime }), bytes: new Uint8Array(ab), mime }
  }

  // bucket/path
  const [bucket, ...rest] = src.split('/')
  const path = rest.join('/')
  if (!bucket || !path) throw new Error('invalid bucket/path')

  const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60)
  if (signed.error || !signed.data?.signedUrl) throw new Error('sign src failed')

  const res = await fetch(signed.data.signedUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error(`src fetch ${res.status}`)
  const mime = res.headers.get('content-type') || 'image/png'
  const ab = await res.arrayBuffer()
  return { blob: new Blob([ab], { type: mime }), bytes: new Uint8Array(ab), mime }
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function rand(len = 6) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[(Math.random() * chars.length) | 0]
  return s
}

function guessExtFromMime(m?: string | null) {
  if (!m) return null
  if (m.includes('png')) return 'png'
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
  if (m.includes('webp')) return 'webp'
  return null
}

function guessExtFromUrl(u: string) {
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(u)
  return m ? m[1].toLowerCase() : null
}

function base64ToUint8Array(b64: string) {
  const buf = Buffer.from(b64, 'base64')
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}
