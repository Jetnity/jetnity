// app/api/admin/security/overview/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const TABLES_TO_CHECK = [
  'creator_sessions',
  'creator_uploads',
  'creator_session_metrics',
  'blog_comments',
  'copilot_suggestions',
  'creator_alert_rules',
  'creator_alert_events',
  'payments',
  'payouts',
]

export async function GET() {
  await requireAdmin()
  const supabase = createRouteHandlerClient<Database>()
  const { data, error } = await (supabase as any).rpc('admin_security_overview', {
    tables: TABLES_TO_CHECK as any,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
