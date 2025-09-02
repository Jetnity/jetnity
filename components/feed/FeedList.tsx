// components/feed/FeedList.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import FeedCard from './FeedCard'
import FeedCardSkeleton from './FeedCardSkeleton'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'

type Session = Tables<'creator_sessions'> & { cover_image?: string | null }
type CreatorProfile = Tables<'creator_profiles'>

const PAGE_SIZE = 12

/** Hilfsfunktion: Select-Fehler in Relationen erkennen und neutralisieren */
function safeCreator(input: any): CreatorProfile | null {
  if (!input) return null
  if (typeof input === 'object' && ('code' in input || 'details' in input)) return null
  return input as CreatorProfile
}

export default function FeedList({
  className,
}: { className?: string }) {
  const [items, setItems] = React.useState<(Session & { creator: CreatorProfile | null })[]>([])
  const [page, setPage] = React.useState(1)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(true)

  const loadedIds = React.useRef<Set<string | number>>(new Set())
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  // Initial laden
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setInitialLoading(true)
      setError(null)
      const ok = await fetchPage(1, true)
      if (alive) {
        setInitialLoading(false)
        setHasMore(ok)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime Updates: INSERT/UPDATE/DELETE
  React.useEffect(() => {
    const ch = supabase
      .channel('creator_sessions_feedlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creator_sessions' }, (payload) => {
        setItems((prev) => {
          // Defensive: eine flache Kopie
          let next = [...prev]

          if (payload.eventType === 'INSERT') {
            const row = payload.new as any as Session
            if ((row as any)?.status === 'published') {
              if (!loadedIds.current.has(row.id)) {
                loadedIds.current.add(row.id)
                next = [{ ...row, creator: null }, ...next]
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            const row = payload.new as any as Session
            const idx = next.findIndex((x) => x.id === row.id)
            const becameUnpublished = (row as any)?.status && (row as any).status !== 'published'
            if (idx >= 0) {
              if (becameUnpublished) {
                // aus Liste entfernen
                loadedIds.current.delete(row.id as any)
                next.splice(idx, 1)
              } else {
                next[idx] = { ...(next[idx] as any), ...row }
              }
            } else if (!becameUnpublished) {
              // falls neu sichtbar
              loadedIds.current.add(row.id as any)
              next = [{ ...row, creator: null }, ...next]
            }
          }

          if (payload.eventType === 'DELETE') {
            const row = payload.old as any as Session
            loadedIds.current.delete(row.id as any)
            next = next.filter((x) => x.id !== row.id)
          }

          return next
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  // IntersectionObserver → loadMore
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const [e] = entries
        if (e.isIntersecting) void loadMore()
      },
      { rootMargin: '400px 0px 600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [page, hasMore, loadingMore])

  async function fetchPage(targetPage: number, replace = false) {
    try {
      const from = (targetPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q = supabase
        .from('creator_sessions')
        .select(`
          *,
          cover_image,
          creator:creator_profiles (
            id, name, avatar_url, username
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, error } = await q

      if (error) throw new Error(error.message)

      const mapped = (data || []).map((s: any) => ({
        ...(s as Session),
        creator: safeCreator(s.creator),
      })) as (Session & { creator: CreatorProfile | null })[]

      // Dedupe
      const next = (replace ? [] : items).slice()
      for (const s of mapped) {
        if (!loadedIds.current.has(s.id as any)) {
          loadedIds.current.add(s.id as any)
          next.push(s)
        }
      }

      setItems(next)
      setPage(targetPage)

      // Hat diese Seite voll geliefert? Wenn weniger als PAGE_SIZE → Ende
      return (data?.length ?? 0) === PAGE_SIZE
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler')
      return false
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setError(null)
    const more = await fetchPage(page + 1)
    setHasMore(more)
    setLoadingMore(false)
  }

  async function refresh() {
    // Reset: States und Id-Cache leeren
    loadedIds.current.clear()
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
    setInitialLoading(true)
    const ok = await fetchPage(1, true)
    setHasMore(ok)
    setInitialLoading(false)
  }

  return (
    <section className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Neueste Stories</h2>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/40"
        >
          Neu laden
        </button>
      </div>

      {/* Grid */}
      {initialLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FeedCardSkeleton key={`sk-${i}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Noch keine Stories gefunden.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((session) => (
              <FeedCard
                key={session.id}
                id={String(session.id)}
                title={session.title ?? 'Ohne Titel'}
                rating={(session as any).rating ?? undefined}
                imageUrl={session.cover_image ?? undefined}
                creator={session.creator}
              />
            ))}

            {/* Lade-Placeholder beim Nachladen */}
            {loadingMore &&
              Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={`sk-more-${i}`} />)}
          </div>

          {/* Fehleranzeige & Retry */}
          {error && (
            <div className="text-center text-destructive mt-3">
              {error}{' '}
              <button
                onClick={loadMore}
                className="underline underline-offset-2 hover:opacity-80"
              >
                erneut versuchen
              </button>
            </div>
          )}

          {/* Sentinel für Infinite Scroll */}
          <div ref={sentinelRef} className="h-10 w-full" />

          {/* Ende erreicht */}
          {!hasMore && !loadingMore && (
            <div className="text-center text-sm text-muted-foreground">Ende erreicht.</div>
          )}
        </>
      )}
    </section>
  )
}
