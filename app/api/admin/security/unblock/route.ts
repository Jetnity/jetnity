// app/api/admin/security/unblock/route.ts
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt, jsonAdminWriteVerweigert } from '@/lib/auth/admin-write-gate'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function POST(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/unblock', capability: 'betrieb-eingreifen' })
  if (!gate.ok) return gate.response
  if (!adminWriteErlaubt({ grant: gate.grant }).erlaubt) {
    return jsonAdminWriteVerweigert()
  }

  const body = await req.json().catch(() => null)
  const ip = typeof body?.ip === 'string' ? body.ip.trim() : ''

  if (!ip) {
    return NextResponse.json({ ok: false, message: 'IP fehlt' }, { status: 400 })
  }

  const supabase = await createRouteHandlerClient<Database>()
  const { error } = await supabase.from('blocked_ips').delete().eq('ip', ip)

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
