// app/api/creator/sessions/[id]/versions/restore/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

const BUCKET = 'session-versions'
type Body = { path?: string; name?: string; preview?: boolean }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Body

    const { data: session, error } = await supabase
      .from('creator_sessions')
      .select('id,user_id,shared_with')
      .eq('id', params.id)
      .single()
    if (error || !session) return new NextResponse('Not found', { status: 404 })

    const isOwner = session.user_id === user.id
    const isShared = Array.isArray(session.shared_with) && session.shared_with.includes(user.id)

    const basePrefix = `${session.user_id}/${params.id}/`
    const pathFromBody = body.path ?? (body.name ? `${session.user_id}/${params.id}/${body.name}` : undefined)
    if (!pathFromBody) return new NextResponse('Missing path/name', { status: 400 })
    if (!pathFromBody.startsWith(basePrefix)) return new NextResponse('Invalid path', { status: 400 })

    const admin = createSupabaseAdmin()
    const { data: file, error: dlErr } = await admin.storage.from(BUCKET).download(pathFromBody)
    if (dlErr || !file) return new NextResponse('Snapshot not found', { status: 404 })
    const snapshot = JSON.parse(await file.text())

    if (body.preview) {
      if (!isOwner && !isShared) return new NextResponse('Forbidden', { status: 403 })
      return NextResponse.json(snapshot)
    }

    if (!isOwner) return new NextResponse('Forbidden', { status: 403 })

    const upd = {
      title: snapshot?.data?.title ?? null,
      content: snapshot?.data?.content ?? null,
    }
    const { error: upErr } = await supabase
      .from('creator_sessions')
      .update(upd)
      .eq('id', params.id)
      .eq('user_id', session.user_id)
    if (upErr) return new NextResponse(`Update error: ${upErr.message}`, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[versions.restore][POST] error', e)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
