// app/api/creator/analytics/timeseries/route.ts
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

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
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Tage bestimmen (für "all" sehr groß wählen)
  const days =
    range === 'all'
      ? 3650
      : [30, 90, 180].includes(Number(range))
      ? Number(range)
      : 90

  const rpcArgs: any = { days }
  if (isContentType(typeRaw)) {
    rpcArgs._content_type = typeRaw
  } else {
    rpcArgs._content_type = null
  }

  // RPC aufrufen (Timeseries)
  const { data, error } = await supabase.rpc(
    'creator_metrics_timeseries' as unknown as never,
    rpcArgs as unknown as never
  )

  if (error) {
    return new Response(`RPC error: ${error.message}`, { status: 500 })
  }

  const rows = Array.isArray(data) ? data : []

  // CSV
  const header = ['date', 'impressions', 'views', 'likes', 'comments', 'engagement']

  const csv =
    header.join(',') +
    '\n' +
    rows
      .map((r: any) => {
        const d = String(r.d ?? '')
        const imp = Number(r.impressions ?? 0)
        const v = Number(r.views ?? 0)
        const l = Number(r.likes ?? 0)
        const c = Number(r.comments ?? 0)
        const e = l + c
        return [d, imp, v, l, c, e].join(',')
      })
      .join('\n')

  const today = new Date()
  const y = today.getUTCFullYear()
  const m = String(today.getUTCMonth() + 1).padStart(2, '0')
  const d = String(today.getUTCDate()).padStart(2, '0')
  const file = `timeseries_${range}_${typeRaw}_${y}-${m}-${d}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  })
}
