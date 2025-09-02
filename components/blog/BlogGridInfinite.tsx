// components/blog/BlogGridInfinite.tsx
'use client'

import * as React from 'react'
import BlogCard from '@/components/blog/BlogCard'
import BlogCardSkeleton from '@/components/blog/BlogCardSkeleton'
import type { Tables } from '@/types/supabase'

type Post = Tables<'blog_posts'>

type Props = {
  initialPosts: Post[]
  total: number
  perPage: number
  initialPage: number
  q?: string
  tag?: string
}

export default function BlogGridInfinite({
  initialPosts,
  total,
  perPage,
  initialPage,
  q,
  tag,
}: Props) {
  const [items, setItems] = React.useState<Post[]>(initialPosts)
  const [page, setPage] = React.useState<number>(initialPage)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadedIds = React.useRef(new Set(initialPosts.map((p) => p.id)))
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const hasMore = page < totalPages

  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page + 1))
      params.set('perPage', String(perPage))
      if (q) params.set('q', q)
      if (tag) params.set('tag', tag)
      const res = await fetch(`/api/blog/posts?` + params.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())

      const data = await res.json() as {
        items: Post[]
        nextPage: number | null
      }

      const next = data.items.filter((p) => !loadedIds.current.has(p.id))
      next.forEach((p) => loadedIds.current.add(p.id))
      setItems((prev) => [...prev, ...next])

      if (data.nextPage) setPage(data.nextPage)
      else setPage((prev) => prev + 1) // fallback
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden.')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, perPage, q, tag])

  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting) loadMore()
    }, { rootMargin: '400px 0px 600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {items.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}

        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <BlogCardSkeleton key={`sk-${i}`} />)}
      </div>

      {error && (
        <div className="mt-4 text-center text-destructive">
          {error}
        </div>
      )}

      {/* Sentinel für IntersectionObserver */}
      <div ref={sentinelRef} className="h-12 w-full" />

      {!hasMore && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Ende erreicht.
        </div>
      )}
    </>
  )
}
