import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Mode = 'add' | 'remove' | 'toggle'

export async function POST(req: Request) {
  const supabase = createServerComponentClient<Database>()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []
    const rawTag: string = (body?.tag ?? '').toString()
    const mode: Mode = (body?.mode ?? 'add') as Mode
    if (!ids.length || !rawTag.trim()) {
      return NextResponse.json({ error: 'missing ids or tag' }, { status: 400 })
    }

    const tag = normalizeTag(rawTag)

    // Bestehende Einträge laden (nur eigene)
    const { data: rows, error } = await supabase
      .from('session_media')
      .select('id,tags')
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) throw error

    let updated = 0
    // Pro Eintrag Tags lokal berechnen und updaten (sicher bzgl. RLS)
    await Promise.all((rows ?? []).map(async (r) => {
      const current: string[] = Array.isArray((r as any).tags) ? (r as any).tags : []
      let next = current.slice()
      const has = current.map(normalizeTag).includes(tag)

      if (mode === 'add' && !has) next = [...current, tag]
      if (mode === 'remove' && has) next = current.filter(t => normalizeTag(t) !== tag)
      if (mode === 'toggle') next = has ? current.filter(t => normalizeTag(t) !== tag) : [...current, tag]

      // Nichts zu tun?
      if (arraysEqual(current, next)) return

      const { error: upErr } = await supabase
        .from('session_media')
        .update({ tags: next } as any)
        .eq('id', r.id)
        .eq('user_id', user.id)

      if (!upErr) updated++
    }))

    return NextResponse.json({ ok: true, updated })
  } catch (e: any) {
    console.error('[bulk-tag] error:', e?.message || e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

function normalizeTag(t: string) {
  return t.replace(/^#/, '').trim().toLowerCase()
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const A = a.slice().sort(), B = b.slice().sort()
  return A.every((x, i) => x === B[i])
}
