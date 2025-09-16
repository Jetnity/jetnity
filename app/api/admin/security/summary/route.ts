// app/api/admin/security/summary/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  await requireAdmin()
  const supabase = createServerComponentClient() as any
  const since = new Date(Date.now() - 7*24*60*60*1000).toISOString()

  // Fallbacks, wenn Tabellen fehlen
  let failed = 0, blocked = 0, anomalies = 0
  let last_event: { type: string; at: string } | null = null
  let configured = false

  try {
    const { data: f } = await supabase
      .from('security_events')
      .select('type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
    if (Array.isArray(f)) {
      configured = true
      failed = f.filter((x: any) => x.type === 'auth_failed').length
      anomalies = f.filter((x: any) => x.type?.startsWith('anomaly')).length
      if (f[0]) last_event = { type: f[0].type, at: f[0].created_at }
    }
  } catch {}

  try {
    const { data: b } = await supabase
      .from('blocked_ips')
      .select('ip')
      .gte('created_at', since)
    if (Array.isArray(b)) {
      configured = true
      blocked = b.length
    }
  } catch {}

  return NextResponse.json({
    window_days: 7,
    failed_logins: failed,
    blocked_ips: blocked,
    anomalies,
    last_event,
    configured,
  })
}
