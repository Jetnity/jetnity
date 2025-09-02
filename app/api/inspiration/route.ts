// app/api/inspiration/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    const region = (url.searchParams.get('region') || '').trim()
    const mood = (url.searchParams.get('mood') || '').trim()
    const sort = (url.searchParams.get('sort') as 'new' | 'old' | 'title') || 'new'
    const perPage = Math.min(48, Math.max(6, Number(url.searchParams.get('perPage') || '9')))
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const supabase = createServerComponentClient()

    let query = supabase
      .from('creator_uploads')
      .select('id,title,image_url,region,mood,created_at', { count: 'exact' })

    if (region) query = query.ilike('region', `%${region}%`)
    if (mood) query = query.ilike('mood', `%${mood}%`)
    if (q) {
      const needle = `%${q.replace(/\s+/g, '%')}%`
      query = query.or(`title.ilike.${needle},mood.ilike.${needle},region.ilike.${needle}`)
    }

    if (sort === 'title') query = query.order('title', { ascending: true })
    else query = query.order('created_at', { ascending: sort === 'old' })

    const { data, count, error } = await query.range(from, to)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const total = count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    return NextResponse.json({
      items: (data || []) as Upload[],
      page,
      perPage,
      total,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
