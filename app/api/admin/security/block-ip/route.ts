// app/api/admin/security/block-ip/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(req: Request) {
  await requireAdmin()
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
