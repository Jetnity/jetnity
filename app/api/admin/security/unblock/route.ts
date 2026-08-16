// app/api/admin/security/unblock/route.ts
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/unblock', minimumRole: 'operator' })
  if (!gate.ok) return gate.response

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
