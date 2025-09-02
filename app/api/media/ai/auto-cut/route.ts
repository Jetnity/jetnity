// app/api/media/ai/auto-cut/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function POST(req: Request) {
  const { sessionId, itemId, targetDurationSec } = await req.json().catch(() => ({}))
  if (!sessionId || !itemId) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  const supabase = createRouteHandlerClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: job, error } = await supabase
    .from('render_jobs')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      job_type: 'auto_cut',
      status: 'queued',
      progress: 0,
      params: { itemId, targetDurationSec: targetDurationSec ?? 30 }
    } as any)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, job })
}
