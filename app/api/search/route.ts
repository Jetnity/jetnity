// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

type Sort = 'new' | 'old' | 'title'

type CursorPayload =
  | { s: 'new' | 'old'; k: [createdAtISO: string, id: string] }
  | { s: 'title';        k: [titleKey: string, id: string] }

function b64urlEncode(obj: CursorPayload) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}
function b64urlDecode<T = CursorPayload>(val?: string | null): T | null {
  if (!val) return null
  try { return JSON.parse(Buffer.from(val, 'base64url').toString()) as T }
  catch { return null }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sp = url.searchParams

  const tab    = (sp.get('tab')    || 'discover').trim()
  const q      = (sp.get('q')      || '').trim()
  const region = (sp.get('region') || '').trim()
  const mood   = (sp.get('mood')   || '').trim()
  const city   = (sp.get('city')   || '').trim()
  const sort   = (['new','old','title'] as const).includes(sp.get('sort') as Sort)
                  ? (sp.get('sort') as Sort) : 'new'
  const limit  = clampInt(Number(sp.get('limit') || 18), 6, 48)
  const cursor = b64urlDecode<CursorPayload>(sp.get('cursor'))

  const supabase = createServerComponentClient()

  let qy = supabase
    .from('creator_uploads')
    .select('id,title,mood,region,city,image_url,is_virtual,created_at')

  if (region) qy = qy.ilike('region', `%${region}%`)
  if (mood)   qy = qy.ilike('mood',   `%${mood}%`)
  if (city)   qy = qy.ilike('city',   `%${city}%`)
  if (q) {
    const needle = `%${q.replace(/\s+/g, '%')}%`
    qy = qy.or(`title.ilike.${needle},mood.ilike.${needle},region.ilike.${needle},city.ilike.${needle}`)
  }

  if (sort === 'title') {
    qy = qy.order('title', { ascending: true, nullsFirst: false }).order('id', { ascending: true })
  } else if (sort === 'old') {
    qy = qy.order('created_at', { ascending: true }).order('id', { ascending: true })
  } else {
    qy = qy.order('created_at', { ascending: false }).order('id', { ascending: false })
  }

  if (cursor && cursor.s === sort) {
    if (sort === 'new') {
      const [createdAt, id] = cursor.k
      qy = qy.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)
    } else if (sort === 'old') {
      const [createdAt, id] = cursor.k
      qy = qy.or(`created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`)
    } else {
      const [titleKey, id] = cursor.k
      qy = qy.or(`title.gt.${escapeOr(titleKey)},and(title.eq.${escapeOr(titleKey)},id.gt.${id})`)
    }
  }

  const { data, error } = await qy.limit(limit + 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1] as any
    if (sort === 'title') {
      nextCursor = b64urlEncode({ s: 'title', k: [String(last.title ?? ''), String(last.id)] })
    } else {
      nextCursor = b64urlEncode({ s: sort, k: [new Date(last.created_at).toISOString(), String(last.id)] })
    }
  }

  return NextResponse.json({ tab, sort, limit, items, nextCursor, hasMore })
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.floor(n)))
}
function escapeOr(v: string) {
  if (v.includes(',')) return `"${v.replace(/"/g, '\\"')}"`
  return v
}
