// app/api/admin/security/block-ip/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'

export async function POST(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/block-ip', minimumRole: 'operator' })
  if (!gate.ok) return gate.response

  const supabase = createServerComponentClient() as any
  const { ip, reason } = await req.json().catch(() => ({}))
  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ error: 'ip required' }, { status: 400 })
  }
  try {
    const { error } = await supabase
      .from('blocked_ips')
      .upsert({ ip, reason: reason ?? null })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // Tabelle fehlt → freundlich antworten
    return NextResponse.json({ ok: false, error: e?.message ?? 'not configured' }, { status: 200 })
  }
}
