// app/api/sessions/[id]/save/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ saved: false }, { status: 401 })

    const { data, error } = await supabase
      .from('session_saves')
      .select('session_id')
      .eq('session_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ saved: Boolean(data) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ saved: false }, { status: 401 })

    // existiert bereits?
    const { data: existing } = await supabase
      .from('session_saves')
      .select('session_id')
      .eq('session_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // löschen = un-save
      const { error: delError } = await supabase
        .from('session_saves')
        .delete()
        .eq('session_id', params.id)
        .eq('user_id', user.id)
      if (delError) return NextResponse.json({ error: delError.message }, { status: 400 })
      return NextResponse.json({ saved: false })
    } else {
      const { error: insError } = await supabase
        .from('session_saves')
        .insert({ session_id: params.id, user_id: user.id })
      if (insError) return NextResponse.json({ error: insError.message }, { status: 400 })
      return NextResponse.json({ saved: true })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
