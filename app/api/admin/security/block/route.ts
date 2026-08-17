// app/api/admin/security/block/route.ts
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function POST(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/block', minimumRole: 'operator' })
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const ip = typeof body?.ip === 'string' ? body.ip.trim() : ''
  const grund = typeof body?.reason === 'string' ? body.reason.trim() : ''

  if (!ip) {
    return NextResponse.json({ ok: false, message: 'IP fehlt' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient<Database>()
  const { error } = await supabase
    .from('blocked_ips')
    .upsert({ ip, reason: grund || null }, { onConflict: 'ip' })

  // supabase-js wirft nicht, es meldet im `error`-Feld. Ein `try/catch` allein
  // liess jeden abgelehnten Schreibvorgang als Erfolg durchgehen.
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
