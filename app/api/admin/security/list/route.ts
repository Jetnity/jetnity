// app/api/admin/security/list/route.ts
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const TAGE = 7
const MAX_ZEILEN = 200

export async function GET() {
  const gate = await requireAdminApi({ surface: 'api/security/list' })
  if (!gate.ok) return gate.response

  const supabase = createRouteHandlerClient<Database>()
  const seit = new Date(Date.now() - TAGE * 24 * 3600 * 1000).toISOString()

  const [ereignisse, sperren] = await Promise.all([
    supabase
      .from('security_events')
      .select('id, created_at, ip, type, user_id, extra')
      .gte('created_at', seit)
      .order('created_at', { ascending: false })
      .limit(MAX_ZEILEN),
    supabase
      .from('blocked_ips')
      .select('ip, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ZEILEN),
  ])

  // Ein Fehler wurde hier bisher verschluckt und als leere Liste ausgeliefert.
  // Eine leere Sicherheitsübersicht sieht dann aus wie „nichts vorgefallen".
  const fehler = ereignisse.error ?? sperren.error
  if (fehler) {
    return NextResponse.json({ message: fehler.message }, { status: 500 })
  }

  return NextResponse.json({
    events: (ereignisse.data ?? []).map((e) => ({
      id: e.id,
      created_at: e.created_at,
      ip: e.ip,
      type: e.type,
      user_id: e.user_id,
      detail: typeof e.extra === 'string' ? e.extra : e.extra ? JSON.stringify(e.extra) : null,
    })),
    blocklist: sperren.data ?? [],
  })
}
