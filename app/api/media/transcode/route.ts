// app/api/media/transcode/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Jobs   = Database['public']['Tables']['render_jobs']
type Row    = Jobs['Row']
type Insert = Jobs['Insert']

/**
 * POST { sessionId, sourceBucket, sourcePath, mediaId, profile?, jobType? }
 * jobType ist optional; Default = 'video' (entspricht eurem Union-Typ)
 */
export async function POST(req: Request) {
  const supabase = createServerComponentClient<Database>()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Partial<{
    sessionId: string
    sourceBucket: string
    sourcePath: string
    mediaId: string
    profile: string
    jobType: Row['job_type'] // z. B. 'photo' | 'video'
  }>

  if (!body.sessionId || !body.sourceBucket || !body.sourcePath || !body.mediaId) {
    return NextResponse.json({ error: 'sessionId, sourceBucket, sourcePath, mediaId required' }, { status: 400 })
  }

  // ✅ streng typisierte Zwischenwerte (passen auf eure Insert-Unionen)
  const job_type: Insert['job_type'] = (body.jobType ?? 'video') as Insert['job_type']
  const status:   Insert['status']   = 'queued' as Insert['status']
  const progress: Insert['progress'] = 0 as Insert['progress']

  // Zusätzliche Infos landen in params (JSON)
  const params: Row['params'] = {
    kind: 'transcode',
    userId: user.id,
    sessionId: String(body.sessionId),
    sourceBucket: String(body.sourceBucket),
    sourcePath: String(body.sourcePath),
    mediaId: String(body.mediaId),
    profile: body.profile ?? 'hls-720p',
  } as Row['params']

  const payload: Insert = {
    job_type,
    status,
    progress,
    params,
    edit_id: '', // Provide appropriate value
    preset: '',  // Provide appropriate value
    session_id: String(body.sessionId),
    target: '',  // Provide appropriate value
  }

  const { data: job, error } = await supabase
    .from('render_jobs')
    .insert(payload)
    .select('*')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? 'failed to create job' }, { status: 500 })
  }

  return NextResponse.json({ jobId: job.id, status: job.status })
}
