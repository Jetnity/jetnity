// app/api/creator/sessions/[id]/save/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Body = {
  title?: string        // keine nulls – leerer String ist ok
  content?: string      // keine nulls – leerer String ist ok
}

type Update = Database['public']['Tables']['creator_sessions']['Update']

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Body

    // Ownership prüfen
    const { data: s, error: e1 } = await supabase
      .from('creator_sessions')
      .select('id,user_id')
      .eq('id', params.id)
      .single()

    if (e1 || !s) return new NextResponse('Not found', { status: 404 })
    if (s.user_id !== user.id) return new NextResponse('Forbidden', { status: 403 })

    // Nur gültige String-Felder setzen (kein null in non-nullable Spalten)
    const up: Update = {}
    if (typeof body.title === 'string')   up.title = body.title
    if (typeof body.content === 'string') up.content = body.content

    const { error: e2 } = await supabase
      .from('creator_sessions')
      .update(up)
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (e2) return new NextResponse(`Update error: ${e2.message}`, { status: 500 })

    return NextResponse.json({ ok: true, updated_at: new Date().toISOString() })
  } catch (err: any) {
    console.error('[session.save] error', err)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}

// Fallback für sendBeacon-POST
export async function POST(req: Request, ctx: { params: { id: string } }) {
  return PATCH(req, ctx)
}
