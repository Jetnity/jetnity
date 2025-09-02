// app/blog/page.tsx
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import BlogCard from '@/components/blog/BlogCard'
import BlogCardFeatured from '@/components/blog/BlogCardFeatured'
import BlogGridInfinite from '@/components/blog/BlogGridInfinite'

export const revalidate = 600 // 10 Minuten

type Post = Tables<'blog_posts'>

function uniq<T>(arr: T[]) { return Array.from(new Set(arr)) }
function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') s.set(k, String(v)) })
  return s.toString()
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { q?: string; tag?: string; page?: string }
}) {
  const supabase = createServerComponentClient()
  const q = (searchParams?.q || '').trim()
  const tag = (searchParams?.tag || '').trim()
  const page = Math.max(1, Number(searchParams?.page) || 1)
  const perPage = 9
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const usingFilters = Boolean(q || tag)

  // Featured/Trending nur ohne Filter
  let featured: Post[] = []
  let trending: Post[] = []
  if (!usingFilters) {
    const [{ data: fData }, { data: tData }] = await Promise.all([
      supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(6),
      supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('views', { ascending: false, nullsFirst: false })
        .limit(6),
    ])
    featured = (fData || []) as Post[]
    const fIds = new Set(featured.map((p) => p.id))
    trending = ((tData || []) as Post[]).filter((p) => !fIds.has(p.id))
  }

  // Liste + Count
  let listQuery = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('status', 'published')

  if (tag) listQuery = listQuery.contains('tags', [tag])
  if (q) {
    const pattern = `*${q.replace(/\s+/g, '%')}*`
    listQuery = listQuery.or(
      `title.ilike.${pattern},seo_title.ilike.${pattern},seo_description.ilike.${pattern},content.ilike.${pattern}`
    )
  }

  const { data: listData, count, error: listError } = await listQuery
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (listError) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-destructive surface-1 p-6 text-center rounded-xl">
          <p className="font-semibold mb-2">Fehler beim Laden der Blogposts</p>
          <p className="text-sm opacity-80">{listError.message}</p>
        </div>
      </main>
    )
  }

  const posts = (listData || []) as Post[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  // Tag-Chips
  const tagPool = [...(featured ?? []), ...(trending ?? []), ...posts]
  const allTags = uniq(
    tagPool.flatMap((p) => (Array.isArray(p.tags) ? (p.tags as string[]) : []))
  ).slice(0, 20)

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Jetnity Blog</h1>

        {/* Suche + Tag Filter */}
        <form action="/blog" className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Suche nach Beiträgen, Themen oder Orten…"
            className="w-full md:max-w-lg rounded-xl border border-border bg-background px-4 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center gap-2">
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button type="submit" className="btn-premium rounded-xl bg-primary px-4 py-2 text-white">
              Suchen
            </button>
            {(q || tag) && (
              <Link href="/blog" className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/40">
                Filter zurücksetzen
              </Link>
            )}
          </div>
        </form>

        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {allTags.map((t) => {
              const active = t === tag
              const query = qs({ q, tag: active ? undefined : t })
              return (
                <Link key={t} href={query ? `/blog?${query}` : '/blog'} className={`tab-chip ${active ? 'tab-chip--active' : ''}`}>
                  #{t}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* Featured Sektion mit großer Karte */}
      {!usingFilters && featured.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl font-bold">✨ Featured</span>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* große Karte (spannt über alle Spalten) */}
            <div className="md:col-span-3">
              <BlogCardFeatured post={featured[0]} priority />
            </div>

            {/* restliche Featured-Karten */}
            {featured.slice(1).map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {!usingFilters && trending.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl font-bold">🔥 Trending</span>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {trending.map((p) => <BlogCard key={p.id} post={p} />)}
          </div>
        </section>
      )}

      {/* Ergebnisse + Infinite Scroll */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {usingFilters ? 'Ergebnisse' : 'Alle Beiträge'}
            {total > 0 && <span className="ml-2 text-muted-foreground text-sm">({total})</span>}
          </h2>

          {/* Fallback-Pagination (No-JS/SEO) */}
          {totalPages > 1 && (
            <div className="hidden md:flex items-center gap-2">
              <Link
                aria-disabled={!hasPrev}
                className={`rounded-lg border border-border px-3 py-1.5 text-sm ${hasPrev ? 'hover:bg-muted/40' : 'opacity-50 pointer-events-none'}`}
                href={`/blog?${qs({ q, tag, page: page - 1 })}`}
              >
                ← Zurück
              </Link>
              <span className="text-sm text-muted-foreground">Seite {page} / {totalPages}</span>
              <Link
                aria-disabled={!hasNext}
                className={`rounded-lg border border-border px-3 py-1.5 text-sm ${hasNext ? 'hover:bg-muted/40' : 'opacity-50 pointer-events-none'}`}
                href={`/blog?${qs({ q, tag, page: page + 1 })}`}
              >
                Weiter →
              </Link>
            </div>
          )}
        </div>

        <BlogGridInfinite
          initialPosts={posts}
          total={total}
          perPage={perPage}
          initialPage={page}
          q={q || undefined}
          tag={tag || undefined}
        />
      </section>
    </main>
  )
}
