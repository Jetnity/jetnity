import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type HeatCell = {
  dow: number
  hour: number
  sessions: number
  impressions: number
  views: number
  likes: number
  comments: number
}

export async function fetchCreatorPostingHeatmap(
  supabase: SupabaseClient<Database>,
  days: number,
  contentType?: string | null
): Promise<HeatCell[]> {
  const args: any = { days }
  args._content_type = contentType ?? null

  const { data, error } = await supabase.rpc(
    'creator_posting_heatmap' as unknown as never,
    args as unknown as never
  )

  if (error) {
    console.error('[creator_posting_heatmap] RPC error:', error)
    return []
  }

  const rows = Array.isArray(data) ? data : []
  return rows.map((r: any) => ({
    dow: Number(r.dow ?? 0),
    hour: Number(r.hour ?? 0),
    sessions: Number(r.sessions ?? 0),
    impressions: Number(r.impressions ?? 0),
    views: Number(r.views ?? 0),
    likes: Number(r.likes ?? 0),
    comments: Number(r.comments ?? 0),
  }))
}
