import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Original lesen (nur eigene)
    const { data: src, error: e1 } = await supabase
      .from('creator_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    if (e1) throw e1

    const payload = {
      user_id: user.id,
      title: ((src.title ?? 'Ohne Titel') + ' – Kopie').slice(0, 200),
      content: src.content ?? null,
      shared_with: (src as any).shared_with ?? null,
      meta: (src as any).meta ?? null,
      role: (src as any).role ?? undefined,
      status: (src as any).status ?? undefined,
      created_at: undefined,
      id: undefined,
      idempotency_key: undefined,
      insights: undefined,
      published_at: undefined,
      updated_at: undefined,
      visibility: undefined,
    } as unknown as Database['public']['Tables']['creator_sessions']['Insert']

    const { data: inserted, error: e2 } = await supabase
      .from('creator_sessions')
      .insert(payload)
      .select('*')
      .single()

    if (e2) throw e2
    return NextResponse.json({ session: inserted })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
