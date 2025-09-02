// components/feed/FeedGridInfinite.tsx
'use client'

import * as React from 'react'
import type { Tables } from '@/types/supabase'
import FeedCard from '@/components/feed/FeedCard'
import FeedCardSkeleton from '@/components/feed/FeedCardSkeleton'

type Session = Tables<'creator_sessions'>

type Props = {
  initialItems: Session[]
  total: number
  perPage: number
  initialPage: number
  q?: string
  status?: 'draft' | 'published' | 'all'
  sort?: 'new' | 'old'
}

export default function FeedGridInfinite({
  initialItems,
  total,
  perPage,
  initialPage,
  q,
  status,
  sort,
}: Props) {
  const [items, setItems] = React.useState<Session[]>(initialItems)
  const [page, setPage] = React.useState<number>(initialPage)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadedIds = React.useRef(new Set(initialItems.map((i) => i.id)))
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
      if (status) params.set('status', status)
      if (sort) params.set('sort', sort)

      const res = await fetch('/api/feed/sessions?' + params.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { items: Session[]; nextPage: number | null }

      const next = data.items.filter((s) => !loadedIds.current.has(s.id))
      next.forEach((s) => loadedIds.current.add(s.id))
      setItems((prev) => [...prev, ...next])

      if (data.nextPage) setPage(data.nextPage)
      else setPage((prev) => prev + 1)
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden.')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, perPage, q, status, sort])

  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) loadMore()
      },
      { rootMargin: '400px 0px 600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {items.map((s) => (
          <FeedCard key={s.id} id={s.id} title={s.title ?? 'Ohne Titel'} />
        ))}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={`sk-${i}`} />)}
      </div>

      {error && <div className="mt-4 text-center text-destructive">{error}</div>}

      <div ref={sentinelRef} className="h-12 w-full" />

      {!hasMore && (
        <div className="mt-6 text-center text-sm text-muted-foreground">Ende erreicht.</div>
      )}
    </>
  )
}
