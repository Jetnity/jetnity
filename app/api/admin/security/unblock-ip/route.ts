// app/api/admin/security/unblock-ip/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(req: Request) {
  await requireAdmin()
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
