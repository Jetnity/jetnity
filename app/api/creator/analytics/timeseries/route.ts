// app/api/creator/analytics/timeseries/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ContentType =
  | 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other'

function parseRangeToDays(rangeRaw: string | null): number {
  const r = (rangeRaw ?? '90').toLowerCase().trim()
  if (r === 'all' || r === 'gesamt' || r === '*') return 3650
  const m = r.match(/\d+/)
  const n = m ? Number(m[0]) : NaN
  return Number.isFinite(n) && n > 0 ? n : 90
}

function normalizeType(typeRaw: string | null): ContentType | null {
  const t = (typeRaw ?? 'all').toLowerCase().trim()
  if (t === 'all' || t === 'alle' || t === '') return null
  const allowed: ContentType[] = ['video','image','guide','blog','story','other']
  return (allowed as string[]).includes(t) ? (t as ContentType) : null
}

// --- CSV helpers ---
function csvEscape(val: string | number | null | undefined) {
  const s = val == null ? '' : String(val)
  // Wenn Komma, Quote, Linebreak → quote + quotes verdoppeln
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

type RowShape = {
  d?: string
  date?: string
  day?: string
  created_at?: string
  impressions?: number
  views?: number
  likes?: number
  comments?: number
  [k: string]: any
}

function toCsv(rows: RowShape[]) {
  const header = ['date', 'impressions', 'views', 'likes', 'comments', 'engagement']
  const lines = [header.join(',')]
  for (const r of rows) {
    const date =
      r.d ?? r.date ?? r.day ?? (typeof r.created_at === 'string' ? r.created_at.slice(0, 10) : '')
    const impressions = Number(r.impressions ?? 0)
    const views = Number(r.views ?? 0)
    const likes = Number(r.likes ?? 0)
    const comments = Number(r.comments ?? 0)
    const engagement = likes + comments
    lines.push([
      csvEscape(date),
      csvEscape(impressions),
      csvEscape(views),
      csvEscape(likes),
      csvEscape(comments),
      csvEscape(engagement),
    ].join(','))
  }
  // UTF-8 BOM, damit Excel & Co. sauber öffnen
  return '\uFEFF' + lines.join('\n')
}

export async function GET(req: Request) {
  try {
    const supabase = createServerComponentClient()
    const { searchParams } = new URL(req.url)
    const days = parseRangeToDays(searchParams.get('range'))
    const contentType = normalizeType(searchParams.get('type'))

    const { data, error } = await supabase.rpc('creator_metrics_timeseries' as any, {
      _days: days,
      _content_type: contentType, // null => kein Segmentfilter
    })

    if (error) {
      console.error('[timeseries] RPC error:', error)
      return new NextResponse(`RPC error: ${error.message}`, { status: 500 })
    }

    const rows: RowShape[] = Array.isArray(data) ? data : []

    // CSV gewünscht?
    const wantsCsv =
      (searchParams.get('format') ?? '').toLowerCase() === 'csv' ||
      (req.headers.get('accept') || '').toLowerCase().includes('text/csv')

    if (!wantsCsv) {
      return NextResponse.json(rows)
    }

    const rangeLabel = (searchParams.get('range') ?? '90').toLowerCase()
    const typeLabel = (searchParams.get('type') ?? 'all').toLowerCase() || 'all'
    const filename = `timeseries_${rangeLabel}_${typeLabel}_${new Date().toISOString().slice(0,10)}.csv`

    const csv = toCsv(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[timeseries] route error:', err)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
