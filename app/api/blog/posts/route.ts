// app/api/blog/posts/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'

type Post = Tables<'blog_posts'>

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const perPage = Math.min(24, Math.max(1, Number(searchParams.get('perPage') || '9')))
    const q = (searchParams.get('q') || '').trim()
    const tag = (searchParams.get('tag') || '').trim()

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const supabase = createServerComponentClient()

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')

    if (tag) {
      query = query.contains('tags', [tag])
    }
    if (q) {
      const pattern = `*${q.replace(/\s+/g, '%')}*`
      query = query.or(
        `title.ilike.${pattern},seo_title.ilike.${pattern},seo_description.ilike.${pattern},content.ilike.${pattern}`
      )
    }

    const { data, count, error } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const total = count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const nextPage = page < totalPages ? page + 1 : null

    return NextResponse.json({
      items: (data || []) as Post[],
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
