// app/api/publish/run-one/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET!

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({})) as { id?: string }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
  const { data, error } = await supabase.from('creator_publish_schedule').select('*').eq('id', body.id).single()
  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // reuse logic by calling /api/publish/run or inline processOne. Für Kürze: inline:
  await supabase.from('creator_publish_schedule').update({ status: 'scheduled' }).eq('id', body.id)
  const res = await fetch(new URL('/api/publish/run', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'x-cron-secret': CRON_SECRET }
  })
  const json = await res.json().catch(()=> ({}))
  return NextResponse.json({ ok: true, run: json })
}
