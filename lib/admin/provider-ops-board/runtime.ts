import 'server-only'

import { activityZustand } from '@/lib/activities/zustand'
import { lese } from '@/lib/api/datenbank-lesen'
import { flugZustand } from '@/lib/flights/zustand'
import { hotelZustand } from '@/lib/hotels/zustand'
import { mobilityZustand } from '@/lib/mobility/zustand'
import { providerOpsZustand } from '@/lib/provider-ops'
import { rentalCarZustand } from '@/lib/rental-cars/zustand'
import { createRouteHandlerClient, createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { DomainZustandSnapshot, ModelUsageSnapshot } from './bewertung'
import {
  sammleProviderOpsBoard,
  type ProviderOpsBoardAbhaengigkeiten,
} from './sammeln'
import type { ProviderOpsBoardBericht } from './typen'

const USAGE_FENSTER_MS = 30 * 24 * 60 * 60 * 1000
const USAGE_LIMIT = 200

type UsageZeile = Pick<
  Database['public']['Tables']['model_usage']['Row'],
  'created_at' | 'kosten_mikro_usd'
>

function domainZustaende(): DomainZustandSnapshot[] {
  return [
    { id: 'domain-flights', name: 'Flights', zustand: flugZustand() },
    { id: 'domain-hotels', name: 'Hotels', zustand: hotelZustand() },
    { id: 'domain-activities', name: 'Activities', zustand: activityZustand() },
    { id: 'domain-mobility', name: 'Mobility', zustand: mobilityZustand() },
    { id: 'domain-rental_cars', name: 'Rental Cars', zustand: rentalCarZustand() },
    {
      id: 'domain-readiness',
      name: 'Readiness',
      zustand: providerOpsZustand({
        vercelEnv: process.env.VERCEL_ENV,
        zugangVorhanden: false,
      }),
    },
    {
      id: 'domain-safety',
      name: 'Safety',
      zustand: providerOpsZustand({
        vercelEnv: process.env.VERCEL_ENV,
        zugangVorhanden: false,
      }),
    },
    {
      id: 'domain-seasonal',
      name: 'Seasonal',
      zustand: providerOpsZustand({
        vercelEnv: process.env.VERCEL_ENV,
        zugangVorhanden: false,
      }),
    },
  ]
}

async function liesModelUsage(
  modus: 'rsc' | 'route',
): Promise<ModelUsageSnapshot> {
  const client =
    modus === 'rsc' ? createServerComponentClient<Database>() : createRouteHandlerClient<Database>()
  const ab = new Date(Date.now() - USAGE_FENSTER_MS).toISOString()
  const lesung = await lese<UsageZeile>(() =>
    client
      .from('model_usage')
      .select('created_at,kosten_mikro_usd')
      .gte('created_at', ab)
      .order('created_at', { ascending: false })
      .limit(USAGE_LIMIT),
  )
  if (lesung.problem) {
    return {
      ok: false,
      timeout: lesung.problem.status === 503,
      message: lesung.problem.message,
    }
  }
  const zeilen = lesung.zeilen
  const kostenMikroUsd = zeilen.reduce((summe, zeile) => summe + zeile.kosten_mikro_usd, 0)
  return {
    ok: true,
    zeilen: zeilen.length,
    kostenMikroUsd,
    juengsteCreatedAt: zeilen[0]?.created_at ?? null,
  }
}

function standardDeps(modus: 'rsc' | 'route'): ProviderOpsBoardAbhaengigkeiten {
  return {
    nowMs: () => Date.now(),
    vercelEnv: () => process.env.VERCEL_ENV?.trim() || null,
    domainZustaende,
    liesModelUsage: () => liesModelUsage(modus),
  }
}

export function ladeProviderOpsBoardFuerSeite(): Promise<ProviderOpsBoardBericht> {
  return sammleProviderOpsBoard(standardDeps('rsc'))
}

export function ladeProviderOpsBoardFuerApi(): Promise<ProviderOpsBoardBericht> {
  return sammleProviderOpsBoard(standardDeps('route'))
}
