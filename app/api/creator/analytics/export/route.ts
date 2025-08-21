// app/api/creator/analytics/export/route.ts
import { NextRequest } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

// Supabase-Enum für content_type
type ContentType = Database['public']['Enums']['creator_content_type']
const CT_VALUES = ['video', 'image', 'guide', 'blog', 'story', 'other'] as const
const isContentType = (x: string): x is ContentType =>
  (CT_VALUES as readonly string[]).includes(x as any)

// "30" | "90" | "180" | "all/gesamt/*" -> days | null (null = alle)
function parseRangeToDays(raw: string | null): number | null {
  const r = (raw ?? '90').toLowerCase().trim()
  if (r === 'all' || r === 'gesamt' || r === '*') return null
  const n = Number(r)
  return Number.isFinite(n) && n > 0 ? n : 90
}

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseRangeToDays(searchParams.get('range'))
  const typeRaw = (searchParams.get('type') ?? 'all').toLowerCase().trim()

  // Zeitraum bestimmen
  let fromISO: string | null = null
  if (days !== null) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    from.setUTCHours(0, 0, 0, 0)
    fromISO = from.toISOString()
  }

  // Query aufbauen
  let q = supabase
    .from('creator_session_metrics')
    .select(
      [
        'created_at',
        'session_id',
        'title',
        'impressions',
        'views',
        'likes',
        'comments',
        'impact_score',
        'content_type',
      ].join(',')
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (fromISO) q = q.gte('created_at', fromISO)
  if (isContentType(typeRaw)) q = q.eq('content_type', typeRaw)

  const { data, error } = await q
  if (error) return new Response(`Query error: ${error.message}`, { status: 500 })

  const rows = Array.isArray(data) ? data : []

  // CSV bauen (mit BOM für Excel)
  const header = [
    'created_at',
    'session_id',
    'title',
    'impressions',
    'views',
    'likes',
    'comments',
    'impact_score',
    'content_type',
  ]

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const csvBody = rows
    .map((r: any) =>
      [
        r.created_at ?? '',
        r.session_id ?? '',
        r.title ?? '',
        r.impressions ?? 0,
        r.views ?? 0,
        r.likes ?? 0,
        r.comments ?? 0,
        r.impact_score ?? '',
        r.content_type ?? '',
      ]
        .map(escape)
        .join(',')
    )
    .join('\n')

  const csv = '\ufeff' + header.join(',') + '\n' + csvBody

  const today = new Date()
  const y = today.getUTCFullYear()
  const m = String(today.getUTCMonth() + 1).padStart(2, '0')
  const d = String(today.getUTCDate()).padStart(2, '0')
  const rangeLabel = days === null ? 'all' : String(days)
  const file = `sessions_${rangeLabel}_${typeRaw}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  })
}
