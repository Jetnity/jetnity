// app/api/media/edits/[sessionId]/[itemId]/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Kind = 'photo' | 'video'
const detectKind = (row: any): Kind =>
  String(row?.mime_type ?? '').startsWith('video') ||
  String(row?.type ?? '').includes('video')
    ? 'video'
    : 'photo'

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string; itemId: string } }
) {
  const supabase = createRouteHandlerClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('edit_docs')
    .select('*')
    .eq('session_id', params.sessionId)
    .eq('item_id', params.itemId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return NextResponse.json(existing)

  const { data: mediaRow } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', params.sessionId)
    .eq('id', params.itemId)
    .maybeSingle<any>()

  const kind: Kind = detectKind(mediaRow)

  const defaultDoc = {
    adjustments: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, sharpness: 0 },
    transform: { rotate: 0, scale: 1, crop: null as null | { x: number; y: number; w: number; h: number } },
    LUT: null as null | string,
    ai: { lastJobs: [] as Array<{ id: string; type: string; status: string }> },
  }

  const { data: created, error } = await supabase
    .from('edit_docs')
    .insert({
      user_id: user.id,
      session_id: params.sessionId,
      item_id: params.itemId,
      type: kind,
      doc: defaultDoc,
    } as any)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(created)
}

export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string; itemId: string } }
) {
  const patchObj = (await req.json().catch(() => ({}))) ?? {}
  const supabase = createRouteHandlerClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: row, error } = await supabase
    .from('edit_docs')
    .select('*')
    .eq('session_id', params.sessionId)
    .eq('item_id', params.itemId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'edit_doc not found' }, { status: 404 })

  const merged = { ...(row as any).doc ?? {}, ...patchObj }
  const { data: updated, error: upErr } = await supabase
    .from('edit_docs')
    .update({ doc: merged } as any)
    .eq('id', (row as any).id)
    .select('*')
    .single()
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json(updated)
}
