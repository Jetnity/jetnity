// app/api/admin/security/block/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  await requireAdmin()
  const { ip, minutes, reason } = await req.json().catch(() => ({} as any))

  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ ok: false, message: 'IP fehlt' }, { status: 400 })
  }

  const mins = Number.isFinite(minutes) ? Number(minutes) : 0
  const expires_at =
    mins > 0 ? new Date(Date.now() + mins * 60 * 1000).toISOString() : null

  const sb = createServerComponentClient() as any
  try {
    await sb.from('ip_blocklist').insert({
      ip,
      reason: reason || 'admin block',
      expires_at,
      created_at: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Insert fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
