// lib/hooks/useInfiniteSearch.ts
'use client'

import * as React from 'react'

export type Sort = 'new' | 'old' | 'title'
export type SearchItem = {
  id: string
  title?: string | null
  mood?: string | null
  region?: string | null
  city?: string | null
  image_url?: string | null
  is_virtual?: boolean | null
  created_at: string
}
export type SearchResponse = {
  items: SearchItem[]
  nextCursor: string | null
  hasMore: boolean
  sort: Sort
  limit: number
}

export function useInfiniteSearch({
  baseParams,
  initialCursor = null,
}: {
  baseParams: Record<string, string | number | undefined>
  initialCursor?: string | null
}) {
  const [items, setItems] = React.useState<SearchItem[]>([])
  const [cursor, setCursor] = React.useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = React.useState<boolean>(Boolean(initialCursor))
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const seen = React.useRef<Set<string>>(new Set())

  const loadMore = React.useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(baseParams)) {
      if (v !== undefined && v !== '') params.set(k, String(v))
    }
    params.set('cursor', cursor)

    try {
      const res = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = (await res.json()) as SearchResponse

      const next: SearchItem[] = []
      for (const it of json.items) {
        if (!seen.current.has(it.id)) { seen.current.add(it.id); next.push(it) }
      }

      setItems(prev => [...prev, ...next])
      setCursor(json.nextCursor)
      setHasMore(json.hasMore)
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [baseParams, cursor, loading])

  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const autoEnabled =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  React.useEffect(() => {
    if (!autoEnabled || !hasMore) return
    const node = sentinelRef.current
    if (!node) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && loadMore()),
      { rootMargin: '400px 0px 400px 0px', threshold: 0 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [autoEnabled, hasMore, loadMore])

  return { items, hasMore, loading, error, loadMore, sentinelRef }
}
