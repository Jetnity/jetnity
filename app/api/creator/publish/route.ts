// app/api/creator/publish/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

type Body = {
  sessionId: string
  platform: 'instagram'|'tiktok'|'youtube'|'x'|'facebook'
  caption?: string | null
  scheduledAt?: string | null
}

export async function POST(req: Request) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Body
    if (!body.sessionId || !body.platform) return new NextResponse('Bad Request', { status: 400 })

    // Session gehört dem User?
    const { data: s, error } = await supabase
      .from('creator_sessions')
      .select('id,user_id')
      .eq('id', body.sessionId)
      .single()
    if (error || !s) return new NextResponse('Not found', { status: 404 })
    if (s.user_id !== user.id) return new NextResponse('Forbidden', { status: 403 })

    const payload = {
      user_id: user.id,
      session_id: body.sessionId,
      platform: body.platform,
      caption: body.caption ?? null,
      scheduled_at: body.scheduledAt ?? null,
      status: body.scheduledAt ? 'scheduled' : 'queued',
    }

    // Tabelle evtl. nicht in Types -> als any
    const { error: e2 } = await supabase
      .from('creator_publish_queue' as any)
      .insert(payload)

    if (e2) return new NextResponse(`Insert error: ${e2.message}`, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[publish] error', e)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
