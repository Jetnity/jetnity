import 'server-only'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/supabase'
import { readWeatherQuota } from './quota-contract'

// Finite LOCAL/UNAPPLIED RPC contract, bound in the schema-use scanner to its SQL.
// This type is not evidence that the function has been installed in Production.
type WeatherDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & {
      reisewetter_reservieren_v1: { Args: Record<string, never>; Returns: Json }
    }
  }
}

type Admission = { ok: true } | { ok: false; status: 401 | 429 | 503; retryAfterSec: number }
export async function reserveGlobalWeatherRequest(): Promise<Admission> {
  try {
    // The ordinary signed-in customer client is the only principal. No service
    // role, new password, URL override, test principal or anonymous fallback.
    const client = await createRouteHandlerClient<WeatherDatabase>()
    const identity = await client.auth.getUser()
    if (identity.error || !identity.data.user || identity.data.user.is_anonymous) {
      return { ok: false, status: 401, retryAfterSec: 0 }
    }
    // A timeout/unknown commit spends capacity conservatively: no retry/refund.
    const response = await client.rpc('reisewetter_reservieren_v1', {})
      .abortSignal(AbortSignal.timeout(3000))
    if (response.error) return { ok: false, status: 503, retryAfterSec: 0 }
    const result = readWeatherQuota(response.data)
    if (!result) return { ok: false, status: 503, retryAfterSec: 0 }
    return result.allowed ? { ok: true }
      : { ok: false, status: 429, retryAfterSec: result.retryAfterSec }
  } catch { return { ok: false, status: 503, retryAfterSec: 0 } }
}
