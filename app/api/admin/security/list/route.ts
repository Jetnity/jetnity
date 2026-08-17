// app/api/admin/security/list/route.ts
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const TAGE = 7
const MAX_ZEILEN = 200

export async function GET() {
  const gate = await requireAdminApi({ surface: 'api/security/list', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = createRouteHandlerClient<Database>()
  const seit = new Date(Date.now() - TAGE * 24 * 3600 * 1000).toISOString()

  // Über `lese()` wie die übrigen lesenden Routen (ADR-0037). Vorher wurde jede
  // Ablehnung hier auf 500 abgebildet – auch eine erschöpfte Verbindung. Die
  // Oberfläche wertet den Unterschied inzwischen aus und lädt bei 503 zum
  // zweiten Versuch ein; bei 500 wäre der zwecklos.
  const [ereignisse, sperren] = await Promise.all([
    lese(() =>
      supabase
        .from('security_events')
        .select('id, created_at, ip, type, user_id, extra')
        .gte('created_at', seit)
        .order('created_at', { ascending: false })
        .limit(MAX_ZEILEN),
    ),
    lese(() =>
      supabase
        .from('blocked_ips')
        .select('ip, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(MAX_ZEILEN),
    ),
  ])

  if (ereignisse.problem) return problemAntwort(ereignisse.problem)
  if (sperren.problem) return problemAntwort(sperren.problem)

  return NextResponse.json({
    events: ereignisse.zeilen.map((e) => ({
      id: e.id,
      created_at: e.created_at,
      ip: e.ip,
      type: e.type,
      user_id: e.user_id,
      detail: typeof e.extra === 'string' ? e.extra : e.extra ? JSON.stringify(e.extra) : null,
    })),
    blocklist: sperren.zeilen,
  })
}
