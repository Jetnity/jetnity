// app/api/creator/sessions/[id]/versions/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

const BUCKET = 'session-versions'

function isoStamp(d = new Date()) {
  return new Date(d.getTime() - d.getMilliseconds()).toISOString().replace(/[:]/g, '-')
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: session, error } = await supabase
      .from('creator_sessions')
      .select('id,user_id,shared_with')
      .eq('id', params.id)
      .single()

    if (error || !session) return new NextResponse('Not found', { status: 404 })
    const isOwner = session.user_id === user.id
    const isShared = Array.isArray(session.shared_with) && session.shared_with.includes(user.id)
    if (!isOwner && !isShared) return new NextResponse('Forbidden', { status: 403 })

    const admin = createSupabaseAdmin()
    const prefix = `${session.user_id}/${params.id}`
    const { data: files, error: listErr } = await admin.storage.from(BUCKET).list(prefix, {
      limit: 200,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' },
    })
    if (listErr) return new NextResponse(`Storage error: ${listErr.message}`, { status: 500 })

    const rows = (files ?? []).filter(f => f.name.endsWith('.json')).map((f: any) => ({
      name: f.name,
      path: `${prefix}/${f.name}`,
      id: f.id ?? undefined,
      created_at: f.created_at ?? null,
      updated_at: f.updated_at ?? null,
      size: f.metadata?.size ?? null,
    }))
    return NextResponse.json(rows)
  } catch (e: any) {
    console.error('[versions][GET] error', e)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: session, error } = await supabase
      .from('creator_sessions')
      .select('id,user_id,title,content,role,status,visibility,shared_with,created_at,published_at,insights')
      .eq('id', params.id)
      .single()

    if (error || !session) return new NextResponse('Not found', { status: 404 })
    if (session.user_id !== user.id) return new NextResponse('Forbidden', { status: 403 })

    const snapshot = {
      kind: 'creator_session.snapshot/v1',
      at: new Date().toISOString(),
      session_id: session.id,
      user_id: session.user_id,
      data: {
        title: session.title ?? '',
        content: session.content ?? '',
        role: session.role ?? null,
        status: session.status ?? null,
        visibility: session.visibility ?? null,
        shared_with: session.shared_with ?? [],
        created_at: session.created_at ?? null,
        published_at: (session as any).published_at ?? null,
        insights: (session as any).insights ?? null,
      },
    }

    const admin = createSupabaseAdmin()
    const path = `${session.user_id}/${params.id}/${isoStamp()}.json`
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, JSON.stringify(snapshot, null, 2), {
      contentType: 'application/json; charset=utf-8',
      upsert: false,
    })
    if (upErr) return new NextResponse(`Upload error: ${upErr.message}`, { status: 500 })

    return NextResponse.json({ ok: true, path })
  } catch (e: any) {
    console.error('[versions][POST] error', e)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}
