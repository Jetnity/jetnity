// app/api/admin/security/list/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function GET() {
  await requireAdmin()
  const sb = createServerComponentClient() as any

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  // Events tolerant laden
  let events: any[] = []
  try {
    const { data } = await sb
      .from('security_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200)
    events = data ?? []
  } catch {
    events = []
  }

  // Blocklist tolerant laden
  let blocklist: any[] = []
  try {
    const { data } = await sb.from('ip_blocklist').select('*').order('created_at', { ascending: false }).limit(200)
    blocklist = data ?? []
  } catch {
    blocklist = []
  }

  // Auf Minimal-Form mappen
  const ev = events.map((e) => ({
    id: String(e.id ?? crypto.randomUUID()),
    created_at: e.created_at ?? null,
    ip: e.ip ?? null,
    type: e.type ?? null,
    user_id: e.user_id ?? null,
    detail: e.detail ?? e.message ?? null,
  }))

  const bl = blocklist.map((b) => ({
    ip: String(b.ip ?? ''),
    reason: b.reason ?? null,
    expires_at: b.expires_at ?? null,
    created_at: b.created_at ?? null,
  }))

  return NextResponse.json({ events: ev, blocklist: bl })
}
