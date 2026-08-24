import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createRouteHandlerClient, createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { PingErgebnis } from './bewertung'
import {
  leseAppRuntime,
  mitTimeout,
  sammleSystemHealth,
  supabaseAppIstKonfiguriert,
  type SystemHealthAbhaengigkeiten,
} from './sammeln'
import type { SystemHealthBericht } from './typen'

const PING_TIMEOUT_MS = 8_000

async function pingAirports(client: SupabaseClient<Database>): Promise<PingErgebnis> {
  const antwort = await mitTimeout(PING_TIMEOUT_MS, async () =>
    client.from('airports').select('iata').limit(1),
  )
  if (antwort.error) {
    return { ok: false, message: antwort.error.message }
  }
  if (antwort.status === 0) {
    return { ok: false, timeout: true, message: 'Datenquelle nicht erreicht' }
  }
  return { ok: true }
}

function standardDeps(modus: 'rsc' | 'route'): SystemHealthAbhaengigkeiten {
  return {
    nowMs: () => Date.now(),
    appRuntime: () => leseAppRuntime(),
    supabaseConfigured: () => supabaseAppIstKonfiguriert(),
    pingSupabase: async () => {
      const client =
        modus === 'rsc' ? createServerComponentClient<Database>() : createRouteHandlerClient<Database>()
      return pingAirports(client)
    },
  }
}

export function ladeSystemHealthFuerSeite(): Promise<SystemHealthBericht> {
  return sammleSystemHealth(standardDeps('rsc'))
}

export function ladeSystemHealthFuerApi(): Promise<SystemHealthBericht> {
  return sammleSystemHealth(standardDeps('route'))
}
