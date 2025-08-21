// lib/supabase/rpc/creatorMetricsTimeseries.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type TimeseriesRow = {
  d: string
  impressions: number
  views: number
  likes: number
  comments: number
}

export async function fetchCreatorMetricsTimeseries(
  supabase: SupabaseClient,
  days: number,
  contentType: string | null
): Promise<TimeseriesRow[]> {
  const { data, error } = await supabase.rpc('creator_metrics_timeseries' as any, {
    _days: days,
    _content_type: contentType, // null oder 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other'
  })
  if (error) {
    console.error('[creator_metrics_timeseries] RPC error:', error)
    return []
  }
  return (data ?? []) as TimeseriesRow[]
}

export default fetchCreatorMetricsTimeseries
