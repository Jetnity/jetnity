import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type ImpactPercentile = {
  pct: number | null
  avg_impact: number | null
  creator_count: number | null
}

export async function fetchCreatorImpactPercentile(
  supabase: SupabaseClient<Database>,
  days = 90
): Promise<ImpactPercentile> {
  const { data, error } = await supabase.rpc(
    'creator_impact_percentile' as unknown as never,
    { days } as unknown as never
  )
  if (error) {
    console.error('[creator_impact_percentile] RPC error:', error)
    return { pct: null, avg_impact: null, creator_count: null }
  }
  const row = (Array.isArray(data) ? data[0] : null) as any
  return {
    pct: row?.pct != null ? Number(row.pct) : null,
    avg_impact: row?.avg_impact != null ? Number(row.avg_impact) : null,
    creator_count: row?.creator_count != null ? Number(row.creator_count) : null,
  }
}
