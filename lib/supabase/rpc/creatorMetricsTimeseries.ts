import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type CreatorMetricsPoint = {
  d: string
  impressions: number
  views: number
  likes: number
  comments: number
}

/** Optionaler Filter contentType: 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other' */
export async function fetchCreatorMetricsTimeseries(
  supabase: SupabaseClient<Database>,
  days = 90,
  contentType?: string | null
): Promise<CreatorMetricsPoint[]> {
  const { data, error } = await supabase.rpc(
    'creator_metrics_timeseries' as unknown as never,
    { days, _content_type: contentType ?? null } as unknown as never
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
