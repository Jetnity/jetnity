import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type CreatorMetricsPoint = {
  d: string // ISO Date (yyyy-mm-dd)
  impressions: number
  views: number
  likes: number
  comments: number
}

/** TS-sicher gekapselter Call; isoliert evtl. Type-Gaps der generierten Types */
export async function fetchCreatorMetricsTimeseries(
  supabase: SupabaseClient<Database>,
  days = 90
): Promise<CreatorMetricsPoint[]> {
  const { data, error } = await supabase.rpc(
    'creator_metrics_timeseries' as unknown as never,
    { days } as unknown as never
  )
  if (error) {
    console.error('[creator_metrics_timeseries] RPC error:', error)
    return []
  }
  const arr = Array.isArray(data) ? data : []
  return arr.map((row: any) => ({
    d: String(row.d),
    impressions: Number(row.impressions ?? 0),
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
  }))
}
