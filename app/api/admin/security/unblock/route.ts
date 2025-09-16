// app/api/admin/security/unblock/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  await requireAdmin()
  const { ip } = await req.json().catch(() => ({} as any))

  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ ok: false, message: 'IP fehlt' }, { status: 400 })
  }

  const sb = createServerComponentClient() as any
  try {
    await sb.from('ip_blocklist').delete().eq('ip', ip)
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Delete fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
