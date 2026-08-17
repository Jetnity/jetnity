// app/api/admin/security/events/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'

export async function GET(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/events', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = createServerComponentClient() as any

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') // created_at ISO
  const q = (searchParams.get('q') || '').trim()
  const LIMIT = 25

  try {
    let query = supabase
      .from('security_events')
      .select('id, type, ip, user_id, created_at, extra')
      .order('created_at', { ascending: false })
      .limit(LIMIT + 1)

    if (cursor) query = query.lt('created_at', cursor)
    if (q) {
      // einfache OR-Suche
      query = query.or(`type.ilike.%${q}%,ip.ilike.%${q}%,user_id.ilike.%${q}%`)
    }

    const { data } = await query
    const rows = (data ?? []) as any[]
    const next = rows.length > LIMIT ? rows[LIMIT - 1]?.created_at : null
    const page = rows.slice(0, LIMIT)

    return NextResponse.json({ rows: page, next_cursor: next })
  } catch {
    // Fallback, wenn Tabelle fehlt
    return NextResponse.json({ rows: [], next_cursor: null })
  }
}
