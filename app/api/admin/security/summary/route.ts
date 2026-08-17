// app/api/admin/security/summary/route.ts
//
// Bis Phase 1.4 fing diese Route jeden Fehler mit `catch {}` ab und lieferte
// danach Nullen samt `configured: false`. Eine Sicherheitsübersicht, die im
// Ausfall „0 Fehlanmeldungen, 0 Sperren“ meldet, ist schlimmer als keine.
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { fasseSicherheitslageZusammen } from '@/lib/admin/kennzahlen'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const TAGE = 7

export async function GET() {
  const gate = await requireAdminApi({ surface: 'api/security/summary', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = createRouteHandlerClient<Database>()
  const seit = new Date(Date.now() - TAGE * 24 * 3600 * 1000).toISOString()

  const [ereignisse, sperren] = await Promise.all([
    lese(() =>
      supabase
        .from('security_events')
        .select('type, created_at')
        .gte('created_at', seit)
        .order('created_at', { ascending: false }),
    ),
    lese(() => supabase.from('blocked_ips').select('ip').gte('created_at', seit)),
  ])

  if (ereignisse.problem) return problemAntwort(ereignisse.problem)
  if (sperren.problem) return problemAntwort(sperren.problem)

  return NextResponse.json({
    window_days: TAGE,
    ...fasseSicherheitslageZusammen(ereignisse.zeilen, sperren.zeilen),
  })
}
