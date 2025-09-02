// app/api/feed/sessions/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'

type Session = Tables<'creator_sessions'>

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const status = (searchParams.get('status') as 'draft' | 'published' | 'all' | null) || 'draft'
    const sort = (searchParams.get('sort') as 'new' | 'old' | null) || 'new'
    const perPage = Math.min(30, Math.max(6, Number(searchParams.get('perPage') || '12')))
    const page = Math.max(1, Number(searchParams.get('page') || '1'))

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const supabase = createServerComponentClient()

    let query = supabase
      .from('creator_sessions')
      .select('id,title,user_id,published_at', { count: 'exact' })

    if (status === 'draft') query = query.is('published_at', null)
    if (status === 'published') query = query.not('published_at', 'is', null)
    if (q) query = query.ilike('title', `%${q.replace(/\s+/g, '%')}%`)

    const { data, count, error } = await query
      .order('id', { ascending: sort === 'old' })
      .range(from, to)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const total = count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const nextPage = page < totalPages ? page + 1 : null

    return NextResponse.json({
      items: (data || []) as Session[],
      page,
      perPage,
      total,
      totalPages,
      nextPage,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
