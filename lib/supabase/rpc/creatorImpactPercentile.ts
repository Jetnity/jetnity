// lib/supabase/rpc/creatorImpactPercentile.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type ImpactPercentileRow = { pct: number | null; avg_impact: number | null }

export async function fetchCreatorImpactPercentile(
  supabase: SupabaseClient,
  days: number
): Promise<ImpactPercentileRow> {
  const { data, error } = await supabase.rpc('creator_impact_percentile' as any, {
    _days: days,
  })
  if (error) {
    console.error('[creator_impact_percentile] RPC error:', error)
    return { pct: null, avg_impact: null }
  }
  const row = Array.isArray(data) ? (data[0] as ImpactPercentileRow) : (data as ImpactPercentileRow)
  return row ?? { pct: null, avg_impact: null }
}

export default fetchCreatorImpactPercentile
