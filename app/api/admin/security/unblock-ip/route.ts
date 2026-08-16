// app/api/admin/security/unblock-ip/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'

export async function POST(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/unblock-ip', minimumRole: 'operator' })
  if (!gate.ok) return gate.response

  const supabase = createServerComponentClient() as any
  const { ip } = await req.json().catch(() => ({}))
  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ error: 'ip required' }, { status: 400 })
  }
  try {
    const { error } = await supabase.from('blocked_ips').delete().eq('ip', ip)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'not configured' }, { status: 200 })
  }
}
