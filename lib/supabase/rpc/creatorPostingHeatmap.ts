// lib/supabase/rpc/creatorPostingHeatmap.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type HeatRow = {
  dow: number
  hour: number
  sessions: number
  impressions: number
  views: number
  likes: number
  comments: number
}

export async function fetchCreatorPostingHeatmap(
  supabase: SupabaseClient,
  days: number,
  contentType: string | null
): Promise<HeatRow[]> {
  const { data, error } = await supabase.rpc('creator_posting_heatmap' as any, {
    _days: days,
    _content_type: contentType,
  })
  if (error) {
    console.error('[creator_posting_heatmap] RPC error:', error)
    return []
  }
  return (data ?? []) as HeatRow[]
}

export default fetchCreatorPostingHeatmap
