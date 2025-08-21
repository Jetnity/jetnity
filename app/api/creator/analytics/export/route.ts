// app/api/creator/analytics/export/route.ts
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

// Supabase-Enum-Typ für content_type
type ContentTypeEnum = Database['public']['Enums']['creator_content_type']
const CT_VALUES = ['video', 'image', 'guide', 'blog', 'story', 'other'] as const
function isContentType(x: string): x is ContentTypeEnum {
  return (CT_VALUES as readonly string[]).includes(x)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') ?? '90').toLowerCase()
  const typeRaw = (searchParams.get('type') ?? 'all').toLowerCase()

  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Zeitraum bestimmen
  let fromISO: string | null = null
  if (range !== 'all') {
    const days = [30, 90, 180].includes(Number(range)) ? Number(range) : 90
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
  if (isContentType(typeRaw)) {
    // Typ-sicheres Filtern auf Enum
    q = q.eq('content_type', typeRaw as ContentTypeEnum)
  }

  const { data, error } = await q

  if (error) {
    return new Response(`Query error: ${error.message}`, { status: 500 })
  }

  const rows = Array.isArray(data) ? data : []

  // CSV bauen
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
    // Falls Komma/Quote/Zeilenumbruch vorkommt: in Quotes + Quotes doppeln
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const csv =
    header.join(',') +
    '\n' +
    rows
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

  const today = new Date()
  const y = today.getUTCFullYear()
  const m = String(today.getUTCMonth() + 1).padStart(2, '0')
  const d = String(today.getUTCDate()).padStart(2, '0')
  const file = `sessions_${range}_${typeRaw}_${y}-${m}-${d}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  })
}
