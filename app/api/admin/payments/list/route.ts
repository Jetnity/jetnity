// app/api/admin/payments/list/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(req: Request) {
  await requireAdmin()
  const supabase = createServerComponentClient() as any
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') // ISO created_at
  const q = (searchParams.get('q') || '').trim()
  const status = (searchParams.get('status') || '').trim()
  const LIMIT = 25

  try {
    let query = supabase
      .from('payments')
      .select('id, status, amount_chf, created_at, customer_email')
      .order('created_at', { ascending: false })
      .limit(LIMIT + 1)

    if (cursor) query = query.lt('created_at', cursor)
    if (status) query = query.eq('status', status)
    if (q) query = query.or(`id.ilike.%${q}%,customer_email.ilike.%${q}%`)

    const { data } = await query
    const rows = (data ?? []) as any[]
    const next = rows.length > LIMIT ? rows[LIMIT - 1]?.created_at : null
    return NextResponse.json({ rows: rows.slice(0, LIMIT), next_cursor: next })
  } catch {
    return NextResponse.json({ rows: [], next_cursor: null })
  }
}
