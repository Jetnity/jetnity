// app/api/media/render/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type JobType = 'export' | 'auto_color' | 'object_remove' | 'auto_cut'

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({})) as {
    sessionId: string
    itemId?: string
    jobType: JobType
    params?: Record<string, any>
  }

  const supabase = createRouteHandlerClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: job, error } = await supabase
    .from('render_jobs')
    .insert({
      user_id: user.id,
      session_id: payload.sessionId,
      edit_doc_id: null,
      job_type: payload.jobType,
      status: 'queued',
      progress: 0,
      params: payload.params ?? {}
    } as any)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, job })
}
