// app/api/creator/analytics/timeseries/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

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

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    console.error('[timeseries] route error:', err)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
