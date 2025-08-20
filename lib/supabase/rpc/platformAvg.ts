// lib/supabase/rpc/platformAvg.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Ruft den SECURITY DEFINER RPC `platform_avg_impact_score(days)` auf.
 * Der Cast auf `never` isoliert den Type-Gap, bis die Supabase-Types regeneriert wurden.
 */
export async function fetchPlatformAvgImpactScore(
  supabase: SupabaseClient<Database>,
  days = 90
): Promise<number> {
  const { data, error } = await supabase.rpc(
    'platform_avg_impact_score' as unknown as never,
    { days } as unknown as never
  )

  if (error) {
    console.error('[platform_avg_impact_score] RPC error:', error)
    return 0
  }
  const n = Number(data ?? 0)
  return Number.isFinite(n) ? n : 0
}
